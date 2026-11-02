import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/authContext";
import { useCRMConfig } from "@/config/crmConfig";

import {
  LayoutDashboard,
  Users,
  UserPlus,
  Briefcase,
  FolderKanban,
  FileText,
  Settings,
  Calendar as CalendarIcon,
  ChevronLeft,
  X,
  Upload,
  Trash,
  Archive,
  BarChart3,
} from "lucide-react";

const SHOW_REAL_ACCOUNTS_SECTION = false;

interface SidebarNavProps {
  collapsed: boolean;
  toggleCollapsed: () => void;
  isMobileOpen: boolean;
  closeMobile: () => void;
}


function SidebarContent({
  collapsed,
  closeMobile,
  toggleCollapsed,
}: Pick<SidebarNavProps, "collapsed" | "closeMobile" | "toggleCollapsed">) {
  const location = useLocation();
  const { user } = useAuth();
  const config = useCRMConfig();
  const clientLabel = config.labels?.client || "Client";
  const useAccountStyle = clientLabel.toLowerCase() === "account";

  const isAdmin = !!user?.roles.includes("admin");

  // Grouped by what people do. Routes and admin-only rules are unchanged.
  const navSections = [
    {
      section: "Sales",
      items: [
        { label: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
        { label: "Leads", path: "/leads", icon: UserPlus },
        {
          label: `${clientLabel}s`,
          path: "/clients",
          icon: useAccountStyle ? Briefcase : Users,
        },
        ...(SHOW_REAL_ACCOUNTS_SECTION
          ? [{ label: "Accounts", path: "/accounts", icon: Briefcase }]
          : []),
        { label: "Projects", path: "/projects", icon: FolderKanban },
        { label: "Calendar", path: "/calendar", icon: CalendarIcon },
      ],
    },
    {
      section: "Insights",
      items: [
        ...(isAdmin ? [{ label: "Reports", path: "/reports", icon: BarChart3 }] : []),
        { label: "Files", path: "/vault", icon: Archive },
      ],
    },
    {
      section: "Workspace",
      items: [
        { label: "Settings", path: "/settings", icon: Settings },
        { label: "Deletes", path: "/trash", icon: Trash },
      ],
    },
    ...(isAdmin
      ? [
          {
            section: "Admin",
            items: [
              { label: "Users", path: "/admin/users", icon: Users },
              { label: "Leads Overview", path: "/admin/leads", icon: UserPlus },
              { label: `${clientLabel}s Overview`, path: "/admin/clients", icon: Briefcase },
              { label: "Interactions Overview", path: "/admin/interactions", icon: FileText },
              { label: "Projects Overview", path: "/admin/projects", icon: FolderKanban },
              { label: "Data Import", path: "/admin/import", icon: Upload },
              // DISABLED: Backup feature - possible future project
              // { label: "Database Backups", path: "/admin/backups", icon: Database },
            ],
          },
        ]
      : []),
  ];

  return (
    <div
      className={`flex flex-col gap-5 bg-chrome text-chrome-foreground px-3 pt-4 pb-6 min-h-full transition-[width] duration-300 ease-in-out ${
        collapsed ? "w-20" : "w-64"
      }`}
    >
      <div className={`flex items-center ${collapsed ? "flex-col gap-3" : "justify-between px-2"}`}>
        {collapsed ? (
          config.branding?.logoCompact ? (
            <img src={config.branding.logoCompact} alt="Logo" className="w-8 h-auto rounded bg-white p-0.5" />
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 96 96" role="img" aria-label="PathSix">
              <text x="10" y="68" fontFamily="Arial, sans-serif" fontSize="64" fontWeight="700" letterSpacing="-2" fill="#FFFFFF">P<tspan fill="#F59E0B">6</tspan></text>
            </svg>
          )
        ) : config.branding?.logo ? (
          <img src={config.branding.logo} alt={config.branding?.companyName || "CRM Logo"} className="max-w-[160px] h-auto rounded bg-white px-2 py-1" />
        ) : (
          // One <text> with tspans so "PathSix" always renders as one word,
          // whatever font the browser falls back to.
          <svg xmlns="http://www.w3.org/2000/svg" width="160" height="32" viewBox="0 0 360 72" role="img" aria-label="PathSix CRM">
            <text x="0" y="50" fontFamily="Arial, sans-serif" fontSize="44" fontWeight="700" letterSpacing="-2" fill="#FFFFFF">
              Path<tspan fill="#F59E0B">Six</tspan><tspan dx="14" fontSize="26" fontWeight="600" letterSpacing="-1" fill="#9AA6C4">CRM</tspan>
            </text>
          </svg>
        )}
        <button
          onClick={toggleCollapsed}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          className="hidden lg:inline-flex p-1 rounded text-chrome-muted hover:text-white hover:bg-chrome-hover"
        >
          <span className={`inline-block transition-transform duration-300 ${collapsed ? "rotate-180" : ""}`}>
            <ChevronLeft size={18} />
          </span>
        </button>
      </div>

      <nav className="flex flex-col gap-5" aria-label="Main">
        {navSections.filter((g) => g.items.length > 0).map((group) => (
          <div key={group.section}>
            {!collapsed && (
              <p className="px-3 mb-1 text-[11px] font-semibold uppercase tracking-wider text-chrome-muted">
                {group.section}
              </p>
            )}
            <div className="flex flex-col gap-0.5">
              {group.items.map((item) => {
                const Icon = item.icon;
                const isActive =
                  location.pathname === item.path ||
                  location.pathname.startsWith(item.path + "/");

                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    title={collapsed ? item.label : undefined}
                    aria-current={isActive ? "page" : undefined}
                    className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                      collapsed ? "justify-center" : ""
                    } ${
                      isActive
                        ? "bg-chrome-hover text-white shadow-[inset_3px_0_0_#F59E0B]"
                        : "hover:bg-chrome-hover hover:text-white"
                    }`}
                    onClick={closeMobile}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    {!collapsed && <span className="truncate">{item.label}</span>}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>
    </div>
  );
}

export default function SidebarNav({
  collapsed,
  toggleCollapsed,
  isMobileOpen,
  closeMobile,
}: SidebarNavProps) {
  return (
    <>
      {/* Desktop Sidebar */}
      <div className="hidden lg:block">
        <SidebarContent
          collapsed={collapsed}
          toggleCollapsed={toggleCollapsed}
          closeMobile={closeMobile}
        />
      </div>

      {/* Mobile Drawer */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50 transition-opacity duration-300"
            onClick={closeMobile}
          ></div>

          {/* Sliding Sidebar */}
          <div className="relative z-10 w-64 h-screen overflow-y-auto bg-chrome shadow-lg transform transition-transform duration-300 translate-x-0">
            <button
              onClick={closeMobile}
              aria-label="Close menu"
              className="absolute top-3 right-3 z-10 text-chrome-muted hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="min-h-full">
              <SidebarContent
                collapsed={false}
                toggleCollapsed={toggleCollapsed}
                closeMobile={closeMobile}
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
