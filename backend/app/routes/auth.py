import os
import urllib.parse
import httpx
from datetime import timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import RedirectResponse
from fastapi.security import OAuth2PasswordRequestForm
from backend.app.models.schemas import UserRegister, UserResponse, Token, ForgotPasswordRequest, ResetPasswordRequest
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


async def send_otp_email(to_email: str, otp_code: str) -> bool:
    from email.mime.text import MIMEText
    from email.mime.multipart import MIMEMultipart
    
    body = f"""
    <html>
        <body style="font-family: Arial, sans-serif; background-color: #0c081a; color: #ffffff; padding: 25px; border-radius: 8px;">
            <h2 style="color: #9d4edd; text-align: center;">IRVision AI Recovery</h2>
            <p>A password reset OTP was requested for your scientist account.</p>
            <div style="background-color: #1a1635; border: 1px solid #9d4edd; padding: 15px; border-radius: 8px; font-size: 24px; font-weight: bold; text-align: center; letter-spacing: 5px; color: #ffffff; margin: 15px 0;">
                {otp_code}
            </div>
            <p style="font-size: 11px; color: #a0aec0;">This verification code is valid for 10 minutes. If you did not request this, you can safely ignore this email.</p>
        </body>
    </html>
    """
    
    # 1. Try Brevo HTTP API (allows sending to any address for free without verified domains)
    brevo_api_key = os.getenv("BREVO_API_KEY")
    if brevo_api_key:
        try:
            headers = {
                "api-key": brevo_api_key,
                "Content-Type": "application/json"
            }
            sender_email = settings.SMTP_FROM or "darjidev2504@gmail.com"
            payload = {
                "sender": {"email": sender_email, "name": "IRVision AI"},
                "to": [{"email": to_email}],
                "subject": "IRVision AI - Scientist Password Reset OTP",
                "htmlContent": body
            }
            async with httpx.AsyncClient() as client:
                res = await client.post("https://api.brevo.com/v3/smtp/email", headers=headers, json=payload, timeout=5.0)
                if res.status_code in (200, 201, 202):
                    print(f"[Brevo Success] Sent password reset OTP email to {to_email}", flush=True)
                    return True
                else:
                    print(f"[Brevo Error] API returned status {res.status_code}: {res.text}", flush=True)
        except Exception as e:
            print(f"[Brevo Error] Failed to send email via Brevo API: {str(e)}", flush=True)

    # 2. Try Resend HTTP API (fallback, requires domain verification for non-owners)
    resend_api_key = os.getenv("RESEND_API_KEY")
    if resend_api_key:
        try:
            headers = {
                "Authorization": f"Bearer {resend_api_key}",
                "Content-Type": "application/json"
            }
            payload = {
                "from": "IRVision AI <onboarding@resend.dev>",
                "to": to_email,
                "subject": "IRVision AI - Scientist Password Reset OTP",
                "html": body
            }
            async with httpx.AsyncClient() as client:
                res = await client.post("https://api.resend.com/emails", headers=headers, json=payload, timeout=5.0)
                if res.status_code in (200, 201):
                    print(f"[Resend Success] Sent password reset OTP email to {to_email}", flush=True)
                    return True
                else:
                    print(f"[Resend Error] API returned status {res.status_code}: {res.text}", flush=True)
        except Exception as e:
            print(f"[Resend Error] Failed to send email via Resend API: {str(e)}", flush=True)

    # 2. Fallback to standard SMTP (for local run or environments allowing SMTP)
    import smtplib
    host = settings.SMTP_HOST
    port = settings.SMTP_PORT
    username = settings.SMTP_USERNAME
    password = settings.SMTP_PASSWORD
    sender = settings.SMTP_FROM or username
    
    if not host or not username or not password:
        print(f"[SMTP Fallback] SMTP not configured. Logged OTP for {to_email}: {otp_code}", flush=True)
        return False
        
    try:
        msg = MIMEMultipart()
        msg['From'] = sender
        msg['To'] = to_email
        msg['Subject'] = "IRVision AI - Scientist Password Reset OTP"
        msg.attach(MIMEText(body, 'html'))
        
        if port == 465:
            server = smtplib.SMTP_SSL(host, port, timeout=5.0)
        else:
            server = smtplib.SMTP(host, port, timeout=5.0)
            server.starttls()
            
        server.login(username, password)
        server.sendmail(sender, to_email, msg.as_string())
        server.quit()
        print(f"[SMTP Success] Sent password reset OTP email to {to_email}", flush=True)
        return True
    except Exception as e:
        print(f"[SMTP Error] Failed to send email to {to_email}: {str(e)}", flush=True)
        return False


@router.post("/forgot-password")
async def forgot_password(payload: ForgotPasswordRequest):
    import random
    from datetime import datetime, timedelta
    email = payload.email.lower()
    user = await db.get_user(email)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Scientist account not found with this email address."
        )
    otp_code = str(random.randint(100000, 999999))
    expires_at = datetime.utcnow() + timedelta(minutes=10)
    await db.save_otp(email, otp_code, expires_at)
    
    # Send via SMTP
    smtp_sent = await send_otp_email(email, otp_code)
    
    print(f"PASSWORD RESET OTP for user {email}: {otp_code} (Expires in 10 mins) [SMTP Sent: {smtp_sent}]", flush=True)
    await db.add_log("WARNING", f"PASSWORD RESET OTP for user {email}: {otp_code} (Expires in 10 mins). SMTP status: {'Sent' if smtp_sent else 'Failed/Logged'}")
    
    if smtp_sent:
        return {"message": "Reset OTP code sent successfully to your registered email account."}
    return {"message": "Reset OTP code generated successfully. Please retrieve it from the Systems Admin log dashboard."}


@router.post("/reset-password")
async def reset_password(payload: ResetPasswordRequest):
    from datetime import datetime
    email = payload.email.lower()
    user = await db.get_user(email)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Scientist account not found."
        )
    otp_code = user.get("otp_code")
    otp_expires_at = user.get("otp_expires_at")
    if not otp_code or not otp_expires_at:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No active password reset request exists for this account."
        )
    if isinstance(otp_expires_at, str):
        try:
            expires_dt = datetime.fromisoformat(otp_expires_at)
        except Exception:
            expires_dt = datetime.utcnow()
    else:
        expires_dt = otp_expires_at
    if datetime.utcnow() > expires_dt:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password reset OTP code has expired."
        )
    if payload.otp != otp_code:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid 6-digit OTP code."
        )
    hashed_password = hash_password(payload.new_password)
    await db.reset_password(email, hashed_password)
    await db.add_log("INFO", f"Password reset successfully for user {email}.")
    return {"message": "Password reset successfully. You can now login with your new password."}