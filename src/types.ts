export interface Account {
  id: number;
  client_id: number;
  client_name?: string;
  tenant_id: number;
  account_number: string;
  account_name?: string;
  status?: string;
  opened_on?: string; // ISO datetime
  notes?: string;
}

export interface Client {
  id: number;
  name: string;
  contact_person?: string;
  contact_title?: string;
  email: string;
  phone: string;
  phone_label: "work" | "mobile";
  secondary_phone?: string;
  secondary_phone_label?: "work" | "mobile";
  address: string;
  city: string;
  state: string;
  zip: string;
  notes?: string;
  created_at: string;
  accounts?: Account[];
  type?: string;
  status?: "new" | "prospect" | "active" | "inactive";
}

export type Interaction = {
  id: number;
  contact_date: string;
  summary: string;
  outcome: string;
  notes: string;
  follow_up?: string | null; // ISO datetime string or null
  client_id?: number;
  lead_id?: number;
  project_id?: number; // NEW: Add project support
  client_name?: string;
  lead_name?: string;
  project_name?: string; // NEW: Add project name
  contact_person?: string;
  email?: string;
  phone?: string;
  phone_label?: "work" | "mobile";
  secondary_phone?: string;
  secondary_phone_label?: "work" | "mobile";
  profile_link?: string;
  followup_status?: "pending" | "completed";
};

export type InteractionFormData = {
  contact_date: string;
  summary: string;
  outcome: string;
  notes: string;
  follow_up: string | null; 
};

export interface Lead {
  id: number;
  name: string;
  contact_person?: string;
  contact_title?: string;
  email: string;
  phone: string;
  phone_label: "work" | "mobile";
  secondary_phone?: string;
  secondary_phone_label?: "work" | "mobile";
  address: string;
  city: string;
  state: string;
  zip: string;
  notes?: string;
  created_at: string;
  assigned_to?: number;
  assigned_to_name?: string;
  created_by_name?: string;
  lead_status: string;
  converted_on?: string;
  type?: string;
  lead_source?: string;
}

export interface Project {
  id: number;
  project_name: string;
  type?: string;
  project_description?: string;
  project_status?: string;
  project_start?: string;
  project_end?: string;
  project_worth?: number;
  client_id?: number;
  lead_id?: number;
  client_name?: string;
  lead_name?: string;
  created_at?: string;
  notes?: string;
  // NEW: Contact fields for standalone projects
  primary_contact_name?: string;
  primary_contact_title?: string;
  primary_contact_email?: string;
  primary_contact_phone?: string;
  primary_contact_phone_label?: "work" | "mobile" | "home";
  assigned_to?: {
    id: number;
    email: string;
  } | null;
}

export interface Contact {
  id: number;
  first_name: string;
  last_name?: string;
  title?: string;
  email?: string;
  phone?: string;
  phone_label?: "work" | "mobile" | "home" | "fax" | "other";
  secondary_phone?: string;
  secondary_phone_label?: "work" | "mobile" | "home" | "fax" | "other";
  notes?: string;
  client_id?: number;
  lead_id?: number;
  created_at?: string;
}

export interface Backup {
  id: number;
  filename: string;
  type: 'manual' | 'scheduled' | 'pre_restore';
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  size: number; // bytes
  checksum: string | null;
  created_at: string; // ISO date
  completed_at: string | null;
  created_by: string | null; // email
  error: string | null;
}

export interface BackupRestore {
  restore_id: number;
  restore_date: string; // ISO 8601 with Z suffix
  user_email: string;
  user_id: number;
  backup_restored: string; // filename
  backup_id: number;
  backup_date: string; // ISO 8601 with Z suffix
  backup_size_bytes: number;
  backup_checksum: string;
  safety_backup_created: string; // filename
  safety_backup_id: number;
  restore_started_at: string; // ISO 8601 with Z suffix
}