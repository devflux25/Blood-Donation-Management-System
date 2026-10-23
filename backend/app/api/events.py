from typing import List, Optional
import uuid
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.core.database import get_db
from app.models import DonationEvent, EventRegistration, Donor
from app.schemas import (
    EventCreate, EventUpdate, EventOut, 
    EventRegistrationCreate, EventRegistrationOut
)
from app.api.deps import get_current_user

router = APIRouter(prefix="/events", tags=["Donation Events"])

@router.get("", response_model=List[EventOut])
def list_events(
    skip: int = 0,
    limit: int = 50,
    status: Optional[str] = None,
    city: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    query = db.query(DonationEvent)
    if status:
        query = query.filter(DonationEvent.status == status)
    if city:
        query = query.filter(DonationEvent.city.ilike(f"%{city}%"))

    events = query.order_by(DonationEvent.event_date.asc()).offset(skip).limit(limit).all()
    result = []
    for evt in events:
        out = EventOut.model_validate(evt)
        out.registered_count = len(evt.registrations)
        result.append(out)
    return result

@router.post("", response_model=EventOut, status_code=status.HTTP_201_CREATED)
def create_event(
    payload: EventCreate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    code = f"EVT-{uuid.uuid4().hex[:6].upper()}"
    evt = DonationEvent(
        event_code=code,
        **payload.model_dump()
    )
    db.add(evt)
    db.commit()
    db.refresh(evt)
    out = EventOut.model_validate(evt)
    out.registered_count = 0
    return out

@router.put("/{event_id}", response_model=EventOut)
def update_event(
    event_id: int,
    payload: EventUpdate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    evt = db.query(DonationEvent).filter(DonationEvent.id == event_id).first()
    if not evt:
        raise HTTPException(status_code=404, detail="Event not found")

    update_data = payload.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(evt, field, value)

    db.commit()
    db.refresh(evt)
    out = EventOut.model_validate(evt)
    out.registered_count = len(evt.registrations)
    return out

# --- Registrations ---
@router.get("/{event_id}/registrations", response_model=List[EventRegistrationOut])
def get_event_registrations(
    event_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    regs = db.query(EventRegistration).filter(EventRegistration.event_id == event_id).all()
    result = []
    for r in regs:
        out = EventRegistrationOut.model_validate(r)
        if r.donor:
            out.donor_name = r.donor.full_name
            out.donor_phone = r.donor.phone
            out.blood_group = r.donor.blood_group
        result.append(out)
    return result

@router.post("/register", response_model=EventRegistrationOut, status_code=status.HTTP_201_CREATED)
def register_donor_for_event(
    payload: EventRegistrationCreate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    event = db.query(DonationEvent).filter(DonationEvent.id == payload.event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    
    donor = db.query(Donor).filter(Donor.id == payload.donor_id).first()
    if not donor:
        raise HTTPException(status_code=404, detail="Donor not found")

    # Check capacity limit
    current_count = db.query(func.count(EventRegistration.id)).filter(
        EventRegistration.event_id == event.id,
        EventRegistration.status != "Cancelled"
    ).scalar() or 0

    if current_count >= event.capacity:
        raise HTTPException(status_code=400, detail="Event has already reached maximum registration capacity")

    # Prevent duplicate registration
    existing = db.query(EventRegistration).filter(
        EventRegistration.event_id == payload.event_id,
        EventRegistration.donor_id == payload.donor_id
    ).first()
    if existing:
        if existing.status == "Cancelled":
            existing.status = "Registered"
            db.commit()
            db.refresh(existing)
            out = EventRegistrationOut.model_validate(existing)
            out.donor_name = donor.full_name
            out.donor_phone = donor.phone
            out.blood_group = donor.blood_group
            return out
        raise HTTPException(status_code=400, detail="Donor is already registered for this event")

    reg = EventRegistration(
        event_id=payload.event_id,
        donor_id=payload.donor_id,
        status="Registered"
    )
    db.add(reg)
    db.commit()
    db.refresh(reg)

    out = EventRegistrationOut.model_validate(reg)
    out.donor_name = donor.full_name
    out.donor_phone = donor.phone
    out.blood_group = donor.blood_group
    return out
