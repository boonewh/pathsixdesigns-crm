import { useEffect, useState } from "react";
import { useAuth } from "@/authContext";
import { apiFetch } from "@/lib/api";
import { Link, useSearchParams } from "react-router-dom";
import { isBefore, isToday, parseISO } from "date-fns";
import PaginationControls from "@/components/ui/PaginationControls";
import { usePagination } from "@/hooks/usePreferences";

interface AdminInteraction {
  id: number;
  contact_date: string;
  summary: string;
  outcome?: string;
  follow_up?: string;
  contact_person?: string;
  email?: string;
  phone?: string;
  client_name?: string;
  lead_name?: string;
  project_name?: string;
  followup_status?: string;
  profile_link?: string;
  assigned_to_name?: string;
  created_by_name?: string;
}

interface User {
  id: number;
  email: string;
  is_active: boolean;
}

function InteractionTable({ title, interactions, loading }: { title: string; interactions: AdminInteraction[]; loading: boolean }) {
  if (loading) {
    return (
      <div className="space-y-2">
        <h2 className="text-base font-semibold">{title}</h2>
        <div className="text-center py-8 text-gray-500">Loading...</div>
      </div>
    );
  }

  if (interactions.length === 0) {
    return (
      <div className="space-y-2">
        <h2 className="text-base font-semibold">{title}</h2>
        <div className="rounded-lg border bg-white px-4 py-6 text-sm text-gray-500">No interactions in this group.</div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <h2 className="text-base font-semibold">{title}</h2>
      <div className="overflow-x-auto bg-white rounded-lg border">
        <table className="min-w-full table-auto">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Assigned To</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Date</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Name</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Contact</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Summary</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Next Step</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Follow-up</th>
            </tr>
          </thead>
          <tbody>
            {interactions.map((i) => (
              <tr key={i.id} className="border-t hover:bg-gray-50 transition">
                <td className="px-4 py-3 text-sm">{i.assigned_to_name || "—"}</td>
                <td className="px-4 py-3 text-sm">{new Date(i.contact_date).toLocaleDateString()}</td>
                <td className="px-4 py-3 text-sm">
                  <Link to={i.profile_link || "#"} className="text-blue-600 hover:underline">
                    {i.client_name || i.lead_name || i.project_name || "—"}
                  </Link>
                </td>
                <td className="px-4 py-3 text-sm">{i.contact_person?.trim() || "—"}</td>
                <td className="px-4 py-3 text-sm">{i.summary}</td>
                <td className="px-4 py-3 text-sm">{i.outcome || "—"}</td>
                <td className="px-4 py-3 text-sm">
                  {i.follow_up ? new Date(i.follow_up).toLocaleDateString() : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function AdminInteractionsPage() {
  const { token } = useAuth();
  const [interactions, setInteractions] = useState<AdminInteraction[]>([]);
  const [total, setTotal] = useState(0);
  const [users, setUsers] = useState<User[]>([]);
  const [searchParams, setSearchParams] = useSearchParams();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const selectedEmail = searchParams.get("user") || "";

  // Use pagination hook with admin-specific key
  const {
    perPage,
    sortOrder,
    currentPage,
    setCurrentPage,
    updatePerPage,
    updateSortOrder,
  } = usePagination('admin_interactions');

  // Load users on component mount
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const userRes = await apiFetch("/users/", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const usersData = await userRes.json();
        setUsers(usersData.filter((u: User) => u.is_active));
      } catch {
        setError("Failed to load users");
      }
    };

    fetchUsers();
  }, [token]);

  // Load interactions when user selection or pagination changes
  useEffect(() => {
    const fetchInteractions = async () => {
      if (!selectedEmail) {
        setInteractions([]);
        setTotal(0);
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const interactionRes = await apiFetch(
          `/interactions/all?page=${currentPage}&per_page=${perPage}&sort=${sortOrder}&user_email=${encodeURIComponent(selectedEmail)}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        const interactionsData = await interactionRes.json();
        setInteractions(interactionsData.interactions);
        setTotal(interactionsData.total);
        setError("");
      } catch {
        setError("Failed to load interactions");
        setInteractions([]);
        setTotal(0);
      } finally {
        setLoading(false);
      }
    };

    fetchInteractions();
  }, [token, selectedEmail, currentPage, perPage, sortOrder]);

  // Reset to page 1 when user selection changes
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedEmail, setCurrentPage]);

  const handleUserChange = (email: string) => {
    setSearchParams(email ? { user: email } : {});
    setCurrentPage(1);
  };

  // Categorize interactions (local dates, same rules as the Dashboard)
  const now = new Date();
  const overdue: AdminInteraction[] = [];
  const todayDue: AdminInteraction[] = [];
  const upcoming: AdminInteraction[] = [];
  const noFollowUp: AdminInteraction[] = [];
  const completed: AdminInteraction[] = [];

  interactions.forEach((i) => {
    if (i.followup_status === "completed") {
      completed.push(i);
    } else if (!i.follow_up) {
      noFollowUp.push(i);
    } else {
      const followUp = parseISO(i.follow_up);
      if (isToday(followUp)) todayDue.push(i);
      else if (isBefore(followUp, now)) overdue.push(i);
      else upcoming.push(i);
    }
  });

  return (
    <div className="p-4 lg:p-6 space-y-6">
      <h1 className="text-2xl font-bold">Admin: All Interactions</h1>
      {error && <p role="alert" className="text-sm text-red-700">{error}</p>}

      <div className="max-w-sm">
        <label htmlFor="user-select" className="block text-sm font-medium mb-1">
          Filter by user:
        </label>
        <select
          id="user-select"
          value={selectedEmail}
          onChange={(e) => handleUserChange(e.target.value)}
          className="w-full rounded-md border border-input bg-white px-3 py-2 text-sm"
        >
          <option value="">— Select a user —</option>
          {users.map((u) => (
            <option key={u.id} value={u.email}>
              {u.email}
            </option>
          ))}
        </select>
      </div>

      {selectedEmail && (
        <>

          {/* Categorized Interactions */}
          <div className="space-y-8">
            <InteractionTable title="Overdue" interactions={overdue} loading={loading} />
            <InteractionTable title="Today" interactions={todayDue} loading={loading} />
            <InteractionTable title="Upcoming" interactions={upcoming} loading={loading} />
            <InteractionTable title="No follow-up" interactions={noFollowUp} loading={loading} />
            <InteractionTable title="Completed" interactions={completed} loading={loading} />
          </div>

          {/* Pagination Controls at bottom */}
          {total > 0 && (
            <PaginationControls
              currentPage={currentPage}
              perPage={perPage}
              total={total}
              sortOrder={sortOrder}
              onPageChange={setCurrentPage}
              onPerPageChange={updatePerPage}
              onSortOrderChange={updateSortOrder}
              entityName="interactions"
              className="border-t pt-4"
            />
          )}
        </>
      )}
    </div>
  );
}