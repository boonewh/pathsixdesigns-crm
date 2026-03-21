import { useEffect, useState } from "react";
import { reportService, PipelineResponse } from "@/lib/reportService";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { TrendingUp, Briefcase } from "lucide-react";

const LEAD_STATUS_COLORS: Record<string, string> = {
  new: "#3b82f6",
  contacted: "#8b5cf6",
  qualified: "#10b981",
  lost: "#ef4444",
  converted: "#22c55e",
};

const PROJECT_STATUS_COLORS: Record<string, string> = {
  pending: "#f59e0b",
  won: "#10b981",
  lost: "#ef4444",
};

const VALUE_TYPE_LABELS: Record<string, string> = {
  one_time: "One-time",
  monthly: "Monthly",
  yearly: "Yearly",
};

const VALUE_TYPE_COLORS: Record<string, string> = {
  one_time: "#6b7280",
  monthly: "#3b82f6",
  yearly: "#8b5cf6",
};

type Props = {
  startDate?: string;
  endDate?: string;
};

export function PipelineReport({ startDate, endDate }: Props) {
  const [data, setData] = useState<PipelineResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadData();
  }, [startDate, endDate]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError("");
      const result = await reportService.getPipeline({ start_date: startDate, end_date: endDate });
      setData(result);
    } catch (err) {
      setError("Failed to load pipeline data");
      console.error(err);
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="p-6 text-center text-gray-500">Loading pipeline...</div>;
  if (error) return <div className="p-6 text-center text-red-600">{error}</div>;
  if (!data || (data.leads.length === 0 && data.projects.length === 0)) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <p className="text-center text-gray-500 py-8">No pipeline data available</p>
      </div>
    );
  }

  const totalLeads = data.leads.reduce((sum, l) => sum + l.count, 0);
  const totalProjectValue = data.projects.reduce((sum, p) => sum + p.total_value, 0);

  return (
    <div className="space-y-6">
      {/* Lead Pipeline */}
      {data.leads.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-blue-600" />
              <h2 className="text-lg font-semibold">Lead Pipeline</h2>
            </div>
            <span className="text-sm text-gray-500">{totalLeads} total leads</span>
          </div>

          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={data.leads}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="status" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="count" name="Leads">
                {data.leads.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={LEAD_STATUS_COLORS[entry.status] || "#6b7280"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>

          <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {data.leads.map((item) => (
              <div key={item.status} className="text-center p-3 bg-gray-50 rounded">
                <div
                  className="text-2xl font-bold"
                  style={{ color: LEAD_STATUS_COLORS[item.status] || "#6b7280" }}
                >
                  {item.count}
                </div>
                <div className="text-sm text-gray-600 capitalize">{item.status}</div>
                <div className="text-xs text-gray-400">
                  {totalLeads > 0 ? ((item.count / totalLeads) * 100).toFixed(1) : 0}%
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Project Pipeline */}
      {data.projects.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Briefcase className="h-5 w-5 text-green-600" />
              <h2 className="text-lg font-semibold">Project Pipeline</h2>
            </div>
            <span className="text-sm text-gray-500">
              Total: ${totalProjectValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </span>
          </div>

          <div className="grid sm:grid-cols-3 gap-4 mb-6">
            {data.projects.map((proj) => {
              const byType = proj.by_value_type || {};
              const typeEntries = Object.entries(byType).filter(([, v]) => v.count > 0);

              return (
                <div
                  key={proj.status}
                  className="border rounded-lg p-4"
                  style={{ borderLeftColor: PROJECT_STATUS_COLORS[proj.status] || "#6b7280", borderLeftWidth: 4 }}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span
                      className="font-semibold capitalize text-sm"
                      style={{ color: PROJECT_STATUS_COLORS[proj.status] || "#6b7280" }}
                    >
                      {proj.status}
                    </span>
                    <span className="text-sm text-gray-500">{proj.count} projects</span>
                  </div>
                  <div className="text-xl font-bold text-gray-900 mb-3">
                    ${proj.total_value.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  </div>

                  {typeEntries.length > 0 && (
                    <div className="space-y-1">
                      {typeEntries.map(([vt, vdata]) => (
                        <div key={vt} className="flex items-center justify-between text-xs">
                          <span
                            className="flex items-center gap-1"
                            style={{ color: VALUE_TYPE_COLORS[vt] || "#6b7280" }}
                          >
                            <span
                              className="inline-block w-2 h-2 rounded-full"
                              style={{ backgroundColor: VALUE_TYPE_COLORS[vt] || "#6b7280" }}
                            />
                            {VALUE_TYPE_LABELS[vt] || vt}
                          </span>
                          <span className="text-gray-500">
                            {vdata.count} · ${vdata.total_value.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
