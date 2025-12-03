import React from "react";
import { useEffect, useState } from "react";
import { UserPlus, MoreVertical } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { apiFetch } from "@/lib/api";
import { formatPhoneNumber } from "@/lib/phoneUtils";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { contactCreateSchema, contactUpdateSchema, type ContactCreateInput, type ContactUpdateInput } from "@/schemas/contactSchemas";
import { Contact } from "@/types";

type Props = {
  token: string;
  entityType: "client" | "lead";
  entityId: number;
};

export default function CompanyContacts({ token, entityType, entityId }: Props) {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<Partial<Contact>>({});
  const [editingId, setEditingId] = useState<number | null>(null);
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);

  // Determine which schema to use based on editing mode
  const schema = editingId ? contactUpdateSchema : contactCreateSchema;

  // Set up React Hook Form with Zod validation
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<ContactCreateInput | ContactUpdateInput>({
    resolver: zodResolver(schema),
    defaultValues: {
      first_name: "",
      last_name: "",
      title: "",
      email: "",
      phone: "",
      phone_label: "work",
      secondary_phone: "",
      secondary_phone_label: "mobile",
      notes: "",
    },
  });

  // Watch all form values to sync with parent component state
  const watchedValues = watch();

  // Sync form state with parent component
  React.useEffect(() => {
    setForm(watchedValues as Partial<Contact>);
  }, [watchedValues]);

  const loadContacts = async () => {
    const res = await apiFetch(`/contacts/?${entityType}_id=${entityId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    setContacts(data);
  };

  useEffect(() => {
    loadContacts();
  }, [entityType, entityId]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const menu = document.getElementById("kabob-menu");
      if (menu && !menu.contains(e.target as Node)) {
        setOpenMenuId(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const resetForm = () => {
    reset();
    setEditingId(null);
    setShowForm(false);
  };

  const handleSave = async (data: ContactCreateInput | ContactUpdateInput) => {
    const url = editingId ? `/contacts/${editingId}` : "/contacts/";
    const method = editingId ? "PUT" : "POST";

    const res = await apiFetch(url, {
      method,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ ...data, [`${entityType}_id`]: entityId }),
    });

    if (res.ok) {
      await loadContacts();
      resetForm();
    } else {
      alert("Failed to save contact");
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this contact?")) return;
    const res = await apiFetch(`/contacts/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) {
      await loadContacts();
    } else {
      alert("Failed to delete contact.");
    }
  };

  return (
    <details className="bg-white rounded shadow-sm border">
      <summary className="cursor-pointer px-4 py-2 font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-t flex items-center gap-2">
        <UserPlus size={16} /> Additional Contacts ({contacts.length})
      </summary>

      <div className="p-4 space-y-4">
        {showForm && (
          <form onSubmit={handleSubmit(handleSave)} className="space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Input
                  placeholder="First Name"
                  {...register("first_name")}
                  className={errors.first_name ? "border-red-500" : ""}
                />
                {errors.first_name && (
                  <p className="text-sm text-red-500 mt-1">{errors.first_name.message}</p>
                )}
              </div>
              <div>
                <Input
                  placeholder="Last Name"
                  {...register("last_name")}
                  className={errors.last_name ? "border-red-500" : ""}
                />
                {errors.last_name && (
                  <p className="text-sm text-red-500 mt-1">{errors.last_name.message}</p>
                )}
              </div>
            </div>
            <div>
              <Input
                placeholder="Title"
                {...register("title")}
                className={errors.title ? "border-red-500" : ""}
              />
              {errors.title && (
                <p className="text-sm text-red-500 mt-1">{errors.title.message}</p>
              )}
            </div>
            <div>
              <Input
                placeholder="Email"
                type="email"
                {...register("email")}
                className={errors.email ? "border-red-500" : ""}
              />
              {errors.email && (
                <p className="text-sm text-red-500 mt-1">{errors.email.message}</p>
              )}
            </div>

            <div className="grid grid-cols-3 gap-2">
              <Input
                placeholder="Phone"
                {...register("phone")}
                className={`col-span-2 ${errors.phone ? "border-red-500" : ""}`}
              />
              <select
                {...register("phone_label")}
                className={`border border-input bg-background text-sm rounded-md px-2 py-1 ${errors.phone_label ? "border-red-500" : ""}`}
              >
                <option value="work">Work</option>
                <option value="mobile">Mobile</option>
                <option value="home">Home</option>
                <option value="fax">Fax</option>
                <option value="other">Other</option>
              </select>
            </div>
            {(errors.phone || errors.phone_label) && (
              <p className="text-sm text-red-500 mt-1">
                {errors.phone?.message || errors.phone_label?.message}
              </p>
            )}

            <div className="grid grid-cols-3 gap-2">
              <Input
                placeholder="Secondary Phone"
                {...register("secondary_phone")}
                className={`col-span-2 ${errors.secondary_phone ? "border-red-500" : ""}`}
              />
              <select
                {...register("secondary_phone_label")}
                className={`border border-input bg-background text-sm rounded-md px-2 py-1 ${errors.secondary_phone_label ? "border-red-500" : ""}`}
              >
                <option value="mobile">Mobile</option>
                <option value="work">Work</option>
                <option value="home">Home</option>
                <option value="fax">Fax</option>
                <option value="other">Other</option>
              </select>
            </div>
            {(errors.secondary_phone || errors.secondary_phone_label) && (
              <p className="text-sm text-red-500 mt-1">
                {errors.secondary_phone?.message || errors.secondary_phone_label?.message}
              </p>
            )}

            <div>
              <Textarea
                placeholder="Notes"
                {...register("notes")}
                className={errors.notes ? "border-red-500" : ""}
              />
              {errors.notes && (
                <p className="text-sm text-red-500 mt-1">{errors.notes.message}</p>
              )}
            </div>

            <div className="flex gap-2 mt-3">
              <button
                type="submit"
                className="px-3 py-1 bg-green-500 text-white rounded text-sm"
              >
                Save
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="px-3 py-1 bg-gray-500 text-white rounded text-sm"
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Add Contact
          </button>
        )}

        <ul className="space-y-4">
          {contacts.map((c) => (
            <li key={c.id} className="border border-gray-300 p-4 rounded shadow-sm relative">
              <div className="font-semibold text-blue-800">
                {c.first_name} {c.last_name}{" "}
                {c.title && <span className="text-sm text-gray-500">({c.title})</span>}
              </div>
              {c.email && (
                <div className="text-sm">
                  📧 <a href={`mailto:${c.email}`} className="text-blue-600 underline">{c.email}</a>
                </div>
              )}
              {c.phone && (
                <div className="text-sm">
                  📞 <a href={`tel:${c.phone}`} className="text-blue-600 underline">{formatPhoneNumber(c.phone)}</a>
                  {c.phone_label && (
                    <span className="text-muted-foreground text-sm ml-1">
                      ({c.phone_label})
                    </span>
                  )}
                  {c.secondary_phone && (
                    <div>
                      ☎️ <a href={`tel:${c.secondary_phone}`} className="text-blue-600 underline">{formatPhoneNumber(c.secondary_phone)}</a>
                      {c.secondary_phone_label && (
                        <span className="text-muted-foreground text-sm ml-1">
                          ({c.secondary_phone_label})
                        </span>
                      )}
                    </div>
                  )}
                </div>
              )}
              {c.notes && (
                <div className="text-sm text-gray-700 mt-2 whitespace-pre-wrap">
                  📝 {c.notes}
                </div>
              )}

              <div className="absolute top-2 right-2" onClick={(e) => e.stopPropagation()}>
                <button
                  onClick={() => setOpenMenuId(openMenuId === c.id ? null : c.id)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <MoreVertical size={16} />
                </button>

                {openMenuId === c.id && (
                  <div id="kabob-menu" className="absolute right-0 mt-2 w-24 bg-white border rounded shadow-md z-50">
                    <button
                      className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-100"
                      onClick={() => {
                        reset({
                          first_name: c.first_name || "",
                          last_name: c.last_name || "",
                          title: c.title || "",
                          email: c.email || "",
                          phone: c.phone || "",
                          phone_label: c.phone_label || "work",
                          secondary_phone: c.secondary_phone || "",
                          secondary_phone_label: c.secondary_phone_label || "mobile",
                          notes: c.notes || "",
                        });
                        setEditingId(c.id);
                        setShowForm(true);
                        setOpenMenuId(null);
                      }}
                    >
                      Edit
                    </button>
                    <button
                      className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                      onClick={() => {
                        handleDelete(c.id);
                        setOpenMenuId(null);
                      }}
                    >
                      Delete
                    </button>
                  </div>
                )}
              </div>
            </li>
          ))}
        </ul>
      </div>
    </details>
  );
}