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
  HelpCircle,
  Database
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

  const navSections = [
    {
      section: "Main",
      items: [
        { label: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
        { label: "Leads", path: "/leads", icon: UserPlus },
        {
          label: `${clientLabel}s`,
          path: "/clients",
          icon: useAccountStyle ? Briefcase : Users,
        },
        { label: "Calendar", path: "/calendar", icon: CalendarIcon },
      ],
    },
    ...(SHOW_REAL_ACCOUNTS_SECTION
      ? [{
          section: "Accounts",
          items: [{ label: "Accounts", path: "/accounts", icon: Briefcase }],
        }]
      : []),
    {
      section: "Projects",
      items: [{ label: "Projects", path: "/projects", icon: FolderKanban }],
    },
    {
      section: "Vault",
      items: [{ label: "Files", path: "/vault", icon: Archive }],
    },
    {
      section: "Reports",
      items: [{ label: "Reports", path: "/reports", icon: FileText }],
    },
    {
      section: "Settings",
      items: [
        { label: "Settings", path: "/settings", icon: Settings },
        { label: "Deletes", path: "/trash", icon: Trash }
      ],
    },
    {
      section: "Help",
      items: [{ label: "User Guide", path: "/help", icon: HelpCircle }],
    },
    ...(user?.roles.includes("admin")
      ? [
          {
            section: "Admin",
            items: [
              { label: "Users", path: "/admin/users", icon: Users },
              { label: "Leads Overview", path: "/admin/leads", icon: UserPlus },
              { label: "Accounts Overview", path: "/admin/clients", icon: Briefcase },
              { label: "Interactions Overview", path: "/admin/interactions", icon: FileText },
              { label: "Projects Overview", path: "/admin/projects", icon: FolderKanban },
              { label: "Data Import", path: "/admin/import", icon: Upload },
              { label: "Database Backups", path: "/admin/backups", icon: Database },
            ],
          },
        ]
      : []),
  ];

  return (
    <div
      className={`flex flex-col bg-neutral shadow-md border-r px-4 pt-4 pb-6 h-full transition-[width] duration-300 ease-in-out ${
        collapsed ? "w-20" : "w-64"
      }`}
    >
      <div className="flex justify-center mb-4">
        {collapsed ? (
          config.branding?.logoCompact ? (
            <img src={config.branding.logoCompact} alt="Logo" className="w-8 h-auto" />
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 96 96" role="img" aria-label="P6">
              <text x="10" y="68" fontFamily="Arial, sans-serif" fontSize="64" fontWeight="700" letterSpacing="-2" fill="#05133D">P</text>
              <text x="46" y="68" fontFamily="Arial, sans-serif" fontSize="64" fontWeight="700" letterSpacing="-2" fill="#F59E0B">6</text>
            </svg>
          )
        ) : (
          config.branding?.logo ? (
            <img src={config.branding.logo} alt={config.branding?.companyName || "CRM Logo"} className="max-w-[180px] h-auto" />
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" width="180" height="36" viewBox="0 0 360 72" role="img" aria-label="PathSix CRM">
              <text x="0" y="50" fontFamily="Arial, sans-serif" fontSize="44" fontWeight="700" letterSpacing="-2" fill="#05133D">Path</text>
              <text x="90" y="50" fontFamily="Arial, sans-serif" fontSize="44" fontWeight="700" letterSpacing="-2" fill="#F59E0B">Six</text>
              <text x="160" y="50" fontFamily="Arial, sans-serif" fontSize="26" fontWeight="600" letterSpacing="-1" fill="#334155">CRM</text>
            </svg>
          )
        )}
      </div>

      <button
        onClick={toggleCollapsed}
        className="self-end mb-4 text-muted-foreground hover:text-foreground transition-transform duration-300"
      >
        <span
          className={`inline-block transition-transform duration-300 ${
            collapsed ? "rotate-180" : ""
          }`}
        >
          <ChevronLeft size={20} />
        </span>
      </button>

      <nav className="border border-border rounded-md bg-neutral px-3 py-4">
        {navSections.map((group) => (
          <div key={group.section}>
            {navSections.length > 1 && !collapsed && (
              <p className="text-xs text-primary font-semibold px-4 pt-0.5 pb-0.25 uppercase tracking-wide">
                {group.section}
              </p>
            )}
            {group.items.map((item, index) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;

              return (
                <div
                  key={item.path}
                  className={`my-[10px] ${
                    index !== group.items.length - 1 ? "border-b border-muted" : ""
                  }`}
                >
                  <Link
                    to={item.path}
                    className={`flex items-center gap-4 px-5 py-4 w-full text-sm font-medium leading-none transition-colors duration-200 rounded-md
                      ${
                        isActive
                          ? "bg-primary/10 text-primary border-l-4 border-primary"
                          : "bg-muted text-secondary hover:bg-accent hover:text-white"
                      }`}
                    onClick={closeMobile}
                  >
                    <Icon className="h-5 w-5 shrink-0" />
                    {!collapsed && <span className="truncate">{item.label}</span>}
                  </Link>
                </div>
              );
            })}
          </div>
        ))}
        <div className="mt-auto h-8" />
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
          <div className="relative z-10 w-64 h-screen overflow-y-auto bg-neutral shadow-lg transform transition-transform duration-300 translate-x-0">
            <button
              onClick={closeMobile}
              className="absolute top-2 right-2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="pb-20">
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
