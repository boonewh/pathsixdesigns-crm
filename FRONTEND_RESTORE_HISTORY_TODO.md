# Frontend TODO: Display Restore History from B2

## Background
When a database restore runs, it uses `pg_restore --clean` which wipes all database tables including the `backup_restores` table. This means restore records in the database get deleted during the restore process.

**Solution:** Restore operations now log metadata to Backblaze B2 storage BEFORE running the restore. These logs survive the database wipe and provide a permanent audit trail.

## API Endpoint

### GET `/api/admin/backups/restores`

**Description:** Fetches restore history from B2 restore logs

**Authentication:** Requires admin role

**Response:**
```json
{
  "restores": [
    {
      "restore_id": 3,
      "restore_date": "2025-12-26T18:45:23Z",
      "user_email": "admin@example.com",
      "user_id": 5,
      "backup_restored": "backup_manual_20251226_062307.dump.gpg",
      "backup_id": 2,
      "backup_date": "2025-12-26T06:23:07Z",
      "backup_size_bytes": 8810,
      "backup_checksum": "abc123...",
      "safety_backup_created": "pre_restore_20251226_184523.sql.gpg",
      "safety_backup_id": 6,
      "restore_started_at": "2025-12-26T18:45:20Z"
    }
  ],
  "total": 1,
  "limit": 50,
  "offset": 0
}
```

## Frontend Implementation Tasks

### 1. Update the Restore History Component

**Location:** Wherever you're displaying the "Restore History (0)" section

**Changes Needed:**
- The API response format is different from the old database-based response
- Each restore log is a flat JSON object (not a nested ORM model)
- Date fields are ISO 8601 strings with "Z" suffix

### 2. Display Fields

Show these fields for each restore operation:

| Field | Description | Display Format |
|-------|-------------|----------------|
| `restore_date` | When the restore happened | "Dec 26, 2025, 6:45 PM" |
| `user_email` | Who triggered the restore | "admin@example.com" |
| `backup_restored` | Which backup was restored | Link to backup details |
| `backup_date` | When that backup was created | "Dec 26, 2025, 6:23 AM" |
| `safety_backup_created` | Pre-restore safety backup | "Created: pre_restore_..." |

### 3. Optional Enhancements

- **Status indicator:** All restores from B2 logs are completed (if they failed, the log wouldn't exist)
- **Backup link:** Make `backup_restored` clickable to view/download that backup
- **Safety backup access:** Link to the safety backup in case they need to "undo" the restore

### 4. Example UI

```
Restore History (1)

┌─────────────────────────────────────────────────────────┐
│ Restored: Dec 26, 2025, 6:45 PM                        │
│ By: admin@example.com                                  │
│                                                         │
│ Restored Backup: backup_manual_20251226_062307.dump.gpg│
│ Backup Date: Dec 26, 2025, 6:23 AM (8.6 KB)           │
│                                                         │
│ Safety Backup: pre_restore_20251226_184523.sql.gpg    │
└─────────────────────────────────────────────────────────┘
```

## Important Notes

1. **No "in_progress" status:** Restore logs are only created when a restore completes successfully. Failed restores won't have logs.

2. **Permanent records:** Unlike database records, these B2 logs survive restores and provide a permanent audit trail for legal/compliance purposes.

3. **Empty state:** If `restores` array is empty, it means no restores have been performed yet (not that they were wiped).

4. **Pagination:** The endpoint supports `limit` and `offset` query parameters for pagination.

## Testing

After deploying these backend changes, you can test by:
1. Triggering a restore from the UI
2. Waiting for it to complete
3. Refreshing the page
4. The "Restore History" section should now show the restore that just completed

## Questions?

If you need any clarification or run into issues implementing this, let me know!
