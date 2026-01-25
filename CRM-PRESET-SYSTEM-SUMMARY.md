# CRM Preset System - Implementation Summary

## What Was Built

A preset system that allows one CRM codebase to serve multiple clients with custom labels, statuses, and business types.

---

## Frontend Changes (`pathsixdesigns-crm`)

### Key Files Modified:

| File | Change |
|------|--------|
| `src/config/crmConfig.ts` | Added `asfi` preset, added `ACTIVE_CONFIG` export that loads preset based on env var |
| `src/schemas/leadSchemas.ts` | Now imports statuses/types from `ACTIVE_CONFIG` |
| `src/schemas/clientSchemas.ts` | Now imports types from `ACTIVE_CONFIG` |
| `src/schemas/projectSchemas.ts` | Now imports types from `ACTIVE_CONFIG` |
| `src/pages/Leads.tsx` | Now uses `ACTIVE_CONFIG` for status options/colors |
| `src/pages/AdminLeadsPage.tsx` | Now uses `ACTIVE_CONFIG` for status colors |
| `src/types.ts` | Changed `lead_status` and `lead_source` to `string` type |
| `.env` | Added `VITE_CRM_PRESET` variable |

### How to Use:

**For ASFI deployment:**
```env
VITE_CRM_PRESET=asfi
```

**For generic deployment:**
```env
VITE_CRM_PRESET=
# or
VITE_CRM_PRESET=default
```

### ASFI Preset Values:
- **Lead Statuses:** `open`, `qualified`, `proposal`, `won`, `lost`
- **Business Types:** `None`, `Oil & Gas`, `Secondary Containment`, `Tanks`, `Pipe`, `Rental`, `Food and Beverage`, `Bridge`, `Culvert`

### Generic Default Values:
- **Lead Statuses:** `new`, `contacted`, `qualified`, `lost`, `converted`
- **Business Types:** `None`, `Retail`, `Wholesale`, `Services`, `Manufacturing`, etc.

---

## Backend Changes (`pathsix-backend`)

### Key Files Modified:

| File | Change |
|------|--------|
| `app/schemas/leads.py` | Permissive validation - accepts any string for `lead_status` and `type` |
| `app/schemas/clients.py` | Permissive validation - accepts any string for `status` and `type` |
| `app/schemas/projects.py` | Permissive validation - accepts any string for `project_status` and `type` |
| `app/routes/leads.py` | Removed unused constant imports |
| `app/routes/clients.py` | Removed unused constant imports, permissive type check |
| `app/routes/projects.py` | Removed unused constant imports |
| `app/routes/imports.py` | Permissive validation for imported data |

### What Still Validates:
- Phone labels (work, mobile, home, fax, other)
- Required fields (name, etc.)
- Email format
- Phone number format
- String length limits

### What's Now Permissive:
- `lead_status` - any string
- `type` (business type) - any string
- `status` (client status) - any string
- `project_status` - any string

---

## Database Migration

Run this on ASFI's SQLite database before deploying:

```sql
-- 1. Add lead_source column to leads table
ALTER TABLE leads ADD COLUMN lead_source VARCHAR(50);
CREATE INDEX ix_leads_lead_source ON leads (lead_source);

-- 2. Create backups table
CREATE TABLE backups (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    filename VARCHAR(255) NOT NULL,
    backup_type VARCHAR(20) NOT NULL DEFAULT 'manual',
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    storage_key VARCHAR(1024),
    size_bytes INTEGER,
    checksum VARCHAR(64),
    database_name VARCHAR(100),
    database_size_bytes INTEGER,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    started_at DATETIME,
    completed_at DATETIME,
    job_id VARCHAR(100),
    error_message TEXT,
    created_by INTEGER REFERENCES users(id)
);
CREATE INDEX ix_backups_filename ON backups (filename);
CREATE INDEX ix_backups_status ON backups (status);
CREATE INDEX ix_backups_created_at ON backups (created_at);
CREATE INDEX ix_backups_job_id ON backups (job_id);

-- 3. Create backup_restores table
CREATE TABLE backup_restores (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    backup_id INTEGER NOT NULL REFERENCES backups(id),
    restored_by INTEGER NOT NULL REFERENCES users(id),
    pre_restore_backup_id INTEGER REFERENCES backups(id),
    status VARCHAR(20) NOT NULL DEFAULT 'in_progress',
    started_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    completed_at DATETIME,
    error_message TEXT
);
CREATE INDEX ix_backup_restores_backup_id ON backup_restores (backup_id);
```

---

## Deployment Checklist

1. [ ] Backup ASFI's current database
2. [ ] Run the migration SQL
3. [ ] Deploy the generic backend (`pathsix-backend`)
4. [ ] Build frontend with `VITE_CRM_PRESET=asfi`
5. [ ] Deploy the frontend
6. [ ] Test that ASFI's data shows with their custom statuses

---

## Adding New Client Presets

To add a new client preset, edit `src/config/crmConfig.ts` and add to `INDUSTRY_PRESETS`:

```typescript
newclient: {
  branding: {
    companyName: "New Client CRM",
  },
  businessTypes: [
    'None', 'Type1', 'Type2', 'Type3'
  ],
  leads: {
    statuses: ['status1', 'status2', 'status3'],
    statusConfig: {
      colors: {
        status1: 'bg-yellow-100 text-yellow-800',
        status2: 'bg-blue-100 text-blue-800',
        status3: 'bg-green-100 text-green-800'
      },
      icons: {
        status1: '🟡',
        status2: '🔵',
        status3: '🟢'
      },
      labels: {
        status1: 'Status 1',
        status2: 'Status 2',
        status3: 'Status 3'
      }
    }
  }
}
```

Then deploy with `VITE_CRM_PRESET=newclient`.

---

## Security Note

The backend uses **permissive validation** for status/type fields - it accepts any string value. This is safe for internal team use but should NOT be used for public-facing SaaS versions where strict validation is needed.

---

*Created: January 2026*
