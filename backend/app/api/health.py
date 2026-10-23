from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.core.database import get_db

router = APIRouter(prefix="/health", tags=["Health"])

@router.get("")
def health_check():
    """Lightweight application uptime check"""
    return {
        "status": "online",
        "service": "Blood Donation Management System API",
        "version": "1.0.0"
    }

@router.get("/db")
def database_health_check(db: Session = Depends(get_db)):
    """Verifies live connectivity to MySQL by executing a genuine query"""
    try:
        result = db.execute(text("SELECT 1 AS live_test")).fetchone()
        if result and result[0] == 1:
            return {
                "status": "connected",
                "database": "MySQL",
                "message": "Successfully connected to blood_donation_db"
            }
        raise Exception("Database query returned unexpected result")
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Database connection failed: {str(e)}"
        )
