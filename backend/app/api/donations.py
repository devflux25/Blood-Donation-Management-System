from typing import List, Optional
from datetime import date
import uuid
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models import Donation, Donor
from app.schemas import DonationCreate, DonationUpdate, DonationOut
from app.services.blood_service import generate_inventory_for_donation
from app.api.deps import get_current_user

router = APIRouter(prefix="/donations", tags=["Donations"])

@router.get("", response_model=List[DonationOut])
def list_donations(
    skip: int = 0,
    limit: int = 50,
    status: Optional[str] = None,
    blood_group: Optional[str] = None,
    donor_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    query = db.query(Donation)
    if status:
        query = query.filter(Donation.status == status)
    if blood_group:
        query = query.filter(Donation.blood_group == blood_group)
    if donor_id:
        query = query.filter(Donation.donor_id == donor_id)

    donations = query.order_by(Donation.id.desc()).offset(skip).limit(limit).all()
    # Enrich donor name and recorder name
    result = []
    for d in donations:
        d_out = DonationOut.model_validate(d)
        d_out.donor_name = d.donor.full_name if d.donor else None
        d_out.recorded_by_name = d.recorder.full_name if d.recorder else None
        result.append(d_out)
    return result

@router.post("", response_model=DonationOut, status_code=status.HTTP_201_CREATED)
def create_donation(
    payload: DonationCreate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    donor = db.query(Donor).filter(Donor.id == payload.donor_id).first()
    if not donor:
        raise HTTPException(status_code=404, detail="Donor does not exist")
    
    code = f"DON-{date.today().strftime('%Y')}-{uuid.uuid4().hex[:6].upper()}"
    donation = Donation(
        donation_code=code,
        recorded_by=current_user.id,
        **payload.model_dump()
    )
    db.add(donation)
    db.flush()

    # If created directly with 'Completed' status, safely create inventory
    if donation.status == "Completed" and donation.screening_status == "Passed":
        generate_inventory_for_donation(db, donation.id)

    db.commit()
    db.refresh(donation)

    d_out = DonationOut.model_validate(donation)
    d_out.donor_name = donor.full_name
    d_out.recorded_by_name = current_user.full_name
    return d_out

@router.put("/{donation_id}", response_model=DonationOut)
def update_donation(
    donation_id: int,
    payload: DonationUpdate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    donation = db.query(Donation).filter(Donation.id == donation_id).first()
    if not donation:
        raise HTTPException(status_code=404, detail="Donation record not found")
    
    update_data = payload.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(donation, field, value)

    # When marked Completed with Passed screening, generate inventory item automatically
    if donation.status == "Completed" and donation.screening_status == "Passed" and not donation.inventory_generated:
        generate_inventory_for_donation(db, donation.id)

    db.commit()
    db.refresh(donation)

    d_out = DonationOut.model_validate(donation)
    d_out.donor_name = donation.donor.full_name if donation.donor else None
    d_out.recorded_by_name = donation.recorder.full_name if donation.recorder else None
    return d_out
