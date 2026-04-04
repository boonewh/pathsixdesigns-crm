import { useState } from "react";
import { Interaction } from "@/types";
import { apiFetch } from "@/lib/api";

interface CompleteInteractionModalProps {
  interaction: Interaction;
  token: string;
  onSuccess: () => void;
  onCancel: () => void;
}

function combineDateTime(date: string, time: string): string {
  return `${date}T${time || "09:00"}:00`;
}

export default function CompleteInteractionModal({
  interaction,
  token,
  onSuccess,
  onCancel,
}: CompleteInteractionModalProps) {
  const [outcome, setOutcome] = useState(interaction.outcome ?? "");
  const [notes, setNotes] = useState(interaction.notes ?? "");
  const [scheduleNext, setScheduleNext] = useState(false);
  const [nextDate, setNextDate] = useState("");
  const [nextTime, setNextTime] = useState("09:00");
  const [nextSummary, setNextSummary] = useState("");
  const [dateError, setDateError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const entityName =
    interaction.client_name ??
    interaction.lead_name ??
    interaction.project_name ??
    "Unknown";

  const scheduledFor = interaction.follow_up
    ? new Date(interaction.follow_up).toLocaleString()
    : null;

  const handleSubmit = async () => {
    if (scheduleNext && !nextDate) {
      setDateError("Please select a date for the next follow-up.");
      return;
    }
    setDateError("");
    setIsSubmitting(true);

    try {
      // Step 1a: Save outcome/notes if the user entered anything
      if (outcome.trim() || notes.trim()) {
        const updateRes = await apiFetch(`/interactions/${interaction.id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            ...(outcome.trim() ? { outcome: outcome.trim() } : {}),
            ...(notes.trim() ? { notes: notes.trim() } : {}),
          }),
        });

        if (!updateRes.ok) {
          setIsSubmitting(false);
          return;
        }
      }

      // Step 1b: Mark complete via the dedicated endpoint (guaranteed to work)
      const completeRes = await apiFetch(`/interactions/${interaction.id}/complete`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!completeRes.ok) {
        setIsSubmitting(false);
        return;
      }

      // Step 2: Create next follow-up interaction if requested
      if (scheduleNext && nextDate) {
        const entityField = interaction.client_id
          ? { client_id: interaction.client_id }
          : interaction.lead_id
          ? { lead_id: interaction.lead_id }
          : { project_id: interaction.project_id };

        const createRes = await apiFetch("/interactions/", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            ...entityField,
            contact_date: new Date().toISOString().slice(0, 19),
            summary: nextSummary.trim() || "Follow-up",
            follow_up: combineDateTime(nextDate, nextTime),
            ...(interaction.contact_person ? { contact_person: interaction.contact_person } : {}),
            ...(interaction.email ? { email: interaction.email } : {}),
            ...(interaction.phone ? { phone: interaction.phone } : {}),
          }),
        });

        if (!createRes.ok) {
          // Completion already saved — just close
          setIsSubmitting(false);
          onSuccess();
          return;
        }
      }

      onSuccess();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg p-6 max-w-lg w-full mx-4">
        {/* Header */}
        <div className="mb-4">
          <h2 className="text-lg font-bold text-gray-900">Complete Interaction</h2>
          <p className="text-sm text-gray-600 mt-0.5">{entityName}</p>
          {scheduledFor && (
            <p className="text-sm text-blue-600 mt-0.5">Scheduled for: {scheduledFor}</p>
          )}
          {interaction.summary && (
            <p className="text-sm text-gray-500 italic mt-1">"{interaction.summary}"</p>
          )}
        </div>

        {/* How did it go? */}
        <div className="space-y-3 mb-4">
          <p className="text-sm font-medium text-gray-700">How did it go? (optional)</p>
          <div>
            <input
              type="text"
              placeholder="Outcome / next step"
              value={outcome}
              onChange={(e) => setOutcome(e.target.value)}
              className="w-full border rounded px-3 py-1.5 text-sm"
            />
          </div>
          <div>
            <textarea
              placeholder="Notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="w-full border rounded px-3 py-1.5 text-sm"
            />
          </div>
        </div>

        <div className="border-t my-4" />

        {/* Schedule next follow-up */}
        <div className="space-y-3 mb-6">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={scheduleNext}
              onChange={(e) => {
                setScheduleNext(e.target.checked);
                setDateError("");
              }}
              className="rounded"
            />
            <span className="text-sm font-medium text-gray-700">Schedule a next follow-up?</span>
          </label>

          {scheduleNext && (
            <div className="space-y-2 pl-6">
              <div className="flex gap-2">
                <input
                  type="date"
                  value={nextDate}
                  onChange={(e) => {
                    setNextDate(e.target.value);
                    setDateError("");
                  }}
                  className={`flex-1 border rounded px-2 py-1.5 text-sm ${dateError ? "border-red-500" : ""}`}
                />
                <input
                  type="time"
                  value={nextTime}
                  onChange={(e) => setNextTime(e.target.value)}
                  className="flex-1 border rounded px-2 py-1.5 text-sm"
                />
              </div>
              {dateError && <p className="text-sm text-red-600">{dateError}</p>}
              <input
                type="text"
                placeholder="Summary (e.g. Check in on proposal)"
                value={nextSummary}
                onChange={(e) => setNextSummary(e.target.value)}
                className="w-full border rounded px-2 py-1.5 text-sm"
              />
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-2 justify-end">
          <button
            onClick={onCancel}
            disabled={isSubmitting}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 text-sm disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 text-sm disabled:bg-green-400"
          >
            {isSubmitting ? "Saving..." : scheduleNext ? "Complete & Schedule Next" : "Complete"}
          </button>
        </div>
      </div>
    </div>
  );
}
