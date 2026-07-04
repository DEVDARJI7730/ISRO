from fastapi import APIRouter, Depends, HTTPException, status
from typing import List, Dict, Any
from backend.app.auth import get_admin_user
from backend.app.models.schemas import SystemStatsResponse, UserResponse
from backend.app.database import db

router = APIRouter(prefix="/api/admin", tags=["Admin Operations"])

@router.get("/stats", response_model=SystemStatsResponse)
async def get_stats(admin_user: dict = Depends(get_admin_user)):
    """Retrieve system-wide aggregated metrics and database status."""
    stats = await db.get_system_stats()
    return stats

@router.get("/users", response_model=List[UserResponse])
async def list_users(admin_user: dict = Depends(get_admin_user)):
    """List all registered user accounts (Admin only)."""
    users = await db.get_users()
    # Format for response
    formatted = []
    for u in users:
        formatted.append({
            "id": u["id"],
            "email": u["email"],
            "full_name": u["full_name"],
            "is_admin": u.get("is_admin", False),
            "created_at": u.get("created_at", "")
        })
    return formatted

@router.delete("/users/{email}", status_code=status.HTTP_200_OK)
async def delete_user(email: str, admin_user: dict = Depends(get_admin_user)):
    """Delete a user account from database (Admin only)."""
    if email.lower() == admin_user["email"].lower():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Administrators cannot delete their own accounts."
        )
        
    deleted = await db.delete_user(email.lower())
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User account not found."
        )
        
    await db.add_log("WARNING", f"Admin {admin_user['email']} deleted user account: {email}")
    return {"message": f"User {email} has been deleted successfully."}

@router.get("/logs")
async def get_logs(limit: int = 100, admin_user: dict = Depends(get_admin_user)):
    """Retrieve the latest system operation logs (Admin only)."""
    logs = await db.get_logs(limit)
    return logs
