// Project status colors and labels, shared by the Projects list, table and Project page.
export const PROJECT_STATUS_COLORS: Record<string, string> = {
  active: "bg-blue-100 text-blue-800",
  pending: "bg-yellow-100 text-yellow-800",
  completed: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800",
  lost: "bg-red-100 text-red-800",
};

export const PROJECT_STATUS_LABELS: Record<string, string> = {
  active: "Active",
  pending: "Pending",
  completed: "Completed",
  cancelled: "Cancelled",
  lost: "Lost",
};

// "$1,530 / mo", "$12,000 / yr", "$8,500"
export function formatProjectValue(worth?: number | null, valueType?: string) {
  if (worth === undefined || worth === null) return null;
  const amount = "$" + worth.toLocaleString();
  if (valueType === "monthly") return amount + " / mo";
  if (valueType === "yearly") return amount + " / yr";
  return amount;
}
