import { useEffect, useState } from "react";
import { reportService, LeadSourceData } from "@/lib/reportService";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { Target } from "lucide-react";

const COLORS = ["#3b82f6", "#8b5cf6", "#10b981", "#f59e0b", "#ef4444", "#06b6d4"];

type Props = {
  startDate?: string;
  endDate?: string;
};

export function LeadSourceReport({ startDate, endDate }: Props) {
  const [data, setData] = useState<LeadSourceData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadData();
  }, [startDate, endDate]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError("");
      const sources = await reportService.getLeadSource({ start_date: startDate, end_date: endDate });
      setData(sources || []);
    } catch (err) {
      setError("Failed to load lead source data");
      console.error(err);
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="p-6 text-center text-gray-500">Loading sources...</div>;
  if (error) return <div className="p-6 text-center text-red-600">{error}</div>;
  if (!data || data.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center gap-2 mb-4">
          <Target className="h-5 w-5 text-purple-600" />
          <h2 className="text-lg font-semibold">Lead Sources</h2>
        </div>
        <p className="text-center text-gray-500 py-8">No lead source data available</p>
      </div>
    );
  }

  const chartData = data.map((item) => ({
    name: item.source,
    value: item.total_leads,
  }));
  const totalLeads = data.reduce((total, item) => total + item.total_leads, 0);

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center gap-2 mb-4">
        <Target className="h-5 w-5 text-purple-600" />
        <h2 className="text-lg font-semibold">Lead Sources</h2>
      </div>

      <p className="mb-4 text-sm text-gray-600">
        {totalLeads.toLocaleString()} {totalLeads === 1 ? "lead" : "leads"} total
      </p>

      <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,18rem),1fr))] items-start gap-6">
        <ResponsiveContainer width="100%" height={240}>
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              labelLine={false}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
            >
              {chartData.map((_entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>

        <ul className="min-w-0 space-y-3" aria-label="Lead source breakdown">
          {data.map((item, index) => {
            const share = totalLeads > 0 ? (item.total_leads / totalLeads) * 100 : 0;
            const shareLabel = share > 0 && share < 0.1 ? "<0.1" : share.toFixed(1);

            return (
              <li key={item.source} className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 rounded bg-gray-50 p-3">
                <div className="flex min-w-0 items-center gap-3">
                  <div
                    className="h-4 w-4 shrink-0 rounded"
                    style={{ backgroundColor: COLORS[index % COLORS.length] }}
                  />
                  <span className="break-words font-medium [overflow-wrap:anywhere]">{item.source}</span>
                </div>
                <div className="ml-auto shrink-0 text-right tabular-nums">
                  <div className="font-semibold">
                    {item.total_leads.toLocaleString()} {item.total_leads === 1 ? "lead" : "leads"}
                  </div>
                  <div className="text-sm text-gray-600">{shareLabel}% of leads</div>
                  <div className="text-sm text-gray-600">
                    {item.conversion_rate.toFixed(1)}% conversion
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
