import os
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse
from backend.app.config import settings
from backend.app.database import db
from backend.app.auth import hash_password
from backend.app.routes import auth, upload, history, admin

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Backend API for ISRO IR Image Colorization and Enhancement platform",
    version="1.0.0"
)

origins = [origin.strip() for origin in settings.CORS_ORIGINS.split(",") if origin.strip()]
if os.getenv("RENDER"):
    origins.append("https://irvision-ai-client.onrender.com")

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Connect to database and seed Admin on startup
@app.on_event("startup")
async def startup_db_client():
    # 1. Establish DB connection (MongoDB with local JSON fallback)
    await db.connect()
    
    # 2. Seed Default Admin User
    admin_email = settings.ADMIN_EMAIL.lower()
    existing_admin = await db.get_user(admin_email)
    
    if not existing_admin:
        try:
            hashed_pwd = hash_password(settings.ADMIN_PASSWORD)
            admin_data = {
                "email": admin_email,
                "password_hash": hashed_pwd,
                "full_name": "ISRO Admin Team",
                "is_admin": True
            }
            await db.create_user(admin_data)
            await db.add_log("INFO", f"Seeded default administrator account: {admin_email}")
            print(f"Default admin seeded: {admin_email} / {settings.ADMIN_PASSWORD}")
        except Exception as e:
            print(f"Error seeding default administrator: {e}")
            await db.add_log("ERROR", f"Failed to seed admin user: {str(e)}")

# Mount static folder to serve processed images
# Ensure directories exist
static_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "static")
os.makedirs(os.path.join(static_dir, "uploads"), exist_ok=True)
app.mount("/static", StaticFiles(directory=static_dir), name="static")

# Include Routers
app.include_router(auth.router)
app.include_router(upload.router)
app.include_router(history.router)
app.include_router(admin.router)

# Root Endpoint
@app.get("/")
async def root():
    return {
        "project": settings.PROJECT_NAME,
        "status": "Online",
        "database_status": db.mode,
        "api_documentation": "/docs"
    }

# Global Exception Handler
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    error_msg = f"Unhandled exception in {request.method} {request.url.path}: {str(exc)}"
    await db.add_log("ERROR", error_msg)
    print(error_msg)
    return JSONResponse(
        status_code=500,
        content={"detail": "An internal server error occurred. Please consult the system logs."}
    )
