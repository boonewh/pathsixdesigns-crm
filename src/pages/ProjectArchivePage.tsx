import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';

type Interaction = { id: number; contact_date: string; summary: string; notes?: string; outcome?: string; follow_up?: string; followup_status: string };
type ArchiveProject = {
  id: number; project_name: string; project_status: string; project_description?: string;
  created_at: string; deleted_at?: string; archived_at?: string; archived_by?: number;
  client_id?: number; lead_id?: number; account_name?: string; lead_name?: string;
  project_worth?: number; value_type?: string; project_start?: string; project_end?: string;
  primary_contact_name?: string; primary_contact_email?: string; primary_contact_phone?: string;
  notes?: string; interactions?: Interaction[];
  archive_history?: { action: string; at: string; by: number }[];
};
type Preview = { projects: ArchiveProject[]; total: number; in_trash: number; preview_token: string };
const endpoint = '/owner/project-archive';
const date = (value?: string) => value ? new Date(value).toLocaleString() : 'Not recorded';

export default function ProjectArchivePage() {
  const [projects, setProjects] = useState<ArchiveProject[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [denied, setDenied] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [preview, setPreview] = useState<Preview | null>(null);
  const [confirmation, setConfirmation] = useState('');
  const [selected, setSelected] = useState<ArchiveProject | null>(null);
  const [restoring, setRestoring] = useState(false);
  const [revision, setRevision] = useState(0);

  async function api<T>(path: string, options?: RequestInit): Promise<T> {
    const response = await apiFetch(endpoint + path, options, { showErrorToast: false });
    if (response.status === 403 || response.status === 401) {
      setDenied(true); setProjects([]); setSelected(null); setPreview(null);
      throw new Error('This private space is available only to its designated owners.');
    }
    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      throw new Error(body.error || 'The request could not be completed. Please try again.');
    }
    return response.json();
  }

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true); setError('');
    api<{ projects: ArchiveProject[]; total: number }>(`?page=${page}&search=${encodeURIComponent(query)}`, { signal: controller.signal })
      .then(data => { if (!controller.signal.aborted) { setProjects(data.projects); setTotal(data.total); } })
      .catch(err => { if (!controller.signal.aborted) setError(err.message); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [page, query, revision]);

  async function perform(action: () => Promise<void>) {
    setBusy(true); setError(''); setMessage('');
    try { await action(); } catch (err) { setError(err instanceof Error ? err.message : 'Request failed.'); }
    finally { setBusy(false); }
  }

  if (denied) return <main className="p-6"><h1 className="text-2xl font-bold">Private Project archive</h1><p className="mt-4" role="alert">This private space is available only to its designated owners.</p></main>;

  const button = 'rounded border px-4 py-2 disabled:opacity-50 disabled:cursor-not-allowed';
  return <div className="mx-auto max-w-6xl p-4 sm:p-6 space-y-6">
    <header>
      <h1 className="text-2xl font-bold">Private Project archive</h1>
      <p className="mt-2 text-gray-600">ASFI only. Archived Projects are hidden from the regular CRM, including sales and admin views, searches, reports, and follow-ups.</p>
      <p className="mt-2 text-gray-600">Projects and their interactions remain available here for review and restoration. Accounts and Leads are not archived.</p>
    </header>
    {error && <p role="alert" className="rounded border border-red-300 p-3 text-red-800">{error}</p>}
    {message && <p role="status" className="rounded border border-green-300 p-3 text-green-800">{message}</p>}

    <section className="rounded-lg border bg-white p-4 space-y-3">
      <h2 className="text-lg font-semibold">Prepare the historical Projects</h2>
      <p>Review ASFI Projects entered before May 1, 2026 (UTC), including Projects already in Deletes. Opening the preview does not move anything.</p>
      <button disabled={busy || loading} className={button} onClick={() => perform(async () => {
        const data = await api<Preview>('/preview'); setPreview(data); setConfirmation('');
      })}>Preview eligible Projects</button>
      {preview && <div className="space-y-4 border-t pt-4">
        <p><strong>{preview.total} eligible Projects</strong>: {preview.total - preview.in_trash} in the CRM and {preview.in_trash} in Deletes.</p>
        <div className="max-h-72 overflow-auto"><table className="w-full text-sm text-left">
          <thead><tr><th className="p-2">Project</th><th className="p-2">Entered</th><th className="p-2">Current location</th></tr></thead>
          <tbody>{preview.projects.map(p => <tr key={p.id} className="border-t"><td className="p-2">{p.project_name} <span className="text-gray-500">#{p.id}</span></td><td className="p-2">{date(p.created_at)}</td><td className="p-2">{p.deleted_at ? 'Deletes' : 'Projects'}</td></tr>)}</tbody>
        </table></div>
        {preview.total > 0 && <>
          <p>Archiving hides these Projects and their interactions; it does not delete them. Restore returns each Project to its previous location, including Deletes when applicable.</p>
          <label className="block" htmlFor="archive-confirmation">To proceed, type <strong>ARCHIVE {preview.total}</strong></label>
          <input id="archive-confirmation" className="block w-full max-w-sm rounded border p-2" value={confirmation} onChange={e => setConfirmation(e.target.value)} autoComplete="off" />
          <button className={`${button} bg-slate-900 text-white`} disabled={busy || confirmation !== `ARCHIVE ${preview.total}`} onClick={() => perform(async () => {
            try {
              const result = await api<{ total: number }>('/archive', { method: 'POST', body: JSON.stringify({ preview_token: preview.preview_token, confirmation }) });
              setMessage(`${result.total} Projects moved into the private archive.`); setPage(1); setRevision(r => r+1);
            } finally { setPreview(null); setConfirmation(''); }
          })}>Archive reviewed Projects</button>
        </>}
        <button className={`${button} ml-2`} disabled={busy} onClick={() => { setPreview(null); setConfirmation(''); }}>Close preview</button>
      </div>}
    </section>

    <section className="rounded-lg border bg-white p-4 space-y-4">
      <h2 className="text-lg font-semibold">Archived Projects{!loading && ` (${total})`}</h2>
      <form className="flex flex-wrap gap-2" onSubmit={e => { e.preventDefault(); setQuery(search); setPage(1); }}>
        <label className="sr-only" htmlFor="archive-search">Search archived Projects</label>
        <input id="archive-search" className="min-w-0 flex-1 rounded border p-2" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search archived Projects" />
        <button className={button} disabled={busy || loading}>Search</button>
      </form>
      {loading ? <p role="status">Loading archive...</p> : error ? <button className={button} onClick={() => setRevision(r => r+1)}>Retry</button> : projects.length === 0 ? <p>{query ? 'No archived Projects match this search.' : 'The archive is empty. No Projects have been moved here.'}</p> : <ul className="divide-y">
        {projects.map(p => <li key={p.id} className="flex flex-wrap justify-between gap-3 py-3">
          <div><h3 className="font-medium">{p.project_name}</h3><p className="text-sm text-gray-600">#{p.id} · {p.project_status} · Archived {date(p.archived_at)} · Previously in {p.deleted_at ? 'Deletes' : 'Projects'}</p></div>
          <button className={button} disabled={busy} onClick={() => perform(async () => { setSelected(null); setRestoring(false); setSelected(await api<ArchiveProject>(`/${p.id}`)); })}>View Project #{p.id}</button>
        </li>)}
      </ul>}
      {total > 25 && <div className="flex gap-3 items-center"><button className={button} disabled={page === 1 || busy || loading} onClick={() => setPage(p => p-1)}>Previous</button><span>Page {page} of {Math.ceil(total/25)}</span><button className={button} disabled={page*25 >= total || busy || loading} onClick={() => setPage(p => p+1)}>Next</button></div>}
    </section>

    {selected && <section aria-label="Archived Project details" className="rounded-lg border bg-white p-4 space-y-4">
      <div className="flex flex-wrap justify-between gap-2"><h2 className="text-xl font-semibold">{selected.project_name}</h2><button className={button} onClick={() => setSelected(null)}>Close details</button></div>
      <p className="text-gray-600">Read-only archived Project #{selected.id}</p>
      <dl className="grid gap-3 sm:grid-cols-2">
        {Object.entries({ Status: selected.project_status, Account: selected.account_name || (selected.client_id ? `#${selected.client_id}` : 'None'), Lead: selected.lead_name || (selected.lead_id ? `#${selected.lead_id}` : 'None'), Entered: date(selected.created_at), Value: `${selected.project_worth ?? 0} (${selected.value_type || 'one_time'})`, Contact: selected.primary_contact_name || 'Not recorded', Email: selected.primary_contact_email || 'Not recorded', Phone: selected.primary_contact_phone || 'Not recorded', Start: date(selected.project_start), End: date(selected.project_end) }).map(([key,value]) => <div key={key}><dt className="font-medium">{key}</dt><dd className="break-words">{value}</dd></div>)}
      </dl>
      <h3 className="font-semibold">Description</h3><p className="whitespace-pre-wrap break-words">{selected.project_description || 'No description.'}</p>
      <h3 className="font-semibold">Notes</h3><p className="whitespace-pre-wrap break-words">{selected.notes || 'No notes.'}</p>
      <h3 className="font-semibold">Interactions</h3>
      {selected.interactions?.length ? <ul className="space-y-3">{selected.interactions.map(i => <li key={i.id} className="rounded border p-3 space-y-2"><p className="font-medium">{i.summary}</p><p>{date(i.contact_date)} · {i.followup_status}</p><p className="whitespace-pre-wrap break-words">{i.notes}</p><p>Next step: {i.outcome || 'Not recorded'}</p>{i.follow_up && <p>Follow-up: {date(i.follow_up)}</p>}</li>)}</ul> : <p>No interactions.</p>}
      <h3 className="font-semibold">Archive history</h3><ul>{selected.archive_history?.map((e,i) => <li key={i}>{e.action} · {date(e.at)} · User #{e.by}</li>)}</ul>
      {restoring ? <div className="space-y-3 border-t pt-4"><p>Restore this Project to {selected.deleted_at ? 'Deletes' : 'the regular CRM'}? Its original links and interactions will become available under normal CRM permissions again.</p><button disabled={busy} className={button} onClick={() => perform(async () => {
        const result = await api<{ restored_to: string }>(`/${selected.id}/restore`, { method: 'POST' });
        setMessage(`Project restored to ${result.restored_to === 'trash' ? 'Deletes' : 'Projects'}.`); setSelected(null); setRestoring(false); setPage(1); setRevision(r => r+1);
      })}>Confirm restore</button><button className={`${button} ml-2`} disabled={busy} onClick={() => setRestoring(false)}>Cancel</button></div> : <button className={button} disabled={busy} onClick={() => setRestoring(true)}>Restore Project</button>}
    </section>}
  </div>;
}
