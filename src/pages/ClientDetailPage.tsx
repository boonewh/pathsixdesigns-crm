import { useEffect, useRef, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useAuth, userHasRole } from "@/authContext";
import { useCRMConfig } from "@/config/crmConfig";
import { Client, Interaction, Account } from "@/types";
import { apiFetch } from "@/lib/api";
import { formatPhoneNumber } from "@/lib/phoneUtils";
import CompanyNotes from "@/components/ui/CompanyNotes";
import CompanyInteractions from "@/components/ui/CompanyInteractions";
import CompanyContacts from "@/components/ui/CompanyContacts";
import CompanySubscriptions from "@/components/ui/CompanySubscriptions";
import { Button } from "@/components/ui/button";
import StatusBadge from "@/components/ui/StatusBadge";
import { RecordHeader, RecordFields, RecordTabs, ProjectList } from "@/components/ui/RecordLayout";

export default function ClientDetailPage() {
  const { id } = useParams();
  const { token, user } = useAuth();
  const config = useCRMConfig();

  const [client, setClient] = useState<Client | null>(null);
  const [interactions, setInteractions] = useState<Interaction[]>([]);
  const [_accounts, setAccounts] = useState<Account[]>([]);
  const menuRef = useRef<HTMLDivElement>(null);
  const [loadError, setLoadError] = useState("");

  const [showAssignModal, setShowAssignModal] = useState(false);
  const [availableUsers, setAvailableUsers] = useState<{ id: number; email: string }[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);

  const [editingTitle, setEditingTitle] = useState(false);
  const [newTitle, setNewTitle] = useState(client?.contact_title || "");

  const [projects, setProjects] = useState<any[]>([]);

  const [isAssigning, setIsAssigning] = useState(false);
  const [interactionCount, setInteractionCount] = useState<number | undefined>(undefined);
  const [contactCount, setContactCount] = useState<number | undefined>(undefined);
  const [subscriptionCount, setSubscriptionCount] = useState<number | undefined>(undefined);

  useEffect(() => {
    const loadClient = async () => {
      try {
        const res = await apiFetch(`/clients/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error(`${config.labels.client} not found`);
        const data = await res.json();
        setClient(data);
        setNewTitle(data.contact_title || "");
        setAccounts(data.accounts || []);
      } catch (err: any) {
        setLoadError(err.message || `Failed to load ${config.labels.client.toLowerCase()}`);
      }
    };

    const loadInteractions = async () => {
      try {
        const res = await apiFetch(`/interactions/?client_id=${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        setInteractions(data);
      } catch {
        // Optional: handle interaction error here too
      }
    };

    loadClient();
    loadInteractions();

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
  }, [id, token, config.labels.client]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        // Future menu behavior
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    apiFetch(`/projects/by-client/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then(setProjects)
      .catch(() => setProjects([]));
  }, [id, token]);

  const saveTitle = async () => {
    const res = await apiFetch(`/clients/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ contact_title: newTitle }),
    });
    if (res.ok) {
      setClient((prev) => prev && { ...prev, contact_title: newTitle });
      setEditingTitle(false);
    } else {
      alert("Failed to update title.");
    }
  };

  if (loadError) return <p className="p-6 text-red-600">{loadError}</p>;
  if (!client) return <p className="p-6">Loading...</p>;

  const clientStatusColors: Record<string, string> = {
    new: "bg-blue-100 text-blue-800",
    prospect: "bg-yellow-100 text-yellow-800",
    active: "bg-green-100 text-green-800",
    inactive: "bg-gray-100 text-gray-800",
  };
  const origin = client.lead_origin;

  return (
    <>
      <div className="p-4 lg:p-6 space-y-4">
        <div className="text-xs text-muted-foreground">
          <Link to="/clients" className="hover:underline">{config.labels.client}s</Link> / {client.name}
        </div>

        <RecordHeader
          eyebrow={config.labels.client}
          title={client.name}
          actions={
            userHasRole(user, "admin") ? (
              <Button variant="outline" onClick={() => setShowAssignModal(true)}>
                Assign {config.labels.client}
              </Button>
            ) : undefined
          }
          fields={[
            {
              label: "Status",
              value: client.status ? (
                <StatusBadge status={client.status} colorClass={clientStatusColors[client.status]} />
              ) : "—",
            },
            { label: "Type", value: client.type || "None" },
            { label: "Lead source", value: origin?.lead_source || "—" },
            { label: "Converted", value: origin?.converted_on ? new Date(origin.converted_on).toLocaleDateString() : "—" },
            { label: "Created", value: client.created_at ? new Date(client.created_at).toLocaleDateString() : "—" },
          ]}
        />

        <div className="grid gap-4 lg:grid-cols-[320px_minmax(0,1fr)] items-start">
          <RecordFields
            title="About"
            fields={[
              {
                label: "Contact",
                value: client.contact_person ? (
                  <div className="leading-tight">
                    <div>{client.contact_person}</div>
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
                            setNewTitle(client.contact_title || "");
                            setEditingTitle(false);
                          }}
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      client.contact_title && (
                        <button
                          className="text-muted-foreground text-sm hover:underline"
                          onClick={() => setEditingTitle(true)}
                        >
                          {client.contact_title}
                        </button>
                      )
                    )}
                  </div>
                ) : "—",
              },
              {
                label: "Email",
                value: client.email ? (
                  <a href={`mailto:${client.email}`} className="text-primary hover:underline">{client.email}</a>
                ) : "—",
              },
              {
                label: "Phone",
                value: client.phone ? (
                  <div className="leading-tight space-y-0.5">
                    <div>
                      <a href={`tel:${client.phone}`} className="text-primary hover:underline">
                        {formatPhoneNumber(client.phone)}
                      </a>
                      {client.phone_label && <span className="text-muted-foreground ml-1">({client.phone_label})</span>}
                    </div>
                    {client.secondary_phone && (
                      <div>
                        <a href={`tel:${client.secondary_phone}`} className="text-primary hover:underline">
                          {formatPhoneNumber(client.secondary_phone)}
                        </a>
                        {client.secondary_phone_label && (
                          <span className="text-muted-foreground ml-1">({client.secondary_phone_label})</span>
                        )}
                      </div>
                    )}
                  </div>
                ) : "—",
              },
              {
                label: "Address",
                value:
                  client.address || client.city || client.state || client.zip ? (
                    <div className="leading-tight">
                      {client.address && <div>{client.address}</div>}
                      <div>{[client.city, client.state].filter(Boolean).join(", ")} {client.zip}</div>
                    </div>
                  ) : "—",
              },
              ...(origin?.days_in_pipeline != null
                ? [{ label: "In pipeline", value: `${origin.days_in_pipeline} days before converting` }]
                : []),
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
                    entityType="client"
                    entityId={client.id}
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
                    notes={client.notes || ""}
                    onSave={async (newNotes) => {
                      const res = await apiFetch(`/clients/${id}`, {
                        method: "PUT",
                        headers: { Authorization: `Bearer ${token}` },
                        body: JSON.stringify({ notes: newNotes }),
                      });
                      if (res.ok) {
                        setClient((prev) => prev && { ...prev, notes: newNotes });
                      } else {
                        alert("Failed to save notes.");
                      }
                    }}
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
                    entityType="client"
                    entityId={client.id}
                    embedded
                    onCount={setContactCount}
                  />
                ),
              },
              ...(config.features.enableSubscriptions
                ? [{
                    key: "subscriptions",
                    label: "Subscriptions",
                    count: subscriptionCount,
                    content: (
                      <CompanySubscriptions
                        token={token!}
                        clientId={client.id}
                        embedded
                        onCount={setSubscriptionCount}
                      />
                    ),
                  }]
                : []),
              {
                key: "projects",
                label: "Projects",
                count: projects.length,
                content: (
                  <ProjectList
                    projects={projects}
                    empty={
                      <>
                        No projects found for this {config.labels.client.toLowerCase()}. Create new projects on the{" "}
                        <Link to="/projects" className="text-primary hover:underline">Projects page</Link>.
                      </>
                    }
                  />
                ),
              },
            ]}
          />
        </div>
      </div>

      {showAssignModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded shadow-md max-w-md w-full">
            <h2 className="text-lg font-semibold mb-4">Assign {config.labels.client}</h2>

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
                  const res = await apiFetch(`/clients/${id}/assign`, {
                    method: "PUT",
                    headers: {
                      "Content-Type": "application/json",
                      Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({ assigned_to: selectedUserId }),
                  });

                  if (res.ok) {
                    setShowAssignModal(false);
                    window.location.reload();
                  } else {
                    alert(`Failed to assign ${config.labels.client.toLowerCase()}.`);
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
    </>
  );
}
