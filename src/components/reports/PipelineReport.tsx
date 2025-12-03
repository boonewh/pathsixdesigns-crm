import { useEffect, useState } from "react";
import { reportService, PipelineData } from "@/lib/reportService";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from "recharts";
import { TrendingUp } from "lucide-react";

const STATUS_COLORS: Record<string, string> = {
  new: "#3b82f6",
  contacted: "#8b5cf6",
  qualified: "#10b981",
  lost: "#ef4444",
  converted: "#22c55e",
};

export function PipelineReport() {
  const [data, setData] = useState<PipelineData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError("");
      const pipeline = await reportService.getPipeline();
      setData(pipeline || []);
    } catch (err) {
      setError("Failed to load pipeline data");
      console.error(err);
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="p-6 text-center">Loading pipeline...</div>;
  if (error) return <div className="p-6 text-center text-red-600">{error}</div>;
  if (!data || data.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="h-5 w-5 text-blue-600" />
          <h2 className="text-lg font-semibold">Lead Pipeline</h2>
        </div>
        <p className="text-center text-gray-500 py-8">No pipeline data available</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center gap-2 mb-4">
        <TrendingUp className="h-5 w-5 text-blue-600" />
        <h2 className="text-lg font-semibold">Lead Pipeline</h2>
      </div>

      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="status" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Bar dataKey="count" name="Leads">
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={STATUS_COLORS[entry.status] || "#6b7280"} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {data.map((item) => (
          <div key={item.status} className="text-center">
            <div className="text-2xl font-bold" style={{ color: STATUS_COLORS[item.status] || "#6b7280" }}>
              {item.count}
            </div>
            <div className="text-sm text-gray-600 capitalize">{item.status}</div>
            <div className="text-xs text-gray-500">{item.percentage.toFixed(1)}%</div>
          </div>
        ))}
      </div>
    </div>
  );
}
