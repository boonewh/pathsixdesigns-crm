import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Mail, Phone, Search, Star } from "lucide-react";
import { useAuth } from "@/authContext";
import { apiFetchJson } from "@/lib/api";
import { formatPhoneNumber } from "@/lib/phoneUtils";
import { useCRMConfig } from "@/config/crmConfig";
import { Input } from "@/components/ui/input";
import PaginationControls from "@/components/ui/PaginationControls";

type ParentType = "client" | "lead" | "project";

interface DirectoryContact {
  id: number;
  name: string | null;
  title: string | null;
  email: string | null;
  phone: string | null;
  phone_label: string | null;
  is_primary: boolean;
  parent: { type: ParentType; id: number; name: string | null };
}

interface DirectoryPage {
  contacts: DirectoryContact[];
  total: number;
  page: number;
  per_page: number;
}

const PATHS: Record<ParentType, string> = { client: "/clients", lead: "/leads", project: "/projects" };

// Everyone in the CRM, alphabetically, with the record they belong to.
export default function ContactsPage() {
  const { token } = useAuth();
  const config = useCRMConfig();
  const labels: Record<ParentType, string> = {
    client: config.labels?.client || "Client",
    lead: config.labels?.lead || "Lead",
    project: config.labels?.project || "Project",
  };

  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(50);
  const [data, setData] = useState<DirectoryPage | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Wait for typing to pause before searching.
  useEffect(() => {
    const timer = setTimeout(() => {
      setQuery(search.trim());
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), per_page: String(perPage) });
    if (query) params.set("q", query);
    apiFetchJson(`/contacts/directory?${params}`, { headers: { Authorization: `Bearer ${token}` } })
      .then((result: DirectoryPage) => {
        if (!cancelled) {
          setData(result);
          setError("");
        }
      })
      .catch(() => !cancelled && setError("Contacts could not be loaded."))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [token, page, perPage, query]);

  // Group consecutive rows under their first letter; nameless people go under "#".
  const groups = useMemo(() => {
    const result: { letter: string; contacts: DirectoryContact[] }[] = [];
    for (const contact of data?.contacts ?? []) {
      const first = contact.name?.trim()[0]?.toUpperCase() ?? "";
      const letter = /[A-Z]/.test(first) ? first : "#";
      const last = result[result.length - 1];
      if (last && last.letter === letter) last.contacts.push(contact);
      else result.push({ letter, contacts: [contact] });
    }
    return result;
  }, [data]);

  const parentLink = (contact: DirectoryContact) => (
    <Link to={`${PATHS[contact.parent.type]}/${contact.parent.id}`} className="text-blue-600 hover:underline">
      <span className="text-gray-500">{labels[contact.parent.type]}:</span> {contact.parent.name || "Untitled"}
    </Link>
  );

  return (
    <div className="p-4 lg:p-6">
      <div className="flex justify-between items-center gap-4 mb-4">
        <h1 className="text-2xl font-bold">Contacts</h1>
        {data && <span className="text-sm text-gray-500">{data.total} {data.total === 1 ? "person" : "people"}</span>}
      </div>

      <div className="relative mb-4 max-w-md">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={`Search name, email, phone or ${labels.client.toLowerCase()}…`}
          className="pl-9"
          aria-label="Search contacts"
        />
      </div>

      {error && <p className="text-red-500 mb-4">{error}</p>}

      {loading && !data ? (
        <p className="text-gray-500">Loading contacts…</p>
      ) : data && data.contacts.length === 0 ? (
        <div className="bg-white border rounded-lg p-8 text-center text-gray-500">
          {query ? `No contacts match "${query}".` : "No contacts yet. People you add to leads, clients and projects appear here."}
        </div>
      ) : (
        <div className={`bg-white border rounded-lg shadow-sm overflow-hidden ${loading ? "opacity-60" : ""}`}>
          {groups.map((group) => (
            <section key={`${group.letter}-${group.contacts[0].id}`} aria-label={`Contacts starting with ${group.letter}`}>
              <h2 className="sticky top-0 bg-gray-50 border-b px-4 py-1 text-xs font-semibold text-gray-500">
                {group.letter}
              </h2>
              <ul className="divide-y">
                {group.contacts.map((contact) => (
                  <li key={contact.id} className="px-4 py-3 grid gap-1 md:grid-cols-[minmax(0,2fr)_minmax(0,2fr)_minmax(0,2fr)] md:gap-4 md:items-center">
                    <div className="min-w-0">
                      <div className="font-medium text-gray-900 truncate flex items-center gap-1.5">
                        {contact.name || <span className="text-gray-500 italic">No name</span>}
                        {contact.is_primary && contact.parent.type !== "project" && (
                          <Star size={12} className="text-amber-500 fill-amber-500 flex-shrink-0" aria-label="Primary contact" />
                        )}
                      </div>
                      {contact.title && <div className="text-sm text-gray-500 truncate">{contact.title}</div>}
                    </div>
                    <div className="text-sm min-w-0 truncate">{parentLink(contact)}</div>
                    <div className="text-sm text-gray-600 min-w-0 space-y-0.5">
                      {contact.email && (
                        <a href={`mailto:${contact.email}`} className="flex items-center gap-1.5 text-blue-600 hover:underline truncate">
                          <Mail size={12} className="flex-shrink-0" />
                          <span className="truncate">{contact.email}</span>
                        </a>
                      )}
                      {contact.phone && (
                        <a href={`tel:${contact.phone}`} className="flex items-center gap-1.5 text-blue-600 hover:underline">
                          <Phone size={12} className="flex-shrink-0" />
                          <span className="whitespace-nowrap">{formatPhoneNumber(contact.phone)}</span>
                          {contact.phone_label && <span className="text-gray-500">({contact.phone_label})</span>}
                        </a>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}

      {data && data.total > perPage && (
        <PaginationControls
          className="mt-4"
          currentPage={page}
          perPage={perPage}
          total={data.total}
          sortOrder="alphabetical"
          onPageChange={setPage}
          onPerPageChange={(value) => {
            setPerPage(value);
            setPage(1);
          }}
          onSortOrderChange={() => {}}
          showSortOrder={false}
          entityName="contacts"
          perPageOptions={[25, 50, 100, 200]}
        />
      )}
    </div>
  );
}
