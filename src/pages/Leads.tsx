import { useEffect, useState } from "react";
import EntityCard from "@/components/ui/EntityCard";
import { Mail, Phone, MapPin, Flag, User, UserCheck, StickyNote, LayoutGrid, List, Plus, Radio } from "lucide-react";
import { useAuth, userHasRole } from "@/authContext";
import toast from "react-hot-toast";
import { Link } from "react-router-dom";
import LeadForm from "@/components/ui/LeadForm";
import { Lead } from "@/types";
import { apiFetch, apiFetchJson } from "@/lib/api";
import { usePagination } from "@/hooks/usePreferences";
import { useStatusFilter } from "@/hooks/useStatusFilter";
import { useSorting, legacySortToUnified, unifiedToLegacySort } from "@/hooks/useSorting";
import LeadsTable from "@/components/ui/LeadsTable";
import PaginationControls from "@/components/ui/PaginationControls";
import { formatPhoneNumber } from "@/lib/phoneUtils";
import { useCRMConfig } from "@/config/crmConfig";
import StatusBadge from "@/components/ui/StatusBadge";
import { Button } from "@/components/ui/button";

export default function Leads() {
  const config = useCRMConfig();

  // Build status config from tenant config
  const LEAD_STATUS_OPTIONS = config.leads.statuses;
  const LEAD_STATUS_CONFIG = {
    statuses: LEAD_STATUS_OPTIONS,
    colors: config.leads.statusConfig.colors,
    labels: config.leads.statusConfig.labels
  };

  const [leads, setLeads] = useState<Lead[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);

  // Use pagination hook
  const {
    perPage,
    sortOrder,
    viewMode,
    currentPage,
    setCurrentPage,
    updatePerPage,
    updateSortOrder,
    updateViewMode,
  } = usePagination('leads');

  // Initialize unified sorting from pagination preferences
  const initialSort = legacySortToUnified(sortOrder, 'leads');
  
  const {
    sortField,
    sortDirection,
    handleSort,
    sortData,
    cardSortOptions,
    currentCardValue,
    setCardSort
  } = useSorting({
    entityType: 'leads',
    initialSort,
    onSortChange: (field, direction) => {
      // Update pagination preferences when sort changes
      const legacySort = unifiedToLegacySort(field, direction, 'leads');
      updateSortOrder(legacySort);
    }
  });

  // Status and type filters (preserves user's filter choice)
  const { statusFilter, setStatusFilter } = useStatusFilter('leads');

  const [editingId, setEditingId] = useState<number | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState<Partial<Lead>>({
    name: "",
    contact_person: "",
    email: "",
    phone: "",
    phone_label: "work",
    secondary_phone: "",
    secondary_phone_label: "mobile",
    address: "",
    city: "",
    state: "",
    zip: "",
    lead_status: config.leads.statuses[0] || "open",
    notes: "",
    type: "None",
    lead_source: undefined,
  });

  const [error, setError] = useState("");
  const { token, user } = useAuth();
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedLeadId, setSelectedLeadId] = useState<number | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [availableUsers, setAvailableUsers] = useState<{ id: number; email: string }[]>([]);
  const [isAssigning, setIsAssigning] = useState(false);
  // Per-status totals from the API. Null when the backend doesn't send them
  // (older backend); the page then falls back to filtering the loaded page.
  const [statusCounts, setStatusCounts] = useState<Record<string, number> | null>(null);

  // The status filter is sent to the API so it covers every page, not just this one.
  const leadsUrl =
    `/leads/?page=${currentPage}&per_page=${perPage}&sort=${sortOrder}` +
    (statusFilter !== "all" ? `&status=${encodeURIComponent(statusFilter)}` : "");

  const applyLeadList = (data: { leads: Lead[]; total: number; status_counts?: Record<string, number> }) => {
    setLeads(data.leads);
    setTotal(data.total);
    setStatusCounts(data.status_counts ?? null);
  };

  const changeStatusFilter = (status: string) => {
    setStatusFilter(status);
    setCurrentPage(1);
  };

  useEffect(() => {
    const fetchLeads = async () => {
      setLoading(true);
      try {
        const res = await apiFetch(leadsUrl, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        applyLeadList(data);
        setError("");
      } catch (err) {
        setError("Failed to load leads");
      } finally {
        setLoading(false);
      }
    };

    fetchLeads();

    if (userHasRole(user, "admin")) {
      apiFetchJson("/users/")
        .then((data) => setAvailableUsers(data.filter((u: any) => u.is_active)))
        .catch((err) => {
          console.error("Failed to load users:", err);
          setAvailableUsers([]);
        });
    }
  }, [token, user, leadsUrl]);


  // Advanced filtering logic
  const filteredLeads = leads.filter(lead => {
    // Status filter
    if (statusFilter !== 'all' && lead.lead_status !== statusFilter) return false;
    
    return true;
  });

  // Apply unified sorting to filtered data
  const sortedLeads = sortData(filteredLeads);

  const handleTableEdit = (lead: Lead) => {
    setForm({
      ...lead,
      phone_label: lead.phone_label || "work",
      secondary_phone_label: lead.secondary_phone_label || "mobile",
    });
    setEditingId(lead.id);
    setShowEditModal(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this lead?")) return;

    const res = await apiFetch(`/leads/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });

    if (res.ok) {
      setLeads((prev) => prev.filter((l) => l.id !== id));
      setTotal((prev) => prev - 1);
    } else {
      alert("Failed to delete lead");
    }
  };

  const handleSave = async (data: any) => {
    try {
      const method = creating ? "POST" : "PUT";
      const url = creating ? "/leads/" : `/leads/${editingId}`;

      const res = await apiFetch(url, {
        method,
        headers: { Authorization: `Bearer ${token}` },
        body: JSON.stringify(data),
      });

      if (!res.ok) throw new Error("Failed to save lead");

      const updatedRes = await apiFetch(leadsUrl, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const fullData = await updatedRes.json();
      applyLeadList(fullData);
      handleCancel();
    } catch (err: any) {
      setError(err.message || "Failed to save lead");
    }
  };

  const handleCancel = () => {
    setEditingId(null);
    setCreating(false);
    setForm({
      name: "",
      contact_person: "",
      email: "",
      phone: "",
      phone_label: "work",
      secondary_phone: "",
      secondary_phone_label: "mobile",
      address: "",
      city: "",
      state: "",
      zip: "",
      lead_status: config.leads.statuses[0] || "open",
      notes: "",
      type: "None",
      lead_source: undefined,
    });
  };

  // Clear all filters
  const clearAllFilters = () => {
    changeStatusFilter('all');
  };

  const activeFiltersCount = [statusFilter].filter(f => f !== 'all').length;

  return (
    <div className="p-4 lg:p-6">
      {/* Header */}
      <div className="flex justify-between items-center gap-4 mb-4">
        <h1 className="text-2xl font-bold">Leads</h1>
        <div className="flex gap-2">
          {/* New Lead Button */}
          <Button
            onClick={() => {
              setCreating(true);
              setEditingId(null);
              setForm({
                name: "",
                contact_person: "",
                email: "",
                phone: "",
                phone_label: "work",
                secondary_phone: "",
                secondary_phone_label: "mobile",
                address: "",
                city: "",
                state: "",
                zip: "",
                lead_status: config.leads.statuses[0] || "open",
                notes: "",
                type: "None",
                lead_source: undefined,
              });
            }}
          >
            <Plus size={16} />
            <span className="hidden sm:inline">New Lead</span>
            <span className="sm:hidden">New</span>
          </Button>
        </div>
      </div>

      {error && <p className="text-red-500 mb-4">{error}</p>}

      {/* Status strip: click a status to filter the list (replaces the Status dropdown) */}
      <div className="flex gap-1 overflow-x-auto rounded-lg border bg-white p-1 mb-3" role="group" aria-label="Filter by status">
        {["all", ...LEAD_STATUS_OPTIONS].map((status) => {
          const isActive = statusFilter === status;
          const name = status === "all"
            ? "All leads"
            : LEAD_STATUS_CONFIG.labels?.[status] || status.charAt(0).toUpperCase() + status.slice(1);
          // Real counts when the API provides them; otherwise only "All" shows a number.
          const count = statusCounts
            ? status === "all"
              ? Object.values(statusCounts).reduce((sum, n) => sum + n, 0)
              : statusCounts[status] ?? 0
            : status === "all" && statusFilter === "all"
              ? total
              : null;
          return (
            <button
              key={status}
              type="button"
              aria-pressed={isActive}
              onClick={() => changeStatusFilter(status)}
              className={`flex items-center gap-2 whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                isActive ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              {status !== "all" && (
                <span
                  aria-hidden="true"
                  className={`h-2 w-2 rounded-full bg-current ${isActive ? "" : (LEAD_STATUS_CONFIG.colors[status] || "").split(" ").find((c) => c.startsWith("text-")) || "text-gray-400"}`}
                />
              )}
              {name}
              {count !== null && (
                <span className={`tabular-nums ${isActive ? "opacity-80" : "text-muted-foreground/80"}`}>{count}</span>
              )}
            </button>
          );
        })}
      </div>

      {/* Toolbar */}
      <div className="mb-4">
          <div className="flex flex-wrap items-center gap-4">
            {/* View Toggle */}
            <div className="flex bg-white rounded-lg p-1 border shadow-sm">
              <button 
                className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-all ${
                  viewMode === 'cards' 
                    ? 'bg-blue-100 text-blue-700' 
                    : 'text-gray-600 hover:text-gray-800'
                }`}
                onClick={() => updateViewMode('cards')}
              >
                <LayoutGrid size={16} />
                <span className="hidden sm:inline">Cards</span>
              </button>
              <button 
                className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-all ${
                  viewMode === 'table' 
                    ? 'bg-blue-100 text-blue-700' 
                    : 'text-gray-600 hover:text-gray-800'
                }`}
                onClick={() => updateViewMode('table')}
              >
                <List size={16} />
                <span className="hidden sm:inline">Table</span>
              </button>
            </div>

            {/* Sort Control */}
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700 whitespace-nowrap">Sort:</label>
              {viewMode === 'cards' ? (
                <select 
                  value={currentCardValue} 
                  onChange={(e) => setCardSort(e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white min-w-32"
                >
                  {cardSortOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              ) : (
                <span className="text-sm text-gray-600 px-3 py-2 border border-gray-300 rounded-lg bg-gray-50">
                  Click headers
                </span>
              )}
            </div>

            {/* Per Page Control */}
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700 whitespace-nowrap">Show:</label>
              <select 
                value={perPage} 
                onChange={(e) => updatePerPage(Number(e.target.value))}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white w-20"
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
              </select>
            </div>

            {/* Clear Filters */}
            {activeFiltersCount > 0 && (
              <button
                onClick={clearAllFilters}
                className="px-3 py-2 text-sm text-blue-600 hover:text-blue-800 font-medium hover:bg-blue-50 rounded-lg transition-colors border border-blue-200"
              >
                Clear filters
              </button>
            )}
          </div>
      </div>

      {/* Results Summary */}
      <div className="mb-4 text-sm text-gray-600">
        {statusFilter !== 'all' && statusCounts ? (
          <span>
            Showing <span className="font-medium">{sortedLeads.length}</span> of {total}{" "}
            {LEAD_STATUS_CONFIG.labels?.[statusFilter] || statusFilter} leads
          </span>
        ) : statusFilter !== 'all' ? (
          <span>
            Showing <span className="font-medium">{sortedLeads.length}</span>{" "}
            {LEAD_STATUS_CONFIG.labels?.[statusFilter] || statusFilter} leads on this page{" "}
            <span className="text-gray-400">({total} leads in total)</span>
          </span>
        ) : (
          <span>
            Showing <span className="font-medium">{sortedLeads.length}</span> of {total} leads
          </span>
        )}
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
            <p className="text-gray-500">Loading leads...</p>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {creating && (
            <div className="w-full">
              <EntityCard
                title="New Lead"
                editing
                onCancel={handleCancel}
                editForm={
                  <LeadForm
                    form={form}
                    setForm={setForm}
                    onSave={handleSave}
                    onCancel={handleCancel}
                    isEditing={false}
                  />
                }
              />
            </div>
          )}

          {viewMode === 'cards' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {sortedLeads.map((lead) => (
                <EntityCard
                  key={lead.id}
                  title={
                    <Link
                      to={`/leads/${lead.id}`}
                      className="text-blue-600 hover:underline font-medium text-base block"
                    >
                      {lead.name}
                    </Link>
                  }
                  typeLabel={lead.type || "None"}
                  onEdit={() => handleTableEdit(lead)}
                  onCancel={handleCancel}
                  onDelete={() => handleDelete(lead.id)}
                  details={
                    <ul className="text-sm text-gray-600 space-y-2">
                      {lead.lead_status && (
                        <li className="flex items-center gap-2">
                          <Flag size={14} />
                          <StatusBadge
                            status={lead.lead_status}
                            colorClass={LEAD_STATUS_CONFIG.colors[lead.lead_status]}
                            label={LEAD_STATUS_CONFIG.labels?.[lead.lead_status]}
                          />
                        </li>
                      )}
                      {lead.lead_source && (
                        <li className="flex items-center gap-2">
                          <Radio size={14} />
                          <span className="text-gray-700">{lead.lead_source}</span>
                        </li>
                      )}
                      {lead.contact_person && (
                        <li className="flex items-start gap-2">
                          <User size={14} className="mt-[2px] flex-shrink-0" />
                          <div className="leading-tight">
                            <div>{lead.contact_person}</div>
                            {lead.contact_title && (
                              <div className="text-gray-500 text-sm italic">{lead.contact_title}</div>
                            )}
                          </div>
                        </li>
                      )}
                      {lead.email && (
                        <li className="flex items-start gap-2">
                          <Mail size={14} className="mt-[2px] flex-shrink-0" />
                          <a href={`mailto:${lead.email}`} className="text-blue-600 underline break-all">
                            {lead.email}
                          </a>
                        </li>
                      )}
                      {lead.phone && (
                        <li className="flex items-start gap-2">
                          <Phone size={14} className="mt-[2px] flex-shrink-0" />
                          <div className="leading-tight">
                            <div>
                              <a href={`tel:${lead.phone}`} className="text-blue-600 underline">
                                {formatPhoneNumber(lead.phone)}
                              </a>
                              {lead.phone_label && (
                                <span className="text-muted-foreground text-sm ml-1">
                                  ({lead.phone_label})
                                </span>
                              )}
                            </div>
                            {lead.secondary_phone && (
                              <div>
                                <a href={`tel:${lead.secondary_phone}`} className="text-blue-600 underline">
                                  {formatPhoneNumber(lead.secondary_phone)}
                                </a>
                                {lead.secondary_phone_label && (
                                  <span className="text-muted-foreground text-sm ml-1">
                                    ({lead.secondary_phone_label})
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        </li>
                      )}
                      {(lead.address || lead.city || lead.state || lead.zip) && (
                        <li className="flex items-start gap-2">
                          <MapPin size={14} className="mt-[2px] flex-shrink-0" />
                          <div className="leading-tight">
                            {lead.address && <div>{lead.address}</div>}
                            <div>
                              {[lead.city, lead.state].filter(Boolean).join(", ")}
                              {lead.zip ? ` ${lead.zip}` : ""}
                            </div>
                          </div>
                        </li>
                      )}
                      {lead.notes && (
                        <li className="flex items-start gap-2">
                          <StickyNote size={14} className="mt-[2px] flex-shrink-0" />
                          <div className="break-words">{lead.notes}</div>
                        </li>
                      )}
                      {lead.assigned_to_name && (
                        <li className="flex items-center gap-2">
                          <UserCheck size={14} className="flex-shrink-0" />
                          <span className="text-gray-700">{lead.assigned_to_name}</span>
                        </li>
                      )}
                    </ul>
                  }
                  extraMenuItems={
                    userHasRole(user, "admin") ? (
                      <button
                        className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100"
                        onClick={() => {
                          setSelectedLeadId(lead.id);
                          setShowAssignModal(true);
                        }}
                      >
                        Assign
                      </button>
                    ) : null
                  }
                />
              ))}
            </div>
          ) : (
            <LeadsTable
              leads={sortedLeads}
              onEdit={handleTableEdit}
              onDelete={handleDelete}
              sortField={sortField}
              sortDirection={sortDirection}
              onSort={handleSort}
              statusConfig={LEAD_STATUS_CONFIG}
            />
          )}

          {sortedLeads.length === 0 && (
            <div className="text-center py-12">
              <div className="text-gray-400 mb-4">
                <LayoutGrid size={48} className="mx-auto" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No leads found</h3>
              <p className="text-gray-500 mb-4">
                {activeFiltersCount > 0 
                  ? "No leads match your current filters. Try adjusting your search criteria."
                  : "Get started by creating your first lead."
                }
              </p>
              {activeFiltersCount > 0 && (
                <button
                  onClick={clearAllFilters}
                  className="text-blue-600 hover:text-blue-800 font-medium"
                >
                  Clear all filters
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {total > perPage && (
        <PaginationControls
          currentPage={currentPage}
          perPage={perPage}
          total={total}
          sortOrder={sortOrder}
          onPageChange={setCurrentPage}
          onPerPageChange={updatePerPage}
          onSortOrderChange={updateSortOrder}
          entityName="leads"
          className="mt-6 pt-4 border-t border-gray-200"
        />
      )}

      {/* Assignment Modal */}
      {showAssignModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
            <h2 className="text-lg font-semibold mb-4">Assign Lead</h2>

            <select
              value={selectedUserId || ""}
              onChange={(e) => setSelectedUserId(Number(e.target.value))}
              className="w-full border rounded px-3 py-2 mb-4"
            >
              <option value="">Select a user</option>
              {availableUsers.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.email}
                </option>
              ))}
            </select>

            <div className="flex flex-col sm:flex-row justify-end gap-2">
              <Button
                onClick={() => {
                  setShowAssignModal(false);
                  setSelectedUserId(null);
                  setSelectedLeadId(null);
                }}
                variant="outline" className="order-2 sm:order-1"
              >
                Cancel
              </Button>
              <Button
                disabled={!selectedUserId || isAssigning}
                onClick={async () => {
                  setIsAssigning(true);
                  const res = await apiFetch(`/leads/${selectedLeadId}/assign`, {
                    method: "PUT",
                    headers: {
                      "Content-Type": "application/json",
                      Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({ assigned_to: selectedUserId }),
                  });

                  if (res.ok) {
                    toast.success("Lead assigned successfully");
                    setShowAssignModal(false);
                    setSelectedUserId(null);
                    setSelectedLeadId(null);
                    const updatedRes = await apiFetch(leadsUrl, {
                      headers: { Authorization: `Bearer ${token}` },
                    });
                    const fullData = await updatedRes.json();
                    applyLeadList(fullData);
                  } else {
                    alert("Failed to assign lead.");
                  }
                  setIsAssigning(false);
                }}
                className="order-1 sm:order-2"
              >
                {isAssigning ? "Assigning…" : "Assign"}
              </Button>
            </div>
          </div>
        </div>
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
                    setEditingId(null);
                    handleCancel();
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
                  await handleSave(data);
                  setShowEditModal(false);
                }}
                onCancel={() => {
                  setShowEditModal(false);
                  handleCancel();
                }}
                isEditing={!!editingId}
              />
              
            </div>
          </div>
        </div>
      )}
    </div>
  );
}