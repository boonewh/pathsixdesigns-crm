import { useRef, useState } from "react";
import { Dialog, DialogPanel, DialogTitle, Description } from "@headlessui/react";
import { useNavigate } from "react-router-dom";
import { apiFetch } from "@/lib/api";
import { Button } from "@/components/ui/button";

export type PurgeResource = "clients" | "leads" | "projects";
export type PurgeItem = { id: number; name: string };
type BlockedItem = PurgeItem & { dependencies: { kind: string; count: number }[] };
const labels = { clients: "accounts", leads: "leads", projects: "projects" };

export default function PurgeDialog({ resource, items, onClose, onDeleted, onRefresh }: {
  resource: PurgeResource;
  items: PurgeItem[];
  onClose: () => void;
  onDeleted: (ids: number[]) => void;
  onRefresh: () => Promise<void>;
}) {
  const navigate = useNavigate();
  const cancelRef = useRef<HTMLButtonElement>(null);
  const inFlight = useRef(false);
  const [busy, setBusy] = useState(false);
  const [phase, setPhase] = useState<"confirm" | "blocked" | "error">("confirm");
  const [message, setMessage] = useState("");
  const [blocked, setBlocked] = useState<BlockedItem[]>([]);

  async function remove() {
    if (inFlight.current) return;
    inFlight.current = true;
    setBusy(true);
    try {
      const response = await apiFetch(`/${resource}/bulk-purge`, {
        method: "POST",
        body: JSON.stringify({ [`${resource.slice(0, -1)}_ids`]: items.map(item => item.id) }),
      }, { showErrorToast: false });
      const data = await response.json().catch(() => null);
      if (response.ok) {
        // Older servers do not return IDs. Refresh instead of assuming every
        // selected record was eligible and removing it from the screen.
        if (Array.isArray(data?.deleted_ids) && data.deleted_ids.every((id: unknown) =>
          typeof id === "number" && items.some(item => item.id === id))) {
          onDeleted(data.deleted_ids);
        } else {
          await onRefresh();
        }
        onClose();
      } else if (response.status === 409) {
        const details: BlockedItem[] = Array.isArray(data?.blocked) ? data.blocked.filter(
          (item: BlockedItem) => item && items.some(selected => selected.id === item.id) &&
            typeof item.name === "string" && Array.isArray(item.dependencies) &&
            item.dependencies.every(dependency => dependency && typeof dependency.kind === "string" &&
              Number.isInteger(dependency.count) && dependency.count > 0)
        ) : [];
        setBlocked(details);
        setMessage(data?.code === "purge_blocked" && typeof data.error === "string"
          ? data.error : "Linked records prevent permanent deletion. No selected records were deleted.");
        setPhase("blocked");
      } else {
        setMessage(response.status === 403 ? "You need administrator access to permanently delete these records."
          : response.status === 401 ? "Your session has expired. Sign in again before continuing."
          : "We couldn’t complete permanent deletion. Refresh Trash to check the current records before trying again.");
        setPhase("error");
      }
    } catch {
      setMessage("We couldn’t confirm whether deletion finished. Refresh Trash before trying again.");
      setPhase("error");
    } finally {
      inFlight.current = false;
      setBusy(false);
    }
  }

  async function restoreAndReview(item: PurgeItem) {
    if (inFlight.current) return;
    inFlight.current = true;
    setBusy(true);
    try {
      const response = await apiFetch(`/${resource}/${item.id}/restore`, { method: "PUT" }, { showErrorToast: false });
      if (!response.ok) {
        setMessage("This record couldn’t be restored. Refresh Trash to check its status and your access.");
        return;
      }
      navigate(`/${resource}/${item.id}`);
    } catch {
      setMessage("We couldn’t confirm whether restoration finished. Refresh Trash before trying again.");
    } finally {
      inFlight.current = false;
      setBusy(false);
    }
  }

  async function refresh() {
    if (inFlight.current) return;
    inFlight.current = true;
    setBusy(true);
    try { await onRefresh(); onClose(); }
    catch { setMessage("Trash couldn’t be refreshed. Please check your connection and try again."); }
    finally { inFlight.current = false; setBusy(false); }
  }

  return (
    <Dialog open onClose={() => { if (!inFlight.current) onClose(); }} initialFocus={cancelRef} className="relative z-50">
      <div className="fixed inset-0 bg-black/50" aria-hidden="true" />
      <div className="fixed inset-0 overflow-y-auto p-4 sm:p-8">
        <div className="flex min-h-full items-center justify-center">
          <DialogPanel className="w-full max-w-xl rounded-xl bg-white p-5 text-gray-900 shadow-xl sm:p-6">
            <DialogTitle className="text-xl font-semibold">
              {phase === "confirm" ? `Permanently delete ${items.length} ${items.length === 1 ? labels[resource].slice(0, -1) : labels[resource]}?`
                : phase === "blocked" ? "Linked records prevent deletion" : "Deletion needs attention"}
            </DialogTitle>
            <Description className="mt-2 text-sm text-gray-600">
              {phase === "confirm" ? "This cannot be undone. Linked records will be preserved. If any selected item has linked records, the entire selection stays in Trash."
                : "You can keep records in Trash or restore an affected record to review its links."}
            </Description>
            {message && <p role="alert" className="mt-4 rounded-lg bg-amber-50 p-3 text-sm text-amber-950">{message}</p>}
            <ul className="mt-4 max-h-64 space-y-3 overflow-y-auto" aria-label="Selected records">
              {(phase === "blocked" && blocked.length ? blocked : items).map(item => (
                <li key={item.id} className="rounded-lg border border-gray-200 p-3">
                  <p className="break-words font-medium">{item.name}</p>
                  {phase === "blocked" && "dependencies" in item && (
                    <ul className="mt-1 text-sm text-gray-600">
                      {(item as BlockedItem).dependencies.map(dependency => (
                        <li key={dependency.kind}>{dependency.count} linked {dependency.count === 1 ? dependency.kind.replace(/s$/, "") : dependency.kind}</li>
                      ))}
                    </ul>
                  )}
                  {phase === "blocked" && <Button variant="outline" size="sm" className="mt-3" disabled={busy}
                    onClick={() => restoreAndReview(item)} aria-label={`Restore and review ${item.name}`}>Restore and review</Button>}
                </li>
              ))}
            </ul>
            {phase === "blocked" && <p className="mt-4 text-sm text-gray-600">
              Restoring makes the record active again. Review its linked records, including any in Trash, before deciding what to keep, reassign, or remove. For links you cannot access, ask an administrator for help.
            </p>}
            <div className="mt-6 flex flex-wrap justify-end gap-2">
              <Button ref={cancelRef} variant={phase === "blocked" ? "default" : "outline"} disabled={busy} onClick={onClose}>
                {phase === "error" ? "Close" : "Keep in Trash"}
              </Button>
              {phase === "confirm" ? <Button variant="destructive" disabled={busy} onClick={remove}>
                {busy ? "Deleting…" : "Delete permanently"}
              </Button> : <Button variant="outline" disabled={busy} onClick={refresh}>Refresh Trash</Button>}
            </div>
            {busy && <p role="status" className="mt-3 text-sm text-gray-600">Please wait…</p>}
          </DialogPanel>
        </div>
      </div>
    </Dialog>
  );
}
