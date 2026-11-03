import { useEffect, useRef, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useAuth, userHasRole } from "@/authContext";
import { Project, Interaction } from "@/types";
import { apiFetch } from "@/lib/api";
import CompanyNotes from "@/components/ui/CompanyNotes";
import CompanyInteractions from "@/components/ui/CompanyInteractions";
import { toast } from "react-hot-toast";
import { useCRMConfig } from "@/config/crmConfig";
import StatusBadge from "@/components/ui/StatusBadge";
import { Button } from "@/components/ui/button";
import { RecordHeader, RecordFields, RecordTabs, RecordSkeleton } from "@/components/ui/RecordLayout";
import { PROJECT_STATUS_COLORS, PROJECT_STATUS_LABELS, formatProjectValue } from "@/lib/projectStatus";

export default function ProjectDetailPage() {
  const { id } = useParams();
  const { token, user } = useAuth();
  const config = useCRMConfig();

  const [project, setProject] = useState<Project | null>(null);
  const [interactions, setInteractions] = useState<Interaction[]>([]);
  const [noteDraft, setNoteDraft] = useState("");
  const [showNoteMenu, setShowNoteMenu] = useState(false);
  const [isEditingNote, setIsEditingNote] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [availableUsers, setAvailableUsers] = useState<{ id: number; email: string }[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const [editingTitle, setEditingTitle] = useState(false);
  const [newTitle, setNewTitle] = useState(project?.primary_contact_title || "");

  const [loadError, setLoadError] = useState("");
  const [isAssigning, setIsAssigning] = useState(false);
  const [interactionCount, setInteractionCount] = useState<number | undefined>(undefined);

  
  useEffect(() => {
    if (!id) return;

    // Fetch project details
    apiFetch(`/projects/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load project");
        return res.json();
      })
      .then((data) => {
        setProject(data);
        setNewTitle(data.primary_contact_title || "");
        setNoteDraft(data.notes || "");
        
        // 🆕 Log activity for "Recently Touched" - this happens automatically
        // when the backend project endpoint is called, similar to clients/leads
      })
      .catch((err) => {
        console.error("Error loading project:", err);
        setLoadError(err.message || "Failed to load project");
      });

    // Fetch interactions
    apiFetch(`/interactions/?project_id=${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load interactions");
        return res.json();
      })
      .then((data) => setInteractions(data.interactions || []))
      .catch((err) => {
        console.error("Error loading interactions:", err);
      });

    // Fetch assignable users if admin (future feature)
    if (userHasRole(user, "admin")) {
      apiFetch("/users/", {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((res) => {
          if (!res.ok) throw new Error("Failed to load users");
          return res.json();
        })
        .then((data) => {
          setAvailableUsers(data.filter((u: any) => u.is_active));
        })
        .catch((err) => {
          console.error("Error loading users:", err);
        });
    }
  }, [id, token, user]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowNoteMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const saveNote = async () => {
    const res = await apiFetch(`/projects/${id}`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify({ notes: noteDraft }),
    });
    if (res.ok) {
      setProject((prev) => prev && { ...prev, notes: noteDraft });
      setIsEditingNote(false);
    } else {
      toast.error("Couldn't save the notes. Please try again.");
    }
  };

  const deleteNote = async () => {
    const res = await apiFetch(`/projects/${id}`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify({ notes: "" }),
    });
    if (res.ok) {
      setProject((prev) => prev && { ...prev, notes: "" });
      setNoteDraft("");
      setIsEditingNote(false);
    } else {
      toast.error("Couldn't delete the notes. Please try again.");
    }
  };

  const handleConvertToClient = async () => {
    if (!project) return;

    const confirmed = confirm(
      `Convert "${project.project_name}" to ${config.labels.client}? This will create a new record and link this project to it.`
    );

    if (!confirmed) return;

    const clientData = {
      name: project.primary_contact_name ? 
        `${project.project_name} (${project.primary_contact_name})` : 
        project.project_name,
      email: project.primary_contact_email,
      phone: project.primary_contact_phone,
      phone_label: project.primary_contact_phone_label || "work",
      contact_person: project.primary_contact_name,
      contact_title: project.primary_contact_title,
      notes: `Converted from project: ${project.project_name}${project.notes ? '\n\nProject Notes:\n' + project.notes : ''}`,
      type: project.type || "None",
    };

    const res = await apiFetch("/clients/", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify(clientData),
    });

    if (res.ok) {
      const newClient = await res.json();

      // Update project to link to new client
      await apiFetch(`/projects/${project.id}`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          client_id: newClient.id,
          // Clear standalone contact fields since they're now in the client
          primary_contact_name: null,
          primary_contact_title: null,
          primary_contact_email: null,
          primary_contact_phone: null,
          primary_contact_phone_label: null,
        }),
      });

      // Transfer interactions to the new client
      await apiFetch("/interactions/transfer", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          from_project_id: project.id,
          to_client_id: newClient.id,
        }),
      });

      window.location.href = `/clients/${newClient.id}`;
    } else {
      toast.error(`Couldn't convert this project to ${config.labels.client.toLowerCase()}. Please try again.`);
    }
  };

  if (!id) return <p className="p-6 text-red-600">Invalid project ID.</p>;
  if (loadError) {
    return (
      <p className="p-6 text-red-600">
        This project couldn't be loaded. It may have been deleted, or you may not have access to it.
      </p>
    );
  }
  if (!project) return <RecordSkeleton />;

  const handleAssignProject = async () => {
    if (!project || !selectedUserId) return;
    setIsAssigning(true);
    const res = await apiFetch(`/projects/${project.id}/assign`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ assigned_to: selectedUserId }),
    });
    if (res.ok) {
      const assignedUser = availableUsers.find((u) => u.id === selectedUserId);
      setProject((prev) => prev && { ...prev, assigned_to: selectedUserId, assigned_to_name: assignedUser?.email });
      setShowAssignModal(false);
      setSelectedUserId(null);
      toast.success("Project assigned");
    } else {
      toast.error("Couldn't assign this project. Please try again.");
    }
    setIsAssigning(false);
  };

  const saveTitle = async () => {
    const res = await apiFetch(`/projects/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ primary_contact_title: newTitle }),
    });
    if (res.ok) {
      setProject((prev) => prev && { ...prev, primary_contact_title: newTitle });
      setEditingTitle(false);
    } else {
      toast.error("Couldn't save the contact title. Please try again.");
    }
  };

  const status = project.project_status || "pending";
  const isStandalone = !project.client_id && !project.lead_id;
  const value = formatProjectValue(project.project_worth, project.value_type);
  const formatDate = (d?: string) => (d ? new Date(d).toLocaleDateString() : null);
  const dates = [formatDate(project.project_start), formatDate(project.project_end)].filter(Boolean).join(" – ");

  return (
    <div className="p-4 lg:p-6 space-y-4">
      <div className="text-xs text-muted-foreground">
        <Link to="/projects" className="hover:underline">Projects</Link> / {project.project_name}
      </div>

      <RecordHeader
        eyebrow="Project"
        title={project.project_name}
        actions={
          <>
            {userHasRole(user, "admin") && (
              <Button variant="outline" onClick={() => setShowAssignModal(true)}>
                Assign Project
              </Button>
            )}
            {isStandalone && (
              <Button onClick={handleConvertToClient}>{`Convert to ${config.labels.client}`}</Button>
            )}
          </>
        }
        fields={[
          {
            label: "Status",
            value: <StatusBadge status={status} colorClass={PROJECT_STATUS_COLORS[status]} label={PROJECT_STATUS_LABELS[status]} />,
          },
          {
            label: "Value",
            value: value ? (
              <span title={project.value_type === "yearly" && project.project_worth
                ? `$${(project.project_worth / 12).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} / mo`
                : undefined}>
                {value}
              </span>
            ) : "—",
          },
          { label: "Dates", value: dates || "—" },
          {
            label: "Linked to",
            value: project.client_id && project.client_name ? (
              <Link to={`/clients/${project.client_id}`} className="text-primary hover:underline">{project.client_name}</Link>
            ) : project.lead_id && project.lead_name ? (
              <Link to={`/leads/${project.lead_id}`} className="text-primary hover:underline">{project.lead_name} (lead)</Link>
            ) : (
              "Standalone"
            ),
          },
          { label: "Owner", value: project.assigned_to_name || "Unassigned" },
        ]}
      />

      <div className="grid gap-4 lg:grid-cols-[320px_minmax(0,1fr)] items-start">
        <RecordFields
          title="About"
          fields={[
            { label: "Type", value: project.type || "None" },
            { label: "Description", value: project.project_description || "—" },
            ...(project.value_type === "yearly" && project.project_worth
              ? [{
                  label: "Per month",
                  value: `$${(project.project_worth / 12).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
                }]
              : []),
            ...(isStandalone
              ? [
                  {
                    label: "Contact",
                    value: project.primary_contact_name ? (
                      <div className="leading-tight">
                        <div>{project.primary_contact_name}</div>
                        {editingTitle ? (
                          <div className="mt-1 flex flex-wrap items-center gap-2">
                            <input
                              type="text"
                              aria-label="Contact title"
                              className="border px-2 py-1 rounded text-sm"
                              value={newTitle}
                              onChange={(e) => setNewTitle(e.target.value)}
                            />
                            <button className="text-primary text-sm" onClick={saveTitle}>
                              Save
                            </button>
                            <button
                              className="text-muted-foreground text-sm"
                              onClick={() => {
                                setNewTitle(project.primary_contact_title || "");
                                setEditingTitle(false);
                              }}
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          project.primary_contact_title && (
                            <button
                              className="text-muted-foreground text-sm hover:underline"
                              onClick={() => setEditingTitle(true)}
                            >
                              {project.primary_contact_title}
                            </button>
                          )
                        )}
                      </div>
                    ) : "—",
                  },
                  {
                    label: "Email",
                    value: project.primary_contact_email ? (
                      <a href={`mailto:${project.primary_contact_email}`} className="text-primary hover:underline">
                        {project.primary_contact_email}
                      </a>
                    ) : "—",
                  },
                  {
                    label: "Phone",
                    value: project.primary_contact_phone ? (
                      <span>
                        <a href={`tel:${project.primary_contact_phone}`} className="text-primary hover:underline">
                          {project.primary_contact_phone}
                        </a>
                        {project.primary_contact_phone_label && (
                          <span className="text-muted-foreground ml-1">({project.primary_contact_phone_label})</span>
                        )}
                      </span>
                    ) : "—",
                  },
                ]
              : []),
            { label: "Created", value: formatDate(project.created_at) || "—" },
          ]}
        />

        <RecordTabs
          tabs={[
            {
              key: "activity",
              label: "Activity",
              count: interactionCount,
              content: (
                <CompanyInteractions
                  token={token!}
                  entityType="project"
                  entityId={project.id}
                  initialInteractions={interactions}
                  embedded
                  onCount={setInteractionCount}
                />
              ),
            },
            {
              key: "notes",
              label: "Notes",
              content: (
                <CompanyNotes
                  notes={project.notes || ""}
                  noteDraft={noteDraft}
                  onSave={saveNote}
                  isEditing={isEditingNote}
                  setIsEditing={setIsEditingNote}
                  onDelete={deleteNote}
                  menuRef={menuRef}
                  showMenu={showNoteMenu}
                  setShowMenu={setShowNoteMenu}
                  setNoteDraft={setNoteDraft}
                  embedded
                />
              ),
            },
          ]}
        />
      </div>

      {showAssignModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
            <h2 className="text-lg font-semibold mb-4">Assign Project</h2>

            <select
              value={selectedUserId ?? ""}
              onChange={(e) => setSelectedUserId(Number(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded mb-4"
            >
              <option value="">Select a user</option>
              {availableUsers.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.email}
                </option>
              ))}
            </select>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowAssignModal(false)}>
                Cancel
              </Button>
              <Button disabled={!selectedUserId || isAssigning} onClick={handleAssignProject}>
                {isAssigning ? "Assigning…" : "Assign"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
