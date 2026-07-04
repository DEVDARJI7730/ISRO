import os
from dotenv import load_dotenv
# Load environment variables from the root .env file
# Try default lookup first
load_dotenv()
# Also search explicitly in the root project directory (parent of backend/)
root_env = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), ".env")
if os.path.exists(root_env):
    load_dotenv(root_env)
class Settings:
    PROJECT_NAME: str = "ISRO IR Image Colorization & Enhancement"
    SECRET_KEY: str = os.getenv("SECRET_KEY", "isro_ir_secret_key_super_secure_9911")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 120
    
    # Database Settings
    MONGODB_URI: str = os.getenv("MONGODB_URI", "")
    DATABASE_NAME: str = "isro_ir_db"
    LOCAL_DB_FILE: str = os.path.join(
        os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 
        os.getenv("LOCAL_DB_FILE", "local_db.json")
    )
    
    # Upload folder paths
    UPLOAD_DIR: str = os.path.join(
        os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 
        "static", 
        "uploads"
    )
    
    # Dynamic CORS Configuration
    CORS_ORIGINS: str = os.getenv("CORS_ORIGINS", "http://localhost:5173,http://localhost:3000,http://127.0.0.1:5173,http://127.0.0.1:3000")
    
    # AWS S3 Storage Settings (Optional fallback to local disk if empty)
    AWS_ACCESS_KEY_ID: str = os.getenv("AWS_ACCESS_KEY_ID", "")
    AWS_SECRET_ACCESS_KEY: str = os.getenv("AWS_SECRET_ACCESS_KEY", "")
    AWS_REGION: str = os.getenv("AWS_REGION", "us-east-1")
    AWS_STORAGE_BUCKET_NAME: str = os.getenv("AWS_STORAGE_BUCKET_NAME", "")
    
    # Google OAuth2 Credentials
    GOOGLE_CLIENT_ID: str = os.getenv("GOOGLE_CLIENT_ID", "")
    GOOGLE_CLIENT_SECRET: str = os.getenv("GOOGLE_CLIENT_SECRET", "")
    GOOGLE_REDIRECT_URI: str = (
        "https://irvision-ai.onrender.com/api/auth/google/callback"
        if os.getenv("RENDER")
        else os.getenv("GOOGLE_REDIRECT_URI", "http://localhost:8000/api/auth/google/callback")
    )
    
    # Admin Seed
    ADMIN_EMAIL: str = os.getenv("ADMIN_EMAIL", "admin@isro.gov.in")
    ADMIN_PASSWORD: str = os.getenv("ADMIN_PASSWORD", "admin123")
settings = Settings()
# Ensure Upload directories exist
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)