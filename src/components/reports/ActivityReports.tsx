import { useEffect, useState } from "react";
import { reportService, UserActivityData, FollowUpData } from "@/lib/reportService";
import { Users, Bell } from "lucide-react";

export function ActivityReports() {
  const [activityData, setActivityData] = useState<UserActivityData[]>([]);
  const [followUps, setFollowUps] = useState<FollowUpData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError("");
      const [activity, followUpData] = await Promise.all([
        reportService.getUserActivity(),
        reportService.getFollowUps({ limit: 10 }),
      ]);
      setActivityData(activity || []);
      setFollowUps(followUpData || []);
    } catch (err) {
      setError("Failed to load activity data");
      console.error(err);
      setActivityData([]);
      setFollowUps([]);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="p-6 text-center">Loading activity data...</div>;
  if (error) return <div className="p-6 text-center text-red-600">{error}</div>;
  if ((!activityData || activityData.length === 0) && (!followUps || followUps.length === 0)) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <p className="text-center text-gray-500 py-8">No activity data available</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* User Activity */}
      {activityData && activityData.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-2 mb-4">
            <Users className="h-5 w-5 text-purple-600" />
            <h2 className="text-lg font-semibold">User Activity</h2>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">User</th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-gray-500">Leads Created</th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-gray-500">Clients Created</th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-gray-500">Interactions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {activityData.map((user) => (
                  <tr key={user.user_email} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-medium">{user.user_email}</td>
                    <td className="px-4 py-3 text-sm text-right">{user.leads_created}</td>
                    <td className="px-4 py-3 text-sm text-right">{user.clients_created}</td>
                    <td className="px-4 py-3 text-sm text-right">{user.interactions_logged}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Follow-ups */}
      {followUps && followUps.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-2 mb-4">
            <Bell className="h-5 w-5 text-orange-600" />
            <h2 className="text-lg font-semibold">Upcoming Follow-ups</h2>
          </div>

          <div className="space-y-3">
            {followUps.map((item) => (
              <div key={item.id} className="flex items-center justify-between p-4 bg-gray-50 rounded hover:bg-gray-100">
                <div className="flex-1">
                  <div className="font-medium">{item.title}</div>
                  <div className="text-sm text-gray-600 mt-1">
                    {item.entity_type}: {item.entity_name}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    Assigned to: {item.assigned_to}
                  </div>
                </div>
                <div className="text-right ml-4">
                  <div className="text-sm font-medium text-gray-900">
                    {new Date(item.due_date).toLocaleDateString()}
                  </div>
                  <div className={`text-xs px-2 py-1 rounded mt-1 ${
                    item.priority === "high" ? "bg-red-100 text-red-800" :
                    item.priority === "medium" ? "bg-yellow-100 text-yellow-800" :
                    "bg-green-100 text-green-800"
                  }`}>
                    {item.priority}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
