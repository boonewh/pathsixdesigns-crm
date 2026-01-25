# ASFI Migration Plan

Migrate ASFI from their current standalone CRM to the unified preset-based system.

**Goal:** Switch out frontend and backend, migrate database, with minimal disruption to ASFI users.

---

## Prerequisites (Before Migration Day)

- [ ] Backup ASFI's current database (download a copy locally)
- [ ] Build new frontend locally with `VITE_CRM_PRESET=asfi` and test
- [ ] Verify pathsix-backend is ready to deploy
- [ ] Test locally with a copy of ASFI's data (if possible)
- [ ] Schedule maintenance window with ASFI

---

## Migration Steps

### Phase 1: Preparation
- [ ] Notify ASFI of maintenance window
- [ ] Take fresh backup of ASFI's production database
- [ ] Put ASFI in maintenance mode (or warn users to stop working)

### Phase 2: Database Migration
- [ ] Run migration SQL on ASFI's database:

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

- [ ] Verify migration completed without errors

### Phase 3: Backend Deployment
- [ ] Deploy new backend to Fly.io: `fly deploy -a [asfi-backend-app-name]`
- [ ] Test backend endpoints directly (curl or Postman)
- [ ] Verify API returns ASFI's existing data correctly

### Phase 4: Frontend Deployment
- [ ] Set `VITE_CRM_PRESET=asfi` in Vercel environment variables
- [ ] Deploy new frontend to Vercel
- [ ] Verify frontend loads correctly

### Phase 5: Verification
- [ ] Test login with ASFI credentials
- [ ] Test viewing existing leads (verify statuses display correctly)
- [ ] Test viewing existing clients
- [ ] Test creating a new lead
- [ ] Test creating a new client
- [ ] Verify business types dropdown shows ASFI options
- [ ] Verify lead statuses show: open, qualified, proposal, won, lost

### Phase 6: Go Live
- [ ] Remove maintenance mode
- [ ] Notify ASFI that system is back online
- [ ] Monitor logs for errors (first 24 hours)

---

## Rollback Plan (If Something Goes Wrong)

1. [ ] Restore ASFI's database from backup
2. [ ] Redeploy their old backend
3. [ ] Redeploy their old frontend
4. [ ] Investigate root cause

---

## Reference Information

### ASFI Preset Configuration
- **Lead Statuses:** open, qualified, proposal, won, lost
- **Business Types:** None, Oil & Gas, Secondary Containment, Tanks, Pipe, Rental, Food and Beverage, Bridge, Culvert

### Key Files
- Frontend config: `src/config/crmConfig.ts` (asfi preset at line 384)
- Documentation: `CRM-PRESET-SYSTEM-SUMMARY.md`

### What ASFI Users Should Notice
- Same data, same workflow
- Possibly minor UI styling differences
- New features: backup system in admin section

---

## Review Section

*To be completed after migration*

### Migration Summary
- Date completed:
- Downtime duration:
- Issues encountered:
- Resolution:

### Post-Migration Notes
-
