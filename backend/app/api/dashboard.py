from datetime import date
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func, text
from app.core.database import get_db
from app.models import Donor, Donation, BloodInventory, BloodRequest
from app.api.deps import get_current_user

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])

@router.get("/stats")
def get_dashboard_stats(db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    """
    Returns live statistics computed directly from MySQL relational tables:
    - Total registered donors
    - Eligible donors
    - Total available blood units
    - Pending blood requests
    - Donations completed this month
    - Inventory distribution by blood group
    - Monthly donation trends
    - Recent donations
    - Latest hospital requests
    """
    today = date.today()
    first_of_month = date(today.year, today.month, 1)

    total_donors = db.query(func.count(Donor.id)).filter(Donor.is_active == True).scalar() or 0
    eligible_donors = db.query(func.count(Donor.id)).filter(
        Donor.is_active == True,
        Donor.is_eligible == True
    ).scalar() or 0

    available_units = db.query(func.count(BloodInventory.id)).filter(
        BloodInventory.status == "Available",
        BloodInventory.expiry_date >= today
    ).scalar() or 0

    pending_requests = db.query(func.count(BloodRequest.id)).filter(
        BloodRequest.status.in_(["Pending", "Partially Fulfilled"])
    ).scalar() or 0

    donations_this_month = db.query(func.count(Donation.id)).filter(
        Donation.status == "Completed",
        Donation.donation_date >= first_of_month
    ).scalar() or 0

    # Inventory grouped by blood group
    all_groups = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"]
    inv_rows = db.query(
        BloodInventory.blood_group,
        func.count(BloodInventory.id)
    ).filter(
        BloodInventory.status == "Available",
        BloodInventory.expiry_date >= today
    ).group_by(BloodInventory.blood_group).all()

    inv_map = {row[0]: row[1] for row in inv_rows}
    inventory_by_group = [{"blood_group": bg, "units": inv_map.get(bg, 0)} for bg in all_groups]

    # Monthly trends (Past 6 months using safe SQL query)
    trend_rows = db.execute(text("""
        SELECT 
            DATE_FORMAT(donation_date, '%b %Y') AS month_label,
            COUNT(*) AS count
        FROM donations
        WHERE status = 'Completed'
          AND donation_date >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH)
        GROUP BY DATE_FORMAT(donation_date, '%Y-%m'), DATE_FORMAT(donation_date, '%b %Y')
        ORDER BY MIN(donation_date) ASC
    """)).fetchall()

    monthly_trends = [{"month": r[0], "donations": r[1]} for r in trend_rows]

    # Recent 5 donations
    recent_donations_query = db.query(Donation).order_by(Donation.id.desc()).limit(5).all()
    recent_donations = [
        {
            "id": d.id,
            "donation_code": d.donation_code,
            "donor_name": d.donor.full_name if d.donor else "Unknown",
            "blood_group": d.blood_group,
            "units": d.units,
            "donation_date": d.donation_date.isoformat(),
            "status": d.status
        }
        for d in recent_donations_query
    ]

    # Latest 5 requests
    latest_requests_query = db.query(BloodRequest).order_by(BloodRequest.id.desc()).limit(5).all()
    latest_requests = [
        {
            "id": r.id,
            "request_code": r.request_code,
            "hospital_name": r.hospital.name if r.hospital else "Unknown",
            "blood_group": r.blood_group,
            "units_requested": r.units_requested,
            "units_fulfilled": r.units_fulfilled,
            "urgency": r.urgency,
            "status": r.status,
            "required_date": r.required_date.isoformat()
        }
        for r in latest_requests_query
    ]

    return {
        "total_donors": total_donors,
        "eligible_donors": eligible_donors,
        "available_units": available_units,
        "pending_requests": pending_requests,
        "donations_this_month": donations_this_month,
        "inventory_by_group": inventory_by_group,
        "monthly_trends": monthly_trends,
        "recent_donations": recent_donations,
        "latest_requests": latest_requests
    }
