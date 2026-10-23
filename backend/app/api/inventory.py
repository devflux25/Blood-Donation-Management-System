from typing import List, Optional
from datetime import date
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.core.database import get_db
from app.models import BloodInventory, SystemSetting
from app.schemas import InventoryOut
from app.api.deps import get_current_user

router = APIRouter(prefix="/inventory", tags=["Inventory"])

@router.get("", response_model=List[InventoryOut])
def list_inventory(
    skip: int = 0,
    limit: int = 100,
    blood_group: Optional[str] = None,
    component_type: Optional[str] = None,
    status: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    query = db.query(BloodInventory)
    if blood_group:
        query = query.filter(BloodInventory.blood_group == blood_group)
    if component_type:
        query = query.filter(BloodInventory.component_type == component_type)
    if status:
        query = query.filter(BloodInventory.status == status)

    return query.order_by(BloodInventory.expiry_date.asc()).offset(skip).limit(limit).all()

@router.get("/summary")
def get_inventory_summary(db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    """
    Returns inventory aggregation grouped by blood group with stock alerts
    """
    # Fetch low-stock threshold
    threshold_setting = db.query(SystemSetting).filter(SystemSetting.setting_key == "low_stock_threshold").first()
    threshold = int(threshold_setting.setting_value) if threshold_setting else 5

    groups = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"]
    
    # Query available units per group
    rows = db.query(
        BloodInventory.blood_group,
        func.count(BloodInventory.id).label("units_count")
    ).filter(
        BloodInventory.status == "Available",
        BloodInventory.expiry_date >= date.today()
    ).group_by(BloodInventory.blood_group).all()

    counts_dict = {r[0]: r[1] for r in rows}

    summary = []
    total_available = 0
    low_stock_alerts = []

    for bg in groups:
        cnt = counts_dict.get(bg, 0)
        total_available += cnt
        is_low = cnt < threshold
        if is_low:
            low_stock_alerts.append(bg)
        summary.append({
            "blood_group": bg,
            "units_available": cnt,
            "is_low_stock": is_low
        })

    # Count expiring soon (within 7 days)
    expiring_soon_count = db.query(func.count(BloodInventory.id)).filter(
        BloodInventory.status == "Available",
        BloodInventory.expiry_date >= date.today(),
        BloodInventory.expiry_date <= func.date_add(date.today(), func.interval(7, "DAY"))
    ).scalar() or 0

    return {
        "groups": summary,
        "total_available_units": total_available,
        "low_stock_blood_groups": low_stock_alerts,
        "expiring_soon_count": expiring_soon_count,
        "threshold_used": threshold
    }
