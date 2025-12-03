import { useEffect, useState } from "react";
import { reportService, ConversionRateData } from "@/lib/reportService";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Activity } from "lucide-react";

export function ConversionRateReport() {
  const [data, setData] = useState<ConversionRateData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError("");
      const conversionData = await reportService.getConversionRate();
      setData(conversionData || []);
    } catch (err) {
      setError("Failed to load conversion rate data");
      console.error(err);
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="p-6 text-center">Loading conversion rates...</div>;
  if (error) return <div className="p-6 text-center text-red-600">{error}</div>;
  if (!data || data.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center gap-2 mb-4">
          <Activity className="h-5 w-5 text-green-600" />
          <h2 className="text-lg font-semibold">Conversion Rate Trends</h2>
        </div>
        <p className="text-center text-gray-500 py-8">No conversion rate data available</p>
      </div>
    );
  }

  const averageRate = data.length > 0
    ? data.reduce((sum, item) => sum + item.rate, 0) / data.length
    : 0;

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Activity className="h-5 w-5 text-green-600" />
          <h2 className="text-lg font-semibold">Conversion Rate Trends</h2>
        </div>
        <div className="text-right">
          <div className="text-sm text-gray-600">Average Rate</div>
          <div className="text-2xl font-bold text-green-600">{averageRate.toFixed(1)}%</div>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="period" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Line
            type="monotone"
            dataKey="rate"
            name="Conversion Rate (%)"
            stroke="#10b981"
            strokeWidth={2}
            dot={{ fill: "#10b981" }}
          />
        </LineChart>
      </ResponsiveContainer>

      <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
        {data.slice(-4).map((item) => (
          <div key={item.period} className="p-3 bg-gray-50 rounded">
            <div className="text-sm text-gray-600">{item.period}</div>
            <div className="text-xl font-bold text-green-600">{item.rate.toFixed(1)}%</div>
            <div className="text-xs text-gray-500">
              {item.converted}/{item.total} converted
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
