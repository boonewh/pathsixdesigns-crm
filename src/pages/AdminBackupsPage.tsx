import { useEffect, useState } from "react";
import { useAuth } from "@/authContext";
import { apiFetch } from "@/lib/api";
import { Backup, BackupRestore } from "@/types";
import {
  Database,
  RefreshCw,
  Clock,
  CheckCircle,
  AlertCircle,
  Upload,
  Trash2,
  HardDrive,
} from "lucide-react";
import toast from "react-hot-toast";

export default function AdminBackupsPage() {
  const { token } = useAuth();

  // State
  const [backups, setBackups] = useState<Backup[]>([]);
  const [restores, setRestores] = useState<BackupRestore[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [creating, setCreating] = useState(false);
  const [selectedBackup, setSelectedBackup] = useState<Backup | null>(null);
  const [showRestoreModal, setShowRestoreModal] = useState(false);
  const [pollingEnabled, setPollingEnabled] = useState(false);

  // Restore modal state
  const [restoreStep, setRestoreStep] = useState(1);
  const [confirmText, setConfirmText] = useState("");
  const [restoring, setRestoring] = useState(false);

  // Fetch backups from API
  const fetchBackups = async () => {
    try {
      const res = await apiFetch("/admin/backups", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        throw new Error("Failed to load backups");
      }

      const data = await res.json();
      setBackups(data.backups || []);

      // Check if any backups are in progress
      const hasInProgress = (data.backups || []).some(
        (b: Backup) => b.status === "in_progress" || b.status === "pending"
      );
      setPollingEnabled(hasInProgress);

      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load backups");
      console.error("Failed to load backups:", err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch restore history from API
  const fetchRestores = async () => {
    try {
      const res = await apiFetch("/admin/backups/restores", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        throw new Error("Failed to load restore history");
      }

      const data = await res.json();
      setRestores(data.restores || []);
    } catch (err) {
      console.error("Failed to load restore history:", err);
    }
  };

  // Load data on mount
  useEffect(() => {
    fetchBackups();
    fetchRestores();
  }, [token]);

  // Auto-polling for in-progress operations
  useEffect(() => {
    if (!pollingEnabled) return;

    const interval = setInterval(() => {
      fetchBackups();
      fetchRestores();
    }, 5000); // Poll every 5 seconds

    return () => clearInterval(interval);
  }, [pollingEnabled]);

  // Auto-enable/disable polling based on in-progress operations
  useEffect(() => {
    const hasInProgress =
      backups.some((b) => b.status === "in_progress" || b.status === "pending") ||
      restores.some((r) => r.status === "in_progress");
    setPollingEnabled(hasInProgress);
  }, [backups, restores]);

  // Create manual backup
  const handleCreateBackup = async () => {
    setCreating(true);
    try {
      const res = await apiFetch("/admin/backups", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!res.ok) {
        throw new Error("Failed to create backup");
      }

      const newBackup = await res.json();
      setBackups((prev) => [newBackup, ...prev]);
      setPollingEnabled(true);

      toast.success("Backup creation started");
    } catch (err) {
      toast.error("Failed to create backup");
    } finally {
      setCreating(false);
    }
  };

  // Delete backup
  const handleDeleteBackup = async (backupId: number) => {
    if (!confirm("Are you sure you want to delete this backup?")) return;

    try {
      const res = await apiFetch(`/admin/backups/${backupId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        throw new Error("Failed to delete backup");
      }

      setBackups((prev) => prev.filter((b) => b.id !== backupId));
      toast.success("Backup deleted");
    } catch (err) {
      toast.error("Failed to delete backup");
    }
  };

  // Initiate restore flow
  const handleRestoreClick = (backup: Backup) => {
    setSelectedBackup(backup);
    setShowRestoreModal(true);
    setRestoreStep(1);
    setConfirmText("");
  };

  // Confirm restore
  const handleConfirmRestore = async () => {
    if (!selectedBackup || confirmText !== "RESTORE") return;

    setRestoring(true);
    try {
      const res = await apiFetch(`/admin/backups/${selectedBackup.id}/restore`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Restore failed");
      }

      toast.success("Restore started successfully");

      // Close modal and refresh data
      setShowRestoreModal(false);
      setSelectedBackup(null);
      setConfirmText("");
      setPollingEnabled(true);

      // Refresh both backups and restores
      await Promise.all([fetchBackups(), fetchRestores()]);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Restore failed");
    } finally {
      setRestoring(false);
    }
  };

  // Close modal
  const closeRestoreModal = () => {
    setShowRestoreModal(false);
    setSelectedBackup(null);
    setRestoreStep(1);
    setConfirmText("");
  };

  // Utility functions
  const formatDateTime = (isoString: string) => {
    return new Date(isoString).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
  };

  // Status badge component
  const StatusBadge = ({ status }: { status: Backup["status"] }) => {
    const config = {
      pending: {
        className: "bg-yellow-100 text-yellow-800",
        icon: <Clock size={14} />,
        label: "Pending",
      },
      in_progress: {
        className: "bg-blue-100 text-blue-800",
        icon: <RefreshCw size={14} className="animate-spin" />,
        label: "In Progress",
      },
      completed: {
        className: "bg-green-100 text-green-800",
        icon: <CheckCircle size={14} />,
        label: "Completed",
      },
      failed: {
        className: "bg-red-100 text-red-800",
        icon: <AlertCircle size={14} />,
        label: "Failed",
      },
    };

    const { className, icon, label } = config[status];

    return (
      <span
        className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full ${className}`}
      >
        {icon}
        {label}
      </span>
    );
  };

  // Type badge component
  const TypeBadge = ({ type }: { type: Backup["type"] }) => {
    const config = {
      manual: { className: "bg-purple-100 text-purple-800", label: "Manual" },
      scheduled: { className: "bg-gray-100 text-gray-800", label: "Scheduled" },
      pre_restore: { className: "bg-yellow-100 text-yellow-800", label: "Safety" },
    };

    const { className, label} = config[type];

    return (
      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${className}`}>
        {label}
      </span>
    );
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-blue-800">Database Backups</h1>
        <button
          onClick={handleCreateBackup}
          disabled={creating}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {creating ? <RefreshCw size={16} className="animate-spin" /> : <HardDrive size={16} />}
          {creating ? "Creating..." : "Create Backup"}
        </button>
      </div>

      {/* Error Display */}
      {error && <p className="text-red-500">{error}</p>}

      {/* Backups Table */}
      <div className="overflow-auto border rounded shadow-sm bg-white">
        <table className="min-w-full table-auto">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">Status</th>
              <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">Filename</th>
              <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">Type</th>
              <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">Created</th>
              <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">Size</th>
              <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                  <RefreshCw className="animate-spin inline mr-2" size={20} />
                  Loading backups...
                </td>
              </tr>
            ) : backups.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                  No backups found. Create your first backup to get started.
                </td>
              </tr>
            ) : (
              backups.map((backup) => (
                <tr key={backup.id} className="border-t hover:bg-gray-50 transition">
                  <td className="px-4 py-2">
                    <StatusBadge status={backup.status} />
                  </td>
                  <td className="px-4 py-2 font-mono text-sm text-gray-700">{backup.filename}</td>
                  <td className="px-4 py-2">
                    <TypeBadge type={backup.type} />
                  </td>
                  <td className="px-4 py-2 text-sm text-gray-600">
                    {formatDateTime(backup.created_at)}
                  </td>
                  <td className="px-4 py-2 text-sm text-gray-600">{formatBytes(backup.size)}</td>
                  <td className="px-4 py-2">
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleRestoreClick(backup)}
                        disabled={backup.status !== "completed"}
                        className="flex items-center gap-1 px-3 py-1 text-sm bg-orange-600 text-white rounded hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Upload size={14} />
                        Restore
                      </button>
                      <button
                        onClick={() => handleDeleteBackup(backup.id)}
                        disabled={backup.status === "in_progress" || backup.status === "pending"}
                        className="flex items-center gap-1 px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Trash2 size={14} />
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Restore History */}
      <details className="border border-gray-300 rounded bg-white shadow-sm">
        <summary className="px-4 py-3 font-semibold cursor-pointer text-blue-700 hover:bg-blue-50 rounded-t flex items-center gap-2">
          <Clock size={20} />
          Restore History ({restores.length})
        </summary>

        <div className="p-4">
          {restores.length === 0 ? (
            <p className="text-gray-500 text-center py-4">No restore operations yet</p>
          ) : (
            <div className="overflow-auto">
              <table className="min-w-full table-auto">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-sm text-gray-700">Status</th>
                    <th className="px-4 py-2 text-left text-sm text-gray-700">Backup File</th>
                    <th className="px-4 py-2 text-left text-sm text-gray-700">Started</th>
                    <th className="px-4 py-2 text-left text-sm text-gray-700">Completed</th>
                    <th className="px-4 py-2 text-left text-sm text-gray-700">Restored By</th>
                    <th className="px-4 py-2 text-left text-sm text-gray-700">Safety Backup</th>
                  </tr>
                </thead>
                <tbody>
                  {restores.map((restore) => (
                    <tr key={restore.id} className="border-t hover:bg-gray-50">
                      <td className="px-4 py-2">
                        <StatusBadge status={restore.status} />
                      </td>
                      <td className="px-4 py-2 font-mono text-xs text-gray-700">
                        {backups.find((b) => b.id === restore.backup_id)?.filename || `Backup #${restore.backup_id}`}
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-600">
                        {formatDateTime(restore.started_at)}
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-600">
                        {restore.completed_at ? formatDateTime(restore.completed_at) : "—"}
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-600">
                        {restore.restored_by || "—"}
                      </td>
                      <td className="px-4 py-2 text-xs">
                        {restore.pre_restore_backup_id ? (
                          <span className="text-green-600 flex items-center gap-1">
                            <CheckCircle size={14} />
                            Created
                          </span>
                        ) : (
                          "—"
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </details>

      {/* Restore Confirmation Modal */}
      {showRestoreModal && selectedBackup && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              {restoreStep === 1 ? (
                <>
                  {/* Step 1: Warning Screen */}
                  <h2 className="text-xl font-bold text-red-600 mb-4 flex items-center gap-2">
                    <AlertCircle size={24} />
                    Confirm Database Restore
                  </h2>

                  <div className="space-y-4 mb-6">
                    <p className="text-gray-700">You are about to restore from backup:</p>

                    <div className="bg-gray-100 p-4 rounded">
                      <p className="text-sm">
                        <strong>Filename:</strong> {selectedBackup.filename}
                      </p>
                      <p className="text-sm">
                        <strong>Created:</strong> {formatDateTime(selectedBackup.created_at)}
                      </p>
                      <p className="text-sm">
                        <strong>Size:</strong> {formatBytes(selectedBackup.size)}
                      </p>
                    </div>

                    <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
                      <p className="font-semibold text-yellow-800 mb-2">Warning:</p>
                      <ul className="list-disc ml-5 text-sm text-yellow-700 space-y-1">
                        <li>All current data will be replaced</li>
                        <li>A safety backup will be created automatically</li>
                        <li>This operation cannot be undone</li>
                        <li>The restore process may take several minutes</li>
                      </ul>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => setRestoreStep(2)}
                      className="px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700"
                    >
                      Continue to Confirmation
                    </button>
                    <button
                      onClick={closeRestoreModal}
                      className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
                    >
                      Cancel
                    </button>
                  </div>
                </>
              ) : (
                <>
                  {/* Step 2: Type "RESTORE" Confirmation */}
                  <h2 className="text-xl font-bold text-red-600 mb-4">Final Confirmation</h2>

                  <div className="space-y-4 mb-6">
                    <p className="text-gray-700 font-medium">
                      To confirm, type{" "}
                      <code className="bg-gray-100 px-2 py-1 rounded font-mono">RESTORE</code> in
                      the box below:
                    </p>

                    <input
                      type="text"
                      value={confirmText}
                      onChange={(e) => setConfirmText(e.target.value)}
                      placeholder="Type RESTORE to confirm"
                      className={`w-full px-3 py-2 border rounded ${
                        confirmText === "RESTORE" ? "border-green-500" : "border-gray-300"
                      }`}
                    />
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={handleConfirmRestore}
                      disabled={confirmText !== "RESTORE" || restoring}
                      className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {restoring ? (
                        <RefreshCw size={16} className="animate-spin" />
                      ) : (
                        <Upload size={16} />
                      )}
                      {restoring ? "Restoring..." : "Restore Database"}
                    </button>
                    <button
                      onClick={closeRestoreModal}
                      className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
                    >
                      Cancel
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
