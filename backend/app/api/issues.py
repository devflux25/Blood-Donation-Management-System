from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models import BloodIssue
from app.schemas import IssueCreate, IssueOut
from app.services.blood_service import issue_blood_transaction
from app.api.deps import get_current_user

router = APIRouter(prefix="/issues", tags=["Blood Issues"])

@router.get("", response_model=List[IssueOut])
def list_issues(
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    issues = db.query(BloodIssue).order_by(BloodIssue.id.desc()).offset(skip).limit(limit).all()
    result = []
    for iss in issues:
        out = IssueOut.model_validate(iss)
        out.issued_by_name = iss.issuer.full_name if iss.issuer else None
        result.append(out)
    return result

@router.post("", response_model=IssueOut, status_code=status.HTTP_201_CREATED)
def issue_blood(
    payload: IssueCreate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """
    Executes safe ACID-compliant transactional blood distribution.
    Locks records, assigns batches, prevents double-issuance, and updates status atomically.
    """
    try:
        issue = issue_blood_transaction(
            db=db,
            request_id=payload.request_id,
            units_to_issue=payload.units_to_issue,
            recipient_name=payload.recipient_name,
            issued_by_id=current_user.id,
            notes=payload.notes,
            preferred_inventory_ids=payload.preferred_inventory_ids
        )
        db.commit()
        db.refresh(issue)

        out = IssueOut.model_validate(issue)
        out.issued_by_name = current_user.full_name
        return out
    except HTTPException:
        db.rollback()
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Transaction failed: {str(e)}")
