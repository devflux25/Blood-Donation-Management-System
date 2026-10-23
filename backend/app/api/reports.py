from typing import Optional
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.core.database import get_db
from app.api.deps import get_current_user

router = APIRouter(prefix="/reports", tags=["Reports"])

@router.get("/inventory-breakdown")
def get_inventory_report(db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    rows = db.execute(text("""
        SELECT 
            blood_group,
            component_type,
            status,
            COUNT(*) AS unit_count,
            MIN(expiry_date) AS earliest_expiry,
            MAX(expiry_date) AS latest_expiry
        FROM blood_inventory
        GROUP BY blood_group, component_type, status
        ORDER BY blood_group ASC, component_type ASC
    """)).fetchall()

    return [
        {
            "blood_group": r[0],
            "component_type": r[1],
            "status": r[2],
            "unit_count": r[3],
            "earliest_expiry": r[4].isoformat() if r[4] else None,
            "latest_expiry": r[5].isoformat() if r[5] else None
        }
        for r in rows
    ]

@router.get("/hospital-fulfillment")
def get_hospital_fulfillment_report(db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    rows = db.execute(text("""
        SELECT 
            h.name AS hospital_name,
            h.city,
            COUNT(r.id) AS total_requests,
            COALESCE(SUM(r.units_requested), 0) AS total_requested,
            COALESCE(SUM(r.units_fulfilled), 0) AS total_fulfilled,
            ROUND(COALESCE(SUM(r.units_fulfilled) * 100.0 / NULLIF(SUM(r.units_requested), 0), 0), 1) AS fulfillment_rate_percent
        FROM hospitals h
        LEFT JOIN blood_requests r ON h.id = r.hospital_id
        GROUP BY h.id, h.name, h.city
        ORDER BY total_requested DESC
    """)).fetchall()

    return [
        {
            "hospital_name": r[0],
            "city": r[1],
            "total_requests": r[2],
            "total_requested": r[3],
            "total_fulfilled": r[4],
            "fulfillment_rate_percent": float(r[5])
        }
        for r in rows
    ]

@router.get("/expiring-soon")
def get_expiring_soon_report(days: int = 7, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    rows = db.execute(text(f"""
        SELECT 
            batch_number,
            blood_group,
            component_type,
            volume_ml,
            collection_date,
            expiry_date,
            DATEDIFF(expiry_date, CURDATE()) AS days_remaining,
            storage_location
        FROM blood_inventory
        WHERE status = 'Available'
          AND expiry_date BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL {int(days)} DAY)
        ORDER BY expiry_date ASC
    """)).fetchall()

    return [
        {
            "batch_number": r[0],
            "blood_group": r[1],
            "component_type": r[2],
            "volume_ml": r[3],
            "collection_date": r[4].isoformat() if r[4] else None,
            "expiry_date": r[5].isoformat() if r[5] else None,
            "days_remaining": r[6],
            "storage_location": r[7]
        }
        for r in rows
    ]
