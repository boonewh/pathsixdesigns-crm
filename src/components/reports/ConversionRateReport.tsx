import { useEffect, useState } from "react";
import { reportService, ConversionResponse } from "@/lib/reportService";
import { Activity, Clock, Users } from "lucide-react";

type Props = {
  startDate?: string;
  endDate?: string;
};

export function ConversionRateReport({ startDate, endDate }: Props) {
  const [data, setData] = useState<ConversionResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadData();
  }, [startDate, endDate]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError("");
      const result = await reportService.getConversionRate({ start_date: startDate, end_date: endDate });
      setData(result);
    } catch (err) {
      setError("Failed to load conversion rate data");
      console.error(err);
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="p-6 text-center text-gray-500">Loading conversion rates...</div>;
  if (error) return <div className="p-6 text-center text-red-600">{error}</div>;
  if (!data || data.overall.total_leads === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center gap-2 mb-4">
          <Activity className="h-5 w-5 text-green-600" />
          <h2 className="text-lg font-semibold">Conversion Rate</h2>
        </div>
        <p className="text-center text-gray-500 py-8">No conversion data available</p>
      </div>
    );
  }

  const { overall, by_user } = data;

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center gap-2 mb-6">
        <Activity className="h-5 w-5 text-green-600" />
        <h2 className="text-lg font-semibold">Conversion Rate</h2>
      </div>

      {/* Overall stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <div className="p-4 bg-blue-50 rounded-lg text-center">
          <div className="text-2xl font-bold text-blue-700">{overall.total_leads}</div>
          <div className="text-sm text-blue-600 mt-1">Total Leads</div>
        </div>

        <div className="p-4 bg-green-50 rounded-lg text-center">
          <div className="text-2xl font-bold text-green-700">{overall.converted_leads}</div>
          <div className="text-sm text-green-600 mt-1">Converted</div>
        </div>

        <div className="p-4 bg-purple-50 rounded-lg text-center">
          <div className="text-2xl font-bold text-purple-700">{overall.conversion_rate.toFixed(1)}%</div>
          <div className="text-sm text-purple-600 mt-1">Conversion Rate</div>
        </div>

        <div className="p-4 bg-orange-50 rounded-lg text-center">
          <div className="flex items-center justify-center gap-1 mb-1">
            <Clock className="h-4 w-4 text-orange-600" />
          </div>
          <div className="text-2xl font-bold text-orange-700">
            {overall.avg_days_to_convert != null ? `${overall.avg_days_to_convert}d` : "—"}
          </div>
          <div className="text-sm text-orange-600">Avg Days to Close</div>
        </div>
      </div>

      {/* Funnel bar */}
      {overall.total_leads > 0 && (
        <div className="mb-6">
          <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
            <span>Leads → Converted</span>
            <span>{overall.converted_leads} of {overall.total_leads}</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
            <div
              className="h-4 bg-green-500 rounded-full transition-all"
              style={{ width: `${Math.min(overall.conversion_rate, 100)}%` }}
            />
          </div>
        </div>
      )}

      {/* Per-user breakdown (admin only — backend only returns data if admin) */}
      {by_user && by_user.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Users className="h-4 w-4 text-gray-500" />
            <h3 className="text-sm font-semibold text-gray-700">By Team Member</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left font-medium text-gray-500">User</th>
                  <th className="px-4 py-2 text-right font-medium text-gray-500">Leads</th>
                  <th className="px-4 py-2 text-right font-medium text-gray-500">Converted</th>
                  <th className="px-4 py-2 text-right font-medium text-gray-500">Rate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {by_user.map((row) => (
                  <tr key={row.user_id} className="hover:bg-gray-50">
                    <td className="px-4 py-2 font-medium">{row.user_email}</td>
                    <td className="px-4 py-2 text-right text-gray-600">{row.total_leads}</td>
                    <td className="px-4 py-2 text-right text-gray-600">{row.converted}</td>
                    <td className="px-4 py-2 text-right">
                      <span
                        className={`font-semibold ${
                          row.conversion_rate >= 30
                            ? "text-green-600"
                            : row.conversion_rate >= 15
                            ? "text-yellow-600"
                            : "text-red-500"
                        }`}
                      >
                        {row.conversion_rate.toFixed(1)}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
