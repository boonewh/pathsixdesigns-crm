import { ReactNode, useState } from "react";
import { Check } from "lucide-react";

// Shared building blocks for record pages (Lead and Account detail).

type Field = { label: string; value: ReactNode };

export function RecordHeader({
  eyebrow,
  title,
  actions,
  fields,
  children,
}: {
  eyebrow: string;
  title: string;
  actions?: ReactNode;
  fields: Field[];
  children?: ReactNode;
}) {
  return (
    <div className="rounded-lg border bg-white">
      <div className="flex flex-col gap-4 p-5">
        <div className="flex flex-wrap items-center gap-4">
          <div className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-primary/10 text-base font-bold uppercase text-primary">
            {title.slice(0, 2)}
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{eyebrow}</div>
            <h1 className="text-xl sm:text-2xl font-semibold break-words">{title}</h1>
          </div>
          {/* On phones the buttons get their own line so the title keeps the full width. */}
          {actions && <div className="flex w-full flex-wrap gap-2 sm:w-auto">{actions}</div>}
        </div>
        <dl className="grid grid-cols-2 gap-x-4 gap-y-3 border-t pt-4 sm:grid-cols-3 lg:grid-cols-5">
          {fields.map((f) => (
            <div key={f.label} className="min-w-0">
              <dt className="text-xs text-muted-foreground">{f.label}</dt>
              <dd className="mt-0.5 break-words text-sm font-medium sm:truncate">{f.value}</dd>
            </div>
          ))}
        </dl>
      </div>
      {children}
    </div>
  );
}

// Clickable stage bar: earlier stages show a check, the current one is highlighted.
export function StagePath({
  stages,
  current,
  labels,
  onSelect,
  disabled,
}: {
  stages: readonly string[];
  current: string;
  labels?: Record<string, string>;
  onSelect: (stage: string) => void;
  disabled?: boolean;
}) {
  const currentIndex = stages.indexOf(current);
  return (
    <div className="flex gap-1 overflow-x-auto border-t px-5 py-3" role="group" aria-label="Stage">
      {stages.map((stage, i) => {
        const label = labels?.[stage] || stage.charAt(0).toUpperCase() + stage.slice(1);
        const isCurrent = i === currentIndex;
        const isDone = currentIndex >= 0 && i < currentIndex;
        return (
          <button
            key={stage}
            type="button"
            disabled={disabled || isCurrent}
            aria-current={isCurrent ? "step" : undefined}
            onClick={() => onSelect(stage)}
            className={`flex min-w-[6rem] flex-1 items-center justify-center gap-1 whitespace-nowrap px-3 py-1.5 text-xs font-medium first:rounded-l-md last:rounded-r-md transition-colors disabled:cursor-default ${
              isCurrent
                ? "bg-primary text-primary-foreground"
                : isDone
                  ? "bg-green-100 text-green-800 hover:bg-green-200"
                  : "bg-muted text-muted-foreground hover:bg-gray-200"
            }`}
          >
            {isDone && <Check className="h-3 w-3" aria-hidden="true" />}
            {label}
          </button>
        );
      })}
    </div>
  );
}

export function RecordFields({ title, fields }: { title: string; fields: Field[] }) {
  return (
    <div className="rounded-lg border bg-white">
      <h2 className="border-b px-4 py-3 text-sm font-semibold">{title}</h2>
      <dl className="divide-y divide-dashed px-4">
        {fields.map((f) => (
          <div key={f.label} className="grid grid-cols-[6.5rem_minmax(0,1fr)] gap-2 py-2.5 text-sm">
            <dt className="text-muted-foreground">{f.label}</dt>
            <dd className="break-words">{f.value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

type Tab = { key: string; label: string; count?: number; content: ReactNode };

// Tabs that are always open. Inactive panels stay mounted (hidden) so each
// section loads once, the same as the old collapsible boxes did.
export function RecordTabs({ tabs }: { tabs: Tab[] }) {
  const [active, setActive] = useState(tabs[0]?.key);
  return (
    <div className="min-w-0 rounded-lg border bg-white">
      <div role="tablist" className="flex gap-1 overflow-x-auto border-b px-2">
        {tabs.map((t) => (
          <button
            key={t.key}
            role="tab"
            type="button"
            id={`tab-${t.key}`}
            aria-selected={active === t.key}
            aria-controls={`panel-${t.key}`}
            onClick={() => setActive(t.key)}
            className={`-mb-px whitespace-nowrap border-b-2 px-3 py-3 text-sm font-medium ${
              active === t.key
                ? "border-primary text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {t.label}
            {t.count !== undefined && (
              <span className="ml-1.5 rounded-full bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">{t.count}</span>
            )}
          </button>
        ))}
      </div>
      {tabs.map((t) => (
        <div
          key={t.key}
          role="tabpanel"
          id={`panel-${t.key}`}
          aria-labelledby={`tab-${t.key}`}
          hidden={active !== t.key}
        >
          {t.content}
        </div>
      ))}
    </div>
  );
}

type ProjectSummary = {
  id: number;
  project_name: string;
  project_status?: string;
  project_description?: string;
  created_at: string;
  project_start?: string;
  project_end?: string;
  project_worth?: number | null;
  value_type?: string;
};

// Related projects list (shared by the Lead and Account pages).
export function ProjectList({ projects, empty }: { projects: ProjectSummary[]; empty: ReactNode }) {
  if (projects.length === 0) return <p className="p-4 text-sm text-muted-foreground">{empty}</p>;
  return (
    <ul className="divide-y text-sm">
      {projects.map((p) => (
        <li key={p.id} className="flex flex-wrap items-start justify-between gap-2 px-4 py-3">
          <div className="min-w-0">
            <div className="font-medium">{p.project_name}</div>
            <div className="text-xs text-muted-foreground">
              {[
                p.project_status,
                `Created ${new Date(p.created_at).toLocaleDateString()}`,
                p.project_start && `Start ${new Date(p.project_start).toLocaleDateString()}`,
                p.project_end && `End ${new Date(p.project_end).toLocaleDateString()}`,
              ]
                .filter(Boolean)
                .join(" · ")}
            </div>
            {p.project_description && <div className="mt-1 text-muted-foreground">{p.project_description}</div>}
          </div>
          {p.project_worth !== undefined && p.project_worth !== null && (
            <div className="text-right font-semibold tabular-nums">
              ${p.project_worth.toLocaleString()}
              {p.value_type === "monthly" && " / mo"}
              {p.value_type === "yearly" && (
                <>
                  {" / yr"}
                  <div className="text-xs font-normal text-muted-foreground">
                    ${(p.project_worth / 12).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} / mo
                  </div>
                </>
              )}
            </div>
          )}
        </li>
      ))}
    </ul>
  );
}

// Grey placeholder in the shape of a record page, shown while it loads.
export function RecordSkeleton() {
  const bar = "rounded bg-muted";
  return (
    <div className="p-4 lg:p-6 space-y-4 animate-pulse motion-reduce:animate-none" role="status" aria-label="Loading">
      <div className={`h-3 w-40 ${bar}`} />
      <div className="rounded-lg border bg-white p-5 space-y-4">
        <div className="flex items-center gap-4">
          <div className={`h-11 w-11 ${bar}`} />
          <div className="space-y-2">
            <div className={`h-3 w-16 ${bar}`} />
            <div className={`h-6 w-64 ${bar}`} />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4 border-t pt-4 sm:grid-cols-3 lg:grid-cols-5">
          {Array.from({ length: 5 }, (_, i) => (
            <div key={i} className="space-y-2">
              <div className={`h-3 w-14 ${bar}`} />
              <div className={`h-4 w-24 ${bar}`} />
            </div>
          ))}
        </div>
      </div>
      <div className="grid gap-4 lg:grid-cols-[320px_minmax(0,1fr)] items-start">
        <div className="rounded-lg border bg-white p-4 space-y-3">
          {Array.from({ length: 4 }, (_, i) => (
            <div key={i} className={`h-4 ${bar}`} />
          ))}
        </div>
        <div className="rounded-lg border bg-white p-4 space-y-3">
          <div className={`h-4 w-72 ${bar}`} />
          {Array.from({ length: 3 }, (_, i) => (
            <div key={i} className={`h-16 ${bar}`} />
          ))}
        </div>
      </div>
    </div>
  );
}
