import { useEffect, useMemo, useState, useRef } from "react";
import FullCalendar from "@fullcalendar/react";
import type { EventClickArg, EventContentArg, EventDropArg } from "@fullcalendar/core";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import listPlugin from "@fullcalendar/list";
import interactionPlugin, { type DateClickArg } from "@fullcalendar/interaction";
import { format } from "date-fns";
import toast from "react-hot-toast";
import { useAuth } from "@/authContext";
import InteractionModal from "@/components/ui/InteractionModal";
import { Button } from "@/components/ui/button";
import { Interaction } from "@/types";
import { apiFetch } from "@/lib/api";
import { useCRMConfig } from "@/config/crmConfig";

type EntityType = "client" | "lead" | "project";
type Filter = "all" | EntityType;

const TYPE_COLORS: Record<EntityType, string> = {
  client: "#3b82f6",
  lead: "#10b981",
  project: "#f59e0b",
};

function entityOf(i: Interaction): { name: string; type?: EntityType } {
  if (i.client_name) return { name: i.client_name, type: "client" };
  if (i.lead_name) return { name: i.lead_name, type: "lead" };
  if (i.project_name) return { name: i.project_name, type: "project" };
  return { name: "Unknown record" };
}

export default function CalendarPage() {
  const { token } = useAuth();
  const config = useCRMConfig();
  const [interactions, setInteractions] = useState<Interaction[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [filterType, setFilterType] = useState<Filter>("all");
  const [showAllHours, setShowAllHours] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const calendarRef = useRef<FullCalendar>(null);

  // Load once; the type filter works on what's already loaded, so the
  // calendar keeps the month/week you navigated to.
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Open follow-ups first, so they aren't cut off by the page size.
        const res = await apiFetch("/interactions/?sort=pending&per_page=200", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error(`Status ${res.status}`);
        const data = await res.json();
        // Handle both paginated response and direct array
        setInteractions(data.interactions || data);
        setLoadError(false);
      } catch (err) {
        console.error(err);
        setLoadError(true);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [token]);

  const events = useMemo(
    () =>
      interactions
        .filter((i) => i.follow_up)
        .map((i) => ({ i, entity: entityOf(i) }))
        .filter(({ entity }) => filterType === "all" || entity.type === filterType)
        .map(({ i, entity }) => ({
          id: i.id.toString(),
          title: entity.name,
          start: i.follow_up!,
          color: entity.type ? TYPE_COLORS[entity.type] : "#94a3b8",
          extendedProps: { followup_status: i.followup_status, entity_type: entity.type },
        })),
    [interactions, filterType]
  );

  const selected = interactions.find((i) => i.id === selectedId) || null;

  function handleEventClick(arg: EventClickArg) {
    setSelectedId(Number(arg.event.id));
  }

  async function handleEventDrop(arg: EventDropArg) {
    const id = Number(arg.event.id);
    const newDate = arg.event.start!;

    try {
      const res = await apiFetch(`/interactions/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ follow_up: newDate.toISOString() }),
      });
      if (!res.ok) throw new Error(`Status ${res.status}`);
      // Keep our copy in step, so the event stays where it was dropped.
      setInteractions((prev) => prev.map((i) => (i.id === id ? { ...i, follow_up: newDate.toISOString() } : i)));
      toast.success(`Follow-up moved to ${format(newDate, "EEE, MMM d, h:mm a")}`);
    } catch (err) {
      console.error(err);
      toast.error("Couldn't move the follow-up. Please try again.");
      arg.revert();
    }
  }

  function generateGoogleCalendarUrl(i: Interaction): string {
    const title = encodeURIComponent(entityOf(i).name);
    const details = encodeURIComponent(`Outcome: ${i.outcome}\nNotes: ${i.notes || "No notes"}`);
    const start = new Date(i.follow_up!).toISOString().replace(/[-:]|\.\d{3}/g, "");
    const end = start;

    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${start}/${end}&details=${details}`;
  }

  function renderEventContent(arg: EventContentArg) {
    const isOverdue = arg.event.start! < new Date();
    const isCompleted = arg.event.extendedProps.followup_status === "completed";

    let style = "text-foreground";
    if (isCompleted) style = "text-muted-foreground line-through";
    else if (isOverdue) style = "text-red-600";

    // List views draw their own colored dot.
    const showDot = !arg.view.type.startsWith("list");

    return (
      <div className={`flex min-w-0 items-center gap-1.5 font-medium ${showDot ? "text-xs" : "text-sm"} ${style}`}>
        {showDot && (
          <span
            className="h-2 w-2 shrink-0 rounded-full"
            style={{ backgroundColor: arg.event.backgroundColor }}
            aria-hidden="true"
          />
        )}
        <span className="truncate">{arg.event.title}</span>
      </div>
    );
  }

  function handleDateClick(arg: DateClickArg) {
    calendarRef.current?.getApi().changeView("timeGridDay", arg.dateStr);
  }

  const isMobile = window.innerWidth < 768;

  const filters: { value: Filter; label: string }[] = [
    { value: "all", label: "All" },
    { value: "client", label: config.labels.client + "s" },
    { value: "lead", label: "Leads" },
    { value: "project", label: "Projects" },
  ];

  const selectedType = selected ? entityOf(selected).type : undefined;
  const selectedTypeLabel =
    selectedType === "client" ? config.labels.client : selectedType === "lead" ? "Lead" : selectedType === "project" ? "Project" : "Record";

  return (
    <div className="p-4 lg:p-6">
      <h1 className="text-2xl font-bold mb-4">Calendar</h1>

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="inline-flex rounded-md border bg-white p-0.5" role="group" aria-label="Filter by type">
          {filters.map((f) => (
            <button
              key={f.value}
              type="button"
              aria-pressed={filterType === f.value}
              onClick={() => setFilterType(f.value)}
              className={`flex items-center gap-1.5 rounded px-3 py-1.5 text-sm font-medium transition-colors ${
                filterType === f.value ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"
              }`}
            >
              {f.value !== "all" && (
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: TYPE_COLORS[f.value] }}
                  aria-hidden="true"
                />
              )}
              {f.label}
            </button>
          ))}
        </div>
        <Button variant="outline" size="sm" onClick={() => setShowAllHours((v) => !v)}>
          {showAllHours ? "Business hours" : "All 24 hours"}
        </Button>
      </div>

      {loading ? (
        <div className="rounded-lg border bg-white p-4 animate-pulse motion-reduce:animate-none" role="status" aria-label="Loading calendar">
          <div className="mb-4 h-8 w-1/3 rounded bg-muted" />
          <div className="h-96 rounded bg-muted/60" />
        </div>
      ) : loadError ? (
        <div className="rounded-lg border bg-white px-4 py-6 text-sm text-red-700" role="alert">
          Couldn't load follow-ups. Please refresh the page to try again.
        </div>
      ) : (
        <div className="rounded-lg border bg-white p-3 sm:p-4 overflow-x-auto">
          <FullCalendar
            ref={calendarRef}
            dateClick={handleDateClick}
            plugins={[dayGridPlugin, timeGridPlugin, listPlugin, interactionPlugin]}
            initialView={isMobile ? "listWeek" : "dayGridMonth"}
            headerToolbar={{
              left: "prev,next today",
              center: "title",
              right: "dayGridMonth,timeGridWeek,timeGridDay,listWeek",
            }}
            buttonText={{
              today: "Today",
              month: "Month",
              week: "Week",
              day: "Day",
              list: "List",
            }}
            noEventsContent="No follow-ups in this period"
            events={events}
            editable={true}
            slotMinTime={showAllHours ? "00:00:00" : "05:00:00"}
            slotMaxTime={showAllHours ? "24:00:00" : "22:00:00"}
            scrollTime="07:00:00"
            eventDrop={handleEventDrop}
            eventClick={handleEventClick}
            eventContent={renderEventContent}
            height="auto"
          />
        </div>
      )}

      {selected && (
        <InteractionModal
          title={`${selectedTypeLabel} Follow-up: ${entityOf(selected).name}`}
          date={new Date(selected.follow_up!).toLocaleString()}
          outcome={selected.outcome}
          summary={selected.summary}
          notes={selected.notes || "No notes"}
          contact_person={selected.contact_person}
          email={selected.email}
          phone={selected.phone}
          phone_label={selected.phone_label}
          secondary_phone={selected.secondary_phone}
          secondary_phone_label={selected.secondary_phone_label}
          profile_link={selected.profile_link}
          onClose={() => setSelectedId(null)}
          calendarLink={generateGoogleCalendarUrl(selected)}
          icsPath={`/interactions/${selected.id}/calendar.ics`}
          icsFilename={`interaction-${selected.id}.ics`}
        />
      )}
    </div>
  );
}
