import { useEffect, useRef, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useAuth, userHasRole } from "@/authContext";
import toast from "react-hot-toast";
import { Lead, Interaction } from "@/types";
import { apiFetch } from "@/lib/api";
import { formatPhoneNumber } from "@/lib/phoneUtils";
import CompanyNotes from "@/components/ui/CompanyNotes";
import CompanyInteractions from "@/components/ui/CompanyInteractions";
import CompanyContacts from "@/components/ui/CompanyContacts";
import { useCRMConfig } from "@/config/crmConfig";
import { Button } from "@/components/ui/button";
import StatusBadge from "@/components/ui/StatusBadge";
import { RecordHeader, RecordFields, RecordTabs, StagePath, ProjectList, RecordSkeleton } from "@/components/ui/RecordLayout";

export default function LeadDetailPage() {
  const { id } = useParams();
  const { token, user } = useAuth();
  const config = useCRMConfig();

  const [lead, setLead] = useState<Lead | null>(null);
  const [interactions, setInteractions] = useState<Interaction[]>([]);
  const [noteDraft, setNoteDraft] = useState("");
  const [showNoteMenu, setShowNoteMenu] = useState(false);
  const [isEditingNote, setIsEditingNote] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [availableUsers, setAvailableUsers] = useState<{ id: number; email: string }[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const [editingTitle, setEditingTitle] = useState(false);
  const [newTitle, setNewTitle] = useState(lead?.contact_title || "");

  const [projects, setProjects] = useState<any[]>([]);
  const [projectLoadError, setProjectLoadError] = useState("");

  const [isAssigning, setIsAssigning] = useState(false);
  const [savingStage, setSavingStage] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [interactionCount, setInteractionCount] = useState<number | undefined>(undefined);
  const [contactCount, setContactCount] = useState<number | undefined>(undefined);

  useEffect(() => {
    if (!id) return;

    // Fetch lead details
    apiFetch(`/leads/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load lead");
        return res.json();
      })
      .then((data) => {
        setLead(data);
        setNewTitle(data.contact_title || "");
        setNoteDraft(data.notes || "");
      })
      .catch((err) => {
        console.error("Error loading lead:", err);
        setLoadError("This lead couldn't be loaded. It may have been deleted, or you may not have access to it.");
      });

    // Fetch interactions
    apiFetch(`/interactions/?lead_id=${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load interactions");
        return res.json();
      })
      .then(setInteractions)
      .catch((err) => {
        console.error("Error loading interactions:", err);
      });

    // Fetch assignable users if admin
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
    if (!id) return;

    apiFetch(`/projects/by-lead/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load projects");
        return res.json();
      })
      .then(setProjects)
      .catch((err) => {
        console.error("Project load error:", err);
        setProjectLoadError("Failed to load associated projects.");
      });
  }, [id, token]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowNoteMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const saveTitle = async () => {
    const res = await apiFetch(`/leads/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ contact_title: newTitle }),
    });
    if (res.ok) {
      setLead((prev) => prev && { ...prev, contact_title: newTitle });
      setEditingTitle(false);
    } else {
      toast.error("Couldn't save the contact title. Please try again.");
    }
  };

  const changeStage = async (stage: string) => {
    setSavingStage(true);
    const res = await apiFetch(`/leads/${id}`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify({ lead_status: stage }),
    });
    if (res.ok) {
      setLead((prev) => prev && { ...prev, lead_status: stage });
      const label = config.leads.statusConfig.labels?.[stage] || stage.charAt(0).toUpperCase() + stage.slice(1);
      toast.success(`Status changed to ${label}`);
    } else {
      toast.error("Couldn't change the status. Please try again.");
    }
    setSavingStage(false);
  };

  const saveNote = async () => {
    const res = await apiFetch(`/leads/${id}`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify({ notes: noteDraft }),
    });
    if (res.ok) {
      setLead((prev) => prev && { ...prev, notes: noteDraft });
      setIsEditingNote(false);
    } else {
      toast.error("Couldn't save the notes. Please try again.");
    }
  };

  const deleteNote = async () => {
    const res = await apiFetch(`/leads/${id}`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify({ notes: "" }),
    });
    if (res.ok) {
      setLead((prev) => prev && { ...prev, notes: "" });
      setNoteDraft("");
      setIsEditingNote(false);
    } else {
      toast.error("Couldn't delete the notes. Please try again.");
    }
  };

  const handleConvertToClient = async () => {
    if (!lead) return;

    const confirmed = confirm(
      `Convert "${lead.name}" to ${config.labels.client}? This will permanently change the record type.`
    );

    if (!confirmed) return;

    // Mark lead as won first so it's tracked in reports even after soft-delete
    await apiFetch(`/leads/${lead.id}`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify({ lead_status: "won" }),
    });

    const res = await apiFetch("/clients/", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        name: lead.name,
        email: lead.email,
        phone: lead.phone,
        address: lead.address,
        contact_person: lead.contact_person,
        city: lead.city,
        state: lead.state,
        zip: lead.zip,
        notes: lead.notes,
        source_lead_id: lead.id,
      }),
    });

    if (res.ok) {
      const newClient = await res.json();

      await apiFetch("/interactions/transfer", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          from_lead_id: lead.id,
          to_client_id: newClient.id,
        }),
      });

      await apiFetch(`/leads/${lead.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      window.location.href = `/clients/${newClient.id}`;
    } else {
      toast.error(`Couldn't convert this lead to ${config.labels.client.toLowerCase()}. Please try again.`);
    }
  };

  if (!id) return <p className="p-6 text-red-600">Invalid lead ID.</p>;

  if (loadError) return <p className="p-6 text-red-600">{loadError}</p>;
  if (!lead) return <RecordSkeleton />;

  return (
    <div className="p-4 lg:p-6 space-y-4">
      <div className="text-xs text-muted-foreground">
        <Link to="/leads" className="hover:underline">Leads</Link> / {lead.name}
      </div>

      <RecordHeader
        eyebrow="Lead"
        title={lead.name}
        actions={
          <>
            {userHasRole(user, "admin") && (
              <Button variant="outline" onClick={() => setShowAssignModal(true)}>
                Assign Lead
              </Button>
            )}
            <Button onClick={handleConvertToClient}>{`Convert to ${config.labels.client}`}</Button>
          </>
        }
        fields={[
          {
            label: "Status",
            value: lead.lead_status ? (
              <StatusBadge
                status={lead.lead_status}
                colorClass={config.leads.statusConfig.colors[lead.lead_status]}
                label={config.leads.statusConfig.labels?.[lead.lead_status]}
              />
            ) : "—",
          },
          { label: "Source", value: lead.lead_source || "—" },
          { label: "Owner", value: lead.assigned_to_name || "Unassigned" },
          { label: "Type", value: lead.type || "None" },
          { label: "Created", value: lead.created_at ? new Date(lead.created_at).toLocaleDateString() : "—" },
        ]}
      >
        <StagePath
          stages={config.leads.statuses.filter((s) => s !== "lost")}
          current={lead.lead_status}
          labels={config.leads.statusConfig.labels}
          onSelect={changeStage}
          disabled={savingStage}
        />
      </RecordHeader>

      <div className="grid gap-4 lg:grid-cols-[320px_minmax(0,1fr)] items-start">
        <RecordFields
          title="About"
          fields={[
            {
              label: "Contact",
              value: lead.contact_person ? (
                <div className="leading-tight">
                  <div>{lead.contact_person}</div>
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
                          setNewTitle(lead.contact_title || "");
                          setEditingTitle(false);
                        }}
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    lead.contact_title && (
                      <button
                        className="text-muted-foreground text-sm hover:underline"
                        onClick={() => setEditingTitle(true)}
                      >
                        {lead.contact_title}
                      </button>
                    )
                  )}
                </div>
              ) : "—",
            },
            {
              label: "Email",
              value: lead.email ? (
                <a href={`mailto:${lead.email}`} className="text-primary hover:underline">{lead.email}</a>
              ) : "—",
            },
            {
              label: "Phone",
              value: lead.phone ? (
                <div className="leading-tight space-y-0.5">
                  <div>
                    <a href={`tel:${lead.phone}`} className="text-primary hover:underline">
                      {formatPhoneNumber(lead.phone)}
                    </a>
                    {lead.phone_label && <span className="text-muted-foreground ml-1">({lead.phone_label})</span>}
                  </div>
                  {lead.secondary_phone && (
                    <div>
                      <a href={`tel:${lead.secondary_phone}`} className="text-primary hover:underline">
                        {formatPhoneNumber(lead.secondary_phone)}
                      </a>
                      {lead.secondary_phone_label && (
                        <span className="text-muted-foreground ml-1">({lead.secondary_phone_label})</span>
                      )}
                    </div>
                  )}
                </div>
              ) : "—",
            },
            {
              label: "Address",
              value:
                lead.address || lead.city || lead.state || lead.zip ? (
                  <div className="leading-tight">
                    {lead.address && <div>{lead.address}</div>}
                    <div>{[lead.city, lead.state].filter(Boolean).join(", ")} {lead.zip}</div>
                  </div>
                ) : "—",
            },
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
                  entityType="lead"
                  entityId={lead.id}
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
                  notes={lead.notes || ""}
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
            {
              key: "contacts",
              label: "Contacts",
              count: contactCount,
              content: (
                <CompanyContacts
                  token={token!}
                  entityType="lead"
                  entityId={lead.id}
                  embedded
                  onCount={setContactCount}
                />
              ),
            },
            {
              key: "projects",
              label: "Projects",
              count: projects.length,
              content: projectLoadError ? (
                <p className="p-4 text-sm text-red-600">{projectLoadError}</p>
              ) : (
                <ProjectList
                  projects={projects}
                  empty={
                    <>
                      No projects found for this lead. Create new projects on the{" "}
                      <Link to="/projects" className="text-primary hover:underline">Projects page</Link>.
                    </>
                  }
                />
              ),
            },
          ]}
        />
      </div>

      {showAssignModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded shadow-md max-w-md w-full">
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

            <div className="flex justify-end gap-2">
              <Button
                onClick={() => setShowAssignModal(false)}
                variant="outline"
              >
                Cancel
              </Button>
              <Button
                disabled={!selectedUserId || isAssigning}
                onClick={async () => {
                  setIsAssigning(true);
                  const res = await apiFetch(`/leads/${id}/assign`, {
                    method: "PUT",
                    headers: {
                      "Content-Type": "application/json",
                      Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({ assigned_to: selectedUserId }),
                  });

                  if (res.ok) {
                    toast.success("Lead assigned");
                    setShowAssignModal(false);
                    setSelectedUserId(null);
                    // Reload just this lead so the Owner field updates without a page reload.
                    const updated = await apiFetch(`/leads/${id}`, {
                      headers: { Authorization: `Bearer ${token}` },
                    });
                    if (updated.ok) setLead(await updated.json());
                  } else {
                    toast.error("Couldn't assign this lead. Please try again.");
                  }
                  setIsAssigning(false);
                }}
              >
                {isAssigning ? "Assigning…" : "Assign"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
