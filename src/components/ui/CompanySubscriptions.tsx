import { useEffect, useState } from "react";
import { CreditCard, MoreVertical, RefreshCw } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { apiFetch } from "@/lib/api";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  subscriptionCreateSchema,
  subscriptionUpdateSchema,
  type SubscriptionCreateInput,
  type Subscription,
} from "@/schemas/subscriptionSchemas";

type Props = {
  token: string;
  clientId: number;
};

function statusBadge(status: string) {
  const base = "text-xs font-semibold px-2 py-0.5 rounded-full";
  if (status === "active") return `${base} bg-green-100 text-green-700`;
  if (status === "paused") return `${base} bg-yellow-100 text-yellow-700`;
  return `${base} bg-red-100 text-red-700`;
}

function cycleBadge(cycle: string) {
  const base = "text-xs px-2 py-0.5 rounded-full border";
  return cycle === "yearly"
    ? `${base} border-blue-300 text-blue-700 bg-blue-50`
    : `${base} border-gray-300 text-gray-600 bg-gray-50`;
}

function daysUntil(dateStr: string | null): number | null {
  if (!dateStr) return null;
  const diff = new Date(dateStr).getTime() - Date.now();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString();
}

export default function CompanySubscriptions({ token, clientId }: Props) {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);
  const [saveError, setSaveError] = useState("");

  const schema = editingId ? subscriptionUpdateSchema : subscriptionCreateSchema;

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<SubscriptionCreateInput>({
    resolver: zodResolver(schema) as Resolver<SubscriptionCreateInput>,
    defaultValues: {
      plan_name: "",
      price: undefined,
      billing_cycle: "monthly",
      start_date: "",
      renewal_date: "",
      status: "active",
      notes: "",
    },
  });

  const loadSubscriptions = async () => {
    try {
      const res = await apiFetch(`/subscriptions/?client_id=${clientId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setSubscriptions(data.subscriptions ?? []);
    } catch {
      setSubscriptions([]);
    }
  };

  useEffect(() => {
    loadSubscriptions();
  }, [clientId]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const menu = document.getElementById("sub-kabob-menu");
      if (menu && !menu.contains(e.target as Node)) {
        setOpenMenuId(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const resetForm = () => {
    reset({
      plan_name: "",
      price: undefined,
      billing_cycle: "monthly",
      start_date: "",
      renewal_date: "",
      status: "active",
      notes: "",
    });
    setEditingId(null);
    setShowForm(false);
    setSaveError("");
  };

  const handleSave = async (data: SubscriptionCreateInput) => {
    setSaveError("");
    const url = editingId ? `/subscriptions/${editingId}` : "/subscriptions/";
    const method = editingId ? "PUT" : "POST";

    const payload = editingId
      ? data
      : { ...data, client_id: clientId };

    const res = await apiFetch(url, {
      method,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      await loadSubscriptions();
      resetForm();
    } else {
      const err = await res.json().catch(() => ({}));
      setSaveError(err?.error || "Failed to save subscription.");
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this subscription?")) return;
    const res = await apiFetch(`/subscriptions/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) {
      await loadSubscriptions();
    } else {
      alert("Failed to delete subscription.");
    }
  };

  const handleRenew = async (id: number) => {
    const res = await apiFetch(`/subscriptions/${id}/renew`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) {
      await loadSubscriptions();
    } else {
      alert("Failed to renew subscription.");
    }
  };

  const activeCount = subscriptions.filter((s) => s.status === "active").length;

  return (
    <details className="bg-white rounded shadow-sm border">
      <summary className="cursor-pointer px-4 py-2 font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-t flex items-center gap-2">
        <CreditCard size={16} /> Subscriptions ({activeCount} active
        {subscriptions.length !== activeCount ? `, ${subscriptions.length} total` : ""})
      </summary>

      <div className="p-4 space-y-4">
        {showForm && (
          <form onSubmit={handleSubmit(handleSave)} className="space-y-3 border rounded p-4 bg-gray-50">
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className="text-xs text-gray-600 font-medium">Plan / Service Name</label>
                <Input
                  placeholder="e.g. Website Hosting, Monthly Support"
                  {...register("plan_name")}
                  className={errors.plan_name ? "border-red-500" : ""}
                />
                {errors.plan_name && (
                  <p className="text-xs text-red-500 mt-1">{errors.plan_name.message}</p>
                )}
              </div>

              <div>
                <label className="text-xs text-gray-600 font-medium">Price</label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  {...register("price")}
                  className={errors.price ? "border-red-500" : ""}
                />
                {errors.price && (
                  <p className="text-xs text-red-500 mt-1">{errors.price.message}</p>
                )}
              </div>

              <div>
                <label className="text-xs text-gray-600 font-medium">Billing Cycle</label>
                <select
                  {...register("billing_cycle")}
                  className={`w-full border border-input bg-background text-sm rounded-md px-2 py-2 ${
                    errors.billing_cycle ? "border-red-500" : ""
                  }`}
                >
                  <option value="monthly">Monthly</option>
                  <option value="yearly">Yearly</option>
                </select>
                {errors.billing_cycle && (
                  <p className="text-xs text-red-500 mt-1">{errors.billing_cycle.message}</p>
                )}
              </div>

              <div>
                <label className="text-xs text-gray-600 font-medium">Start Date</label>
                <Input
                  type="date"
                  {...register("start_date")}
                  className={errors.start_date ? "border-red-500" : ""}
                />
                {errors.start_date && (
                  <p className="text-xs text-red-500 mt-1">{errors.start_date.message}</p>
                )}
              </div>

              <div>
                <label className="text-xs text-gray-600 font-medium">
                  Next Renewal Date{" "}
                  <span className="text-gray-400 font-normal">(auto-set if blank)</span>
                </label>
                <Input
                  type="date"
                  {...register("renewal_date")}
                  className={errors.renewal_date ? "border-red-500" : ""}
                />
              </div>

              <div>
                <label className="text-xs text-gray-600 font-medium">Status</label>
                <select
                  {...register("status")}
                  className="w-full border border-input bg-background text-sm rounded-md px-2 py-2"
                >
                  <option value="active">Active</option>
                  <option value="paused">Paused</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>

              <div className="col-span-2">
                <label className="text-xs text-gray-600 font-medium">Notes</label>
                <Textarea
                  placeholder="Optional notes about this subscription"
                  {...register("notes")}
                  className={errors.notes ? "border-red-500" : ""}
                />
              </div>
            </div>

            {saveError && <p className="text-sm text-red-600">{saveError}</p>}

            <div className="flex gap-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700 disabled:opacity-50"
              >
                {isSubmitting ? "Saving…" : editingId ? "Update" : "Add Subscription"}
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="px-3 py-1 bg-gray-500 text-white rounded text-sm hover:bg-gray-600"
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
          >
            Add Subscription
          </button>
        )}

        {subscriptions.length === 0 && !showForm && (
          <p className="text-sm text-gray-500">No subscriptions recorded for this client.</p>
        )}

        <ul className="space-y-3">
          {subscriptions.map((s) => {
            const days = daysUntil(s.renewal_date);
            const renewalWarning =
              s.billing_cycle === "yearly" &&
              s.status === "active" &&
              days !== null &&
              days <= 60 &&
              days >= 0;

            return (
              <li
                key={s.id}
                className={`border rounded p-4 relative ${
                  renewalWarning ? "border-amber-400 bg-amber-50" : "border-gray-200"
                }`}
              >
                <div className="flex items-start justify-between gap-2 pr-6">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-gray-900">{s.plan_name}</span>
                      <span className={cycleBadge(s.billing_cycle)}>
                        {s.billing_cycle}
                      </span>
                      <span className={statusBadge(s.status)}>{s.status}</span>
                    </div>

                    <div className="text-sm text-gray-700">
                      <span className="font-medium">
                        ${s.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                      <span className="text-gray-400"> / {s.billing_cycle === "monthly" ? "mo" : "yr"}</span>
                    </div>

                    <div className="text-xs text-gray-500 space-y-0.5">
                      <div>Started: {formatDate(s.start_date)}</div>
                      {s.renewal_date && (
                        <div>
                          Renews: {formatDate(s.renewal_date)}
                          {days !== null && days >= 0 && (
                            <span className={`ml-1 ${renewalWarning ? "text-amber-600 font-semibold" : "text-gray-400"}`}>
                              ({days === 0 ? "today" : `${days}d`})
                            </span>
                          )}
                          {days !== null && days < 0 && (
                            <span className="ml-1 text-red-500 font-semibold">(overdue)</span>
                          )}
                        </div>
                      )}
                    </div>

                    {renewalWarning && (
                      <p className="text-xs text-amber-700 font-medium mt-1">
                        Renewal coming up — mark renewed when complete.
                      </p>
                    )}

                    {s.notes && (
                      <p className="text-xs text-gray-600 mt-1 whitespace-pre-wrap">{s.notes}</p>
                    )}
                  </div>
                </div>

                {/* Kabob menu */}
                <div className="absolute top-2 right-2" onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={() => setOpenMenuId(openMenuId === s.id ? null : s.id)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <MoreVertical size={16} />
                  </button>

                  {openMenuId === s.id && (
                    <div
                      id="sub-kabob-menu"
                      className="absolute right-0 mt-1 w-32 bg-white border rounded shadow-md z-50"
                    >
                      <button
                        className="flex items-center gap-2 w-full text-left px-3 py-2 text-sm hover:bg-gray-50"
                        onClick={() => {
                          reset({
                            plan_name: s.plan_name,
                            price: s.price,
                            billing_cycle: s.billing_cycle,
                            start_date: s.start_date ? s.start_date.split("T")[0] : "",
                            renewal_date: s.renewal_date ? s.renewal_date.split("T")[0] : "",
                            status: s.status,
                            notes: s.notes ?? "",
                          });
                          setEditingId(s.id);
                          setShowForm(true);
                          setOpenMenuId(null);
                        }}
                      >
                        Edit
                      </button>
                      {s.status === "active" && (
                        <button
                          className="flex items-center gap-2 w-full text-left px-3 py-2 text-sm hover:bg-gray-50 text-blue-600"
                          onClick={() => {
                            handleRenew(s.id);
                            setOpenMenuId(null);
                          }}
                        >
                          <RefreshCw size={12} /> Mark Renewed
                        </button>
                      )}
                      <button
                        className="flex items-center gap-2 w-full text-left px-3 py-2 text-sm hover:bg-gray-50 text-red-600"
                        onClick={() => {
                          handleDelete(s.id);
                          setOpenMenuId(null);
                        }}
                      >
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </details>
  );
}
