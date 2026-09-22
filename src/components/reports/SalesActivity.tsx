import { useEffect, useState } from "react";
import { reportService, SalesActivityResponse, SalesActivityUser } from "@/lib/reportService";

type Props = { startDate?: string; endDate?: string };
const columns = [
  ["leads_created", "Leads entered"], ["clients_created", "Clients entered"],
  ["projects_created", "Projects entered"], ["interactions", "Interactions entered"],
  ["edits", "Edits"], ["deletions", "Deletions"], ["views", "Record views"], ["total", "Total recorded"],
] as const;

export function ActivityReports(props: Props) {
  return <SalesActivity key={`${props.startDate}:${props.endDate}`} {...props} />;
}

function SalesActivity({ startDate, endDate }: Props) {
  const [data, setData] = useState<SalesActivityResponse | null>(null);
  const [users, setUsers] = useState<SalesActivityUser[]>([]);
  const [userId, setUserId] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");
    reportService.getSalesActivity({ start_date: startDate, end_date: endDate,
      user_id: userId ? Number(userId) : undefined }, page).then((result) => {
      if (!active) return;
      setData(result);
      if (!userId) setUsers(result.users);
    }).catch(() => {
      if (active) setError("Could not load sales activity. Check your connection and administrator access, then retry.");
    }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [startDate, endDate, userId, page, retry]);

  return <div className="space-y-5" aria-busy={loading}>
    <div className="bg-white rounded-lg shadow p-6 space-y-3">
      <h2 className="text-lg font-semibold">Sales team activity</h2>
      <p className="text-sm text-gray-600">Work performed by each person, regardless of assignment. Includes inactive team members.</p>
      <p className="text-sm font-medium">Applied dates (UTC): {startDate || "Beginning of history"} through {endDate || "Present"}. End date includes the full day.</p>
      <label htmlFor="activity-salesperson" className="block text-sm font-medium">Salesperson</label>
        <select id="activity-salesperson" className="block mt-1 border rounded-md p-2 w-full sm:w-80" value={userId}
          onChange={(event) => { setUserId(event.target.value); setPage(1); }}>
          <option value="">All team members</option>
          {users.map((user) => <option key={user.user_id} value={user.user_id}>{user.email}{user.is_active ? "" : " (inactive)"}</option>)}
        </select>
    </div>
    <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
      Historical coverage: creation records and saved activity are included. Older edits may show only the latest saved edit.
      Older interactions did not record their author; these appear as “Author not recorded.” New CRM record changes record the person who performed them.
      Private team-chat messages are not included.
    </div>
    {loading ? <p role="status" className="p-6 text-center">Loading sales activity…</p> : error ?
      <div role="alert" className="p-6 bg-red-50 text-red-700 rounded-lg">{error}
        <button className="ml-3 underline" onClick={() => setRetry((value) => value + 1)}>Retry</button>
      </div> : data && <>
        <div className="bg-white rounded-lg shadow overflow-x-auto">
          <table className="min-w-full text-sm">
            <caption className="text-left p-4 font-semibold">Activity by salesperson in the applied date range</caption>
            <thead className="bg-gray-50"><tr><th scope="col" className="px-4 py-3 text-left">Salesperson</th>
              {columns.map(([key, label]) => <th scope="col" key={key} className="px-4 py-3 text-right">{label}</th>)}
            </tr></thead>
            <tbody className="divide-y divide-gray-200">{data.users.map((user) => <tr key={user.user_id}>
              <th scope="row" className="px-4 py-3 text-left font-medium">{user.email}{!user.is_active && <span className="block text-xs text-gray-500">Inactive</span>}</th>
              {columns.map(([key]) => <td key={key} className="px-4 py-3 text-right tabular-nums">{user[key]}</td>)}
            </tr>)}</tbody>
          </table>
          {data.users.length === 0 && <p className="p-4 text-gray-500">No team members found.</p>}
        </div>
        <section className="bg-white rounded-lg shadow p-4 space-y-3">
          <h3 className="font-semibold">Activity details · {data.total} recorded events</h3>
          {data.unattributed_total > 0 && <p className="text-sm text-amber-800">{data.unattributed_total} historical events have no recorded author and are excluded from salesperson totals.</p>}
          <div className="overflow-x-auto"><table className="min-w-full text-sm">
            <thead className="bg-gray-50"><tr>{["When (UTC)", "Salesperson", "Action", "Record type", "Record"].map((label) => <th scope="col" key={label} className="p-3 text-left">{label}</th>)}</tr></thead>
            <tbody className="divide-y divide-gray-200">{data.events.map((event) => <tr key={`${event.source}:${event.entity_type}:${event.event_id}`}>
              <td className="p-3 whitespace-nowrap">{event.occurred_at ? new Date(event.occurred_at).toLocaleString(undefined, { timeZone: "UTC" }) : "Date not recorded"}</td>
              <td className="p-3">{event.email}</td>
              <td className="p-3 capitalize">{event.action}{event.source === "latest_edit" && <span className="block text-xs text-gray-500">Latest historical edit only</span>}</td>
              <td className="p-3 capitalize">{event.entity_type}</td>
              <td className="p-3">{event.record_name || `${event.entity_type} #${event.entity_id}`}<span className="block text-xs text-gray-500">#{event.entity_id}</span></td>
            </tr>)}</tbody>
          </table></div>
          {data.total === 0 && <p className="p-6 text-center text-gray-500">No recorded activity in this date range.</p>}
          <div className="flex items-center justify-between gap-3">
            <button className="border rounded px-3 py-2 disabled:opacity-40" disabled={page <= 1} onClick={() => setPage(page - 1)}>Previous</button>
            <span className="text-sm">Page {page} of {Math.max(1, Math.ceil(data.total / data.per_page))}</span>
            <button className="border rounded px-3 py-2 disabled:opacity-40" disabled={page * data.per_page >= data.total} onClick={() => setPage(page + 1)}>Next</button>
          </div>
        </section>
      </>}
  </div>;
}
