// Colored status pill with a dot. Colors come from the tenant config
// (e.g. "bg-green-100 text-green-800"); the dot takes the text color.
type Props = {
  status: string;
  colorClass?: string;
  label?: string;
};

export default function StatusBadge({ status, colorClass, label }: Props) {
  const text = label || status.charAt(0).toUpperCase() + status.slice(1);
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 text-xs font-medium rounded-full whitespace-nowrap ${
        colorClass || "bg-gray-100 text-gray-800"
      }`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden="true" />
      {text}
    </span>
  );
}
