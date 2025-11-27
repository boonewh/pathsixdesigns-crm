import React from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Lead } from "@/types";
import PhoneInput from "@/components/ui/PhoneInput";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { leadCreateSchema, leadUpdateSchema, leadStatuses, typeOptions, type LeadCreateInput, type LeadUpdateInput } from "@/schemas/leadSchemas";

interface LeadFormProps {
  form: Partial<Lead>;
  setForm: React.Dispatch<React.SetStateAction<Partial<Lead>>>;
  onSave: (data: LeadCreateInput | LeadUpdateInput) => void;
  onCancel: () => void;
  isEditing?: boolean;
}

// Lead status options - matches backend constants
const LEAD_STATUS_OPTIONS = leadStatuses.map((status) => ({
  value: status,
  label: status.replace('_', ' ').replace(/\b\w/g, (char) => char.toUpperCase()),
}));

export default function LeadForm({ form, setForm, onSave, onCancel, isEditing = false }: LeadFormProps) {
  const SHOW_LEAD_SOURCE = false;
  const SHOW_LEAD_TEMPERATURE = false;
  const SHOW_LEAD_SCORE = false;

  // Determine which schema to use based on editing mode
  const schema = isEditing ? leadUpdateSchema : leadCreateSchema;

  // Set up React Hook Form with Zod validation
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<LeadCreateInput | LeadUpdateInput>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: form.name || "",
      contact_person: form.contact_person || "",
      contact_title: form.contact_title || "",
      email: form.email || "",
      phone: form.phone || "",
      phone_label: form.phone_label || "work",
      secondary_phone: form.secondary_phone || "",
      secondary_phone_label: form.secondary_phone_label || "mobile",
      address: form.address || "",
      city: form.city || "",
      state: form.state || "",
      zip: form.zip || "",
      lead_status: form.lead_status || "new",
      notes: form.notes || "",
      type: form.type || "None",
    },
  });

  // Watch all form values to sync with parent component state
  const watchedValues = watch();

  // Sync form state with parent component
  React.useEffect(() => {
    setForm(watchedValues as Partial<Lead>);
  }, [watchedValues, setForm]);

  // Handle form submission with validation
  const onSubmit = (data: LeadCreateInput | LeadUpdateInput) => {
    onSave(data);
  };

  // Handle form reset
  const handleCancel = () => {
    reset();
    onCancel();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="relative">
      <div className="space-y-4 pb-28">
        {/* Company Name */}
        <div className="grid gap-2">
          <Label htmlFor="name">Company Name *</Label>
          <Input
            id="name"
            {...register("name")}
            className={errors.name ? "border-red-500" : ""}
          />
          {errors.name && (
            <p className="text-sm text-red-500">{errors.name.message}</p>
          )}
        </div>

        {/* Lead Status */}
        <div className="grid gap-2">
          <Label htmlFor="lead_status">Lead Status</Label>
          <select
            id="lead_status"
            {...register("lead_status")}
            className={`border border-input bg-background text-sm rounded-md px-2 py-1 ${
              errors.lead_status ? "border-red-500" : ""
            }`}
          >
            {LEAD_STATUS_OPTIONS.map((status) => (
              <option key={status.value} value={status.value}>
                {status.label}
              </option>
            ))}
          </select>
          {errors.lead_status && (
            <p className="text-sm text-red-500">{errors.lead_status.message}</p>
          )}
        </div>

        {/* Business Type */}
        <div className="grid gap-2">
          <Label htmlFor="type">Type</Label>
          <select
            id="type"
            {...register("type")}
            className={`border border-input bg-background text-sm rounded-md px-2 py-1 ${
              errors.type ? "border-red-500" : ""
            }`}
          >
            {typeOptions.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
          {errors.type && (
            <p className="text-sm text-red-500">{errors.type.message}</p>
          )}
        </div>

        {/* Optional Future Fields */}
        {SHOW_LEAD_SOURCE && (
          <div className="grid gap-2">
            <Label htmlFor="lead_source">Lead Source</Label>
            <select
              id="lead_source"
              value={(form as any).lead_source || ""}
              onChange={(e) => setForm({ ...form, lead_source: e.target.value } as any)}
              className="border border-input bg-background text-sm rounded-md px-2 py-1"
            >
              <option value="">Select Source</option>
              <option value="website">Website</option>
              <option value="referral">Referral</option>
              <option value="cold_call">Cold Call</option>
              <option value="email_campaign">Email Campaign</option>
              <option value="social_media">Social Media</option>
              <option value="trade_show">Trade Show</option>
              <option value="advertisement">Advertisement</option>
              <option value="partner">Partner</option>
              <option value="other">Other</option>
            </select>
          </div>
        )}

        {SHOW_LEAD_TEMPERATURE && (
          <div className="grid gap-2">
            <Label htmlFor="lead_temperature">Temperature</Label>
            <select
              id="lead_temperature"
              value={(form as any).lead_temperature || "warm"}
              onChange={(e) => setForm({ ...form, lead_temperature: e.target.value } as any)}
              className="border border-input bg-background text-sm rounded-md px-2 py-1"
            >
              <option value="hot">🔥 Hot</option>
              <option value="warm">☀️ Warm</option>
              <option value="cold">❄️ Cold</option>
            </select>
          </div>
        )}

        {SHOW_LEAD_SCORE && (
          <div className="grid gap-2">
            <Label htmlFor="lead_score">Lead Score (0–100)</Label>
            <Input
              id="lead_score"
              type="number"
              min="0"
              max="100"
              value={(form as any).lead_score || 50}
              onChange={(e) => setForm({ ...form, lead_score: parseInt(e.target.value) || 50 } as any)}
            />
          </div>
        )}

        {/* Contact Info */}
        <div className="grid gap-2">
          <Label htmlFor="contact_person">Contact Person</Label>
          <Input
            id="contact_person"
            {...register("contact_person")}
            className={errors.contact_person ? "border-red-500" : ""}
          />
          {errors.contact_person && (
            <p className="text-sm text-red-500">{errors.contact_person.message}</p>
          )}
        </div>

        <div className="grid gap-2">
          <Label htmlFor="contact_title">Title</Label>
          <Input
            id="contact_title"
            {...register("contact_title")}
            className={errors.contact_title ? "border-red-500" : ""}
          />
          {errors.contact_title && (
            <p className="text-sm text-red-500">{errors.contact_title.message}</p>
          )}
        </div>

        <div className="grid gap-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            {...register("email")}
            className={errors.email ? "border-red-500" : ""}
          />
          {errors.email && (
            <p className="text-sm text-red-500">{errors.email.message}</p>
          )}
        </div>

        {/* Primary Phone */}
        <div className="grid gap-2">
          <Label htmlFor="phone">Primary Phone</Label>
          <div className="flex gap-2">
            <PhoneInput
              value={watch("phone") || ""}
              onChange={(cleanedPhone) => setValue("phone", cleanedPhone)}
              placeholder="(123) 456-7890"
              className={`flex-1 ${errors.phone ? "border-red-500" : ""}`}
            />
            <select
              {...register("phone_label")}
              className={`border border-input bg-background text-sm rounded-md px-2 py-1 w-20 ${
                errors.phone_label ? "border-red-500" : ""
              }`}
            >
              <option value="work">Work</option>
              <option value="mobile">Mobile</option>
              <option value="home">Home</option>
            </select>
          </div>
          {(errors.phone || errors.phone_label) && (
            <p className="text-sm text-red-500">
              {errors.phone?.message || errors.phone_label?.message}
            </p>
          )}
        </div>

        {/* Secondary Phone */}
        <div className="grid gap-2">
          <Label htmlFor="secondary_phone">Secondary Phone</Label>
          <div className="flex gap-2">
            <PhoneInput
              value={watch("secondary_phone") || ""}
              onChange={(cleanedPhone) => setValue("secondary_phone", cleanedPhone)}
              placeholder="(123) 555-6789"
              className={`flex-1 ${errors.secondary_phone ? "border-red-500" : ""}`}
            />
            <select
              {...register("secondary_phone_label")}
              className={`border border-input bg-background text-sm rounded-md px-2 py-1 w-20 ${
                errors.secondary_phone_label ? "border-red-500" : ""
              }`}
            >
              <option value="mobile">Mobile</option>
              <option value="work">Work</option>
              <option value="home">Home</option>
            </select>
          </div>
          {(errors.secondary_phone || errors.secondary_phone_label) && (
            <p className="text-sm text-red-500">
              {errors.secondary_phone?.message || errors.secondary_phone_label?.message}
            </p>
          )}
        </div>

        {/* Address */}
        <div className="grid gap-2">
          <Label htmlFor="address">Address</Label>
          <Input
            id="address"
            {...register("address")}
            className={errors.address ? "border-red-500" : ""}
          />
          {errors.address && (
            <p className="text-sm text-red-500">{errors.address.message}</p>
          )}
        </div>

        <div className="grid grid-cols-3 gap-2">
          <div>
            <Label htmlFor="city">City</Label>
            <Input
              id="city"
              {...register("city")}
              className={errors.city ? "border-red-500" : ""}
            />
            {errors.city && (
              <p className="text-sm text-red-500">{errors.city.message}</p>
            )}
          </div>
          <div>
            <Label htmlFor="state">State</Label>
            <Input
              id="state"
              {...register("state")}
              className={errors.state ? "border-red-500" : ""}
            />
            {errors.state && (
              <p className="text-sm text-red-500">{errors.state.message}</p>
            )}
          </div>
          <div>
            <Label htmlFor="zip">Zip</Label>
            <Input
              id="zip"
              {...register("zip")}
              className={errors.zip ? "border-red-500" : ""}
            />
            {errors.zip && (
              <p className="text-sm text-red-500">{errors.zip.message}</p>
            )}
          </div>
        </div>

        {/* Notes */}
        <div className="grid gap-2">
          <Label htmlFor="notes">Notes</Label>
          <Textarea
            id="notes"
            {...register("notes")}
            placeholder="Additional notes about this lead..."
            className={errors.notes ? "border-red-500" : ""}
          />
          {errors.notes && (
            <p className="text-sm text-red-500">{errors.notes.message}</p>
          )}
        </div>
      </div>

      {/* Sticky Save/Cancel Footer */}
      <div className="sticky bottom-0 bg-white pt-4 border-t flex justify-end gap-2 z-10">
        <button
          type="button"
          onClick={handleCancel}
          className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? "Saving..." : "Save"}
        </button>
      </div>
    </form>
  );
}
