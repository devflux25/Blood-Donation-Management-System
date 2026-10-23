from datetime import datetime, date, time
from sqlalchemy import (
    Column, Integer, String, Boolean, Date, Time, DateTime, 
    ForeignKey, Text, Enum as SQLEnum, Numeric, CheckConstraint
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    full_name = Column(String(100), nullable=False)
    email = Column(String(120), unique=True, nullable=False, index=True)
    hashed_password = Column(String(255), nullable=False)
    role = Column(SQLEnum("admin", "staff", name="user_role"), nullable=False, default="staff")
    is_active = Column(Boolean, nullable=False, default=True)
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now(), nullable=False)

    recorded_donations = relationship("Donation", back_populates="recorder")
    issued_batches = relationship("BloodIssue", back_populates="issuer")


class Donor(Base):
    __tablename__ = "donors"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    donor_code = Column(String(20), unique=True, nullable=False, index=True)
    full_name = Column(String(120), nullable=False)
    email = Column(String(120), nullable=True)
    phone = Column(String(25), nullable=False, index=True)
    date_of_birth = Column(Date, nullable=False)
    gender = Column(SQLEnum("Male", "Female", "Other", name="donor_gender"), nullable=False)
    blood_group = Column(
        SQLEnum("A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-", name="blood_group_enum"), 
        nullable=False, index=True
    )
    address = Column(String(255), nullable=True)
    city = Column(String(80), nullable=False)
    is_eligible = Column(Boolean, nullable=False, default=True)
    last_donation_date = Column(Date, nullable=True)
    notes = Column(Text, nullable=True)
    is_active = Column(Boolean, nullable=False, default=True)
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now(), nullable=False)

    donations = relationship("Donation", back_populates="donor")
    registrations = relationship("EventRegistration", back_populates="donor")


class Hospital(Base):
    __tablename__ = "hospitals"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    hospital_code = Column(String(20), unique=True, nullable=False, index=True)
    name = Column(String(150), nullable=False)
    license_number = Column(String(50), unique=True, nullable=False)
    contact_person = Column(String(100), nullable=False)
    phone = Column(String(25), nullable=False)
    email = Column(String(120), nullable=False)
    address = Column(String(255), nullable=False)
    city = Column(String(80), nullable=False)
    is_active = Column(Boolean, nullable=False, default=True)
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now(), nullable=False)

    requests = relationship("BloodRequest", back_populates="hospital")


class DonationEvent(Base):
    __tablename__ = "donation_events"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    event_code = Column(String(20), unique=True, nullable=False, index=True)
    title = Column(String(150), nullable=False)
    organizer = Column(String(120), nullable=False)
    venue = Column(String(255), nullable=False)
    city = Column(String(80), nullable=False)
    event_date = Column(Date, nullable=False, index=True)
    start_time = Column(Time, nullable=False)
    end_time = Column(Time, nullable=False)
    capacity = Column(Integer, nullable=False, default=100)
    status = Column(
        SQLEnum("Upcoming", "Ongoing", "Completed", "Cancelled", name="event_status_enum"), 
        nullable=False, default="Upcoming"
    )
    description = Column(Text, nullable=True)
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now(), nullable=False)

    registrations = relationship("EventRegistration", back_populates="event", cascade="all, delete-orphan")
    donations = relationship("Donation", back_populates="event")


class EventRegistration(Base):
    __tablename__ = "event_registrations"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    event_id = Column(Integer, ForeignKey("donation_events.id", ondelete="CASCADE"), nullable=False)
    donor_id = Column(Integer, ForeignKey("donors.id", ondelete="RESTRICT"), nullable=False)
    registered_at = Column(DateTime, server_default=func.now(), nullable=False)
    status = Column(
        SQLEnum("Registered", "Attended", "Cancelled", name="reg_status_enum"), 
        nullable=False, default="Registered"
    )

    event = relationship("DonationEvent", back_populates="registrations")
    donor = relationship("Donor", back_populates="registrations")


class Donation(Base):
    __tablename__ = "donations"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    donation_code = Column(String(25), unique=True, nullable=False, index=True)
    donor_id = Column(Integer, ForeignKey("donors.id", ondelete="RESTRICT"), nullable=False)
    event_id = Column(Integer, ForeignKey("donation_events.id", ondelete="SET NULL"), nullable=True)
    donation_date = Column(Date, nullable=False, index=True)
    blood_group = Column(
        SQLEnum("A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-", name="blood_group_enum"), 
        nullable=False
    )
    component_type = Column(
        SQLEnum("Whole Blood", "Red Blood Cells", "Platelets", "Plasma", name="component_type_enum"),
        nullable=False, default="Whole Blood"
    )
    units = Column(Integer, nullable=False, default=1)
    hemoglobin_g_dl = Column(Numeric(4, 1), nullable=True)
    blood_pressure = Column(String(20), nullable=True)
    pulse_rate = Column(Integer, nullable=True)
    screening_status = Column(
        SQLEnum("Passed", "Failed", "Deferred", name="screening_status_enum"),
        nullable=False, default="Passed"
    )
    status = Column(
        SQLEnum("Scheduled", "Completed", "Rejected", "Cancelled", name="donation_status_enum"),
        nullable=False, default="Scheduled"
    )
    inventory_generated = Column(Boolean, nullable=False, default=False)
    remarks = Column(Text, nullable=True)
    recorded_by = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now(), nullable=False)

    donor = relationship("Donor", back_populates="donations")
    event = relationship("DonationEvent", back_populates="donations")
    recorder = relationship("User", back_populates="recorded_donations")
    inventory_items = relationship("BloodInventory", back_populates="donation")


class BloodInventory(Base):
    __tablename__ = "blood_inventory"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    batch_number = Column(String(30), unique=True, nullable=False, index=True)
    donation_id = Column(Integer, ForeignKey("donations.id", ondelete="SET NULL"), nullable=True)
    blood_group = Column(
        SQLEnum("A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-", name="blood_group_enum"), 
        nullable=False, index=True
    )
    component_type = Column(
        SQLEnum("Whole Blood", "Red Blood Cells", "Platelets", "Plasma", name="component_type_enum"),
        nullable=False, default="Whole Blood"
    )
    volume_ml = Column(Integer, nullable=False, default=450)
    collection_date = Column(Date, nullable=False)
    expiry_date = Column(Date, nullable=False, index=True)
    status = Column(
        SQLEnum("Available", "Reserved", "Issued", "Expired", "Discarded", name="inv_status_enum"),
        nullable=False, default="Available", index=True
    )
    storage_location = Column(String(50), nullable=False, default="Main Cold Room - Shelf A")
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now(), nullable=False)

    donation = relationship("Donation", back_populates="inventory_items")
    issue_allocations = relationship("BloodIssueItem", back_populates="inventory_item")


class BloodRequest(Base):
    __tablename__ = "blood_requests"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    request_code = Column(String(25), unique=True, nullable=False, index=True)
    hospital_id = Column(Integer, ForeignKey("hospitals.id", ondelete="RESTRICT"), nullable=False)
    patient_name = Column(String(100), nullable=True)
    blood_group = Column(
        SQLEnum("A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-", name="blood_group_enum"), 
        nullable=False, index=True
    )
    component_type = Column(
        SQLEnum("Whole Blood", "Red Blood Cells", "Platelets", "Plasma", name="component_type_enum"),
        nullable=False, default="Whole Blood"
    )
    units_requested = Column(Integer, nullable=False)
    units_fulfilled = Column(Integer, nullable=False, default=0)
    urgency = Column(
        SQLEnum("Normal", "Urgent", "Critical", name="req_urgency_enum"),
        nullable=False, default="Normal"
    )
    required_date = Column(Date, nullable=False)
    status = Column(
        SQLEnum("Pending", "Approved", "Partially Fulfilled", "Fulfilled", "Rejected", "Cancelled", name="req_status_enum"),
        nullable=False, default="Pending", index=True
    )
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now(), nullable=False)

    __table_args__ = (
        CheckConstraint("units_requested > 0", name="chk_units_requested_positive"),
        CheckConstraint("units_fulfilled >= 0 AND units_fulfilled <= units_requested", name="chk_units_fulfilled_valid"),
    )

    hospital = relationship("Hospital", back_populates="requests")
    issues = relationship("BloodIssue", back_populates="request")


class BloodIssue(Base):
    __tablename__ = "blood_issues"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    issue_code = Column(String(25), unique=True, nullable=False, index=True)
    request_id = Column(Integer, ForeignKey("blood_requests.id", ondelete="RESTRICT"), nullable=False)
    units_issued = Column(Integer, nullable=False)
    issued_date = Column(DateTime, server_default=func.now(), nullable=False)
    issued_by = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    recipient_name = Column(String(100), nullable=False)
    notes = Column(Text, nullable=True)

    __table_args__ = (
        CheckConstraint("units_issued > 0", name="chk_issue_units_positive"),
    )

    request = relationship("BloodRequest", back_populates="issues")
    issuer = relationship("User", back_populates="issued_batches")
    allocated_items = relationship("BloodIssueItem", back_populates="issue", cascade="all, delete-orphan")


class BloodIssueItem(Base):
    __tablename__ = "blood_issue_items"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    issue_id = Column(Integer, ForeignKey("blood_issues.id", ondelete="CASCADE"), nullable=False)
    inventory_id = Column(Integer, ForeignKey("blood_inventory.id", ondelete="RESTRICT"), nullable=False, unique=True)

    issue = relationship("BloodIssue", back_populates="allocated_items")
    inventory_item = relationship("BloodInventory", back_populates="issue_allocations")


class SystemSetting(Base):
    __tablename__ = "system_settings"

    setting_key = Column(String(50), primary_key=True)
    setting_value = Column(String(255), nullable=False)
    description = Column(String(255), nullable=True)
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now(), nullable=False)
