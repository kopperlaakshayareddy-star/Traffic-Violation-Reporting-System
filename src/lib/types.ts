export type UserRole = 'admin' | 'officer' | 'citizen';

export type ViolationStatus = 'pending' | 'approved' | 'rejected';

export interface Profile {
  id: string;
  full_name: string;
  phone: string | null;
  role: UserRole;
  created_at: string;
}

export interface Violation {
  id: string;
  reporter_id: string;
  vehicle_number: string;
  vehicle_type: string;
  violation_type: string;
  description: string;
  violation_date: string;
  violation_time: string;
  location: string;
  latitude: number | null;
  longitude: number | null;
  image_url: string | null;
  remarks: string | null;
  status: ViolationStatus;
  reviewed_by: string | null;
  review_notes: string | null;
  reviewed_at: string | null;
  created_at: string;
  updated_at: string;
  reporter?: Profile;
  reviewer?: Profile | null;
}

export interface ViolationInput {
  vehicle_number: string;
  vehicle_type: string;
  violation_type: string;
  description: string;
  violation_date: string;
  violation_time: string;
  location: string;
  latitude?: number | null;
  longitude?: number | null;
  image_url?: string | null;
  remarks?: string | null;
}
