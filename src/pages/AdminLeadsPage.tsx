import { useEffect, useState } from "react";
import { useAuth } from "@/authContext";
import { apiFetch } from "@/lib/api";
import { Link, useSearchParams } from "react-router-dom";
import type { Lead } from "@/types";
import LeadForm from "@/components/ui/LeadForm";
import PaginationControls from "@/components/ui/PaginationControls";
import { usePagination } from "@/hooks/usePreferences";
import { formatPhoneNumber } from "@/lib/phoneUtils";
import { Edit } from "lucide-react";
import { useCRMConfig } from "@/config/crmConfig";
import toast from "react-hot-toast";
import StatusBadge from "@/components/ui/StatusBadge";
import { Button } from "@/components/ui/button";

interface AdminLead extends Lead {
  assigned_to_name?: string;
  created_by_name?: string;
}

interface User {
  id: number;
  email: string;
  is_active: boolean;
}

export default function AdminLeadsPage() {
  const { token } = useAuth();
  const config = useCRMConfig();
  const [leads, setLeads] = useState<AdminLead[]>([]);
  const [total, setTotal] = useState(0);
  const [users, setUsers] = useState<User[]>([]);
  const [searchParams, setSearchParams] = useSearchParams();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [editingLeadId, setEditingLeadId] = useState<number | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [form, setForm] = useState<Partial<AdminLead>>({
    phone_label: "work",
    secondary_phone_label: "mobile",
    lead_status: config.leads.statuses[0] as string,
    type: "None",
  });

  const [selectedLeadIds, setSelectedLeadIds] = useState<number[]>([]);

  const toggleLeadSelection = (id: number) => {
    setSelectedLeadIds((prev) =>
      prev.includes(id) ? prev.filter((leadId) => leadId !== id) : [...prev, id]
    );
  };

  const toggleAllLeads = () => {
    setSelectedLeadIds(prev =>
      prev.length === leads.length ? [] : leads.map(l => l.id)
    );
  };

  const clearSelection = () => setSelectedLeadIds([]);

  const selectedEmail = searchParams.get("user") || "";

  // Use pagination hook with admin-specific key
  const {
    perPage,
    sortOrder,
    currentPage,
    setCurrentPage,
    updatePerPage,
    updateSortOrder,
  } = usePagination('admin_leads');

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

  // Load leads when user selection or pagination changes
  useEffect(() => {
    const fetchLeads = async () => {
      if (!selectedEmail) {
        setLeads([]);
        setTotal(0);
        setLoading(false);
        return;
      }

      setLoading(true);
      // Never keep checked leads from another page/user: they'd be deleted unseen.
      setSelectedLeadIds([]);
      try {
        const leadRes = await apiFetch(
          `/leads/all?page=${currentPage}&per_page=${perPage}&sort=${sortOrder}&user_email=${encodeURIComponent(selectedEmail)}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        const leadsData = await leadRes.json();
        setLeads(leadsData.leads);
        setTotal(leadsData.total);
        setError("");
      } catch {
        setError("Failed to load leads");
        setLeads([]);
        setTotal(0);
      } finally {
        setLoading(false);
      }
    };

    fetchLeads();
  }, [token, selectedEmail, currentPage, perPage, sortOrder]);

  // Reset to page 1 when user selection changes
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedEmail, setCurrentPage]);

  const listUrl = `/leads/all?page=${currentPage}&per_page=${perPage}&sort=${sortOrder}&user_email=${encodeURIComponent(selectedEmail)}`;

  const deleteSelected = async () => {
    const count = selectedLeadIds.length;
    if (!confirm(`Delete ${count} selected lead(s)?`)) return;
    try {
      const res = await apiFetch("/leads/bulk-delete", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ lead_ids: selectedLeadIds }),
      });
      if (!res.ok) throw new Error(`Status ${res.status}`);
      const refreshed = await apiFetch(listUrl, { headers: { Authorization: `Bearer ${token}` } });
      const data = await refreshed.json();
      setLeads(data.leads);
      setTotal(data.total);
      clearSelection();
      toast.success(`${count} lead(s) deleted`);
    } catch (err) {
      console.error(err);
      toast.error("Couldn't delete the selected leads. Please try again.");
    }
  };

  const handleUserChange = (email: string) => {
    setSearchParams(email ? { user: email } : {});
    setCurrentPage(1);
  };

  return (
    <div className="p-4 lg:p-6 space-y-6">
      <h1 className="text-2xl font-bold">Admin: Leads Overview</h1>
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
          {selectedLeadIds.length > 0 && (
            <div className="flex items-center gap-3 rounded-lg border bg-white px-4 py-2">
              <span className="text-sm">{selectedLeadIds.length} selected</span>
              <Button size="sm" variant="destructive" onClick={deleteSelected}>
                Delete Selected ({selectedLeadIds.length})
              </Button>
              <Button size="sm" variant="ghost" onClick={clearSelection}>Clear</Button>
            </div>
          )}


          {/* Content */}
          {loading ? (
            <div className="text-gray-500 text-center py-10">Loading...</div>
          ) : (
            <div className="overflow-x-auto bg-white rounded-lg border">
              <table className="min-w-full table-auto">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">
                      <input
                        type="checkbox"
                        aria-label="Select all leads"
                        checked={leads.length > 0 && selectedLeadIds.length === leads.length}
                        onChange={toggleAllLeads}
                      />
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Name</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Contact</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Email</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Phone</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Status</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Type</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Assigned To</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Created</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Edit</th>
                  </tr>
                </thead>
                <tbody>
                  {leads.map((lead) => (
                    <tr key={lead.id} className="border-t hover:bg-gray-50 transition">
                      <td className="px-4 py-3 text-sm">
                        <input
                          type="checkbox"
                          checked={selectedLeadIds.includes(lead.id)}
                          onChange={() => toggleLeadSelection(lead.id)}
                          aria-label={`Select ${lead.name}`}
                        />
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <Link
                          to={`/leads/${lead.id}`}
                          className="text-blue-600 hover:underline"
                        >
                          {lead.name}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <div>
                          {lead.contact_person ?? "—"}
                          {lead.contact_title && (
                            <div className="text-xs text-gray-500">{lead.contact_title}</div>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm">{lead.email ?? "—"}</td>
                      <td className="px-4 py-3 text-sm">{lead.phone ? formatPhoneNumber(lead.phone) : "—"}</td>
                      <td className="px-4 py-3 text-sm">
                        {lead.lead_status ? (
                          <StatusBadge
                            status={lead.lead_status}
                            colorClass={config.leads.statusConfig.colors[lead.lead_status]}
                            label={config.leads.statusConfig.labels?.[lead.lead_status]}
                          />
                        ) : "—"}
                      </td>
                      <td className="px-4 py-3 text-sm">{lead.type ?? "—"}</td>
                      <td className="px-4 py-3 text-sm">{lead.assigned_to_name ?? "—"}</td>
                      <td className="px-4 py-3 text-sm">
                        {lead.created_at 
                          ? new Date(lead.created_at).toLocaleDateString()
                          : "—"
                        }
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <button
                          onClick={() => {
                            setEditingLeadId(lead.id);
                            setForm(lead);
                            setShowEditModal(true);
                          }}
                          className="text-blue-600 hover:text-blue-800 p-1 rounded hover:bg-blue-50"
                          title="Edit Lead"
                        >
                          <Edit size={14} />
                        </button>
                      </td>

                    </tr>
                  ))}
                  {leads.length === 0 && !loading && (
                    <tr>
                      <td colSpan={10} className="px-4 py-4 text-center text-gray-500">
                        No leads found for this user.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination Controls at bottom */}
          {total > 0 && (
            <>
              <PaginationControls
                currentPage={currentPage}
                perPage={perPage}
                total={total}
                sortOrder={sortOrder}
                onPageChange={setCurrentPage}
                onPerPageChange={updatePerPage}
                onSortOrderChange={updateSortOrder}
                entityName="leads"
                className="border-t pt-4"
              />
            </>
          )}


      {showEditModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold">Edit Lead</h2>
                <button
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingLeadId(null);
                    setForm({});
                  }}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>

              <LeadForm
                form={form}
                setForm={setForm}
                onSave={async (data) => {
                  try {
                    const res = await apiFetch(`/leads/${editingLeadId}`, {
                      method: "PUT",
                      headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                      },
                      body: JSON.stringify(data),
                    });

                    if (res.ok) {
                      const leadRes = await apiFetch(
                        `/leads/all?page=${currentPage}&per_page=${perPage}&sort=${sortOrder}&user_email=${encodeURIComponent(selectedEmail)}`,
                        { headers: { Authorization: `Bearer ${token}` } }
                      );
                      const updated = await leadRes.json();
                      setLeads(updated.leads);
                      setShowEditModal(false);
                      setEditingLeadId(null);
                      setForm({});
                      toast.success("Lead updated");
                    } else {
                      toast.error("Couldn't update the lead. Please try again.");
                    }
                  } catch {
                    toast.error("Couldn't update the lead. Please try again.");
                  }
                }}
                onCancel={() => {
                  setShowEditModal(false);
                  setEditingLeadId(null);
                  setForm({});
                }}
                isEditing={true}
              />
              
            </div>
          </div>
        </div>
      )}
      </>
      )}
    </div>
  );
}