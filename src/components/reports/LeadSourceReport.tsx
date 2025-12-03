import { useEffect, useState } from "react";
import { reportService, LeadSourceData } from "@/lib/reportService";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";
import { Target } from "lucide-react";

const COLORS = ["#3b82f6", "#8b5cf6", "#10b981", "#f59e0b", "#ef4444", "#06b6d4"];

export function LeadSourceReport() {
  const [data, setData] = useState<LeadSourceData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError("");
      const sources = await reportService.getLeadSource();
      setData(sources || []);
    } catch (err) {
      setError("Failed to load lead source data");
      console.error(err);
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="p-6 text-center">Loading sources...</div>;
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
    value: item.count,
  }));

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center gap-2 mb-4">
        <Target className="h-5 w-5 text-purple-600" />
        <h2 className="text-lg font-semibold">Lead Sources</h2>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }) => `${name}: ${((percent || 0) * 100).toFixed(0)}%`}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
            >
              {chartData.map((_entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>

        <div className="space-y-3">
          {data.map((item, index) => (
            <div key={item.source} className="flex items-center justify-between p-3 bg-gray-50 rounded">
              <div className="flex items-center gap-3">
                <div
                  className="w-4 h-4 rounded"
                  style={{ backgroundColor: COLORS[index % COLORS.length] }}
                />
                <span className="font-medium">{item.source}</span>
              </div>
              <div className="text-right">
                <div className="font-semibold">{item.count} leads</div>
                <div className="text-sm text-gray-600">
                  {item.conversion_rate.toFixed(1)}% conversion
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
