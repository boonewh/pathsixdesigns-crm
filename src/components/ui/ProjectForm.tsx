import React from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Project } from "@/types";
import PhoneInput from "@/components/ui/PhoneInput";
import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { PROJECT_STATUSES, PROJECT_TYPES, projectCreateSchema, projectUpdateSchema, type ProjectCreateInput, type ProjectUpdateInput } from "@/schemas/projectSchemas";

// TEMP: All Seasons Foam prefers "Accounts" instead of "Clients"
const USE_ACCOUNT_LABELS = true;

interface ProjectFormProps {
  form: Partial<Project>;
  setForm: React.Dispatch<React.SetStateAction<Partial<Project>>>;
  clients: { id: number; name: string }[];
  leads: { id: number; name: string }[];
  onSave: (data: ProjectCreateInput | ProjectUpdateInput) => void;
  onCancel: () => void;
  isEditing?: boolean;
}

type ContactOption = {
  id: number;
  name: string;
  title?: string;
  email?: string;
  phone?: string;
  phone_label?: "work" | "mobile" | "home";
};

// Project type options - matches backend constants
const TYPE_OPTIONS = PROJECT_TYPES;

// Project status options - matches backend constants
const STATUS_OPTIONS = PROJECT_STATUSES;

export default function ProjectForm({ form, setForm, clients, leads, onSave, onCancel, isEditing = false }: ProjectFormProps) {
  const [contactOptions, setContactOptions] = useState<ContactOption[]>([]);
  
  // Determine which schema to use based on editing mode
  const schema = isEditing ? projectUpdateSchema : projectCreateSchema;

  // Set up React Hook Form with Zod validation
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<ProjectCreateInput | ProjectUpdateInput>({
    resolver: zodResolver(schema),
    defaultValues: {
      project_name: form.project_name || "",
      type: form.type || "None",
      project_description: form.project_description || "",
      project_status: form.project_status || "active",
      project_start: form.project_start || "",
      project_end: form.project_end || "",
      project_worth: form.project_worth || undefined,
      client_id: form.client_id || undefined,
      lead_id: form.lead_id || undefined,
      notes: form.notes || "",
      primary_contact_name: form.primary_contact_name || "",
      primary_contact_title: form.primary_contact_title || "",
      primary_contact_email: form.primary_contact_email || "",
      primary_contact_phone: form.primary_contact_phone || "",
      primary_contact_phone_label: form.primary_contact_phone_label || "work",
    },
  });

  // Watch all form values to sync with parent component state
  const watchedValues = watch();

  // Sync form state with parent component
  React.useEffect(() => {
    setForm(watchedValues as Partial<Project>);
  }, [watchedValues, setForm]);

  // Handle form submission with validation
  const onSubmit = (data: ProjectCreateInput | ProjectUpdateInput) => {
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
        {/* Basic Project Information */}
        <div className="grid gap-2">
          <Label htmlFor="project_name">Project Name *</Label>
          <Input
            id="project_name"
            {...register("project_name")}
            className={errors.project_name ? "border-red-500" : ""}
          />
          {errors.project_name && (
            <p className="text-sm text-red-500">{errors.project_name.message}</p>
          )}
        </div>

        <div className="grid gap-2">
          <Label htmlFor="type">Type</Label>
          <select
            id="type"
            {...register("type")}
            className={`border border-input bg-background text-sm rounded-md px-2 py-1 ${
              errors.type ? "border-red-500" : ""
            }`}
          >
            {TYPE_OPTIONS.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
          {errors.type && (
            <p className="text-sm text-red-500">{errors.type.message}</p>
          )}
        </div>

        <div className="grid gap-2">
          <Label htmlFor="project_status">Status</Label>
          <select
            id="project_status"
            {...register("project_status")}
            className={`border border-input bg-background text-sm rounded-md px-2 py-1 ${
              errors.project_status ? "border-red-500" : ""
            }`}
          >
            {STATUS_OPTIONS.map((status) => (
              <option key={status} value={status}>
                {status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
              </option>
            ))}
          </select>
          {errors.project_status && (
            <p className="text-sm text-red-500">{errors.project_status.message}</p>
          )}
        </div>

        {/* Entity Assignment */}
        <div className="grid grid-cols-2 gap-4">
          <div className="grid gap-2">
            <Label htmlFor="client_id">{USE_ACCOUNT_LABELS ? "Account" : "Client"} (Optional)</Label>
            <select
              id="client_id"
              value={form.client_id || ""}
              onChange={async (e) => {
                const clientId = e.target.value ? parseInt(e.target.value) : undefined;
                setForm({ ...form, client_id: clientId, lead_id: undefined });

                if (clientId) {
                  const res = await apiFetch(`/clients/${clientId}`);
                  const data = await res.json();

                  // Set form with primary contact info
                  setForm((prev) => ({
                    ...prev,
                    primary_contact_name: data.contact_person || "",
                    primary_contact_title: data.contact_title || "",
                    primary_contact_email: data.email || "",
                    primary_contact_phone: data.phone || "",
                    primary_contact_phone_label: data.phone_label || "work",
                  }));

                  // Add both primary and additional contacts to the dropdown
                  const primary: ContactOption = {
                    id: 0,
                    name: data.contact_person || "Primary Contact",
                    title: data.contact_title || "",
                    email: data.email || "",
                    phone: data.phone || "",
                    phone_label: data.phone_label || "work",
                  };

                  const extras = (data.contacts || []).map((c: any) => ({
                    id: c.id,
                    name: c.name,
                    title: c.title,
                    email: c.email,
                    phone: c.phone,
                    phone_label: c.phone_label,
                  }));

                  setContactOptions([primary, ...extras]);
                } else {
                  // If client deselected, clear contacts
                  setContactOptions([]);
                }
              }}

              className="border border-input bg-background text-sm rounded-md px-2 py-1"
            >
              <option value="">-- No {USE_ACCOUNT_LABELS ? "Account" : "Client"} --</option>
              {clients.map((client) => (
                <option key={client.id} value={client.id}>
                  {client.name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="lead_id">Lead (Optional)</Label>
            <select
              id="lead_id"
              value={form.lead_id || ""}
              onChange={async (e) => {
                const leadId = e.target.value ? parseInt(e.target.value) : undefined;
                setForm({ ...form, lead_id: leadId, client_id: undefined });

                if (leadId) {
                  const res = await apiFetch(`/leads/${leadId}`);
                  const data = await res.json();

                  setForm((prev) => ({
                    ...prev,
                    primary_contact_name: data.contact_person || "",
                    primary_contact_title: data.contact_title || "",
                    primary_contact_email: data.email || "",
                    primary_contact_phone: data.phone || "",
                    primary_contact_phone_label: data.phone_label || "work",
                  }));

                  const primary: ContactOption = {
                    id: 0,
                    name: data.contact_person || "Primary Contact",
                    title: data.contact_title || "",
                    email: data.email || "",
                    phone: data.phone || "",
                    phone_label: data.phone_label || "work",
                  };

                  const extras = (data.contacts || []).map((c: any) => ({
                    id: c.id,
                    name: c.name,
                    title: c.title,
                    email: c.email,
                    phone: c.phone,
                    phone_label: c.phone_label,
                  }));

                  setContactOptions([primary, ...extras]);
                } else {
                  setContactOptions([]);
                }
              }}


              className="border border-input bg-background text-sm rounded-md px-2 py-1"
            >
              <option value="">-- No Lead --</option>
              {leads.map((lead) => (
                <option key={lead.id} value={lead.id}>
                  {lead.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Primary Contact */}
        <div className="border-t pt-4">
          {contactOptions.length > 0 && (
            <div className="grid gap-2 mt-4 mb-4">
              <Label htmlFor="contact_picker" className="text-lg font-medium">Choose a contact.</Label>
              <select
                id="contact_picker"
                onChange={(e) => {
                  const selected = contactOptions.find(c => c.id === parseInt(e.target.value));
                  if (selected) {
                    setForm((prev) => ({
                      ...prev,
                      primary_contact_name: selected.name || "",
                      primary_contact_title: selected.title || "",
                      primary_contact_email: selected.email || "",
                      primary_contact_phone: selected.phone || "",
                      primary_contact_phone_label: (selected.phone_label as "work" | "mobile" | "home") || "work",
                    }));
                  }
                }}
                className="border border-input bg-background text-sm rounded-md px-2 py-1"
              >
                <option value="">-- Select a contact --</option>
                {contactOptions.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} {c.title ? `(${c.title})` : ""}
                  </option>
                ))}
              </select>
            </div>
          )}
          <h3 className="text-lg font-semibold text-gray-800 mb-3">Primary Contact</h3>
          <p className="text-sm text-gray-600 mb-4">
            For standalone projects, add contact information. This will be used for interactions and follow-ups.
          </p>

          <div className="grid gap-2 mb-4">
            <Label htmlFor="primary_contact_name">Contact Name</Label>
            <Input
              id="primary_contact_name"
              {...register("primary_contact_name")}
              placeholder="John Doe"
              className={errors.primary_contact_name ? "border-red-500" : ""}
            />
            {errors.primary_contact_name && (
              <p className="text-sm text-red-500">{errors.primary_contact_name.message}</p>
            )}
          </div>

          <div className="grid gap-2 mb-4">
            <Label htmlFor="primary_contact_title">Contact Title</Label>
            <Input
              id="primary_contact_title"
              {...register("primary_contact_title")}
              placeholder="Project Manager"
              className={errors.primary_contact_title ? "border-red-500" : ""}
            />
            {errors.primary_contact_title && (
              <p className="text-sm text-red-500">{errors.primary_contact_title.message}</p>
            )}
          </div>

          <div className="grid gap-2 mb-4">
            <Label htmlFor="primary_contact_email">Contact Email</Label>
            <Input
              id="primary_contact_email"
              type="email"
              {...register("primary_contact_email")}
              placeholder="john.doe@company.com"
              className={errors.primary_contact_email ? "border-red-500" : ""}
            />
            {errors.primary_contact_email && (
              <p className="text-sm text-red-500">{errors.primary_contact_email.message}</p>
            )}
          </div>

          <div className="grid gap-2 mb-4">
            <Label htmlFor="primary_contact_phone">Contact Phone</Label>
            <div className="flex gap-2">
              <PhoneInput
                value={watch("primary_contact_phone") || ""}
                onChange={(cleanedPhone) => setValue("primary_contact_phone", cleanedPhone)}
                placeholder="(123) 456-7890"
                className={`flex-1 ${errors.primary_contact_phone ? "border-red-500" : ""}`}
              />
              <select
                {...register("primary_contact_phone_label")}
                className={`border border-input bg-background text-sm rounded-md px-2 py-1 w-20 ${
                  errors.primary_contact_phone_label ? "border-red-500" : ""
                }`}
              >
                <option value="work">Work</option>
                <option value="mobile">Mobile</option>
                <option value="home">Home</option>
              </select>
            </div>
            {(errors.primary_contact_phone || errors.primary_contact_phone_label) && (
              <p className="text-sm text-red-500">
                {errors.primary_contact_phone?.message || errors.primary_contact_phone_label?.message}
              </p>
            )}
          </div>
        </div>

        {/* Project Details */}
        <div className="grid gap-2 mb-4">
          <Label htmlFor="project_description">Description</Label>
          <Textarea
            id="project_description"
            {...register("project_description")}
            placeholder="Project description..."
            className={errors.project_description ? "border-red-500" : ""}
          />
          {errors.project_description && (
            <p className="text-sm text-red-500">{errors.project_description.message}</p>
          )}
        </div>

        <div className="grid gap-2 mb-4">
          <Label htmlFor="project_worth">Project Worth ($)</Label>
          <Input
            id="project_worth"
            type="number"
            min="0"
            step="0.01"
            {...register("project_worth", { valueAsNumber: true })}
            className={errors.project_worth ? "border-red-500" : ""}
          />
          {errors.project_worth && (
            <p className="text-sm text-red-500">{errors.project_worth.message}</p>
          )}
        </div>

        {/* Timeline */}
        <div className="grid grid-cols-2 gap-4">
          <div className="grid gap-2">
            <Label htmlFor="project_start">Start Date</Label>
            <Input
              id="project_start"
              type="date"
              {...register("project_start")}
              className={errors.project_start ? "border-red-500" : ""}
            />
            {errors.project_start && (
              <p className="text-sm text-red-500">{errors.project_start.message}</p>
            )}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="project_end">End Date</Label>
            <Input
              id="project_end"
              type="date"
              {...register("project_end")}
              className={errors.project_end ? "border-red-500" : ""}
            />
            {errors.project_end && (
              <p className="text-sm text-red-500">{errors.project_end.message}</p>
            )}
          </div>
        </div>

        <div className="grid gap-2">
          <Label htmlFor="notes">Notes</Label>
          <Textarea
            id="notes"
            {...register("notes")}
            placeholder="Additional notes..."
            className={errors.notes ? "border-red-500" : ""}
          />
          {errors.notes && (
            <p className="text-sm text-red-500">{errors.notes.message}</p>
          )}
        </div>

        {!form.client_id && !form.lead_id && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3 pb-20">
            <div className="flex items-center gap-2">
              <span className="text-yellow-600">⚠️</span>
              <p className="text-sm text-yellow-800">
                <strong>Standalone Project:</strong> This project is not linked to a {USE_ACCOUNT_LABELS ? "account" : "client"} or lead.
                Make sure to add contact information above for proper interaction tracking.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Sticky Save/Cancel Footer */}
      <div className="sticky bottom-0 bg-white pt-4 border-t flex justify-end gap-2 z-10 px-4 pb-4">
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
