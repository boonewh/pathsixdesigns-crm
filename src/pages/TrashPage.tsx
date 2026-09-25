import { useCRMConfig } from "@/config/crmConfig";
import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/authContext";
import { formatDistanceToNow } from "date-fns";
import { Button } from "@/components/ui/button";
import PurgeDialog, { type PurgeResource, type PurgeItem } from "@/components/PurgeDialog";

interface TrashItem {
  id: number;
  name: string;
  deleted_at: string;
  deleted_by: number | null;
}

export default function TrashPage() {
  const config = useCRMConfig();
  const { token } = useAuth();
  const [clients, setClients] = useState<TrashItem[]>([]);
  const [leads, setLeads] = useState<TrashItem[]>([]);
  const [projects, setProjects] = useState<TrashItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [purge, setPurge] = useState<{ resource: PurgeResource; items: PurgeItem[] } | null>(null);

  // selections
  const [selectedClientIds, setSelectedClientIds] = useState<Set<number>>(new Set());
  const [selectedLeadIds, setSelectedLeadIds] = useState<number[]>([]);
  const [selectedProjectIds, setSelectedProjectIds] = useState<number[]>([]);

  // --- client selection helpers ---
  const toggleClient = (id: number) =>
    setSelectedClientIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  const toggleAllClients = () =>
    setSelectedClientIds(prev => (prev.size === clients.length ? new Set() : new Set(clients.map(c => c.id))));

  // --- lead selection helpers ---
  const toggleLeadSelection = (id: number) =>
    setSelectedLeadIds(prev => (prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]));
  const toggleAllLeads = () =>
    setSelectedLeadIds(prev => (prev.length === leads.length ? [] : leads.map(l => l.id)));
  const clearLeadSelection = () => setSelectedLeadIds([]);

  // --- project selection helpers ---
  const toggleProjectSelection = (id: number) =>
    setSelectedProjectIds(prev => (prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]));
  const toggleAllProjects = () =>
    setSelectedProjectIds(prev => (prev.length === projects.length ? [] : projects.map(p => p.id)));
  const clearProjectSelection = () => setSelectedProjectIds([]);

  // Capture the selection while the confirmation dialog is open.
  function openPurge(resource: PurgeResource, ids: number[]) {
    const rows = resource === "clients" ? clients : resource === "leads" ? leads : projects;
    const items = rows.filter(item => ids.includes(item.id));
    if (items.length) { setNotice(""); setPurge({ resource, items }); }
  }
  const bulkPurgeClients = () => openPurge("clients", Array.from(selectedClientIds));
  const handleBulkPurgeLeads = () => openPurge("leads", selectedLeadIds);
  const handleBulkPurgeProjects = () => openPurge("projects", selectedProjectIds);

  function completePurge(ids: number[]) {
    if (!purge) return;
    if (purge.resource === "clients") {
      setClients(rows => rows.filter(row => !ids.includes(row.id)));
      setSelectedClientIds(selected => new Set([...selected].filter(id => !ids.includes(id))));
    } else if (purge.resource === "leads") {
      setLeads(rows => rows.filter(row => !ids.includes(row.id)));
      setSelectedLeadIds(selected => selected.filter(id => !ids.includes(id)));
    } else {
      setProjects(rows => rows.filter(row => !ids.includes(row.id)));
      setSelectedProjectIds(selected => selected.filter(id => !ids.includes(id)));
    }
    setNotice(ids.length ? `${ids.length} record(s) permanently deleted.`
      : "No selected records were eligible for deletion. Refresh Trash to see the current list.");
  }

  // --- fetch ---
  const fetchTrash = async () => {
    setLoading(true);
    setError("");
    try {
      const [clientRes, leadRes, projectRes] = await Promise.all([
        apiFetch("/clients/trash", { headers: { Authorization: `Bearer ${token}` } }),
        apiFetch("/leads/trash", { headers: { Authorization: `Bearer ${token}` } }),
        apiFetch("/projects/trash", { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      if (![clientRes, leadRes, projectRes].every(response => response.ok)) {
        throw new Error("Trash request failed");
      }
      const rows = await Promise.all([clientRes.json(), leadRes.json(), projectRes.json()]);
      if (!rows.every(Array.isArray)) throw new Error("Invalid Trash response");
      setClients(rows[0]); setLeads(rows[1]); setProjects(rows[2]);
      setSelectedClientIds(selected => new Set([...selected].filter(id => rows[0].some((item: TrashItem) => item.id === id))));
      setSelectedLeadIds(selected => selected.filter(id => rows[1].some((item: TrashItem) => item.id === id)));
      setSelectedProjectIds(selected => selected.filter(id => rows[2].some((item: TrashItem) => item.id === id)));
    } catch (cause) {
      setError("Trash couldn’t be refreshed. The displayed records may be out of date.");
      throw cause;
    } finally {
      setLoading(false);
    }
  };

  // --- item actions ---
  const handleRestore = async (type: "client" | "lead" | "project", id: number) => {
    const res = await apiFetch(`/${type}s/${id}/restore`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return alert("Failed to restore.");
    if (type === "client") setClients(prev => prev.filter(c => c.id !== id));
    else if (type === "lead") setLeads(prev => prev.filter(l => l.id !== id));
    else setProjects(prev => prev.filter(p => p.id !== id));
  };

  const handlePurge = (type: "client" | "lead" | "project", id: number) => {
    openPurge(`${type}s` as PurgeResource, [id]);
  };

  useEffect(() => {
    void fetchTrash().catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  // --- shared pieces (keep desktop intact) ---

  // Desktop table col sizing (md+ only)
  const ColGroup = () => (
    <colgroup>
      <col className="w-11" /> {/* checkbox */}
      <col /> {/* name */}
      <col className="w-56" /> {/* deleted */}
      <col className="w-72" /> {/* actions */}
    </colgroup>
  );

  const TableHeader = ({
    allChecked,
    onToggleAll,
    aria,
  }: {
    allChecked: boolean;
    onToggleAll: () => void;
    aria: string;
  }) => (
    <thead className="bg-gray-100 text-left">
      <tr>
        <th className="p-2 w-11">
          <input type="checkbox" aria-label={aria} checked={allChecked} onChange={onToggleAll} />
        </th>
        <th className="p-2">Name</th>
        <th className="p-2">Deleted</th>
        <th className="p-2">Actions</th>
      </tr>
    </thead>
  );

  // Mobile row (â‰¤ md-1)
  function MobileRow({
    item,
    checked,
    onToggle,
    onRestore,
    onPurge,
    ariaPrefix,
  }: {
    item: TrashItem;
    checked: boolean;
    onToggle: () => void;
    onRestore: () => void;
    onPurge: () => void;
    ariaPrefix: string;
  }) {
    return (
      <li className="rounded-xl border p-3 flex flex-col gap-3">
        <div className="flex items-start gap-3">
          <input
            type="checkbox"
            className="mt-1"
            aria-label={`${ariaPrefix} ${item.name}`}
            checked={checked}
            onChange={onToggle}
          />
          <div className="min-w-0">
            <div className="font-medium truncate">{item.name}</div>
            <div className="text-xs text-gray-500">
              Deleted {formatDistanceToNow(new Date(item.deleted_at), { addSuffix: true })}
            </div>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <Button size="sm" onClick={onRestore} className="w-full sm:w-auto">Restore</Button>
          <Button size="sm" variant="destructive" onClick={onPurge} className="w-full sm:w-auto">
            Delete Permanently
          </Button>
        </div>
      </li>
    );
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Trash</h1>

      {notice && <p role="status" className="mb-4 text-green-700">{notice}</p>}
      {error && <div role="alert" className="mb-4 text-red-700">{error}
        <Button variant="outline" className="ml-2" onClick={() => { void fetchTrash().catch(() => {}); }}>Refresh Trash</Button>
      </div>}
      {purge && <PurgeDialog resource={purge.resource} items={purge.items}
        onClose={() => setPurge(null)} onDeleted={completePurge} onRefresh={fetchTrash} />}
      {loading ? (
        <p>Loading deleted items...</p>
      ) : (
        <div className="space-y-10">
          {/* Clients */}
          <section>
            <h2 className="text-xl font-semibold mb-2">Deleted {config.labels.client}s</h2>

            {selectedClientIds.size > 0 && (
              <div className="mb-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
                <Button size="sm" variant="destructive" onClick={bulkPurgeClients}>
                  Delete Selected ({selectedClientIds.size})
                </Button>
                <Button size="sm" variant="secondary" onClick={() => setSelectedClientIds(new Set())}>
                  Clear selection
                </Button>
                {/* Mobile convenience: select all */}
                {clients.length > 0 && (
                  <Button size="sm" variant="outline" onClick={toggleAllClients} className="sm:ml-auto">
                    {selectedClientIds.size === clients.length ? "Unselect All" : "Select All"}
                  </Button>
                )}
              </div>
            )}

            {clients.length === 0 ? (
              <p className="text-gray-500">No deleted {config.labels.client.toLowerCase()}s.</p>
            ) : (
              <>
                {/* Mobile list */}
                <ul className="md:hidden grid gap-3">
                  {clients.map(client => (
                    <MobileRow
                      key={client.id}
                      item={client}
                      checked={selectedClientIds.has(client.id)}
                      onToggle={() => toggleClient(client.id)}
                      onRestore={() => handleRestore("client", client.id)}
                      onPurge={() => handlePurge("client", client.id)}
                      ariaPrefix={`Select ${config.labels.client.toLowerCase()}`}
                    />
                  ))}
                </ul>

                {/* Desktop table (unchanged layout) */}
                <table className="hidden md:table w-full text-sm border table-fixed">
                  <ColGroup />
                  <TableHeader
                    allChecked={clients.length > 0 && selectedClientIds.size === clients.length}
                    onToggleAll={toggleAllClients}
                    aria={`Select all ${config.labels.client.toLowerCase()}s`}
                  />
                  <tbody>
                    {clients.map(client => (
                      <tr key={client.id} className="border-t">
                        <td className="p-2 w-11">
                          <input
                            type="checkbox"
                            checked={selectedClientIds.has(client.id)}
                            onChange={() => toggleClient(client.id)}
                            aria-label={`Select ${client.name}`}
                          />
                        </td>
                        <td className="p-2 min-w-0">
                          <span className="block truncate">{client.name}</span>
                        </td>
                        <td className="p-2 text-gray-500 whitespace-nowrap">
                          {formatDistanceToNow(new Date(client.deleted_at), { addSuffix: true })}
                        </td>
                        <td className="p-2">
                          <div className="flex flex-wrap gap-2 whitespace-nowrap">
                            <Button size="sm" onClick={() => handleRestore("client", client.id)}>Restore</Button>
                            <Button size="sm" variant="destructive" onClick={() => handlePurge("client", client.id)}>
                              Delete Permanently
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </>
            )}
          </section>

          {/* Leads */}
          <section>
            <h2 className="text-xl font-semibold mb-2">Deleted Leads</h2>

            {selectedLeadIds.length > 0 && (
              <div className="mb-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
                <Button size="sm" variant="destructive" onClick={handleBulkPurgeLeads}>
                  Delete Selected ({selectedLeadIds.length})
                </Button>
                <Button size="sm" variant="secondary" onClick={clearLeadSelection}>
                  Clear selection
                </Button>
                {leads.length > 0 && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={toggleAllLeads}
                    className="sm:ml-auto"
                  >
                    {selectedLeadIds.length === leads.length ? "Unselect All" : "Select All"}
                  </Button>
                )}
              </div>
            )}

            {leads.length === 0 ? (
              <p className="text-gray-500">No deleted leads.</p>
            ) : (
              <>
                {/* Mobile list */}
                <ul className="md:hidden grid gap-3">
                  {leads.map(lead => (
                    <MobileRow
                      key={lead.id}
                      item={lead}
                      checked={selectedLeadIds.includes(lead.id)}
                      onToggle={() => toggleLeadSelection(lead.id)}
                      onRestore={() => handleRestore("lead", lead.id)}
                      onPurge={() => handlePurge("lead", lead.id)}
                      ariaPrefix="Select lead"
                    />
                  ))}
                </ul>

                {/* Desktop table */}
                <table className="hidden md:table w-full text-sm border table-fixed">
                  <ColGroup />
                  <TableHeader
                    allChecked={leads.length > 0 && selectedLeadIds.length === leads.length}
                    onToggleAll={toggleAllLeads}
                    aria="Select all leads"
                  />
                  <tbody>
                    {leads.map(lead => (
                      <tr key={lead.id} className="border-t">
                        <td className="p-2 w-11">
                          <input
                            type="checkbox"
                            aria-label={`Select ${lead.name}`}
                            checked={selectedLeadIds.includes(lead.id)}
                            onChange={() => toggleLeadSelection(lead.id)}
                          />
                        </td>
                        <td className="p-2 min-w-0">
                          <span className="block truncate">{lead.name}</span>
                        </td>
                        <td className="p-2 text-gray-500 whitespace-nowrap">
                          {formatDistanceToNow(new Date(lead.deleted_at), { addSuffix: true })}
                        </td>
                        <td className="p-2">
                          <div className="flex flex-wrap gap-2 whitespace-nowrap">
                            <Button size="sm" onClick={() => handleRestore("lead", lead.id)}>Restore</Button>
                            <Button size="sm" variant="destructive" onClick={() => handlePurge("lead", lead.id)}>
                              Delete Permanently
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </>
            )}
          </section>

          {/* Projects */}
          <section>
            <h2 className="text-xl font-semibold mb-2">Deleted Projects</h2>

            {selectedProjectIds.length > 0 && (
              <div className="mb-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
                <Button size="sm" variant="destructive" onClick={handleBulkPurgeProjects}>
                  Delete Selected ({selectedProjectIds.length})
                </Button>
                <Button size="sm" variant="secondary" onClick={clearProjectSelection}>
                  Clear selection
                </Button>
                {projects.length > 0 && (
                  <Button size="sm" variant="outline" onClick={toggleAllProjects} className="sm:ml-auto">
                    {selectedProjectIds.length === projects.length ? "Unselect All" : "Select All"}
                  </Button>
                )}
              </div>
            )}

            {projects.length === 0 ? (
              <p className="text-gray-500">No deleted projects.</p>
            ) : (
              <>
                {/* Mobile list */}
                <ul className="md:hidden grid gap-3">
                  {projects.map(project => (
                    <MobileRow
                      key={project.id}
                      item={project}
                      checked={selectedProjectIds.includes(project.id)}
                      onToggle={() => toggleProjectSelection(project.id)}
                      onRestore={() => handleRestore("project", project.id)}
                      onPurge={() => handlePurge("project", project.id)}
                      ariaPrefix="Select project"
                    />
                  ))}
                </ul>

                {/* Desktop table */}
                <table className="hidden md:table w-full text-sm border table-fixed">
                  <ColGroup />
                  <TableHeader
                    allChecked={projects.length > 0 && selectedProjectIds.length === projects.length}
                    onToggleAll={toggleAllProjects}
                    aria="Select all projects"
                  />
                  <tbody>
                    {projects.map(project => (
                      <tr key={project.id} className="border-t">
                        <td className="p-2 w-11">
                          <input
                            type="checkbox"
                            aria-label={`Select ${project.name}`}
                            checked={selectedProjectIds.includes(project.id)}
                            onChange={() => toggleProjectSelection(project.id)}
                          />
                        </td>
                        <td className="p-2 min-w-0">
                          <span className="block truncate">{project.name}</span>
                        </td>
                        <td className="p-2 text-gray-500 whitespace-nowrap">
                          {formatDistanceToNow(new Date(project.deleted_at), { addSuffix: true })}
                        </td>
                        <td className="p-2">
                          <div className="flex flex-wrap gap-2 whitespace-nowrap">
                            <Button size="sm" onClick={() => handleRestore("project", project.id)}>Restore</Button>
                            <Button size="sm" variant="destructive" onClick={() => handlePurge("project", project.id)}>
                              Delete Permanently
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
