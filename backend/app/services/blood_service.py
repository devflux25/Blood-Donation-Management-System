from datetime import date, timedelta
import uuid
from typing import List
from sqlalchemy.orm import Session
from sqlalchemy import func
from fastapi import HTTPException, status
from app.models import Donation, BloodInventory, BloodRequest, BloodIssue, BloodIssueItem, Donor, SystemSetting

def get_setting_value(db: Session, key: str, default: str) -> str:
    setting = db.query(SystemSetting).filter(SystemSetting.setting_key == key).first()
    return setting.setting_value if setting else default

def generate_inventory_for_donation(db: Session, donation_id: int) -> BloodInventory:
    """
    Safely generates a unique, traceable inventory batch from an approved completed donation.
    Enforces idempotency: does not generate duplicates if run repeatedly.
    """
    donation = db.query(Donation).filter(Donation.id == donation_id).first()
    if not donation:
        raise HTTPException(status_code=404, detail="Donation record not found")
    
    if donation.status != "Completed":
        raise HTTPException(status_code=400, detail="Only completed donations can generate inventory")
    
    if donation.inventory_generated:
        # Already generated, return existing item
        existing = db.query(BloodInventory).filter(BloodInventory.donation_id == donation.id).first()
        if existing:
            return existing

    # Shelf life lookup
    shelf_life = int(get_setting_value(db, "whole_blood_shelf_life_days", "42"))
    if donation.component_type == "Platelets":
        shelf_life = 5
    elif donation.component_type == "Plasma":
        shelf_life = 365

    expiry_date = donation.donation_date + timedelta(days=shelf_life)
    unique_suffix = uuid.uuid4().hex[:6].upper()
    batch_num = f"B-{donation.blood_group.replace('+', 'P').replace('-', 'N')}-{donation.donation_date.strftime('%y%m%d')}-{unique_suffix}"

    inventory_item = BloodInventory(
        batch_number=batch_num,
        donation_id=donation.id,
        blood_group=donation.blood_group,
        component_type=donation.component_type,
        volume_ml=450 if donation.component_type == "Whole Blood" else 300,
        collection_date=donation.donation_date,
        expiry_date=expiry_date,
        status="Available",
        storage_location="Main Cold Room - Shelf A"
    )
    db.add(inventory_item)
    donation.inventory_generated = True

    # Update donor's last donation date
    donor = db.query(Donor).filter(Donor.id == donation.donor_id).first()
    if donor:
        donor.last_donation_date = donation.donation_date

    return inventory_item

def issue_blood_transaction(
    db: Session,
    request_id: int,
    units_to_issue: int,
    recipient_name: str,
    issued_by_id: int,
    notes: str = None,
    preferred_inventory_ids: List[int] = None
) -> BloodIssue:
    """
    Executes an ACID transactional blood issue allocation.
    1. Locks candidate inventory batches
    2. Validates request approval and remaining unfulfilled count
    3. Allocates batches (Earliest Expiry First)
    4. Updates batches to 'Issued'
    5. Decreases request balance and records issue & audit links
    """
    request = db.query(BloodRequest).filter(BloodRequest.id == request_id).with_for_update().first()
    if not request:
        raise HTTPException(status_code=404, detail="Blood request not found")
    
    if request.status not in ["Pending", "Approved", "Partially Fulfilled"]:
        raise HTTPException(
            status_code=400, 
            detail=f"Cannot issue blood for request with status '{request.status}'. Request must be Approved or Pending."
        )

    remaining_units = request.units_requested - request.units_fulfilled
    if units_to_issue > remaining_units:
        raise HTTPException(
            status_code=400,
            detail=f"Requested issue quantity ({units_to_issue}) exceeds unfulfilled balance ({remaining_units})"
        )

    # Find available batches matching blood group & component, not expired
    query = db.query(BloodInventory).filter(
        BloodInventory.blood_group == request.blood_group,
        BloodInventory.component_type == request.component_type,
        BloodInventory.status == "Available",
        BloodInventory.expiry_date >= date.today()
    ).with_for_update()

    if preferred_inventory_ids:
        query = query.filter(BloodInventory.id.in_(preferred_inventory_ids))
    
    # Order by earliest expiry first (FIFO principle for clinical inventory)
    available_batches = query.order_by(BloodInventory.expiry_date.asc()).limit(units_to_issue).all()

    if len(available_batches) < units_to_issue:
        raise HTTPException(
            status_code=400,
            detail=f"Insufficient inventory available for {request.blood_group} {request.component_type}. "
                   f"Required: {units_to_issue}, Available: {len(available_batches)}"
        )

    # Create Issue record
    issue_code = f"ISS-{uuid.uuid4().hex[:8].upper()}"
    new_issue = BloodIssue(
        issue_code=issue_code,
        request_id=request.id,
        units_issued=units_to_issue,
        issued_by=issued_by_id,
        recipient_name=recipient_name,
        notes=notes
    )
    db.add(new_issue)
    db.flush()  # obtain new_issue.id

    # Allocate each batch
    for batch in available_batches:
        batch.status = "Issued"
        issue_item = BloodIssueItem(
            issue_id=new_issue.id,
            inventory_id=batch.id
        )
        db.add(issue_item)

    # Update blood request counts
    request.units_fulfilled += units_to_issue
    if request.units_fulfilled >= request.units_requested:
        request.status = "Fulfilled"
    else:
        request.status = "Partially Fulfilled"

    return new_issue
