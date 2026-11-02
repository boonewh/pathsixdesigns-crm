import { Outlet, Navigate, Link, useLocation } from "react-router-dom";
import { useAuth } from "@/authContext";
import { useState, useEffect, useRef } from "react";
import SidebarNav from "@/components/SidebarNav";
import { apiFetchJson } from "@/lib/api";
import RequestActivity from "@/components/RequestActivity";
import { useCRMConfig } from "@/config/crmConfig";
import { Menu, MenuButton, MenuItem, MenuItems } from "@headlessui/react";
import { ChevronDown, Menu as MenuIcon, Search } from "lucide-react";

export default function ProtectedLayout() {
  const config = useCRMConfig();
  const { isAuthenticated, logout, token, user } = useAuth();
  const location = useLocation();
  const mainRef = useRef<HTMLElement>(null);

  const [collapsed, setCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [showResults, setShowResults] = useState(false);
  const searchRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    mainRef.current?.scrollTo({ top: 0 });
  }, [location.pathname]);

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      if (search.trim().length < 2) {
        setResults([]);
        setShowResults(false);
        return;
      }

      apiFetchJson(`/search/?q=${encodeURIComponent(search)}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((data) => {
          setResults(data);
          setShowResults(true);
        })
        .catch(() => {
          setResults([]);
          setShowResults(false);
        });
    }, 300);

    return () => clearTimeout(delayDebounce);
  }, [search, token]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowResults(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const handleUnauthorized = () => logout();
    window.addEventListener("unauthorized", handleUnauthorized);
    return () => window.removeEventListener("unauthorized", handleUnauthorized);
  }, []);

  if (!isAuthenticated) return <Navigate to="/login" replace />;

  return (
    <div className="flex min-h-screen bg-muted">
      {/* Sidebar (desktop + mobile) */}
      {/* Mobile backdrop */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      <div
        className={`
          fixed top-0 left-0 h-screen overflow-y-auto scrollbar-hide bg-chrome z-40 transition-all duration-300
          ${isMobileOpen ? "translate-x-0" : "-translate-x-full"}
          lg:translate-x-0
          ${collapsed ? "lg:w-20" : "lg:w-64"} 
          w-64
        `}
      >
        <SidebarNav
          collapsed={collapsed}
          toggleCollapsed={() => setCollapsed((prev) => !prev)}
          isMobileOpen={isMobileOpen}
          closeMobile={() => setIsMobileOpen(false)}
        />
      </div>

      {/* Main content */}
      <div
        className={`min-w-0 flex-1 flex flex-col transition-all duration-300 ${
          collapsed ? "lg:ml-20" : "lg:ml-64"
        }`}
      >
        <header className="flex flex-wrap items-center bg-chrome text-white px-4 lg:px-6 py-3 gap-x-4 gap-y-2 border-b border-white/10 relative">
          <button
            className="lg:hidden p-1 rounded text-chrome-foreground hover:text-white hover:bg-chrome-hover"
            onClick={() => setIsMobileOpen(true)}
            aria-label="Open menu"
          >
            <MenuIcon className="h-5 w-5" />
          </button>

          <span className="lg:hidden text-base font-bold tracking-tight whitespace-nowrap">
            PathSix CRM
          </span>

          <div className="relative order-last basis-full min-w-0 sm:order-none sm:basis-auto sm:flex-1 sm:max-w-md" ref={searchRef}>
            <Search aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-chrome-muted" />
            <input
              type="text"
              placeholder="Search..."
              aria-label="Search leads, accounts, contacts and projects"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-md border border-white/15 bg-chrome-hover pl-9 pr-3 py-1.5 text-sm text-white placeholder:text-chrome-muted focus:outline-none focus:ring-2 focus:ring-primary"
            />
            {showResults && results.length > 0 && (
              <div className="absolute left-0 right-0 mt-1 bg-white border rounded shadow-lg z-50 max-h-64 overflow-y-auto text-sm">
                {Object.entries(
                  results.reduce((acc: Record<string, any[]>, r) => {
                    acc[r.type] = acc[r.type] || [];
                    acc[r.type].push(r);
                    return acc;
                  }, {})
                ).map(([type, entries]) => (
                  <div key={type}>
                    <div className="px-4 py-2 font-semibold text-gray-500 uppercase text-xs border-b bg-gray-50">
                      {type === "client" ? config.labels.client : type}s
                    </div>
                    {entries.map((r) =>
                      r.link ? (
                        <Link
                          key={`${r.type}-${r.id}`}
                          to={r.link}
                          className="block px-4 py-2 hover:bg-gray-100 text-gray-800"
                          onClick={() => setShowResults(false)}
                        >
                          <div className="font-medium">{r.name}</div>
                          <div className="text-xs text-gray-500">
                            Matched on: {r.matches.join(", ")}
                          </div>
                        </Link>
                      ) : (
                        <div
                          key={`${r.type}-${r.id}`}
                          className="block px-4 py-2 text-gray-400 cursor-not-allowed"
                        >
                          <div className="font-medium">{r.name}</div>
                          <div className="text-xs text-gray-400">
                            Matched on: {r.matches.join(", ")}
                          </div>
                        </div>
                      )
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <RequestActivity />

          <Menu as="div" className="relative ml-auto">
            <MenuButton
              aria-label="Account menu"
              className="flex items-center gap-2 rounded-md px-1.5 py-1 text-chrome-foreground hover:bg-chrome-hover hover:text-white"
            >
              <span className="grid h-8 w-8 place-items-center rounded-full bg-primary text-xs font-semibold uppercase text-white">
                {(user?.email || "?").slice(0, 2)}
              </span>
              <ChevronDown className="hidden sm:block h-4 w-4" />
            </MenuButton>
            <MenuItems className="absolute right-0 z-50 mt-2 w-56 origin-top-right rounded-md border bg-white py-1 text-sm text-foreground shadow-lg focus:outline-none">
              {user?.email && (
                <div className="px-4 py-2 border-b">
                  <div className="text-xs text-muted-foreground">Signed in as</div>
                  <div className="truncate font-medium">{user.email}</div>
                </div>
              )}
              <MenuItem>
                <Link to="/settings" className="block px-4 py-2 data-[focus]:bg-muted">Settings</Link>
              </MenuItem>
              <MenuItem>
                <Link to="/change-password" className="block px-4 py-2 data-[focus]:bg-muted">Change password</Link>
              </MenuItem>
              <MenuItem>
                <Link to="/help" className="block px-4 py-2 data-[focus]:bg-muted">User Guide</Link>
              </MenuItem>
              <div className="my-1 border-t" />
              <MenuItem>
                <button onClick={logout} className="block w-full px-4 py-2 text-left data-[focus]:bg-muted">
                  Log out
                </button>
              </MenuItem>
            </MenuItems>
          </Menu>
        </header>

        <main ref={mainRef} className="flex-1 p-6 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
