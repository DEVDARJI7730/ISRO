from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List
from datetime import datetime
class UserRegister(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=6)
    full_name: str = Field(..., min_length=1)
class UserLogin(BaseModel):
    username: str  # OAuth2 password bearer expects 'username' field
    password: str
class UserResponse(BaseModel):
    id: str
    email: EmailStr
    full_name: str
    is_admin: bool
    created_at: str
    is_google_user: Optional[bool] = False
    picture_url: Optional[str] = None
class Token(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse
class HistoryResponse(BaseModel):
    id: str
    original_filename: str
    original_url: str
    enhanced_url: str
    colorized_url: str
    timestamp: str
    processing_time: float
    downloads: int
    user_email: str
    metadata: Optional[dict] = None
class SystemStatsResponse(BaseModel):
    total_users: int
    total_images_processed: int
    total_downloads: int
    avg_processing_time_sec: float
    db_mode: str

class ForgotPasswordRequest(BaseModel):
    email: EmailStr

class ResetPasswordRequest(BaseModel):
    email: EmailStr
    otp: str = Field(..., min_length=6, max_length=6)
    new_password: str = Field(..., min_length=6)