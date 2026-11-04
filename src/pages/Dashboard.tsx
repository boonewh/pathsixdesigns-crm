import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AlertTriangle, CalendarClock, CalendarDays } from "lucide-react";
import { useAuth } from "@/authContext";
import { Interaction } from "@/types";
import { addDays, format, isBefore, isToday, isWithinInterval, parseISO, formatDistanceToNow } from "date-fns";
import InteractionModal from "@/components/ui/InteractionModal";
import CompleteInteractionModal from "@/components/ui/CompleteInteractionModal";
import { MetricCard } from "@/components/ui/MetricCard";
import { apiFetchJson } from "@/lib/api";
import { useCRMConfig } from "@/config/crmConfig";

interface ActivityEntry {
  entity_type: string;
  entity_id: number;
  name: string;
  last_touched: string;
  profile_link: string;
}

type FollowUp = Interaction & { parsedFollowUp: Date };

export default function Dashboard() {
  const { token } = useAuth();
  const config = useCRMConfig();
  const [interactions, setInteractions] = useState<Interaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [selectedInteraction, setSelectedInteraction] = useState<Interaction | null>(null);
  const [completingInteraction, setCompletingInteraction] = useState<Interaction | null>(null);
  const [recentActivity, setRecentActivity] = useState<ActivityEntry[]>([]);

  useEffect(() => {
    // Open follow-ups first (soonest first), so they aren't cut off by the page size.
    apiFetchJson("/interactions/?sort=pending&per_page=200", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((data) => {
        setInteractions(data.interactions || data); // Handle both paginated and direct array responses
        setLoadError(false);
      })
      .catch(() => {
        setInteractions([]);
        setLoadError(true);
      })
      .finally(() => setLoading(false));
  }, [token]);

  useEffect(() => {
    apiFetchJson("/activity/recent", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(setRecentActivity)
      .catch(() => setRecentActivity([]));
  }, [token]);

  const now = new Date();

  const parsedFollowUps: FollowUp[] = interactions
    .filter((i) => i.follow_up && i.followup_status !== "completed")
    .map((i) => ({
      ...i,
      parsedFollowUp: parseISO(i.follow_up!),
    }));

  const byDate = (a: FollowUp, b: FollowUp) => a.parsedFollowUp.getTime() - b.parsedFollowUp.getTime();

  const followUpsToday = parsedFollowUps.filter((i) => isToday(i.parsedFollowUp)).sort(byDate);

  const overdueFollowUps = parsedFollowUps
    .filter((i) => isBefore(i.parsedFollowUp, now) && !isToday(i.parsedFollowUp))
    .sort(byDate);

  const upcomingFollowUps = parsedFollowUps
    .filter((i) =>
      isWithinInterval(i.parsedFollowUp, {
        start: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1),
        end: addDays(now, 7),
      })
    )
    .sort(byDate);

  const hasFollowUps = overdueFollowUps.length + followUpsToday.length + upcomingFollowUps.length > 0;

  // Record name and type for display
  const getEntityDisplay = (interaction: Interaction) => {
    if (interaction.client_name) return { name: interaction.client_name, type: config.labels.client };
    if (interaction.lead_name) return { name: interaction.lead_name, type: "Lead" };
    if (interaction.project_name) return { name: interaction.project_name, type: "Project" };
    return { name: "Unknown record", type: "" };
  };

  const getEntityLabel = (entityType: string) => {
    switch (entityType) {
      case "client": return config.labels.client;
      case "lead": return "Lead";
      case "project": return "Project";
      case "account": return "Account";
      default: return "Item";
    }
  };

  const renderGroup = (title: string, items: FollowUp[], dateFormat: string, dateClass = "text-muted-foreground") => {
    if (items.length === 0) return null;
    return (
      <div>
        <h3 className="bg-muted/60 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {title} <span className="font-normal">({items.length})</span>
        </h3>
        <ul className="divide-y">
          {items.map((i) => {
            const entity = getEntityDisplay(i);
            return (
              <li key={i.id}>
                <button
                  type="button"
                  className="flex w-full items-start gap-3 px-4 py-3 text-left hover:bg-muted/50 transition-colors"
                  onClick={() => setSelectedInteraction(i)}
                >
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium">
                      {entity.name}
                      {entity.type && <span className="ml-2 text-xs font-normal text-muted-foreground">{entity.type}</span>}
                    </div>
                    <div className="truncate text-sm text-muted-foreground">{i.summary}</div>
                  </div>
                  <span className={`shrink-0 text-xs font-medium ${dateClass}`}>
                    {format(i.parsedFollowUp, dateFormat)}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    );
  };

  return (
    <div className="p-4 lg:p-6 space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-sm text-muted-foreground">{format(now, "EEEE, MMMM d")}</p>
      </div>

      {loading ? (
        <div className="space-y-4 animate-pulse motion-reduce:animate-none" role="status" aria-label="Loading dashboard">
          <div className="grid grid-cols-3 gap-2 sm:gap-4">
            {[0, 1, 2].map((n) => <div key={n} className="h-[74px] sm:h-[86px] rounded-lg border bg-white" />)}
          </div>
          <div className="rounded-lg border bg-white p-4 space-y-4">
            {[0, 1, 2, 3].map((n) => <div key={n} className="h-4 rounded bg-muted" style={{ width: `${70 - n * 10}%` }} />)}
          </div>
        </div>
      ) : (
        <>
          {!loadError && (
            <div className="grid grid-cols-3 gap-2 sm:gap-4">
              <MetricCard
                title="Overdue"
                value={overdueFollowUps.length}
                icon={AlertTriangle}
                valueClassName={overdueFollowUps.length > 0 ? "text-red-600" : ""}
              />
              <MetricCard title="Due today" value={followUpsToday.length} icon={CalendarClock} />
              <MetricCard title="Next 7 days" value={upcomingFollowUps.length} icon={CalendarDays} />
            </div>
          )}

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <section className="rounded-lg border bg-white overflow-hidden lg:col-span-2" aria-label="My follow-ups">
              <h2 className="border-b px-4 py-3 text-sm font-semibold">My follow-ups</h2>
              {loadError ? (
                <p className="px-4 py-6 text-sm text-red-700" role="alert">
                  Couldn't load follow-ups. Please refresh the page to try again.
                </p>
              ) : hasFollowUps ? (
                <>
                  {renderGroup("Overdue", overdueFollowUps, "MMM d", "text-red-600")}
                  {renderGroup("Today", followUpsToday, "h:mm a")}
                  {renderGroup("Next 7 days", upcomingFollowUps, "EEE, MMM d")}
                </>
              ) : (
                <div className="px-4 py-8 text-center">
                  <p className="text-sm font-medium">You're all caught up</p>
                  <p className="text-sm text-muted-foreground">No follow-ups are overdue or due in the next 7 days.</p>
                </div>
              )}
            </section>

            <section className="rounded-lg border bg-white overflow-hidden self-start" aria-label="Recently touched">
              <h2 className="border-b px-4 py-3 text-sm font-semibold">Recently touched</h2>
              {recentActivity.length === 0 ? (
                <p className="px-4 py-6 text-sm text-muted-foreground">Nothing yet.</p>
              ) : (
                <ul className="divide-y">
                  {recentActivity.map((entry) => (
                    <li key={`${entry.entity_type}-${entry.entity_id}`}>
                      <Link
                        to={entry.profile_link}
                        className="flex items-center gap-3 px-4 py-3 hover:bg-muted/50 transition-colors"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-sm font-medium text-primary">{entry.name}</div>
                          <div className="text-xs text-muted-foreground">{getEntityLabel(entry.entity_type)}</div>
                        </div>
                        <span className="shrink-0 text-xs text-muted-foreground">
                          {formatDistanceToNow(parseISO(entry.last_touched), { addSuffix: true })}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>
        </>
      )}

      <p className="text-xs text-muted-foreground">
        Found a bug or have a suggestion? Email{" "}
        <a href="mailto:support@pathsixsolutions.com" className="text-primary hover:underline">
          support@pathsixsolutions.com
        </a>
      </p>

      {completingInteraction && (
        <CompleteInteractionModal
          interaction={completingInteraction}
          token={token!}
          onSuccess={() => {
            setInteractions((prev) => prev.filter((i) => i.id !== completingInteraction.id));
            setCompletingInteraction(null);
          }}
          onCancel={() => setCompletingInteraction(null)}
        />
      )}

      {selectedInteraction && (
        <InteractionModal
          title={`Follow-up: ${getEntityDisplay(selectedInteraction).name}`}
          date={new Date(selectedInteraction.contact_date).toLocaleString()}
          outcome={selectedInteraction.outcome}
          summary={selectedInteraction.summary}
          notes={selectedInteraction.notes}
          contact_person={selectedInteraction.contact_person}
          email={selectedInteraction.email}
          phone={selectedInteraction.phone}
          phone_label={selectedInteraction.phone_label}
          secondary_phone={selectedInteraction.secondary_phone}
          secondary_phone_label={selectedInteraction.secondary_phone_label}
          profile_link={selectedInteraction.profile_link}
          onClose={() => setSelectedInteraction(null)}
          onMarkComplete={() => {
            setSelectedInteraction(null);
            setCompletingInteraction(selectedInteraction);
          }}
        />
      )}
    </div>
  );
}
