import React from "react";
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Client } from "@/types";
import PhoneInput from "@/components/ui/PhoneInput";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { getClientTypes, CLIENT_STATUSES, getClientCreateSchema, getClientUpdateSchema, type ClientCreateInput, type ClientUpdateInput } from "@/schemas/clientSchemas";

interface ClientFormProps {
  form: Partial<Client>
  setForm: React.Dispatch<React.SetStateAction<Partial<Client>>>;
  onSave: (data: ClientCreateInput | ClientUpdateInput) => void;
  onCancel: () => void;
  isEditing?: boolean;
}

export default function ClientForm({ form, setForm, onSave, onCancel, isEditing = false }: ClientFormProps) {
  // Business type options - loaded lazily from tenant config
  const TYPE_OPTIONS = getClientTypes();

  // Determine which schema to use based on editing mode
  const schema = isEditing ? getClientUpdateSchema() : getClientCreateSchema();

  // Set up React Hook Form with Zod validation
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<ClientCreateInput | ClientUpdateInput>({
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
      notes: form.notes || "",
      type: form.type || "None",
      status: form.status || "new",
    },
  });

  // Watch all form values to sync with parent component state
  const watchedValues = watch();

  // Sync form state with parent component
  React.useEffect(() => {
    setForm(watchedValues as Partial<Client>);
  }, [watchedValues, setForm]);

  // Handle form submission with validation
  const onSubmit = (data: ClientCreateInput | ClientUpdateInput) => {
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
          <Label htmlFor="status">Status</Label>
          <select
            id="status"
            {...register("status")}
            className={`border border-input bg-background text-sm rounded-md px-2 py-1 ${
              errors.status ? "border-red-500" : ""
            }`}
          >
            {CLIENT_STATUSES.map((status) => (
              <option key={status} value={status}>
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </option>
            ))}
          </select>
          {errors.status && (
            <p className="text-sm text-red-500">{errors.status.message}</p>
          )}
        </div>

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

        <div className="grid gap-2">
          <Label htmlFor="phone">Phone</Label>
          <div className="grid grid-cols-3 gap-2">
            <PhoneInput
              value={watch("phone") || ""}
              onChange={(cleanedPhone) => setValue("phone", cleanedPhone)}
              placeholder="(123) 456-7890"
              className={`col-span-2 ${errors.phone ? "border-red-500" : ""}`}
            />
            <select
              {...register("phone_label")}
              className={`border border-input bg-background text-sm rounded-md px-2 py-1 ${
                errors.phone_label ? "border-red-500" : ""
              }`}
            >
              <option value="work">Work</option>
              <option value="mobile">Mobile</option>
              <option value="home">Home</option>
              <option value="fax">Fax</option>
              <option value="other">Other</option>
            </select>
          </div>
          {(errors.phone || errors.phone_label) && (
            <p className="text-sm text-red-500">
              {errors.phone?.message || errors.phone_label?.message}
            </p>
          )}
        </div>

        <div className="grid gap-2">
          <Label htmlFor="secondary_phone">Secondary Phone</Label>
          <div className="grid grid-cols-3 gap-2">
            <PhoneInput
              value={watch("secondary_phone") || ""}
              onChange={(cleanedPhone) => setValue("secondary_phone", cleanedPhone)}
              placeholder="(123) 555-6789"
              className={`col-span-2 ${errors.secondary_phone ? "border-red-500" : ""}`}
            />
            <select
              {...register("secondary_phone_label")}
              className={`border border-input bg-background text-sm rounded-md px-2 py-1 ${
                errors.secondary_phone_label ? "border-red-500" : ""
              }`}
            >
              <option value="mobile">Mobile</option>
              <option value="work">Work</option>
              <option value="home">Home</option>
              <option value="fax">Fax</option>
              <option value="other">Other</option>
            </select>
          </div>
          {(errors.secondary_phone || errors.secondary_phone_label) && (
            <p className="text-sm text-red-500">
              {errors.secondary_phone?.message || errors.secondary_phone_label?.message}
            </p>
          )}
        </div>

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
        <div className="grid gap-2">
          <Label htmlFor="notes">Notes</Label>
          <Textarea 
            id="notes" 
            {...register("notes")}
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
