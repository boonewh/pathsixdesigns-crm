import { useEffect, useState } from "react";
import { reportService, UserActivityData, FollowUpsResponse, ConvertedLead } from "@/lib/reportService";
import { Users, Bell, AlertTriangle, UserX, TrendingUp, ChevronDown, ChevronUp } from "lucide-react";

type Props = {
  startDate?: string;
  endDate?: string;
};

function CollapsibleSection({
  title,
  icon,
  badge,
  defaultOpen = true,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  badge?: React.ReactNode;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="bg-white rounded-lg shadow">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center gap-2 px-6 py-4 text-left hover:bg-gray-50 rounded-lg transition-colors"
      >
        {icon}
        <h2 className="text-lg font-semibold">{title}</h2>
        {badge && <span className="ml-2">{badge}</span>}
        <span className="ml-auto text-gray-400">
          {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </span>
      </button>
      {open && <div className="px-6 pb-6">{children}</div>}
    </div>
  );
}

export function ActivityReports({ startDate, endDate }: Props) {
  const [activityData, setActivityData] = useState<UserActivityData[]>([]);
  const [followUps, setFollowUps] = useState<FollowUpsResponse | null>(null);
  const [convertedLeads, setConvertedLeads] = useState<ConvertedLead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadData();
  }, [startDate, endDate]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError("");
      const [activity, followUpData, converted] = await Promise.all([
        reportService.getUserActivity({ start_date: startDate, end_date: endDate }),
        reportService.getFollowUps({ start_date: startDate, end_date: endDate }),
        reportService.getConvertedLeads({ start_date: startDate, end_date: endDate }),
      ]);
      setActivityData(activity || []);
      setFollowUps(followUpData || null);
      setConvertedLeads(converted || []);
    } catch (err) {
      // User activity is admin-only; if it 403s, still show follow-ups and converted leads
      try {
        const [followUpData, converted] = await Promise.all([
          reportService.getFollowUps({ start_date: startDate, end_date: endDate }),
          reportService.getConvertedLeads({ start_date: startDate, end_date: endDate }),
        ]);
        setFollowUps(followUpData || null);
        setConvertedLeads(converted || []);
        setActivityData([]);
      } catch {
        setError("Failed to load activity data");
        console.error(err);
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="p-6 text-center text-gray-500">Loading activity data...</div>;
  if (error) return <div className="p-6 text-center text-red-600">{error}</div>;

  const overdueFollowUps = followUps?.overdue_follow_ups ?? [];
  const inactiveClients = followUps?.inactive_clients ?? [];
  const inactiveLeads = followUps?.inactive_leads ?? [];

  const hasData =
    activityData.length > 0 ||
    overdueFollowUps.length > 0 ||
    inactiveClients.length > 0 ||
    inactiveLeads.length > 0 ||
    convertedLeads.length > 0;

  if (!hasData) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <p className="text-center text-gray-500 py-8">No activity data available</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* User Activity — admin only; silently omitted for non-admins */}
      {activityData.length > 0 && (
        <CollapsibleSection
          title="User Activity"
          icon={<Users className="h-5 w-5 text-purple-600" />}
          defaultOpen={true}
        >
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-gray-500">User</th>
                  <th className="px-4 py-3 text-right font-medium text-gray-500">Interactions</th>
                  <th className="px-4 py-3 text-right font-medium text-gray-500">Leads Assigned</th>
                  <th className="px-4 py-3 text-right font-medium text-gray-500">Clients Assigned</th>
                  <th className="px-4 py-3 text-right font-medium text-gray-500">Activity Logs</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {activityData.map((u) => (
                  <tr key={u.user_id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium">{u.email}</td>
                    <td className="px-4 py-3 text-right">{u.interactions}</td>
                    <td className="px-4 py-3 text-right">{u.leads_assigned}</td>
                    <td className="px-4 py-3 text-right">{u.clients_assigned}</td>
                    <td className="px-4 py-3 text-right">{u.activity_count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CollapsibleSection>
      )}

      {/* Converted Leads — shown near top since client specifically requested this */}
      {convertedLeads.length > 0 && (
        <CollapsibleSection
          title="Converted Leads"
          icon={<TrendingUp className="h-5 w-5 text-green-600" />}
          badge={
            <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">
              {convertedLeads.length} total
            </span>
          }
          defaultOpen={true}
        >
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-gray-500">Lead</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500">Client</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500">Source</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500">Assigned To</th>
                  <th className="px-4 py-3 text-right font-medium text-gray-500">Converted</th>
                  <th className="px-4 py-3 text-right font-medium text-gray-500">Days in Pipeline</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {convertedLeads.map((lead) => (
                  <tr key={lead.lead_id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium">{lead.name}</td>
                    <td className="px-4 py-3 text-gray-600">{lead.client_name ?? "—"}</td>
                    <td className="px-4 py-3 text-gray-500">{lead.lead_source ?? "—"}</td>
                    <td className="px-4 py-3 text-gray-500">{lead.assigned_to ?? "—"}</td>
                    <td className="px-4 py-3 text-right text-gray-500">
                      {lead.converted_on ? new Date(lead.converted_on).toLocaleDateString() : "—"}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {lead.days_in_pipeline != null ? (
                        <span className="font-medium text-green-700">{lead.days_in_pipeline}d</span>
                      ) : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CollapsibleSection>
      )}

      {/* Overdue Follow-ups — collapsible so it doesn't bury everything below */}
      {overdueFollowUps.length > 0 && (
        <CollapsibleSection
          title="Overdue Follow-ups"
          icon={<Bell className="h-5 w-5 text-red-500" />}
          badge={
            <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-medium">
              {overdueFollowUps.length} overdue
            </span>
          }
          defaultOpen={true}
        >
          <div className="space-y-3">
            {overdueFollowUps.map((item) => (
              <div
                key={item.interaction_id}
                className="flex items-center justify-between p-4 bg-red-50 border border-red-200 rounded"
              >
                <div className="flex-1">
                  <div className="font-medium text-sm">{item.entity_name || "Unknown"}</div>
                  {item.summary && (
                    <div className="text-xs text-gray-600 mt-0.5 line-clamp-1">{item.summary}</div>
                  )}
                </div>
                <div className="text-right ml-4 flex-shrink-0">
                  <div className="text-sm text-gray-700">
                    {item.follow_up_date ? new Date(item.follow_up_date).toLocaleDateString() : "—"}
                  </div>
                  <div className="text-xs text-red-600 font-semibold mt-0.5">
                    {item.days_overdue}d overdue
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CollapsibleSection>
      )}

      {/* Inactive Clients */}
      {inactiveClients.length > 0 && (
        <CollapsibleSection
          title="Inactive Clients"
          icon={<UserX className="h-5 w-5 text-orange-500" />}
          badge={
            <span className="text-xs text-gray-400 text-sm">No interaction in 30+ days</span>
          }
          defaultOpen={false}
        >
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left font-medium text-gray-500">Client</th>
                  <th className="px-4 py-2 text-right font-medium text-gray-500">Last Contact</th>
                  <th className="px-4 py-2 text-right font-medium text-gray-500">Days Inactive</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {inactiveClients.map((c) => (
                  <tr key={c.client_id} className="hover:bg-gray-50">
                    <td className="px-4 py-2 font-medium">{c.name}</td>
                    <td className="px-4 py-2 text-right text-gray-500">
                      {c.last_interaction ? new Date(c.last_interaction).toLocaleDateString() : "Never"}
                    </td>
                    <td className="px-4 py-2 text-right">
                      {c.days_inactive != null ? (
                        <span className={`font-medium ${c.days_inactive >= 90 ? "text-red-600" : "text-orange-500"}`}>
                          {c.days_inactive}d
                        </span>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CollapsibleSection>
      )}

      {/* Stalled Leads */}
      {inactiveLeads.length > 0 && (
        <CollapsibleSection
          title="Stalled Leads"
          icon={<AlertTriangle className="h-5 w-5 text-yellow-500" />}
          badge={
            <span className="text-xs text-gray-400 text-sm">Open/qualified, no recent activity</span>
          }
          defaultOpen={false}
        >
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left font-medium text-gray-500">Lead</th>
                  <th className="px-4 py-2 text-right font-medium text-gray-500">Last Contact</th>
                  <th className="px-4 py-2 text-right font-medium text-gray-500">Days Inactive</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {inactiveLeads.map((l) => (
                  <tr key={l.lead_id} className="hover:bg-gray-50">
                    <td className="px-4 py-2 font-medium">{l.name}</td>
                    <td className="px-4 py-2 text-right text-gray-500">
                      {l.last_interaction ? new Date(l.last_interaction).toLocaleDateString() : "Never"}
                    </td>
                    <td className="px-4 py-2 text-right">
                      {l.days_inactive != null ? (
                        <span className={`font-medium ${l.days_inactive >= 60 ? "text-red-600" : "text-yellow-600"}`}>
                          {l.days_inactive}d
                        </span>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CollapsibleSection>
      )}
    </div>
  );
}
