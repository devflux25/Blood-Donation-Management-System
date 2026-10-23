export interface User {
  id: number;
  full_name: string;
  email: string;
  role: 'admin' | 'staff';
  is_active: boolean;
  created_at: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  role: 'admin' | 'staff';
  full_name: string;
  email: string;
}

export interface Donor {
  id: number;
  donor_code: string;
  full_name: string;
  email?: string;
  phone: string;
  date_of_birth: string;
  gender: 'Male' | 'Female' | 'Other';
  blood_group: string;
  address?: string;
  city: string;
  is_eligible: boolean;
  last_donation_date?: string;
  notes?: string;
  is_active: boolean;
  created_at: string;
}

export interface Hospital {
  id: number;
  hospital_code: string;
  name: string;
  license_number: string;
  contact_person: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  is_active: boolean;
  created_at: string;
}

export interface DonationEvent {
  id: number;
  event_code: string;
  title: string;
  organizer: string;
  venue: string;
  city: string;
  event_date: string;
  start_time: string;
  end_time: string;
  capacity: number;
  status: 'Upcoming' | 'Ongoing' | 'Completed' | 'Cancelled';
  description?: string;
  registered_count: number;
  created_at: string;
}

export interface EventRegistration {
  id: number;
  event_id: number;
  donor_id: number;
  registered_at: string;
  status: 'Registered' | 'Attended' | 'Cancelled';
  donor_name?: string;
  donor_phone?: string;
  blood_group?: string;
}

export interface Donation {
  id: number;
  donation_code: string;
  donor_id: number;
  donor_name?: string;
  event_id?: number;
  donation_date: string;
  blood_group: string;
  component_type: string;
  units: number;
  hemoglobin_g_dl?: number;
  blood_pressure?: string;
  pulse_rate?: number;
  screening_status: 'Passed' | 'Failed' | 'Deferred';
  status: 'Scheduled' | 'Completed' | 'Rejected' | 'Cancelled';
  inventory_generated: boolean;
  remarks?: string;
  recorded_by_name?: string;
  created_at: string;
}

export interface BloodInventoryItem {
  id: number;
  batch_number: string;
  donation_id?: number;
  blood_group: string;
  component_type: string;
  volume_ml: number;
  collection_date: string;
  expiry_date: string;
  status: 'Available' | 'Reserved' | 'Issued' | 'Expired' | 'Discarded';
  storage_location: string;
  created_at: string;
}

export interface BloodRequest {
  id: number;
  request_code: string;
  hospital_id: number;
  hospital_name?: string;
  patient_name?: string;
  blood_group: string;
  component_type: string;
  units_requested: number;
  units_fulfilled: number;
  urgency: 'Normal' | 'Urgent' | 'Critical';
  required_date: string;
  status: 'Pending' | 'Approved' | 'Partially Fulfilled' | 'Fulfilled' | 'Rejected' | 'Cancelled';
  notes?: string;
  created_at: string;
}

export interface BloodIssue {
  id: number;
  issue_code: string;
  request_id: number;
  units_issued: number;
  issued_date: string;
  issued_by_name?: string;
  recipient_name: string;
  notes?: string;
}

export interface DashboardStats {
  total_donors: number;
  eligible_donors: number;
  available_units: number;
  pending_requests: number;
  donations_this_month: number;
  inventory_by_group: { blood_group: string; units: number }[];
  monthly_trends: { month: string; donations: number }[];
  recent_donations: any[];
  latest_requests: any[];
}

export interface SystemSetting {
  setting_key: string;
  setting_value: string;
  description?: string;
  updated_at: string;
}
