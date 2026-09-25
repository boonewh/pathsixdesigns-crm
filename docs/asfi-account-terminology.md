# ASFI account terminology

ASFI uses Account/Accounts for the CRM entity internally called client/clients.
Use `useCRMConfig().labels.client` for its visible singular label and the same
label in plurals, forms, navigation, report headings, search groups and help copy.
Do not rename API paths, entity keys, database tables, saved names or notes.
The separate `/accounts` resource is a different existing model.

## September 25, 2026 correction

Production tenant 1 (`asfi`) had `config.labels.client = "Client"`, while several
admin and Trash headings were hardcoded to Accounts. Cached sessions also skipped
the `/me` request, so a corrected server setting would not reach those sessions
until their next login.

- Updated only `tenants[1].config.labels.client` to `Account` in production and
  in the staging equivalent (tenant 1, slug `staging`, Staging Demo Co).
- Verified the exact tenant, prior label and complete resulting config in each
  transaction. All other settings were retained. No business records were updated.
- Kept the generic default `Client` and other tenants' configured terminology.
- Added a cancellable configuration refresh for cached sessions on page load;
  temporary errors retain the cached session and settings.
- Converted remaining visible client labels and mixed hardcoded account labels
  to tenant configuration, including the report help content and record-type
  labels in search and salesperson activity.

The full main-branch browser suite passed (31 tests), including new coverage for
stale ASFI labels, another tenant's Customer wording, saved company names containing
Client, and a failed config refresh. Typecheck and production build passed.
The terminology regression checks also run in CI.

This is tenant configuration, not a data migration. A rollback of the setting
changes just `config.labels.client` back to its previously recorded value,
`Client`; never replace the tenant's entire configuration to undo this label.
