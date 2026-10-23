from typing import List, Optional
import uuid
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import or_
from app.core.database import get_db
from app.models import Hospital
from app.schemas import HospitalCreate, HospitalUpdate, HospitalOut
from app.api.deps import get_current_user

router = APIRouter(prefix="/hospitals", tags=["Hospitals"])

@router.get("", response_model=List[HospitalOut])
def list_hospitals(
    skip: int = 0,
    limit: int = 50,
    search: Optional[str] = None,
    city: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    query = db.query(Hospital)
    if search:
        search_fmt = f"%{search}%"
        query = query.filter(
            or_(
                Hospital.name.ilike(search_fmt),
                Hospital.license_number.ilike(search_fmt),
                Hospital.contact_person.ilike(search_fmt)
            )
        )
    if city:
        query = query.filter(Hospital.city.ilike(f"%{city}%"))

    return query.order_by(Hospital.name.asc()).offset(skip).limit(limit).all()

@router.post("", response_model=HospitalOut, status_code=status.HTTP_201_CREATED)
def create_hospital(
    payload: HospitalCreate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    existing = db.query(Hospital).filter(Hospital.license_number == payload.license_number).first()
    if existing:
        raise HTTPException(status_code=400, detail="A hospital with this license number already exists")

    code = f"HSP-{uuid.uuid4().hex[:4].upper()}"
    hospital = Hospital(
        hospital_code=code,
        **payload.model_dump()
    )
    db.add(hospital)
    db.commit()
    db.refresh(hospital)
    return hospital

@router.put("/{hospital_id}", response_model=HospitalOut)
def update_hospital(
    hospital_id: int,
    payload: HospitalUpdate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    hospital = db.query(Hospital).filter(Hospital.id == hospital_id).first()
    if not hospital:
        raise HTTPException(status_code=404, detail="Hospital not found")

    update_data = payload.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(hospital, field, value)

    db.commit()
    db.refresh(hospital)
    return hospital
