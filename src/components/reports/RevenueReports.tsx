import { useEffect, useState } from "react";
import { reportService, RevenueByClientData, RevenueForecastData } from "@/lib/reportService";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from "recharts";
import { DollarSign, TrendingUp } from "lucide-react";

export function RevenueReports() {
  const [revenueData, setRevenueData] = useState<RevenueByClientData[]>([]);
  const [forecastData, setForecastData] = useState<RevenueForecastData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError("");
      const [revenue, forecast] = await Promise.all([
        reportService.getRevenueByClient({ limit: 10 }),
        reportService.getRevenueForecast(),
      ]);
      setRevenueData(revenue || []);
      setForecastData(forecast || []);
    } catch (err) {
      setError("Failed to load revenue data");
      console.error(err);
      setRevenueData([]);
      setForecastData([]);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="p-6 text-center">Loading revenue data...</div>;
  if (error) return <div className="p-6 text-center text-red-600">{error}</div>;
  if ((!revenueData || revenueData.length === 0) && (!forecastData || forecastData.length === 0)) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <p className="text-center text-gray-500 py-8">No revenue data available</p>
      </div>
    );
  }

  const totalRevenue = revenueData.reduce((sum, item) => sum + item.total_revenue, 0);

  return (
    <div className="space-y-6">
      {/* Revenue by Client */}
      {revenueData && revenueData.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-blue-600" />
              <h2 className="text-lg font-semibold">Revenue by Client (Top 10)</h2>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-600">Total Revenue</div>
              <div className="text-2xl font-bold text-blue-600">
                ${totalRevenue.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </div>
            </div>
          </div>

          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={revenueData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis dataKey="client_name" type="category" width={150} />
              <Tooltip formatter={(value: number) => `$${value.toLocaleString()}`} />
              <Legend />
              <Bar dataKey="total_revenue" name="Revenue" fill="#3b82f6" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Revenue Forecast */}
      {forecastData && forecastData.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="h-5 w-5 text-green-600" />
            <h2 className="text-lg font-semibold">Revenue Forecast</h2>
          </div>

          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={forecastData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip formatter={(value: number) => `$${value.toLocaleString()}`} />
              <Legend />
              <Line
                type="monotone"
                dataKey="projected_revenue"
                name="Projected Revenue"
                stroke="#10b981"
                strokeWidth={2}
                dot={{ fill: "#10b981" }}
              />
            </LineChart>
          </ResponsiveContainer>

          <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {forecastData.map((item) => (
              <div key={item.month} className="p-3 bg-gray-50 rounded text-center">
                <div className="text-sm text-gray-600">{item.month}</div>
                <div className="text-lg font-bold text-green-600">
                  ${(item.projected_revenue / 1000).toFixed(0)}K
                </div>
                <div className="text-xs text-gray-500 capitalize">{item.confidence}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
