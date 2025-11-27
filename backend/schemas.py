from datetime import datetime
from typing import Literal, Optional

from pydantic import BaseModel, EmailStr, Field, conint

"""
Backend request models kept as the validation source of truth.

The enums and shape definitions here mirror the frontend Zod schemas so both
sides enforce the same constraints on incoming payloads.
"""

# Shared enumerations (backend source of truth)
PHONE_LABELS = ("work", "mobile", "home", "fax", "other")
LEAD_STATUS_OPTIONS = ("new", "contacted", "qualified", "lost", "converted")
CLIENT_STATUS_OPTIONS = ("prospect", "active", "inactive", "cancelled")
PROJECT_STATUS_OPTIONS = ("active", "pending", "completed", "cancelled")

CLIENT_TYPE_OPTIONS = (
    "None",
    "Retail",
    "Services",
    "Manufacturing",
    "Technology",
    "Healthcare",
    "Education",
    "Government",
    "Non-Profit",
    "Other",
)

LEAD_TYPE_OPTIONS = (
    "None",
    "Retail",
    "Wholesale",
    "Services",
    "Manufacturing",
    "Construction",
    "Real Estate",
    "Healthcare",
    "Technology",
    "Education",
    "Finance & Insurance",
    "Hospitality",
    "Transportation & Logistics",
    "Non-Profit",
    "Government",
)

PROJECT_TYPE_OPTIONS = (
    "None",
    "Commercial",
    "Residential",
    "Industrial",
    "Government",
    "Infrastructure",
    "Technology",
    "Consulting",
    "Other",
)


class LeadCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    contact_person: Optional[str] = Field(None, max_length=100)
    contact_title: Optional[str] = Field(None, max_length=100)
    email: Optional[EmailStr] = Field(None, max_length=255)
    phone: Optional[str] = Field(None, max_length=20)
    phone_label: Literal[*PHONE_LABELS] = "work"
    secondary_phone: Optional[str] = Field(None, max_length=20)
    secondary_phone_label: Optional[Literal[*PHONE_LABELS]] = None
    address: Optional[str] = Field(None, max_length=255)
    city: Optional[str] = Field(None, max_length=100)
    state: Optional[str] = Field(None, max_length=100)
    zip: Optional[str] = Field(None, max_length=20)
    notes: Optional[str] = None
    type: Literal[*LEAD_TYPE_OPTIONS] = "None"
    lead_status: Literal[*LEAD_STATUS_OPTIONS] = "new"

    class Config:
        extra = "forbid"


class LeadUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    contact_person: Optional[str] = Field(None, max_length=100)
    contact_title: Optional[str] = Field(None, max_length=100)
    email: Optional[EmailStr] = Field(None, max_length=255)
    phone: Optional[str] = Field(None, max_length=20)
    phone_label: Optional[Literal[*PHONE_LABELS]] = None
    secondary_phone: Optional[str] = Field(None, max_length=20)
    secondary_phone_label: Optional[Literal[*PHONE_LABELS]] = None
    address: Optional[str] = Field(None, max_length=255)
    city: Optional[str] = Field(None, max_length=100)
    state: Optional[str] = Field(None, max_length=100)
    zip: Optional[str] = Field(None, max_length=20)
    notes: Optional[str] = None
    type: Optional[Literal[*LEAD_TYPE_OPTIONS]] = None
    lead_status: Optional[Literal[*LEAD_STATUS_OPTIONS]] = None

    class Config:
        extra = "forbid"


class LeadAssign(BaseModel):
    assigned_to: conint(gt=0)

    class Config:
        extra = "forbid"


class ClientCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    contact_person: Optional[str] = Field(None, max_length=100)
    contact_title: Optional[str] = Field(None, max_length=100)
    email: Optional[EmailStr] = Field(None, max_length=255)
    phone: Optional[str] = Field(None, max_length=20)
    phone_label: Literal[*PHONE_LABELS] = "work"
    secondary_phone: Optional[str] = Field(None, max_length=20)
    secondary_phone_label: Optional[Literal[*PHONE_LABELS]] = None
    address: Optional[str] = Field(None, max_length=255)
    city: Optional[str] = Field(None, max_length=100)
    state: Optional[str] = Field(None, max_length=100)
    zip: Optional[str] = Field(None, max_length=20)
    notes: Optional[str] = None
    type: Literal[*CLIENT_TYPE_OPTIONS] = "None"
    status: Literal[*CLIENT_STATUS_OPTIONS] = "prospect"

    class Config:
        extra = "forbid"


class ClientUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    contact_person: Optional[str] = Field(None, max_length=100)
    contact_title: Optional[str] = Field(None, max_length=100)
    email: Optional[EmailStr] = Field(None, max_length=255)
    phone: Optional[str] = Field(None, max_length=20)
    phone_label: Optional[Literal[*PHONE_LABELS]] = None
    secondary_phone: Optional[str] = Field(None, max_length=20)
    secondary_phone_label: Optional[Literal[*PHONE_LABELS]] = None
    address: Optional[str] = Field(None, max_length=255)
    city: Optional[str] = Field(None, max_length=100)
    state: Optional[str] = Field(None, max_length=100)
    zip: Optional[str] = Field(None, max_length=20)
    notes: Optional[str] = None
    type: Optional[Literal[*CLIENT_TYPE_OPTIONS]] = None
    status: Optional[Literal[*CLIENT_STATUS_OPTIONS]] = None

    class Config:
        extra = "forbid"


class ClientAssign(BaseModel):
    assigned_to: conint(gt=0)

    class Config:
        extra = "forbid"


class ContactCreate(BaseModel):
    first_name: str = Field(..., min_length=1, max_length=100)
    client_id: Optional[conint(gt=0)] = None
    lead_id: Optional[conint(gt=0)] = None
    last_name: Optional[str] = Field(None, max_length=100)
    title: Optional[str] = Field(None, max_length=100)
    email: Optional[EmailStr] = Field(None, max_length=255)
    phone: Optional[str] = Field(None, max_length=20)
    phone_label: Literal[*PHONE_LABELS] = "work"
    secondary_phone: Optional[str] = Field(None, max_length=20)
    secondary_phone_label: Optional[Literal[*PHONE_LABELS]] = None
    notes: Optional[str] = None

    class Config:
        extra = "forbid"


class ContactUpdate(BaseModel):
    first_name: Optional[str] = Field(None, min_length=1, max_length=100)
    client_id: Optional[conint(gt=0)] = None
    lead_id: Optional[conint(gt=0)] = None
    last_name: Optional[str] = Field(None, max_length=100)
    title: Optional[str] = Field(None, max_length=100)
    email: Optional[EmailStr] = Field(None, max_length=255)
    phone: Optional[str] = Field(None, max_length=20)
    phone_label: Optional[Literal[*PHONE_LABELS]] = None
    secondary_phone: Optional[str] = Field(None, max_length=20)
    secondary_phone_label: Optional[Literal[*PHONE_LABELS]] = None
    notes: Optional[str] = None

    class Config:
        extra = "forbid"


class ProjectCreate(BaseModel):
    project_name: str = Field(..., min_length=1, max_length=100)
    type: Literal[*PROJECT_TYPE_OPTIONS] = "None"
    project_description: Optional[str] = None
    project_status: Literal[*PROJECT_STATUS_OPTIONS] = "active"
    project_start: Optional[datetime] = None
    project_end: Optional[datetime] = None
    project_worth: Optional[float] = None
    client_id: Optional[conint(gt=0)] = None
    lead_id: Optional[conint(gt=0)] = None
    notes: Optional[str] = None
    primary_contact_name: Optional[str] = Field(None, max_length=100)
    primary_contact_title: Optional[str] = Field(None, max_length=100)
    primary_contact_email: Optional[EmailStr] = Field(None, max_length=255)
    primary_contact_phone: Optional[str] = Field(None, max_length=20)
    primary_contact_phone_label: Optional[Literal[*PHONE_LABELS]] = None

    class Config:
        extra = "forbid"


class ProjectUpdate(BaseModel):
    project_name: Optional[str] = Field(None, min_length=1, max_length=100)
    type: Optional[Literal[*PROJECT_TYPE_OPTIONS]] = None
    project_description: Optional[str] = None
    project_status: Optional[Literal[*PROJECT_STATUS_OPTIONS]] = None
    project_start: Optional[datetime] = None
    project_end: Optional[datetime] = None
    project_worth: Optional[float] = None
    client_id: Optional[conint(gt=0)] = None
    lead_id: Optional[conint(gt=0)] = None
    notes: Optional[str] = None
    primary_contact_name: Optional[str] = Field(None, max_length=100)
    primary_contact_title: Optional[str] = Field(None, max_length=100)
    primary_contact_email: Optional[EmailStr] = Field(None, max_length=255)
    primary_contact_phone: Optional[str] = Field(None, max_length=20)
    primary_contact_phone_label: Optional[Literal[*PHONE_LABELS]] = None

    class Config:
        extra = "forbid"


class ProjectAssign(BaseModel):
    assigned_to: conint(gt=0)

    class Config:
        extra = "forbid"


class InteractionCreate(BaseModel):
    contact_date: datetime
    summary: str = Field(..., min_length=1, max_length=255)
    client_id: Optional[conint(gt=0)] = None
    lead_id: Optional[conint(gt=0)] = None
    project_id: Optional[conint(gt=0)] = None
    outcome: Optional[str] = Field(None, max_length=255)
    notes: Optional[str] = None
    follow_up: Optional[datetime] = None
    contact_person: Optional[str] = Field(None, max_length=100)
    email: Optional[EmailStr] = Field(None, max_length=255)
    phone: Optional[str] = Field(None, max_length=20)

    class Config:
        extra = "forbid"


class InteractionUpdate(BaseModel):
    contact_date: Optional[datetime] = None
    summary: Optional[str] = Field(None, min_length=1, max_length=255)
    client_id: Optional[conint(gt=0)] = None
    lead_id: Optional[conint(gt=0)] = None
    project_id: Optional[conint(gt=0)] = None
    outcome: Optional[str] = Field(None, max_length=255)
    notes: Optional[str] = None
    follow_up: Optional[datetime] = None
    contact_person: Optional[str] = Field(None, max_length=100)
    email: Optional[EmailStr] = Field(None, max_length=255)
    phone: Optional[str] = Field(None, max_length=20)

    class Config:
        extra = "forbid"
