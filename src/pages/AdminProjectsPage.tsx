import { useEffect, useState } from "react";
import { useAuth } from "@/authContext";
import { apiFetch } from "@/lib/api";
import { Link, useSearchParams } from "react-router-dom";
import ProjectForm from "@/components/ui/ProjectForm";
import PaginationControls from "@/components/ui/PaginationControls";
import { usePagination } from "@/hooks/usePreferences";
import { Edit } from "lucide-react";
import { PROJECT_STATUS_COLORS, PROJECT_STATUS_LABELS, formatProjectValue } from "@/lib/projectStatus";
import StatusBadge from "@/components/ui/StatusBadge";
import { useCRMConfig } from "@/config/crmConfig";
import toast from "react-hot-toast";


interface AdminProject {
  id: number;
  project_name: string;
  type?: string;
  project_status?: string;
  project_description?: string;
  project_start?: string;
  project_end?: string;
  project_worth?: number;
  value_type?: "one_time" | "monthly" | "yearly";
  client_name?: string;
  lead_name?: string;
  assigned_to_email?: string;
  created_at?: string;
  client_id?: number;
  lead_id?: number;
}

interface User {
  id: number;
  email: string;
  is_active: boolean;
}


export default function AdminProjectsPage() {
  const { token } = useAuth();
  const config = useCRMConfig();
  const [projects, setProjects] = useState<AdminProject[]>([]);
  const [total, setTotal] = useState(0);
  const [users, setUsers] = useState<User[]>([]);
  const [searchParams, setSearchParams] = useSearchParams();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [editingProjectId, setEditingProjectId] = useState<number | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [form, setForm] = useState<Partial<AdminProject>>({});
  const [clients, setClients] = useState<{ id: number; name: string }[]>([]);
  const [leads, setLeads] = useState<{ id: number; name: string }[]>([]);

  const selectedEmail = searchParams.get("user") || "";

  // Use pagination hook with admin-specific key
  const {
    perPage,
    sortOrder,
    currentPage,
    setCurrentPage,
    updatePerPage,
    updateSortOrder,
  } = usePagination('admin_projects');

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

  // Load projects when user selection or pagination changes
  useEffect(() => {
    const fetchProjects = async () => {
      if (!selectedEmail) {
        setProjects([]);
        setTotal(0);
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const [projectRes, clientRes, leadRes] = await Promise.all([
          apiFetch(
            `/projects/all?page=${currentPage}&per_page=${perPage}&sort=${sortOrder}&user_email=${encodeURIComponent(selectedEmail)}`,
            { headers: { Authorization: `Bearer ${token}` } }
          ),
          apiFetch("/clients/", { headers: { Authorization: `Bearer ${token}` } }),
          apiFetch("/leads/", { headers: { Authorization: `Bearer ${token}` } }),
        ]);

        const projectData = await projectRes.json();
        const clientData = await clientRes.json();
        const leadData = await leadRes.json();

        setProjects(projectData.projects);
        setTotal(projectData.total);
        setClients((clientData.clients || clientData).map((c: any) => ({ id: c.id, name: c.name })));
        setLeads((leadData.leads || leadData).map((l: any) => ({ id: l.id, name: l.name })));
        setError("");
      } catch {
        setError("Failed to load projects");
        setProjects([]);
        setTotal(0);
      } finally {
        setLoading(false);
      }
    };

      fetchProjects();
    }, [token, selectedEmail, currentPage, perPage, sortOrder]);



  // Reset to page 1 when user selection changes
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedEmail, setCurrentPage]);

  const handleUserChange = (email: string) => {
    setSearchParams(email ? { user: email } : {});
    setCurrentPage(1);
  };

  return (
    <div className="p-4 lg:p-6 space-y-6">
      <h1 className="text-2xl font-bold">Admin: Projects Overview</h1>
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

          {/* Content */}
          {loading ? (
            <div className="text-gray-500 text-center py-10">Loading...</div>
          ) : (
            <div className="overflow-x-auto bg-white rounded-lg border">
              <table className="min-w-full table-auto">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Project Name</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Status</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Type</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Associated With</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Worth</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Start Date</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">End Date</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Assigned To</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Created</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Edit</th>
                  </tr>
                </thead>
                <tbody>
                  {projects.map((project) => (
                    <tr key={project.id} className="border-t hover:bg-gray-50 transition">
                      <td className="px-4 py-3 text-sm">
                        <Link to={`/projects/${project.id}`} className="font-medium text-blue-600 hover:underline">{project.project_name}</Link>
                        {project.project_description && (
                          <div className="text-xs text-gray-500 mt-1 max-w-xs truncate">
                            {project.project_description}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {project.project_status ? (
                          <StatusBadge
                            status={project.project_status}
                            colorClass={PROJECT_STATUS_COLORS[project.project_status]}
                            label={PROJECT_STATUS_LABELS[project.project_status]}
                          />
                        ) : "—"}
                      </td>
                      <td className="px-4 py-3 text-sm">{project.type ?? "—"}</td>
                      <td className="px-4 py-3 text-sm">
                        {project.client_name && (
                          <div className="text-sm">
                            <span className="text-gray-500">{config.labels.client}:</span>{" "}
                            <Link 
                              to={`/clients/${project.client_id}`} 
                              className="text-blue-600 hover:underline"
                            >
                              {project.client_name}
                            </Link>
                          </div>
                        )}
                        {project.lead_name && (
                          <div className="text-sm">
                            <span className="text-gray-500">Lead:</span>{" "}
                            <Link 
                              to={`/leads/${project.lead_id}`} 
                              className="text-green-600 hover:underline"
                            >
                              {project.lead_name}
                            </Link>
                          </div>
                        )}
                        {!project.client_name && !project.lead_name && (
                          <span className="text-gray-500 text-xs">Standalone</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {formatProjectValue(project.project_worth, project.value_type) ?? "—"}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {project.project_start 
                          ? new Date(project.project_start).toLocaleDateString()
                          : "—"
                        }
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {project.project_end 
                          ? new Date(project.project_end).toLocaleDateString()
                          : "—"
                        }
                      </td>
                      <td className="px-4 py-3 text-sm">{project.assigned_to_email ?? "—"}</td>
                      <td className="px-4 py-3 text-sm">
                        {project.created_at 
                          ? new Date(project.created_at).toLocaleDateString()
                          : "—"
                        }
                      </td>
                        <td className="px-4 py-3 text-sm">
                          <button
                            onClick={() => {
                              setEditingProjectId(project.id);
                              setForm(project);
                              setShowEditModal(true);
                            }}
                            className="text-blue-600 hover:text-blue-800 p-1 rounded hover:bg-blue-50"
                            title="Edit Project"
                          >
                            <Edit size={14} />
                          </button>
                        </td>
                    </tr>
                  ))}
                  {projects.length === 0 && !loading && (
                    <tr>
                      <td colSpan={10} className="px-4 py-4 text-center text-gray-500">
                        No projects found for this user.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

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
              entityName="projects"
              className="border-t pt-4"
            />
          )}
        </>
      )}
      {showEditModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold">Edit Project</h2>
                <button
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingProjectId(null);
                    setForm({});
                  }}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>

              <ProjectForm
                form={form}
                setForm={setForm}
                clients={clients}
                leads={leads}
                onSave={async (data) => {
                  try {
                    const res = await apiFetch(`/projects/${editingProjectId}`, {
                      method: "PUT",
                      headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                      },
                      body: JSON.stringify(data),
                    });

                    if (res.ok) {
                      const projectRes = await apiFetch(
                        `/projects/all?page=${currentPage}&per_page=${perPage}&sort=${sortOrder}&user_email=${encodeURIComponent(selectedEmail)}`,
                        {
                          headers: { Authorization: `Bearer ${token}` },
                        }
                      );
                      const data = await projectRes.json();
                      setProjects(data.projects);
                      setShowEditModal(false);
                      setEditingProjectId(null);
                      setForm({});
                      toast.success("Project updated");
                    } else {
                      toast.error("Couldn't update the project. Please try again.");
                    }
                  } catch {
                    toast.error("Couldn't update the project. Please try again.");
                  }
                }}
                onCancel={() => {
                  setShowEditModal(false);
                  setEditingProjectId(null);
                  setForm({});
                }}
                isEditing={true}
              />
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
