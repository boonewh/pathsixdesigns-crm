import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { interactionCreateSchema, interactionUpdateSchema, type InteractionCreateInput, type InteractionUpdateInput } from "@/schemas/interactionSchemas";
import { useState } from "react";

type InteractionFormProps = {
  onSubmit: (data: InteractionCreateInput | InteractionUpdateInput) => Promise<void>;
  onCancel: () => void;
  isEditing: boolean;
  editingId?: number | null;
  defaultValues?: Partial<InteractionCreateInput>;
};

function splitDateTime(datetime?: string): { date: string; time: string } {
  if (!datetime) return { date: "", time: "" };
  const [date, time = ""] = datetime.split("T");
  return { date, time: time.slice(0, 5) }; // "HH:MM"
}

function combineDateTime(date: string, time: string): string {
  return `${date}T${time || "08:00"}`;
}

export default function InteractionForm(props: InteractionFormProps) {
  const { onSubmit, onCancel, isEditing, defaultValues } = props;
  
  const schema = isEditing ? interactionUpdateSchema : interactionCreateSchema;
  
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
    reset,
    setValue,
  } = useForm<InteractionCreateInput | InteractionUpdateInput>({
    resolver: zodResolver(schema),
    defaultValues: {
      contact_date: "",
      summary: "",
      outcome: "",
      notes: "",
      follow_up: "",
      contact_person: "",
      email: "",
      phone: "",
      ...defaultValues,
    },
  });

  const watchedContactDate = watch("contact_date");
  const watchedFollowUp = watch("follow_up");

  const { date: contactDate, time: contactTime } = splitDateTime(watchedContactDate);
  const { date: followDate, time: followTime } = splitDateTime(watchedFollowUp);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-2 mb-4">
      <label className="block text-sm font-medium text-gray-700">Contact Date</label>
      <div className="flex gap-2">
        <input
          type="date"
          value={contactDate}
          onChange={(e) =>
            setValue("contact_date", combineDateTime(e.target.value, contactTime))
          }
          className={`w-full border rounded px-2 py-1 text-sm ${errors.contact_date ? "border-red-500" : ""}`}
        />
        <input
          type="time"
          value={contactTime}
          onChange={(e) =>
            setValue("contact_date", combineDateTime(contactDate, e.target.value))
          }
          className={`w-full border rounded px-2 py-1 text-sm ${errors.contact_date ? "border-red-500" : ""}`}
        />
      </div>
      {errors.contact_date && (
        <p className="text-sm text-red-600 mt-1">{errors.contact_date.message}</p>
      )}

      <div>
        <input
          placeholder="Summary"
          {...register("summary")}
          className={`w-full border rounded px-2 py-1 text-sm ${errors.summary ? "border-red-500" : ""}`}
        />
        {errors.summary && (
          <p className="text-sm text-red-600 mt-1">{errors.summary.message}</p>
        )}
      </div>

      <div>
        <textarea
          placeholder="Notes"
          {...register("notes")}
          className={`w-full border rounded px-2 py-1 text-sm ${errors.notes ? "border-red-500" : ""}`}
          rows={3}
        />
        {errors.notes && (
          <p className="text-sm text-red-600 mt-1">{errors.notes.message}</p>
        )}
      </div>

      <label className="block text-sm font-medium text-gray-700">Next Follow-up (optional)</label>
      <div className="flex gap-2">
        <input
          type="date"
          value={followDate}
          onChange={(e) =>
            setValue("follow_up", combineDateTime(e.target.value, followTime))
          }
          className={`w-full border rounded px-2 py-1 text-sm ${errors.follow_up ? "border-red-500" : ""}`}
        />
        <input
          type="time"
          value={followTime}
          onChange={(e) =>
            setValue("follow_up", combineDateTime(followDate, e.target.value))
          }
          className={`w-full border rounded px-2 py-1 text-sm ${errors.follow_up ? "border-red-500" : ""}`}
        />
      </div>
      {errors.follow_up && (
        <p className="text-sm text-red-600 mt-1">{errors.follow_up.message}</p>
      )}

      <div>
        <input
          placeholder="Next Step"
          {...register("outcome")}
          className={`w-full border rounded px-2 py-1 text-sm ${errors.outcome ? "border-red-500" : ""}`}
        />
        {errors.outcome && (
          <p className="text-sm text-red-600 mt-1">{errors.outcome.message}</p>
        )}
      </div>

      <div>
        <input
          placeholder="Contact Person"
          {...register("contact_person")}
          className={`w-full border rounded px-2 py-1 text-sm ${errors.contact_person ? "border-red-500" : ""}`}
        />
        {errors.contact_person && (
          <p className="text-sm text-red-600 mt-1">{errors.contact_person.message}</p>
        )}
      </div>

      <div>
        <input
          placeholder="Email"
          type="email"
          {...register("email")}
          className={`w-full border rounded px-2 py-1 text-sm ${errors.email ? "border-red-500" : ""}`}
        />
        {errors.email && (
          <p className="text-sm text-red-600 mt-1">{errors.email.message}</p>
        )}
      </div>

      <div>
        <input
          placeholder="Phone"
          {...register("phone")}
          className={`w-full border rounded px-2 py-1 text-sm ${errors.phone ? "border-red-500" : ""}`}
        />
        {errors.phone && (
          <p className="text-sm text-red-600 mt-1">{errors.phone.message}</p>
        )}
      </div>

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-green-400"
        >
          {isSubmitting ? "Saving..." : isEditing ? "Update" : "Save"} Interaction
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
