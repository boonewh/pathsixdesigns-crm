import { useEffect, useState } from "react";
import {
  reportService,
  RevenueByClientItem,
  RevenueForecastResponse,
  SubscriptionIncomeResponse,
  UpcomingRenewalsResponse,
} from "@/lib/reportService";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { DollarSign, TrendingUp, CreditCard, RefreshCw, AlertTriangle } from "lucide-react";
import { useCRMConfig } from "@/config/crmConfig";

const fmt = (n: number) => `$${n.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
const fmtDec = (n: number) => `$${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const VALUE_TYPE_LABELS: Record<string, string> = {
  one_time: "One-time",
  monthly: "Monthly",
  yearly: "Yearly",
};

const STATUS_COLORS: Record<string, string> = {
  won: "#10b981",
  pending: "#f59e0b",
  lost: "#ef4444",
};

type Props = {
  startDate?: string;
  endDate?: string;
};

export function RevenueReports({ startDate, endDate }: Props) {
  const config = useCRMConfig();
  const enableSubscriptions = config.features.enableSubscriptions;

  const [revenueData, setRevenueData] = useState<RevenueByClientItem[]>([]);
  const [forecastData, setForecastData] = useState<RevenueForecastResponse | null>(null);
  const [subIncome, setSubIncome] = useState<SubscriptionIncomeResponse | null>(null);
  const [renewals, setRenewals] = useState<UpcomingRenewalsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadData();
  }, [startDate, endDate, enableSubscriptions]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError("");

      const fetches: Promise<unknown>[] = [
        reportService.getRevenueByClient({ limit: 10, start_date: startDate, end_date: endDate }),
        reportService.getRevenueForecast({ start_date: startDate, end_date: endDate }),
      ];

      if (enableSubscriptions) {
        fetches.push(
          reportService.getSubscriptionIncome({ start_date: startDate, end_date: endDate }),
          reportService.getUpcomingRenewals({ days: 60 })
        );
      }

      const results = await Promise.all(fetches);
      setRevenueData((results[0] as RevenueByClientItem[]) || []);
      setForecastData((results[1] as RevenueForecastResponse) || null);
      if (enableSubscriptions) {
        setSubIncome((results[2] as SubscriptionIncomeResponse) || null);
        setRenewals((results[3] as UpcomingRenewalsResponse) || null);
      }
    } catch (err) {
      setError("Failed to load revenue data");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="p-6 text-center text-gray-500">Loading revenue data...</div>;
  if (error) return <div className="p-6 text-center text-red-600">{error}</div>;

  // Chart data for revenue by client
  const clientChartData = revenueData.map((c) => ({
    name: c.client_name,
    "Won": c.won_value,
    "Pending": c.pending_value,
  }));

  // Forecast summary stats
  const wonEntry = forecastData?.projects.find((p) => p.status === "won");
  const pendingEntry = forecastData?.projects.find((p) => p.status === "pending");

  return (
    <div className="space-y-6">

      {/* Subscription MRR/ARR — feature-gated */}
      {enableSubscriptions && subIncome && (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-2 mb-5">
            <CreditCard className="h-5 w-5 text-blue-600" />
            <h2 className="text-lg font-semibold">Subscription Revenue</h2>
            <span className="text-xs text-gray-400 ml-auto">{subIncome.active_subscriptions} active subscriptions</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-5">
            <div className="p-4 bg-blue-50 rounded-lg text-center">
              <div className="text-2xl font-bold text-blue-700">{fmtDec(subIncome.mrr)}</div>
              <div className="text-sm text-blue-600 mt-1">MRR</div>
            </div>
            <div className="p-4 bg-green-50 rounded-lg text-center">
              <div className="text-2xl font-bold text-green-700">{fmt(subIncome.arr)}</div>
              <div className="text-sm text-green-600 mt-1">ARR</div>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg text-center">
              <div className="text-2xl font-bold text-gray-700">{subIncome.monthly_subscription_count}</div>
              <div className="text-sm text-gray-500 mt-1">Monthly Subs</div>
              <div className="text-xs text-gray-400">{fmtDec(subIncome.monthly_revenue)}/mo</div>
            </div>
            <div className="p-4 bg-purple-50 rounded-lg text-center">
              <div className="text-2xl font-bold text-purple-700">{subIncome.yearly_subscription_count}</div>
              <div className="text-sm text-purple-600 mt-1">Annual Subs</div>
              <div className="text-xs text-purple-400">{fmt(subIncome.yearly_revenue)}/yr</div>
            </div>
          </div>

          {subIncome.by_client.length > 0 && (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left font-medium text-gray-500">Client</th>
                    <th className="px-4 py-2 text-right font-medium text-gray-500">Subscriptions</th>
                    <th className="px-4 py-2 text-right font-medium text-gray-500">Monthly</th>
                    <th className="px-4 py-2 text-right font-medium text-gray-500">Annual</th>
                    <th className="px-4 py-2 text-right font-medium text-gray-500">MRR</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {subIncome.by_client.map((c) => (
                    <tr key={c.client_id} className="hover:bg-gray-50">
                      <td className="px-4 py-2 font-medium">{c.client_name || "—"}</td>
                      <td className="px-4 py-2 text-right text-gray-600">{c.subscription_count}</td>
                      <td className="px-4 py-2 text-right text-gray-600">
                        {c.monthly_total > 0 ? fmtDec(c.monthly_total) : "—"}
                      </td>
                      <td className="px-4 py-2 text-right text-gray-600">
                        {c.yearly_total > 0 ? fmt(c.yearly_total) : "—"}
                      </td>
                      <td className="px-4 py-2 text-right font-semibold text-blue-700">
                        {fmtDec(c.mrr)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Upcoming Renewals — feature-gated */}
      {enableSubscriptions && renewals && renewals.upcoming_renewals.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-2 mb-4">
            <RefreshCw className="h-5 w-5 text-orange-500" />
            <h2 className="text-lg font-semibold">Upcoming Renewals</h2>
            <span className="text-xs text-gray-400 ml-auto">Next 60 days</span>
          </div>

          <div className="space-y-3">
            {renewals.upcoming_renewals.map((r) => (
              <div
                key={r.subscription_id}
                className={`flex items-center justify-between p-3 rounded border ${
                  r.days_until_renewal <= 14
                    ? "border-amber-300 bg-amber-50"
                    : "border-gray-200 bg-gray-50"
                }`}
              >
                <div>
                  <div className="font-medium text-sm">{r.client_name || "Unknown client"}</div>
                  <div className="text-xs text-gray-500">{r.plan_name}</div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-semibold">{fmtDec(r.price)}/{r.billing_cycle === "monthly" ? "mo" : "yr"}</div>
                  <div
                    className={`text-xs mt-0.5 ${
                      r.days_until_renewal <= 14 ? "text-amber-600 font-semibold" : "text-gray-400"
                    }`}
                  >
                    {r.days_until_renewal === 0
                      ? "Renews today"
                      : `${r.days_until_renewal}d away`}
                  </div>
                </div>
                {r.days_until_renewal <= 14 && (
                  <AlertTriangle className="h-4 w-4 text-amber-500 ml-3 flex-shrink-0" />
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Revenue by Client */}
      {revenueData.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-blue-600" />
              <h2 className="text-lg font-semibold">Revenue by Client (Top 10)</h2>
            </div>
            <div className="text-right">
              <div className="text-xs text-gray-500">Total Won</div>
              <div className="text-xl font-bold text-blue-700">
                {fmt(revenueData.reduce((s, c) => s + c.won_value, 0))}
              </div>
            </div>
          </div>

          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={clientChartData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
              <YAxis dataKey="name" type="category" width={140} tick={{ fontSize: 12 }} />
              <Tooltip formatter={(value: number) => fmt(value)} />
              <Legend />
              <Bar dataKey="Won" fill="#10b981" stackId="a" />
              <Bar dataKey="Pending" fill="#f59e0b" stackId="a" />
            </BarChart>
          </ResponsiveContainer>

          {/* Value type breakdown table */}
          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left font-medium text-gray-500">Client</th>
                  <th className="px-4 py-2 text-right font-medium text-gray-500">Won</th>
                  <th className="px-4 py-2 text-right font-medium text-gray-500">Pending</th>
                  {revenueData.some((c) => Object.keys(c.value_type_breakdown || {}).length > 0) && (
                    <th className="px-4 py-2 text-right font-medium text-gray-500">Breakdown</th>
                  )}
                  {revenueData.some((c) => c.mrr > 0) && (
                    <th className="px-4 py-2 text-right font-medium text-gray-500">MRR</th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {revenueData.map((c) => {
                  const hasBreakdown = Object.keys(c.value_type_breakdown || {}).length > 0;
                  const showBreakdown = revenueData.some((x) => Object.keys(x.value_type_breakdown || {}).length > 0);
                  const showMrr = revenueData.some((x) => x.mrr > 0);
                  return (
                    <tr key={c.client_id} className="hover:bg-gray-50">
                      <td className="px-4 py-2 font-medium">{c.client_name}</td>
                      <td className="px-4 py-2 text-right text-green-700 font-medium">{fmt(c.won_value)}</td>
                      <td className="px-4 py-2 text-right text-yellow-600">{fmt(c.pending_value)}</td>
                      {showBreakdown && (
                        <td className="px-4 py-2 text-right">
                          {hasBreakdown ? (
                            <div className="flex flex-col items-end gap-0.5">
                              {Object.entries(c.value_type_breakdown).map(([vt, val]) =>
                                val > 0 ? (
                                  <span key={vt} className="text-xs text-gray-500">
                                    {VALUE_TYPE_LABELS[vt] || vt}: {fmt(val)}
                                  </span>
                                ) : null
                              )}
                            </div>
                          ) : (
                            <span className="text-gray-300">—</span>
                          )}
                        </td>
                      )}
                      {showMrr && (
                        <td className="px-4 py-2 text-right text-blue-600 font-medium">
                          {c.mrr > 0 ? fmtDec(c.mrr) : "—"}
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Revenue Forecast */}
      {forecastData && forecastData.projects.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-2 mb-5">
            <TrendingUp className="h-5 w-5 text-green-600" />
            <h2 className="text-lg font-semibold">Revenue Forecast</h2>
            <span className="text-xs text-gray-400 ml-auto">Weighted by pipeline stage</span>
          </div>

          {/* Summary stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
            <div className="p-4 bg-green-50 rounded-lg text-center">
              <div className="text-lg font-bold text-green-700">
                {fmt(wonEntry?.total_value ?? 0)}
              </div>
              <div className="text-xs text-green-600 mt-1">Won Revenue</div>
            </div>
            <div className="p-4 bg-yellow-50 rounded-lg text-center">
              <div className="text-lg font-bold text-yellow-700">
                {fmt(pendingEntry?.weighted_value ?? 0)}
              </div>
              <div className="text-xs text-yellow-600 mt-1">Weighted Pipeline</div>
              <div className="text-xs text-yellow-400">30% of pending</div>
            </div>
            <div className="p-4 bg-blue-50 rounded-lg text-center">
              <div className="text-lg font-bold text-blue-700">
                {fmt(forecastData.total_weighted_forecast)}
              </div>
              <div className="text-xs text-blue-600 mt-1">Total Forecast</div>
              <div className="text-xs text-blue-400">annualized</div>
            </div>
            {(forecastData.mrr_from_projects > 0 || forecastData.arr_from_projects > 0) && (
              <div className="p-4 bg-purple-50 rounded-lg text-center">
                <div className="text-lg font-bold text-purple-700">
                  {fmtDec(forecastData.mrr_from_projects)}
                </div>
                <div className="text-xs text-purple-600 mt-1">Project MRR</div>
                <div className="text-xs text-purple-400">{fmt(forecastData.arr_from_projects)}/yr</div>
              </div>
            )}
          </div>

          {/* Breakdown table */}
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left font-medium text-gray-500">Status</th>
                  <th className="px-4 py-2 text-right font-medium text-gray-500">Projects</th>
                  <th className="px-4 py-2 text-right font-medium text-gray-500">Raw Value</th>
                  <th className="px-4 py-2 text-right font-medium text-gray-500">Annualized</th>
                  <th className="px-4 py-2 text-right font-medium text-gray-500">Weighted</th>
                  <th className="px-4 py-2 text-right font-medium text-gray-500">Types</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {forecastData.projects.map((p) => (
                  <tr key={p.status} className="hover:bg-gray-50">
                    <td className="px-4 py-2">
                      <span
                        className="font-semibold capitalize"
                        style={{ color: STATUS_COLORS[p.status] || "#6b7280" }}
                      >
                        {p.status}
                      </span>
                      <span className="text-xs text-gray-400 ml-2">({(p.weight * 100).toFixed(0)}%)</span>
                    </td>
                    <td className="px-4 py-2 text-right text-gray-600">{p.count}</td>
                    <td className="px-4 py-2 text-right text-gray-600">{fmt(p.total_value)}</td>
                    <td className="px-4 py-2 text-right text-gray-700">{fmt(p.annualized_value)}</td>
                    <td className="px-4 py-2 text-right font-semibold" style={{ color: STATUS_COLORS[p.status] || "#6b7280" }}>
                      {fmt(p.weighted_value)}
                    </td>
                    <td className="px-4 py-2 text-right">
                      <div className="flex flex-col items-end gap-0.5">
                        {Object.entries(p.by_type).map(([vt, vdata]) => (
                          <span key={vt} className="text-xs text-gray-400">
                            {VALUE_TYPE_LABELS[vt] || vt}: {vdata.count}
                          </span>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {revenueData.length === 0 && (!forecastData || forecastData.projects.length === 0) && (
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-center text-gray-500 py-8">No revenue data available</p>
        </div>
      )}
    </div>
  );
}
