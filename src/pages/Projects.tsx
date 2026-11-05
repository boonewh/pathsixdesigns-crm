import { useEffect, useState } from "react";
import { useAuth } from "@/authContext";
import EntityCard from "@/components/ui/EntityCard";
import { Project } from "@/types";
import ProjectForm from "@/components/ui/ProjectForm";
import ProjectEditModal from "@/components/ui/ProjectEditModal";
import PaginationControls from "@/components/ui/PaginationControls";
import { apiFetch } from "@/lib/api";
import { Link } from "react-router-dom";
import { usePagination } from "@/hooks/usePreferences";
import { useStatusFilter } from "@/hooks/useStatusFilter";
import { useSorting, legacySortToUnified, unifiedToLegacySort } from "@/hooks/useSorting";
import ProjectsTable from "@/components/ui/ProjectsTable";
import { LayoutGrid, List, Plus, ChevronRight } from "lucide-react";
import toast from "react-hot-toast";
import StatusBadge from "@/components/ui/StatusBadge";
import { Button } from "@/components/ui/button";
import { PROJECT_STATUS_COLORS, PROJECT_STATUS_LABELS, formatProjectValue } from "@/lib/projectStatus";
import { PROJECT_STATUSES } from "@/schemas/projectSchemas";
import { useCRMConfig } from "@/config/crmConfig";

// Project status options for filtering (align with backend/Pydantic)
const PROJECT_STATUS_OPTIONS = PROJECT_STATUSES;

export default function Projects() {
  const { token } = useAuth();
  const config = useCRMConfig();
  const [projects, setProjects] = useState<Project[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);

  // Use pagination hook with view mode support
  const {
    perPage,
    sortOrder,
    viewMode,
    currentPage,
    setCurrentPage,
    updatePerPage,
    updateSortOrder,
    updateViewMode,
  } = usePagination('projects');

  // Initialize unified sorting from pagination preferences
  const initialSort = legacySortToUnified(sortOrder, 'projects');
  
  const {
    sortField,
    sortDirection,
    handleSort,
    sortData,
    cardSortOptions,
    currentCardValue,
    setCardSort
  } = useSorting({
    entityType: 'projects',
    initialSort,
    onSortChange: (field, direction) => {
      // Update pagination preferences when sort changes
      const legacySort = unifiedToLegacySort(field, direction, 'projects');
      updateSortOrder(legacySort);
    }
  });

  // Status filter (preserves user's filter choice)
  const { statusFilter, setStatusFilter } = useStatusFilter('projects');

  // Per-status totals from the API. Null when the backend doesn't send them yet
  // (older backend); the page then falls back to filtering the loaded page.
  const [statusCounts, setStatusCounts] = useState<Record<string, number> | null>(null);

  // The status filter is sent to the API so it covers every page, not just this one.
  const projectsUrl =
    `/projects/?page=${currentPage}&per_page=${perPage}&sort=${sortOrder}` +
    (statusFilter !== "all" ? `&status=${encodeURIComponent(statusFilter)}` : "");

  const changeStatusFilter = (status: string) => {
    setStatusFilter(status);
    setCurrentPage(1);
  };

  const [form, setForm] = useState<Partial<Project>>({});
  const [creating, setCreating] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [clients, setClients] = useState<{ id: number; name: string }[]>([]);
  const [leads, setLeads] = useState<{ id: number; name: string }[]>([]);
  const [error, setError] = useState("");
  const [loadError, setLoadError] = useState("");
  const [reload, setReload] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    const fetchAll = async () => {
      setLoading(true);
      setLoadError("");
      try {
        const results = await Promise.allSettled([
          apiFetch(projectsUrl, { 
            signal: controller.signal,
            headers: { Authorization: `Bearer ${token}` } 
          }),
          apiFetch("/clients/", { signal: controller.signal, headers: { Authorization: `Bearer ${token}` } }),
          apiFetch("/leads/", { signal: controller.signal, headers: { Authorization: `Bearer ${token}` } }),
        ]);
        const [projRes, clientRes, leadRes] = results.map(result => {
          if (result.status === "rejected") throw result.reason;
          if (!result.value.ok) throw new Error(`HTTP ${result.value.status}`);
          return result.value;
        });

        const projectsData = await projRes.json();
        const clients = await clientRes.json();
        const leads = await leadRes.json();

        const leadsArray = leads.leads || leads;
        const clientsArray = clients.clients || clients;
        if (!Array.isArray(projectsData.projects) || !Array.isArray(clientsArray) || !Array.isArray(leadsArray)) {
          throw new Error("Unexpected response format");
        }
        if (controller.signal.aborted) return;

        setProjects(projectsData.projects);
        setTotal(projectsData.total);
        setStatusCounts(projectsData.status_counts ?? null);
        setClients(clientsArray.map((c: any) => ({ id: c.id, name: c.name })));
        setLeads(leadsArray.map((l: any) => ({ id: l.id, name: l.name })));
      } catch (err: any) {
        if (!controller.signal.aborted) setLoadError("We couldn't load projects and their related data. Please try again.");
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    };

    fetchAll();
    return () => controller.abort();
  }, [token, projectsUrl, reload]);

  // Filter projects by status
  const filteredProjects = projects.filter(project => {
    if (statusFilter === 'all') return true;
    return project.project_status === statusFilter;
  });

  // Apply unified sorting to filtered data
  const sortedProjects = sortData(filteredProjects);

  const handleTableEdit = (project: Project) => {
    setForm(project);
    setEditingId(project.id);
    setShowEditModal(true);
  };

  const resetForm = () => {
    setForm({});
    setCreating(false);
    setEditingId(null);
  };

  const handleSave = async (data: any) => {
    try {
      const method = creating ? "POST" : "PUT";
      const url = creating ? "/projects/" : `/projects/${editingId}`;

      if (!data.project_worth) {
        data.project_worth = 0;
      }
      
      const res = await apiFetch(url, {
        method,
        headers: { Authorization: `Bearer ${token}` },
        body: JSON.stringify(data),
      });

      if (!res.ok) throw new Error("Failed to save project");

      const updated = await apiFetch(projectsUrl, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const refreshed = await updated.json();
      setProjects(refreshed.projects);
      setTotal(refreshed.total);
      resetForm();
    } catch (err: any) {
      setError(err.message || "Failed to save project");
    }
  };

  // The card menu and the table each confirm before calling this, so it doesn't ask again.
  const handleDelete = async (id: number) => {
    try {
      const res = await apiFetch(`/projects/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        setProjects((prev) => prev.filter((p) => p.id !== id));
        setTotal((prev) => prev - 1);
        toast.success("Project deleted. You can restore it from Deletes.");
      } else {
        // Try to get error details from response
        let errorMsg = "Failed to delete project";
        try {
          const errorData = await res.json();
          errorMsg = errorData.detail || errorData.error || errorMsg;
        } catch {
          errorMsg = `Failed to delete project (${res.status})`;
        }
        toast.error(errorMsg);
        console.error('Delete project error:', res.status, errorMsg);
      }
    } catch (err) {
      console.error('Delete project exception:', err);
      toast.error("Couldn't delete this project. Please try again.");
    }
  };

  const handleEdit = (project: Project) => {
    setEditingId(project.id);
    setForm(project);
    setShowEditModal(true); // ✅ show the modal
  };

  const handleCancel = () => {
    setShowEditModal(false);     
    setEditingId(null);          
    setCreating(false);       
    setForm({});        
  };

  // Clear all filters
  const clearAllFilters = () => {
    setStatusFilter('all');
  };

  const activeFiltersCount = statusFilter !== 'all' ? 1 : 0;

  return (
    <div className="p-4 lg:p-6">
      {/* Header */}
      <div className="flex justify-between items-center gap-4 mb-4">
        <h1 className="text-2xl font-bold">Projects</h1>
        <div className="flex gap-2">
          {/* New Project Button */}
          <Button
            disabled={loading || !!loadError}
            onClick={() => {
              setCreating(true);
              setForm({});
            }}
          >
            <Plus size={16} />
            <span className="hidden sm:inline">New Project</span>
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

            {/* Status Filter */}
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700 whitespace-nowrap">Status:</label>
              <select 
                value={statusFilter} 
                onChange={(e) => changeStatusFilter(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white shadow-sm min-w-32"
              >
                <option value="all">
                  All statuses{statusCounts ? ` (${Object.values(statusCounts).reduce((sum, n) => sum + n, 0)})` : ""}
                </option>
                {PROJECT_STATUS_OPTIONS.map(status => (
                  <option key={status} value={status}>
                    {PROJECT_STATUS_LABELS[status] || status}{statusCounts ? ` (${statusCounts[status] ?? 0})` : ""}
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

      {/* Results Summary. Without counts from the API the Status filter applies to the loaded page only. */}
      {!loading && !loadError && (
      <div className="mb-4 text-sm text-gray-600">
        {statusFilter !== 'all' && statusCounts ? (
          <span>
            Showing <span className="font-medium">{sortedProjects.length}</span> of {total}{" "}
            {(PROJECT_STATUS_LABELS[statusFilter] || statusFilter).toLowerCase()} projects
          </span>
        ) : statusFilter !== 'all' ? (
          <span>
            Showing <span className="font-medium">{sortedProjects.length}</span>{" "}
            {(PROJECT_STATUS_LABELS[statusFilter] || statusFilter).toLowerCase()} projects on this page{" "}
            <span className="text-gray-400">({total} in total)</span>
          </span>
        ) : (
          <span>
            Showing <span className="font-medium">{sortedProjects.length}</span> of {total} projects
          </span>
        )}
      </div>
      )}

      {/* Content */}
      {loading ? (
        <div className="rounded-lg border bg-white animate-pulse motion-reduce:animate-none" role="status" aria-label="Loading projects">
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
      ) : loadError ? (
        <div role="alert" className="rounded-md border border-red-200 bg-red-50 p-6 text-center">
          <p className="text-red-800">{loadError}</p>
          <button type="button" className="mt-4 rounded-md bg-primary px-4 py-2 text-primary-foreground" onClick={() => {
            setLoading(true);
            setReload(value => value + 1);
          }}>Try again</button>
        </div>
      ) : (
        <div className="space-y-4">
          {creating && (
            <div className="w-full">
              <EntityCard
                title="New Project"
                editing
                onSave={() => {}} // EntityCard doesn't need this since ProjectForm handles submission
                onCancel={resetForm}
                editForm={
                  <ProjectForm
                    form={form}
                    setForm={setForm}
                    clients={clients}
                    leads={leads}
                    onSave={handleSave}
                    onCancel={resetForm}
                    isEditing={false}
                  />
                }
              />
            </div>
          )}

          {showEditModal && editingId !== null && (
            <ProjectEditModal
              form={form}
              setForm={setForm}
              clients={clients}
              leads={leads}
              onSave={handleSave}
              onCancel={handleCancel}
            />
          )}

          {/* Phones: compact list, one tappable row per project (no sideways scrolling) */}
          {sortedProjects.length > 0 && (
            <ul className="sm:hidden divide-y rounded-lg border bg-white" aria-label="Projects">
              {sortedProjects.map((project) => (
                <li key={project.id}>
                  <Link to={`/projects/${project.id}`} className="flex items-center gap-3 px-4 py-3 active:bg-muted">
                    <div className="min-w-0 flex-1">
                      <div className="truncate font-medium text-foreground">{project.project_name}</div>
                      <div className="truncate text-sm text-muted-foreground">
                        {[formatProjectValue(project.project_worth, project.value_type), project.client_name || project.lead_name || project.primary_contact_name].filter(Boolean).join(" · ") || "Not linked yet"}
                      </div>
                    </div>
                    <StatusBadge
                      status={project.project_status || 'pending'}
                      colorClass={PROJECT_STATUS_COLORS[project.project_status || 'pending']}
                      label={PROJECT_STATUS_LABELS[project.project_status || 'pending']}
                    />
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
              {sortedProjects.map((project) => (
                <div key={project.id} className="w-full">
                  <EntityCard
                    title={
                      <Link
                        to={`/projects/${project.id}`}
                        className="text-blue-600 hover:underline font-medium text-base block"
                      >
                        {project.project_name}
                      </Link>
                    }
                    typeLabel={project.type || "None"}
                    onEdit={() => handleEdit(project)}
                    onDelete={() => handleDelete(project.id)}
                    details={
                      <ul className="text-sm text-gray-700 space-y-1">
                        <li>
                          <StatusBadge
                            status={project.project_status || 'pending'}
                            colorClass={PROJECT_STATUS_COLORS[project.project_status || 'pending']}
                            label={PROJECT_STATUS_LABELS[project.project_status || 'pending']}
                          />
                        </li>
                        {project.project_description && <li>{project.project_description}</li>}
                        {project.client_id && project.client_name && (
                          <li>
                            <Link to={`/clients/${project.client_id}`} className="text-blue-600 hover:underline">
                              {config.labels.client}: {project.client_name}
                            </Link>
                          </li>
                        )}
                        {project.lead_id && project.lead_name && (
                          <li>
                            <Link to={`/leads/${project.lead_id}`} className="text-blue-600 hover:underline">
                              Lead: {project.lead_name}
                            </Link>
                          </li>
                        )}
                        {!project.client_id && !project.lead_id && project.primary_contact_name && (
                          <li className="text-blue-600">
                            Contact: {project.primary_contact_name}
                          </li>
                        )}
                        {!project.client_id && !project.lead_id && !project.primary_contact_name && (
                          <li className="text-amber-700 text-xs font-medium">Not linked to an account or lead</li>
                        )}
                        {project.project_worth && (
                          <li>
                            Worth: ${project.project_worth.toLocaleString()}
                            {project.value_type === 'monthly' && ' / mo'}
                            {project.value_type === 'yearly' && ` / yr ($${(project.project_worth / 12).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} / mo)`}
                          </li>
                        )}
                        {project.project_start && <li>Start: {new Date(project.project_start).toLocaleDateString()}</li>}
                        {project.project_end && <li>End: {new Date(project.project_end).toLocaleDateString()}</li>}
                        {project.notes && (
                          <li className="whitespace-pre-wrap text-gray-600">
                            <strong>Notes:</strong> {project.notes?.trim() || "No notes provided."}
                          </li>
                        )}
                      </ul>
                    }
                  />
                </div>
              ))}

            </div>
          ) : (
            <ProjectsTable
              projects={sortedProjects}
              onEdit={handleTableEdit}
              onDelete={handleDelete}
              sortField={sortField}
              sortDirection={sortDirection}
              onSort={handleSort}
            />
          )}
          </div>

          {sortedProjects.length === 0 && (
            <div className="text-center py-12">
              <div className="text-gray-400 mb-4">
                <LayoutGrid size={48} className="mx-auto" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No projects found</h3>
              <p className="text-gray-500 mb-4">
                {statusFilter !== 'all' 
                  ? `No projects with status "${statusFilter}". Try adjusting your filters.`
                  : "Get started by creating your first project."
                }
              </p>
              {statusFilter !== 'all' && (
                <button
                  onClick={() => setStatusFilter('all')}
                  className="text-blue-600 hover:text-blue-800 font-medium"
                >
                  Show all projects
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
          entityName="projects"
          className="mt-6 pt-4 border-t border-gray-200"
        />
      )}

    </div>
  );
}
