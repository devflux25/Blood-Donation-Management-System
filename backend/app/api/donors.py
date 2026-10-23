from typing import List, Optional
import uuid
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import or_
from app.core.database import get_db
from app.models import Donor
from app.schemas import DonorCreate, DonorUpdate, DonorOut
from app.api.deps import get_current_user

router = APIRouter(prefix="/donors", tags=["Donors"])

@router.get("", response_model=List[DonorOut])
def list_donors(
    skip: int = 0,
    limit: int = 50,
    search: Optional[str] = None,
    blood_group: Optional[str] = None,
    is_eligible: Optional[bool] = None,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    query = db.query(Donor)
    if search:
        search_fmt = f"%{search}%"
        query = query.filter(
            or_(
                Donor.full_name.ilike(search_fmt),
                Donor.donor_code.ilike(search_fmt),
                Donor.phone.ilike(search_fmt),
                Donor.city.ilike(search_fmt)
            )
        )
    if blood_group:
        query = query.filter(Donor.blood_group == blood_group)
    if is_eligible is not None:
        query = query.filter(Donor.is_eligible == is_eligible)

    return query.order_by(Donor.id.desc()).offset(skip).limit(limit).all()

@router.post("", response_model=DonorOut, status_code=status.HTTP_201_CREATED)
def create_donor(
    payload: DonorCreate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    # Prevent duplicate phone
    existing = db.query(Donor).filter(Donor.phone == payload.phone).first()
    if existing:
        raise HTTPException(status_code=400, detail="A donor with this phone number is already registered")

    code = f"DNR-{uuid.uuid4().hex[:6].upper()}"
    donor = Donor(
        donor_code=code,
        **payload.model_dump()
    )
    db.add(donor)
    db.commit()
    db.refresh(donor)
    return donor

@router.get("/{donor_id}", response_model=DonorOut)
def get_donor(donor_id: int, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    donor = db.query(Donor).filter(Donor.id == donor_id).first()
    if not donor:
        raise HTTPException(status_code=404, detail="Donor not found")
    return donor

@router.put("/{donor_id}", response_model=DonorOut)
def update_donor(
    donor_id: int,
    payload: DonorUpdate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    donor = db.query(Donor).filter(Donor.id == donor_id).first()
    if not donor:
        raise HTTPException(status_code=404, detail="Donor not found")
    
    update_data = payload.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(donor, field, value)

    db.commit()
    db.refresh(donor)
    return donor

@router.delete("/{donor_id}", status_code=status.HTTP_200_OK)
def deactivate_donor(donor_id: int, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    donor = db.query(Donor).filter(Donor.id == donor_id).first()
    if not donor:
        raise HTTPException(status_code=404, detail="Donor not found")
    donor.is_active = False
    db.commit()
    return {"message": "Donor deactivated successfully"}
