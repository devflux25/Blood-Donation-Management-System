# Entity-Relationship (ER) Diagram — Blood Donation Management System

This document outlines the entity relationships, primary/foreign keys, cardinality, and constraints designed for `blood_donation_db`.

```mermaid
erDiagram
    USERS ||--o{ DONATIONS : records
    USERS ||--o{ BLOOD_ISSUES : authorizes
    
    DONORS ||--o{ DONATIONS : gives
    DONORS ||--o{ EVENT_REGISTRATIONS : attends
    
    DONATION_EVENTS ||--o{ EVENT_REGISTRATIONS : hosts
    DONATION_EVENTS ||--o{ DONATIONS : facilitates
    
    DONATIONS ||--o| BLOOD_INVENTORY : yields
    
    HOSPITALS ||--o{ BLOOD_REQUESTS : requests
    
    BLOOD_REQUESTS ||--o{ BLOOD_ISSUES : fulfills
    BLOOD_ISSUES ||--|{ BLOOD_ISSUE_ITEMS : contains
    BLOOD_INVENTORY ||--o| BLOOD_ISSUE_ITEMS : allocates

    USERS {
        int id PK
        string full_name
        string email UK
        string hashed_password
        enum role "admin, staff"
        boolean is_active
        timestamp created_at
    }

    DONORS {
        int id PK
        string donor_code UK
        string full_name
        string email
        string phone
        date date_of_birth
        enum gender
        enum blood_group
        string city
        boolean is_eligible
        date last_donation_date
        boolean is_active
    }

    HOSPITALS {
        int id PK
        string hospital_code UK
        string name
        string license_number UK
        string contact_person
        string phone
        string email
        string city
        boolean is_active
    }

    DONATION_EVENTS {
        int id PK
        string event_code UK
        string title
        string organizer
        string venue
        string city
        date event_date
        time start_time
        time end_time
        int capacity
        enum status
    }

    EVENT_REGISTRATIONS {
        int id PK
        int event_id FK
        int donor_id FK
        timestamp registered_at
        enum status
    }

    DONATIONS {
        int id PK
        string donation_code UK
        int donor_id FK
        int event_id FK
        date donation_date
        enum blood_group
        enum component_type
        int units
        decimal hemoglobin_g_dl
        string blood_pressure
        enum screening_status
        enum status
        boolean inventory_generated
        int recorded_by FK
    }

    BLOOD_INVENTORY {
        int id PK
        string batch_number UK
        int donation_id FK
        enum blood_group
        enum component_type
        int volume_ml
        date collection_date
        date expiry_date
        enum status
        string storage_location
    }

    BLOOD_REQUESTS {
        int id PK
        string request_code UK
        int hospital_id FK
        string patient_name
        enum blood_group
        enum component_type
        int units_requested
        int units_fulfilled
        enum urgency
        date required_date
        enum status
    }

    BLOOD_ISSUES {
        int id PK
        string issue_code UK
        int request_id FK
        int units_issued
        timestamp issued_date
        int issued_by FK
        string recipient_name
        text notes
    }

    BLOOD_ISSUE_ITEMS {
        int id PK
        int issue_id FK
        int inventory_id FK
    }

    SYSTEM_SETTINGS {
        string setting_key PK
        string setting_value
        string description
    }
```

## Relationship Cardinalities Summary
- **DONOR to DONATIONS**: One-to-Many (`1 : N`). A donor can donate multiple times over their lifetime, respecting the mandatory gap interval.
- **DONATION to BLOOD_INVENTORY**: One-to-One (`1 : 1`) for standard component units or `1 : N` if separated into components. In this project, each approved donation batch generates a tracked inventory record.
- **HOSPITAL to BLOOD_REQUESTS**: One-to-Many (`1 : N`). A hospital issues multiple discrete blood requests.
- **BLOOD_REQUEST to BLOOD_ISSUES**: One-to-Many (`1 : N`). A request for 3 units may be fulfilled across multiple deliveries (partial fulfillment) or a single dispatch.
- **BLOOD_ISSUES to BLOOD_INVENTORY**: Many-to-Many via `BLOOD_ISSUE_ITEMS` associative junction table. This enforces batch-level traceability for audits.
- **DONATION_EVENTS to EVENT_REGISTRATIONS to DONORS**: Many-to-Many bridge allowing donors to pre-register for mobile community drives.
