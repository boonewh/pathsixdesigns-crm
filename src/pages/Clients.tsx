import { useEffect, useState } from "react";
import EntityCard from "@/components/ui/EntityCard";
import { useAuth, userHasRole } from "@/authContext";
import { Mail, Phone, MapPin, User, StickyNote, LayoutGrid, List, Plus, Edit, Trash2, CircleDot, ChevronRight } from "lucide-react";
import toast from "react-hot-toast";
import { Link } from "react-router-dom";
import CompanyForm from "@/components/ui/CompanyForm";
import PaginationControls from "@/components/ui/PaginationControls";
import { Client } from "@/types";
import { apiFetch, apiFetchJson } from "@/lib/api";
import { usePagination } from "@/hooks/usePreferences";
import { useStatusFilter } from "@/hooks/useStatusFilter";
import { useSorting, legacySortToUnified, unifiedToLegacySort } from "@/hooks/useSorting";
import { formatPhoneNumber } from "@/lib/phoneUtils";
import { getClientTypes } from "@/schemas/clientSchemas";
import { useCRMConfig } from "@/config/crmConfig";
import StatusBadge from "@/components/ui/StatusBadge";
import { Button } from "@/components/ui/button";

const statusConfig = {
  colors: {
    new: "bg-blue-100 text-blue-800",
    prospect: "bg-yellow-100 text-yellow-800",
    active: "bg-green-100 text-green-800",
    inactive: "bg-gray-100 text-gray-800",
  },
};

// Table component for proper data table view
function ClientsTable({
  clients,
  onEdit,
  onDelete,
  onSort,
  getSortIcon,
  clientLabel
}: {
  clients: Client[];
  onEdit: (client: Client) => void;
  onDelete: (id: number) => void;
  onSort: (field: string) => void;
  getSortIcon: (field: string) => string;
  clientLabel: string;
}) {
  const handleDelete = (client: Client) => {
    if (confirm(`Are you sure you want to delete "${client.name}"?`)) {
      onDelete(client.id);
    }
  };

  return (
    <div className="overflow-x-auto bg-white rounded-lg shadow border">
      <table className="min-w-full">
        <thead className="bg-gray-50">
          <tr>
            <th 
              className="px-4 py-3 text-left text-sm font-medium text-gray-500 cursor-pointer hover:bg-gray-100 select-none"
              onClick={() => onSort('name')}
            >
              {clientLabel} Name <span className="ml-1">{getSortIcon('name')}</span>
            </th>
            <th 
              className="px-4 py-3 text-left text-sm font-medium text-gray-500 cursor-pointer hover:bg-gray-100 select-none"
              onClick={() => onSort('contact_person')}
            >
              Contact <span className="ml-1">{getSortIcon('contact_person')}</span>
            </th>
            <th 
              className="px-4 py-3 text-left text-sm font-medium text-gray-500 cursor-pointer hover:bg-gray-100 select-none"
              onClick={() => onSort('type')}
            >
              Type <span className="ml-1">{getSortIcon('type')}</span>
            </th>
            <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">
              Status
            </th>
            <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">
              Contact Info
            </th>
            <th 
              className="px-4 py-3 text-left text-sm font-medium text-gray-500 cursor-pointer hover:bg-gray-100 select-none"
              onClick={() => onSort('created_at')}
            >
              Created <span className="ml-1">{getSortIcon('created_at')}</span>
            </th>
            <th className="px-4 py-3 text-right text-sm font-medium text-gray-500">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {clients.map((client) => (
            <tr key={client.id} className="hover:bg-gray-50">
              <td className="px-4 py-3">
                <div className="font-medium text-gray-900">
                  <Link
                    to={`/clients/${client.id}`}
                    className="text-blue-600 hover:underline"
                  >
                    {client.name}
                  </Link>
                </div>
                {client.address && (
                  <div className="text-sm text-gray-500 truncate max-w-xs">
                    {client.city && client.state ? `${client.city}, ${client.state}` : client.address}
                  </div>
                )}
              </td>
              <td className="px-4 py-3">
                <div>
                  {client.contact_person && (
                    <div className="font-medium text-gray-900">{client.contact_person}</div>
                  )}
                  {client.contact_title && (
                    <div className="text-sm text-gray-500">{client.contact_title}</div>
                  )}
                  {!client.contact_person && !client.contact_title && (
                    <span className="text-gray-400">—</span>
                  )}
                </div>
              </td>
              <td className="px-4 py-3 text-sm text-gray-600">
                {client.type || '—'}
              </td>
              <td className="px-4 py-3">
                {client.status ? (
                  <StatusBadge status={client.status} colorClass={statusConfig.colors[client.status]} />
                ) : (
                  <span className="text-gray-400">—</span>
                )}
              </td>
              <td className="px-4 py-3 text-sm text-gray-600">
                <div className="space-y-1">
                  {client.email && (
                    <div>
                      <a href={`mailto:${client.email}`} className="text-blue-600 hover:underline">
                        {client.email}
                      </a>
                    </div>
                  )}
                  {client.phone && (
                    <div>
                      <a href={`tel:${client.phone}`} className="text-blue-600 hover:underline">
                        {formatPhoneNumber(client.phone)}
                      </a>
                      {client.phone_label && (
                        <span className="text-gray-500 text-xs ml-1">({client.phone_label})</span>
                      )}
                    </div>
                  )}
                  {client.secondary_phone && (
                    <div>
                      <a href={`tel:${client.secondary_phone}`} className="text-blue-600 hover:underline">
                        {formatPhoneNumber(client.secondary_phone)}
                      </a>
                      {client.secondary_phone_label && (
                        <span className="text-gray-500 text-xs ml-1">({client.secondary_phone_label})</span>
                      )}
                    </div>
                  )}
                  {!client.email && !client.phone && !client.secondary_phone && (
                    <span className="text-gray-400">—</span>
                  )}
                </div>
              </td>
              <td className="px-4 py-3 text-sm text-gray-600">
                {client.created_at ? new Date(client.created_at).toLocaleDateString() : '—'}
              </td>
              <td className="px-4 py-3 text-right">
                <div className="flex justify-end gap-2">
                <button
                  onClick={() => onEdit(client)}
                  className="text-blue-600 hover:text-blue-800 p-1 rounded hover:bg-blue-50"
                  title={`Edit ${clientLabel.toLowerCase()}`}
                >
                  <Edit size={14} />
                </button>
                <button
                  onClick={() => handleDelete(client)}
                  className="text-red-600 hover:text-red-800 p-1 rounded hover:bg-red-50"
                  title={`Delete ${clientLabel.toLowerCase()}`}
                >
                  <Trash2 size={14} />
                </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      
      {clients.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <p>No {clientLabel.toLowerCase()}s found.</p>
        </div>
      )}
    </div>
  );
}

export default function Clients() {
  const config = useCRMConfig();
  const clientLabel = config.labels?.client || "Client";
  const ACCOUNT_TYPE_OPTIONS = config.businessTypes || getClientTypes();

  const [clients, setClients] = useState<Client[]>([]);
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
  } = usePagination('clients');

  // Initialize unified sorting from pagination preferences
  const initialSort = legacySortToUnified(sortOrder, 'clients');
  
  const {
    handleSort,
    getSortIcon,
    sortData,
    cardSortOptions,
    currentCardValue,
    setCardSort
  } = useSorting({
    entityType: 'clients',
    initialSort,
    onSortChange: (field, direction) => {
      // Update pagination preferences when sort changes
      const legacySort = unifiedToLegacySort(field, direction, 'clients');
      updateSortOrder(legacySort);
    }
  });

  // Type filter (preserves user's filter choice)
  const { statusFilter: typeFilter, setStatusFilter: setTypeFilter } = useStatusFilter('clients_type');

  // Per-type totals from the API. Null when the backend doesn't send them yet
  // (older backend); the page then falls back to filtering the loaded page.
  const [typeCounts, setTypeCounts] = useState<Record<string, number> | null>(null);

  // The type filter is sent to the API so it covers every page, not just this one.
  const clientsUrl =
    `/clients/?page=${currentPage}&per_page=${perPage}&sort=${sortOrder}` +
    (typeFilter !== "all" ? `&type=${encodeURIComponent(typeFilter)}` : "");

  const changeTypeFilter = (type: string) => {
    setTypeFilter(type);
    setCurrentPage(1);
  };

  const [editingId, setEditingId] = useState<number | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState<Partial<Client>>({
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
    notes: "",
    type: "None",
    status: "new",
  });

  const [error, setError] = useState("");
  const { token, user } = useAuth();
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedClientId, setSelectedClientId] = useState<number | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [availableUsers, setAvailableUsers] = useState<{ id: number; email: string }[]>([]);

  useEffect(() => {
    const fetchClients = async () => {
      setLoading(true);
      try {
        const data = await apiFetchJson(clientsUrl, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setClients(data.clients);
        setTotal(data.total);
        setTypeCounts(data.type_counts ?? null);
        setError(""); // Reset error on successful fetch
      } catch (err) {
        setError(`Failed to load ${clientLabel.toLowerCase()}s`);
      } finally {
        setLoading(false);
      }
    };

    fetchClients();

    if (userHasRole(user, "admin")) {
      apiFetch("/users/", {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then(async (res) => {
          if (!res.ok) return;
          const data = await res.json();
          setAvailableUsers(data.filter((u: any) => u.is_active));
        })
        .catch(() => setAvailableUsers([]));
    }
  }, [token, user, clientsUrl, clientLabel]);

  // Filter logic - only type filter now
  const filteredClients = clients.filter(client => {
    // Type filter
    if (typeFilter !== 'all' && client.type !== typeFilter) return false;
    return true;
  });

  // Apply unified sorting to filtered data
  const sortedClients = sortData(filteredClients);

  const handleTableEdit = (client: Client) => {
    setForm({
      ...client,
      phone_label: client.phone_label || "work",
      secondary_phone_label: client.secondary_phone_label || "mobile",
    });
    setEditingId(client.id);
    setShowEditModal(true);
  };

  // The card menu and the table each confirm before calling this, so it doesn't ask again.
  const handleDelete = async (id: number) => {
    const res = await apiFetch(`/clients/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });

    if (res.ok) {
      setClients((prev) => prev.filter((c) => c.id !== id));
      setTotal((prev) => prev - 1);
      toast.success(`${clientLabel} deleted. You can restore it from Deletes.`);
    } else {
      toast.error(`Couldn't delete this ${clientLabel.toLowerCase()}. Please try again.`);
    }
  };

  const handleSave = async (data: any) => {
    try {
      const method = creating ? "POST" : "PUT";
      const url = creating ? "/clients/" : `/clients/${editingId}`;

      const res = await apiFetch(url, {
        method,
        headers: { Authorization: `Bearer ${token}` },
        body: JSON.stringify(data),
      });

      if (!res.ok) throw new Error(`Failed to save ${clientLabel.toLowerCase()}`);

      const updatedRes = await apiFetch(clientsUrl, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const fullData = await updatedRes.json();
      setClients(fullData.clients);
      setTotal(fullData.total);
      handleCancel();
    } catch (err: any) {
      setError(err.message || `Failed to save ${clientLabel.toLowerCase()}`);
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
      notes: "",
      type: "None",
      status: "new",
    });
  };

  // Clear all filters - now only handles type filter
  const clearAllFilters = () => {
    setTypeFilter('all');
  };

  const activeFiltersCount = typeFilter !== 'all' ? 1 : 0;

  return (
    <div className="p-4 lg:p-6">
      {/* Header */}
      <div className="flex justify-between items-center gap-4 mb-4">
        <h1 className="text-2xl font-bold">
          {clientLabel}s
        </h1>
        <div className="flex gap-2">
          {/* New Account Button */}
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
                notes: "",
                type: "None",
                status: "new",
              });
            }}
          >
            <Plus size={16} />
            <span className="hidden sm:inline">New {clientLabel}</span>
            <span className="sm:hidden">New</span>
          </Button>
        </div>
      </div>

      {error && <p className="text-red-500 mb-4">{error}</p>}

      {/* Toolbar (always visible) */}
      <div className="mb-4">
          <div className="flex flex-wrap items-center gap-4">
            {/* View Toggle (phones always get the compact list, so it's hidden there) */}
            <div className="hidden sm:flex bg-white rounded-lg p-1 border shadow-sm">
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

            {/* Business Type Filter */}
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700 whitespace-nowrap">Type:</label>
              <select 
                value={typeFilter} 
                onChange={(e) => changeTypeFilter(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white shadow-sm min-w-40"
              >
                <option value="all">
                  All types{typeCounts ? ` (${Object.values(typeCounts).reduce((sum, n) => sum + n, 0)})` : ""}
                </option>
                {ACCOUNT_TYPE_OPTIONS.map(type => (
                  <option key={type} value={type}>
                    {type}{typeCounts ? ` (${typeCounts[type] ?? 0})` : ""}
                  </option>
                ))}
              </select>
            </div>

            {/* Sort Control */}
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700 whitespace-nowrap">Sort:</label>
              {(() => {
                const sortSelect = (className: string) => (
                  <select
                    value={currentCardValue}
                    onChange={(e) => setCardSort(e.target.value)}
                    className={`border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white min-w-32 ${className}`}
                  >
                    {cardSortOptions.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                );
                return viewMode === 'cards' ? sortSelect("") : (
                  <>
                    {/* Phones show a list without column headers, so offer the dropdown there. */}
                    {sortSelect("sm:hidden")}
                    <span className="hidden sm:inline text-sm text-gray-600 px-3 py-2 border border-gray-300 rounded-lg bg-gray-50">
                      Click headers
                    </span>
                  </>
                );
              })()}
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

      {/* Results Summary (hidden while loading). Without counts from the API the Type filter applies to the loaded page only. */}
      <div className={`mb-4 text-sm text-gray-600 ${loading ? "invisible" : ""}`}>
        {typeFilter !== 'all' && typeCounts ? (
          <span>
            Showing <span className="font-medium">{sortedClients.length}</span> of {total} {typeFilter} {clientLabel.toLowerCase()}s
          </span>
        ) : typeFilter !== 'all' ? (
          <span>
            Showing <span className="font-medium">{sortedClients.length}</span> {typeFilter} {clientLabel.toLowerCase()}s on this page{" "}
            <span className="text-gray-400">({total} in total)</span>
          </span>
        ) : (
          <span>
            Showing <span className="font-medium">{sortedClients.length}</span> of {total} {clientLabel.toLowerCase()}s
          </span>
        )}
      </div>

      {/* Content */}
      {loading ? (
        <div className="rounded-lg border bg-white animate-pulse motion-reduce:animate-none" role="status" aria-label={`Loading ${clientLabel.toLowerCase()}s`}>
          <div className="h-11 border-b bg-muted/60" />
          {Array.from({ length: 6 }, (_, i) => (
            <div key={i} className="flex items-center gap-6 border-b px-4 py-4 last:border-b-0">
              <div className="h-4 w-48 rounded bg-muted" />
              <div className="h-4 w-28 rounded bg-muted" />
              <div className="h-5 w-20 rounded-full bg-muted" />
              <div className="hidden sm:block h-4 w-24 rounded bg-muted" />
              <div className="hidden md:block h-4 w-40 rounded bg-muted" />
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {creating && (
            <div className="w-full">
              <EntityCard
                title={`New ${clientLabel}`}
                editing
                onSave={() => {}} // EntityCard doesn't need this since CompanyForm handles submission
                onCancel={handleCancel}
                editForm={
                  <CompanyForm
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

          {/* Phones: compact list, one tappable row per account (no sideways scrolling) */}
          {sortedClients.length > 0 && (
            <ul className="sm:hidden divide-y rounded-lg border bg-white" aria-label={`${clientLabel}s`}>
              {sortedClients.map((client) => (
                <li key={client.id}>
                  <Link to={`/clients/${client.id}`} className="flex items-center gap-3 px-4 py-3 active:bg-muted">
                    <div className="min-w-0 flex-1">
                      <div className="truncate font-medium text-foreground">{client.name}</div>
                      <div className="truncate text-sm text-muted-foreground">
                        {[client.contact_person, [client.city, client.state].filter(Boolean).join(", ")].filter(Boolean).join(" · ") || "No contact yet"}
                      </div>
                    </div>
                    {client.status && (
                      <StatusBadge status={client.status} colorClass={statusConfig.colors[client.status]} />
                    )}
                    <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                  </Link>
                </li>
              ))}
            </ul>
          )}

          {/* Tablets and desktop: the saved Table / Cards view */}
          <div className="hidden sm:block">
          {viewMode === 'cards' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {sortedClients.map((client) => (
                <EntityCard
                  key={client.id}
                  title={
                    <Link
                      to={`/clients/${client.id}`}
                      className="text-blue-600 hover:underline font-medium text-base block"
                    >
                      {client.name}
                    </Link>
                  }
                  typeLabel={client.type || "None"}
                  editing={editingId === client.id}
                  onEdit={() => handleTableEdit(client)}
                  onSave={() => {}} // EntityCard doesn't need this since CompanyForm handles submission
                  onCancel={handleCancel}
                  onDelete={() => handleDelete(client.id)}
                  editForm={
                    <CompanyForm
                      form={form}
                      setForm={setForm}
                      onSave={handleSave}
                      onCancel={handleCancel}
                      isEditing={true}
                    />
                  }
                  details={
                    <ul className="text-sm text-gray-600 space-y-2">
                      {client.status && (
                        <li className="flex items-start gap-2">
                          <CircleDot size={14} className="mt-[2px] flex-shrink-0" />
                          <StatusBadge status={client.status} colorClass={statusConfig.colors[client.status]} />
                        </li>
                      )}
                      {client.contact_person && (
                        <li className="flex items-start gap-2">
                          <User size={14} className="mt-[2px] flex-shrink-0" />
                          <div className="leading-tight">
                            <div>{client.contact_person}</div>
                            {client.contact_title && (
                              <div className="text-gray-500 text-sm italic">{client.contact_title}</div>
                            )}
                          </div>
                        </li>
                      )}
                      {client.email && (
                        <li className="flex items-start gap-2">
                          <Mail size={14} className="mt-[2px] flex-shrink-0" />
                          <a href={`mailto:${client.email}`} className="text-blue-600 underline break-all">
                            {client.email}
                          </a>
                        </li>
                      )}
                      {client.phone && (
                        <li className="flex items-start gap-2">
                          <Phone size={14} className="mt-[2px] flex-shrink-0" />
                          <div className="leading-tight">
                            <div>
                              <a href={`tel:${client.phone}`} className="text-blue-600 underline">
                                {formatPhoneNumber(client.phone)}
                              </a>
                              {client.phone_label && (
                                <span className="text-muted-foreground text-sm ml-1">
                                  ({client.phone_label})
                                </span>
                              )}
                            </div>
                            {client.secondary_phone && (
                              <div>
                                <a href={`tel:${client.secondary_phone}`} className="text-blue-600 underline">
                                  {formatPhoneNumber(client.secondary_phone)}
                                </a>
                                {client.secondary_phone_label && (
                                  <span className="text-muted-foreground text-sm ml-1">
                                    ({client.secondary_phone_label})
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        </li>
                      )}
                      {(client.address || client.city || client.state || client.zip) && (
                        <li className="flex items-start gap-2">
                          <MapPin size={14} className="mt-[2px] flex-shrink-0" />
                          <div className="leading-tight">
                            {client.address && <div>{client.address}</div>}
                            <div>
                              {[client.city, client.state].filter(Boolean).join(", ")}
                              {client.zip ? ` ${client.zip}` : ""}
                            </div>
                          </div>
                        </li>
                      )}
                      {client.notes && (
                        <li className="flex items-start gap-2">
                          <StickyNote size={14} className="mt-[2px] flex-shrink-0" />
                          <div className="break-words">{client.notes}</div>
                        </li>
                      )}
                    </ul>
                  }
                  extraMenuItems={
                    userHasRole(user, "admin") ? (
                      <button
                        className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100"
                        onClick={() => {
                          setSelectedClientId(client.id);
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
            <ClientsTable
              clients={sortedClients}
              onEdit={handleTableEdit}
              onDelete={handleDelete}
              onSort={handleSort}
              getSortIcon={getSortIcon}
              clientLabel={clientLabel}
            />
          )}
          </div>

          {sortedClients.length === 0 && (
            <div className="text-center py-12">
              <div className="text-gray-400 mb-4">
                <LayoutGrid size={48} className="mx-auto" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No {clientLabel.toLowerCase()}s found</h3>
              <p className="text-gray-500 mb-4">
                {activeFiltersCount > 0
                  ? `No ${clientLabel.toLowerCase()}s match your current filters. Try adjusting your search criteria.`
                  : `Get started by creating your first ${clientLabel.toLowerCase()}.`
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
          entityName={`${clientLabel.toLowerCase()}s`}
          className="mt-6 pt-4 border-t border-gray-200"
        />
      )}

      {/* Assignment Modal */}
      {showAssignModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
            <h2 className="text-lg font-semibold mb-4">Assign {clientLabel}</h2>

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
                variant="outline"
                className="order-2 sm:order-1"
                onClick={() => {
                  setShowAssignModal(false);
                  setSelectedUserId(null);
                  setSelectedClientId(null);
                }}
              >
                Cancel
              </Button>
              <Button
                className="order-1 sm:order-2"
                disabled={!selectedUserId}
                onClick={async () => {
                  const res = await apiFetch(`/clients/${selectedClientId}/assign`, {
                    method: "PUT",
                    headers: {
                      "Content-Type": "application/json",
                      Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({ assigned_to: selectedUserId }),
                  });

                  if (res.ok) {
                    toast.success(`${clientLabel} assigned`);
                    setShowAssignModal(false);
                    setSelectedUserId(null);
                    setSelectedClientId(null);
                    const updatedRes = await apiFetch(clientsUrl, {
                      headers: { Authorization: `Bearer ${token}` },
                    });
                    const fullData = await updatedRes.json();
                    setClients(fullData.clients);
                    setTotal(fullData.total);
                  } else {
                    toast.error(`Couldn't assign this ${clientLabel.toLowerCase()}. Please try again.`);
                  }
                }}
              >
                Assign
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
                <h2 className="text-lg font-semibold">
                  Edit {clientLabel}
                </h2>
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
              
              <CompanyForm
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
