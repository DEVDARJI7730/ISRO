import os
import asyncio
from backend.app.config import settings

# Boto3 client import for S3 storage
try:
    import boto3
    from botocore.exceptions import ClientError
    BOTO3_AVAILABLE = True
except ImportError:
    BOTO3_AVAILABLE = False

class StorageManager:
    """Manages files transparently between local disk and AWS S3 bucket storage."""
    def __init__(self):
        self.s3_client = None
        self.bucket_name = settings.AWS_STORAGE_BUCKET_NAME
        self.use_s3 = False

        if BOTO3_AVAILABLE and settings.AWS_ACCESS_KEY_ID and settings.AWS_SECRET_ACCESS_KEY and self.bucket_name:
            try:
                self.s3_client = boto3.client(
                    's3',
                    aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
                    aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
                    region_name=settings.AWS_REGION
                )
                self.use_s3 = True
                print(f"Cloud Storage Mode: AWS S3 ({self.bucket_name})")
            except Exception as e:
                print(f"AWS S3 connection failed: {e}. Falling back to Local Static files.")
        else:
            print("Cloud Storage Mode: Local Static Files")

    async def upload_file(self, local_path: str) -> str:
        """
        Uploads a local file to S3 and returns the public S3 URL.
        If S3 is not configured, returns the local static endpoint path.
        """
        filename = os.path.basename(local_path)
        
        if self.use_s3 and self.s3_client:
            # Run blocking boto3 client upload in a separate threadpool executor
            loop = asyncio.get_running_loop()
            try:
                # S3 key prefix for organization
                s3_key = f"uploads/{filename}"
                
                # Determine Content-Type
                content_type = "image/png"
                if filename.lower().endswith(".jpg") or filename.lower().endswith(".jpeg"):
                    content_type = "image/jpeg"
                elif filename.lower().endswith(".tiff") or filename.lower().endswith(".tif"):
                    content_type = "image/tiff"
                
                await loop.run_in_executor(
                    None,
                    lambda: self.s3_client.upload_file(
                        local_path,
                        self.bucket_name,
                        s3_key,
                        ExtraArgs={
                            'ACL': 'public-read',
                            'ContentType': content_type
                        }
                    )
                )
                
                # Clean up local file after uploading to conserve disk space
                if os.path.exists(local_path):
                    os.remove(local_path)
                    
                # Construct public S3 access URL
                s3_url = f"https://{self.bucket_name}.s3.{settings.AWS_REGION}.amazonaws.com/{s3_key}"
                return s3_url
            except Exception as e:
                print(f"Failed to upload {filename} to S3: {e}. Falling back to local static URL.")
                
        # Fallback to local static URL path
        return f"/static/uploads/{filename}"

    async def delete_file(self, file_url: str):
        """Removes a file from S3 or local static uploads folder."""
        filename = os.path.basename(file_url)
        
        # If it is an S3 URL, delete from S3
        if "s3.amazonaws.com" in file_url and self.use_s3 and self.s3_client:
            loop = asyncio.get_running_loop()
            try:
                s3_key = f"uploads/{filename}"
                await loop.run_in_executor(
                    None,
                    lambda: self.s3_client.delete_object(Bucket=self.bucket_name, Key=s3_key)
                )
                print(f"Deleted S3 object: {s3_key}")
                return
            except Exception as e:
                print(f"Failed to delete S3 object {filename}: {e}")
                
        # Fallback to deleting from local disk uploads folder
        local_path = os.path.join(settings.UPLOAD_DIR, filename)
        if os.path.exists(local_path):
            try:
                os.remove(local_path)
                print(f"Deleted local static file: {local_path}")
            except Exception as e:
                print(f"Failed to delete local static file {filename}: {e}")

storage_manager = StorageManager()
