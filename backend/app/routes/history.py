import asyncio
from fastapi import APIRouter, Depends, HTTPException, Query, status
from typing import List, Optional
from backend.app.auth import get_current_user
from backend.app.models.schemas import HistoryResponse
from backend.app.database import db
from backend.app.storage import storage_manager

router = APIRouter(prefix="/api/history", tags=["User History"])

@router.get("", response_model=List[HistoryResponse])
async def get_history(
    search: Optional[str] = Query(None, description="Search term for filename or record ID"),
    current_user: dict = Depends(get_current_user)
):
    """Retrieve history records for the logged-in user, optionally filtered by filename search."""
    history = await db.get_user_history(current_user["email"], search)
    return history

@router.delete("/{record_id}", status_code=status.HTTP_200_OK)
async def delete_record(
    record_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Delete a specific image record from history."""
    # Find matching record to get URLs for storage deletion
    user_history = await db.get_user_history(current_user["email"])
    matched = next((h for h in user_history if h["id"] == record_id), None)
    
    if matched:
        # Delete original, enhanced, and colorized files from storage
        asyncio.create_task(storage_manager.delete_file(matched["original_url"]))
        asyncio.create_task(storage_manager.delete_file(matched["enhanced_url"]))
        asyncio.create_task(storage_manager.delete_file(matched["colorized_url"]))
        
    deleted = await db.delete_history_record(record_id, current_user["email"])
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Record not found or access denied."
        )
    
    await db.add_log("INFO", f"User {current_user['email']} deleted history record: {record_id}")
    return {"message": "Record deleted successfully."}

@router.post("/{record_id}/download", status_code=status.HTTP_200_OK)
async def track_download(
    record_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Track and increment download count of a processed result."""
    success = await db.increment_download_count(record_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Record not found."
        )
    
    return {"message": "Download tracked successfully."}
