from datetime import date, datetime, time
from typing import Optional, List
from pydantic import BaseModel, EmailStr, Field, field_validator

# --- User & Auth Schemas ---
class Token(BaseModel):
    access_token: str
    token_type: str
    role: str
    full_name: str
    email: str

class TokenPayload(BaseModel):
    sub: Optional[str] = None

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class UserBase(BaseModel):
    full_name: str
    email: EmailStr
    role: str = "staff"
    is_active: bool = True

class UserCreate(UserBase):
    password: str = Field(min_length=6)

class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    email: Optional[EmailStr] = None
    role: Optional[str] = None
    is_active: Optional[bool] = None
    password: Optional[str] = Field(default=None, min_length=6)

class UserOut(UserBase):
    id: int
    created_at: datetime
    class Config:
        from_attributes = True


# --- Donor Schemas ---
class DonorBase(BaseModel):
    full_name: str
    email: Optional[EmailStr] = None
    phone: str
    date_of_birth: date
    gender: str
    blood_group: str
    address: Optional[str] = None
    city: str
    is_eligible: bool = True
    notes: Optional[str] = None

    @field_validator("email", mode="before")
    @classmethod
    def clean_empty_email(cls, v):
        return None if v == "" or v is None else v

class DonorCreate(DonorBase):
    pass

class DonorUpdate(BaseModel):
    full_name: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    gender: Optional[str] = None
    blood_group: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    is_eligible: Optional[bool] = None
    notes: Optional[str] = None
    is_active: Optional[bool] = None

    @field_validator("email", mode="before")
    @classmethod
    def clean_empty_email(cls, v):
        return None if v == "" or v is None else v

class DonorOut(DonorBase):
    id: int
    donor_code: str
    is_active: bool
    last_donation_date: Optional[date] = None
    created_at: datetime
    class Config:
        from_attributes = True


# --- Hospital Schemas ---
class HospitalBase(BaseModel):
    name: str
    license_number: str
    contact_person: str
    phone: str
    email: EmailStr
    address: str
    city: str

class HospitalCreate(HospitalBase):
    pass

class HospitalUpdate(BaseModel):
    name: Optional[str] = None
    license_number: Optional[str] = None
    contact_person: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[EmailStr] = None
    address: Optional[str] = None
    city: Optional[str] = None
    is_active: Optional[bool] = None

class HospitalOut(HospitalBase):
    id: int
    hospital_code: str
    is_active: bool
    created_at: datetime
    class Config:
        from_attributes = True


# --- Event Schemas ---
class EventBase(BaseModel):
    title: str
    organizer: str
    venue: str
    city: str
    event_date: date
    start_time: time
    end_time: time
    capacity: int = 100
    status: str = "Upcoming"
    description: Optional[str] = None

class EventCreate(EventBase):
    pass

class EventUpdate(BaseModel):
    title: Optional[str] = None
    organizer: Optional[str] = None
    venue: Optional[str] = None
    city: Optional[str] = None
    event_date: Optional[date] = None
    start_time: Optional[time] = None
    end_time: Optional[time] = None
    capacity: Optional[int] = None
    status: Optional[str] = None
    description: Optional[str] = None

class EventRegistrationCreate(BaseModel):
    event_id: int
    donor_id: int

class EventRegistrationOut(BaseModel):
    id: int
    event_id: int
    donor_id: int
    registered_at: datetime
    status: str
    donor_name: Optional[str] = None
    donor_phone: Optional[str] = None
    blood_group: Optional[str] = None
    class Config:
        from_attributes = True

class EventOut(EventBase):
    id: int
    event_code: str
    registered_count: Optional[int] = 0
    created_at: datetime
    class Config:
        from_attributes = True


# --- Donation Schemas ---
class DonationBase(BaseModel):
    donor_id: int
    event_id: Optional[int] = None
    donation_date: date
    blood_group: str
    component_type: str = "Whole Blood"
    units: int = 1
    hemoglobin_g_dl: Optional[float] = None
    blood_pressure: Optional[str] = None
    pulse_rate: Optional[int] = None
    screening_status: str = "Passed"
    status: str = "Scheduled"
    remarks: Optional[str] = None

class DonationCreate(DonationBase):
    pass

class DonationUpdate(BaseModel):
    hemoglobin_g_dl: Optional[float] = None
    blood_pressure: Optional[str] = None
    pulse_rate: Optional[int] = None
    screening_status: Optional[str] = None
    status: Optional[str] = None
    remarks: Optional[str] = None

class DonationOut(DonationBase):
    id: int
    donation_code: str
    inventory_generated: bool
    donor_name: Optional[str] = None
    recorded_by_name: Optional[str] = None
    created_at: datetime
    class Config:
        from_attributes = True


# --- Inventory Schemas ---
class InventoryBase(BaseModel):
    blood_group: str
    component_type: str = "Whole Blood"
    volume_ml: int = 450
    collection_date: date
    expiry_date: date
    storage_location: str = "Main Cold Room - Shelf A"

class InventoryCreate(InventoryBase):
    donation_id: Optional[int] = None

class InventoryOut(InventoryBase):
    id: int
    batch_number: str
    donation_id: Optional[int] = None
    status: str
    created_at: datetime
    class Config:
        from_attributes = True


# --- Blood Request Schemas ---
class RequestBase(BaseModel):
    hospital_id: int
    patient_name: Optional[str] = None
    blood_group: str
    component_type: str = "Whole Blood"
    units_requested: int = Field(gt=0)
    urgency: str = "Normal"
    required_date: date
    notes: Optional[str] = None

class RequestCreate(RequestBase):
    pass

class RequestUpdate(BaseModel):
    status: Optional[str] = None
    urgency: Optional[str] = None
    notes: Optional[str] = None

class RequestOut(RequestBase):
    id: int
    request_code: str
    units_fulfilled: int
    status: str
    hospital_name: Optional[str] = None
    created_at: datetime
    class Config:
        from_attributes = True


# --- Blood Issue Schemas ---
class IssueCreate(BaseModel):
    request_id: int
    units_to_issue: int = Field(gt=0)
    recipient_name: str
    notes: Optional[str] = None
    preferred_inventory_ids: Optional[List[int]] = None

class IssueOut(BaseModel):
    id: int
    issue_code: str
    request_id: int
    units_issued: int
    issued_date: datetime
    issued_by_name: Optional[str] = None
    recipient_name: str
    notes: Optional[str] = None
    class Config:
        from_attributes = True


# --- System Settings Schema ---
class SystemSettingOut(BaseModel):
    setting_key: str
    setting_value: str
    description: Optional[str] = None
    updated_at: datetime
    class Config:
        from_attributes = True

class SystemSettingUpdate(BaseModel):
    setting_value: str
