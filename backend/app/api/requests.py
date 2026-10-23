from typing import List, Optional
import uuid
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models import BloodRequest, Hospital
from app.schemas import RequestCreate, RequestUpdate, RequestOut
from app.api.deps import get_current_user

router = APIRouter(prefix="/requests", tags=["Blood Requests"])

@router.get("", response_model=List[RequestOut])
def list_requests(
    skip: int = 0,
    limit: int = 50,
    status: Optional[str] = None,
    blood_group: Optional[str] = None,
    urgency: Optional[str] = None,
    hospital_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    query = db.query(BloodRequest)
    if status:
        query = query.filter(BloodRequest.status == status)
    if blood_group:
        query = query.filter(BloodRequest.blood_group == blood_group)
    if urgency:
        query = query.filter(BloodRequest.urgency == urgency)
    if hospital_id:
        query = query.filter(BloodRequest.hospital_id == hospital_id)

    requests = query.order_by(BloodRequest.id.desc()).offset(skip).limit(limit).all()
    result = []
    for r in requests:
        out = RequestOut.model_validate(r)
        out.hospital_name = r.hospital.name if r.hospital else None
        result.append(out)
    return result

@router.post("", response_model=RequestOut, status_code=status.HTTP_201_CREATED)
def create_request(
    payload: RequestCreate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    hospital = db.query(Hospital).filter(Hospital.id == payload.hospital_id).first()
    if not hospital:
        raise HTTPException(status_code=404, detail="Hospital not found")

    code = f"REQ-{uuid.uuid4().hex[:6].upper()}"
    req = BloodRequest(
        request_code=code,
        **payload.model_dump()
    )
    db.add(req)
    db.commit()
    db.refresh(req)

    out = RequestOut.model_validate(req)
    out.hospital_name = hospital.name
    return out

@router.put("/{request_id}", response_model=RequestOut)
def update_request(
    request_id: int,
    payload: RequestUpdate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    req = db.query(BloodRequest).filter(BloodRequest.id == request_id).first()
    if not req:
        raise HTTPException(status_code=404, detail="Request not found")

    update_data = payload.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(req, field, value)

    db.commit()
    db.refresh(req)

    out = RequestOut.model_validate(req)
    out.hospital_name = req.hospital.name if req.hospital else None
    return out
