import os
import uuid
import asyncio
import json
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status
from fastapi.responses import StreamingResponse
from backend.app.auth import get_current_user
from backend.app.config import settings
from backend.app.database import db
from backend.app.ai.pipeline import process_image_pipeline

from backend.app.storage import storage_manager

router = APIRouter(prefix="/api/upload", tags=["Upload & Processing"])

# Allowable formats
SUPPORTED_EXTENSIONS = {".png", ".jpg", ".jpeg", ".tiff", ".tif"}

@router.post("/process")
async def upload_and_process(
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user)
):
    """
    Accepts an image, saves it, executes the enhancement and colorization pipeline,
    and returns a Server-Sent Events (SSE) StreamingResponse to update the user with
    real-time progress.
    """
    # Verify extension
    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in SUPPORTED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported file format '{ext}'. Supported formats: PNG, JPG, JPEG, TIFF."
        )
    
    # Save the uploaded file to input directory with temporary unique name
    temp_id = str(uuid.uuid4())
    input_filename = f"{temp_id}{ext}"
    input_path = os.path.join(settings.UPLOAD_DIR, input_filename)
    
    try:
        content = await file.read()
        # Basic file validation: size constraint (e.g. max 15MB)
        if len(content) > 15 * 1024 * 1024:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="File size exceeds maximum limit of 15MB."
            )
            
        with open(input_path, "wb") as f:
            f.write(content)
    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to save uploaded file: {str(e)}"
        )

    async def event_generator():
        # Async Queue to transfer progress messages between pipeline and stream
        progress_queue = asyncio.Queue()
        
        def progress_callback(percent: int, status_msg: str):
            progress_queue.put_nowait({
                "progress": percent,
                "status": status_msg,
                "done": False
            })
            
        # Run pipeline as a background task so we can yield from queue
        pipeline_task = asyncio.create_task(
            process_image_pipeline(input_path, settings.UPLOAD_DIR, progress_callback)
        )
        
        # Read from progress queue and yield SSE frames
        finished = False
        while not finished:
            try:
                # Wait for progress update, timeout after 10s to keep connection alive
                update = await asyncio.wait_for(progress_queue.get(), timeout=10.0)
                yield f"data: {json.dumps(update)}\n\n"
                progress_queue.task_done()
                if update["progress"] == 100:
                    finished = True
            except asyncio.TimeoutError:
                # Keep-alive frame
                yield "data: {\"keep_alive\": true}\n\n"
            except Exception as e:
                yield f"data: {json.dumps({'error': f'Pipeline update error: {str(e)}', 'done': True})}\n\n"
                finished = True
                
        # Get pipeline result
        try:
            result, duration = await pipeline_task
            
            # Retrieve absolute paths for upload
            orig_local = os.path.join(settings.UPLOAD_DIR, os.path.basename(result["original"]))
            enh_local = os.path.join(settings.UPLOAD_DIR, os.path.basename(result["enhanced"]))
            col_local = os.path.join(settings.UPLOAD_DIR, os.path.basename(result["colorized"]))
            
            # Upload files using transparent storage manager (returns S3 URLs or local endpoints)
            orig_url = await storage_manager.upload_file(orig_local)
            enh_url = await storage_manager.upload_file(enh_local)
            col_url = await storage_manager.upload_file(col_local)
            
            # Save history record to Database
            history_record = {
                "original_filename": file.filename,
                "original_url": orig_url,
                "enhanced_url": enh_url,
                "colorized_url": col_url,
                "processing_time": duration,
                "user_email": current_user["email"],
                "metadata": result["metadata"]
            }
            
            saved_record = await db.create_history_record(history_record)
            
            # Send completion frame with final records payload
            completion_payload = {
                "progress": 100,
                "status": "Complete",
                "done": True,
                "result": saved_record
            }
            
            await db.add_log("INFO", f"User {current_user['email']} processed image: {file.filename} in {duration}s.")
            yield f"data: {json.dumps(completion_payload)}\n\n"
            
        except Exception as e:
            await db.add_log("ERROR", f"Pipeline failure for {file.filename}: {str(e)}")
            yield f"data: {json.dumps({'error': f'AI Pipeline processing failed: {str(e)}', 'done': True})}\n\n"
        finally:
            # Clean up raw original uploaded file (since pipeline creates a standard PNG copy)
            if os.path.exists(input_path):
                try:
                    os.remove(input_path)
                except Exception:
                    pass

    return StreamingResponse(event_generator(), media_type="text/event-stream")
