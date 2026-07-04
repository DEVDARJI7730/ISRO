import os
import urllib.parse
import httpx
from datetime import timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import RedirectResponse
from fastapi.security import OAuth2PasswordRequestForm
from backend.app.models.schemas import UserRegister, UserResponse, Token
from backend.app.auth import hash_password, verify_password, create_access_token, get_current_user
from backend.app.database import db
from backend.app.config import settings

router = APIRouter(prefix="/api/auth", tags=["Authentication"])


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register(user_in: UserRegister):
    # Check if user already exists
    existing_user = await db.get_user(user_in.email)
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A user with this email already exists."
        )
    
    # Hash password
    hashed_pwd = hash_password(user_in.password)
    
    # Determine if user is admin
    is_admin = False
    if user_in.email.lower() == "admin@isro.gov.in":
        is_admin = True
        
    user_data = {
        "email": user_in.email.lower(),
        "password_hash": hashed_pwd,
        "full_name": user_in.full_name,
        "is_admin": is_admin
    }
    
    try:
        created = await db.create_user(user_data)
        return created
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Registration failed: {str(e)}"
        )


@router.post("/login", response_model=Token)
async def login(form_data: OAuth2PasswordRequestForm = Depends()):
    # Get user
    user = await db.get_user(form_data.username.lower())
    if not user or not verify_password(form_data.password, user.get("password_hash", "")):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Incorrect email or password."
        )
        
    # Generate access token
    access_token = create_access_token(data={"sub": user["email"]})
    
    user_resp = {
        "id": user["id"],
        "email": user["email"],
        "full_name": user["full_name"],
        "is_admin": user.get("is_admin", False),
        "created_at": user["created_at"],
        "is_google_user": user.get("is_google_user", False),
        "picture_url": user.get("picture_url", "")
    }
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": user_resp
    }


@router.get("/me", response_model=UserResponse)
async def get_me(current_user: dict = Depends(get_current_user)):
    return current_user


@router.post("/logout")
async def logout(current_user: dict = Depends(get_current_user)):
    await db.add_log("INFO", f"User {current_user['email']} logged out.")
    return {"message": "Logged out successfully."}


@router.get("/google/login")
async def google_login():
    if not settings.GOOGLE_CLIENT_ID or not settings.GOOGLE_CLIENT_SECRET:
        # Mock Demo login flow: bypass Google API call and redirect to callback immediately
        await db.add_log("WARNING", "Google OAuth credentials not configured. Initialising mock Google redirect.")
        return RedirectResponse(url="/api/auth/google/callback?code=mock_demo_code")
        
    google_auth_url = (
        "https://accounts.google.com/o/oauth2/v2/auth?"
        "response_type=code&"
        f"client_id={settings.GOOGLE_CLIENT_ID}&"
        f"redirect_uri={urllib.parse.quote(settings.GOOGLE_REDIRECT_URI)}&"
        "scope=openid%20email%20profile"
    )
    return RedirectResponse(url=google_auth_url)


@router.get("/google/callback")
async def google_callback(code: str):
    import json
    
    email = ""
    full_name = ""
    picture_url = ""
    
    if code == "mock_demo_code":
        email = "scientist-demo@isro.gov.in"
        full_name = "Google Scientist Demo"
        picture_url = "https://lh3.googleusercontent.com/a/default-user"
    else:
        # Code Exchange
        token_url = "https://oauth2.googleapis.com/token"
        data = {
            "code": code,
            "client_id": settings.GOOGLE_CLIENT_ID,
            "client_secret": settings.GOOGLE_CLIENT_SECRET,
            "redirect_uri": settings.GOOGLE_REDIRECT_URI,
            "grant_type": "authorization_code"
        }
        
        async with httpx.AsyncClient() as client:
            token_response = await client.post(token_url, data=data)
            if token_response.status_code != 200:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Google code exchange failed: {token_response.text}"
                )
            
            token_data = token_response.json()
            access_token = token_data.get("access_token")
            
            # Fetch User Profile info
            userinfo_url = "https://www.googleapis.com/oauth2/v3/userinfo"
            headers = {"Authorization": f"Bearer {access_token}"}
            userinfo_response = await client.get(userinfo_url, headers=headers)
            
            if userinfo_response.status_code != 200:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Failed to retrieve profile details from Google."
                )
                
            profile = userinfo_response.json()
            email = profile.get("email", "").lower()
            full_name = profile.get("name", "Google User")
            picture_url = profile.get("picture", "")
            
    if not email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Failed to retrieve email address from Google authentication."
        )
        
    # Check if user already exists
    user = await db.get_user(email)
    
    if not user:
        # Create Google authenticated user in database
        import uuid
        hashed_pwd = hash_password(str(uuid.uuid4())) # Random password hash for security
        user_data = {
            "email": email,
            "password_hash": hashed_pwd,
            "full_name": full_name,
            "is_admin": False,
            "is_google_user": True,
            "picture_url": picture_url
        }
        user = await db.create_user(user_data)
        await db.add_log("INFO", f"Registered new Google OAuth user account: {email}")
    else:
        # Update user's Google status indicator and picture
        updates = {"is_google_user": True}
        if picture_url:
            updates["picture_url"] = picture_url
        await db.update_user(email, updates)
        # Fetch updated user object
        user = await db.get_user(email)
            
    # Generate Access Token
    access_token = create_access_token(data={"sub": user["email"]})
    
    user_resp = {
        "id": user["id"],
        "email": user["email"],
        "full_name": user["full_name"],
        "is_admin": user.get("is_admin", False),
        "created_at": user["created_at"],
        "is_google_user": True,
        "picture_url": user.get("picture_url", "")
    }
    
    # Redirect back to the frontend login query handler
    frontend_url = (
        "https://irvision-ai-client.onrender.com/login"
        if os.getenv("RENDER")
        else "http://localhost:5173/login"
    )
    user_json = urllib.parse.quote(json.dumps(user_resp))
    redirect_url = f"{frontend_url}?token={access_token}&user={user_json}"
    
    await db.add_log("INFO", f"User {email} authenticated via Google OAuth successfully.")
    return RedirectResponse(url=redirect_url)