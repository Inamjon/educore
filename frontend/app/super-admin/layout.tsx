"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Building2,
  GitBranch,
  ShieldCheck,
  GraduationCap,
  Users,
  CreditCard,
  DollarSign,
  BarChart2,
  Bell,
  Settings,
  ScrollText,
  UserCircle,
  ChevronLeft,
  Zap,
  Search,
  ChevronDown,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { SA_NOTIFICATIONS, SA_PROFILE } from "@/lib/super-admin-data";

// ─── Nav Config ───────────────────────────────────────────────────────────────

const NAV_GROUPS = [
  {
    label: "Overview",
    items: [
      { href: "/super-admin", label: "Dashboard", icon: LayoutDashboard },
    ],
  },
  {
    label: "Management",
    items: [
      { href: "/super-admin/centers",       label: "Educational Centers", icon: Building2      },
      { href: "/super-admin/branches",      label: "Branches",            icon: GitBranch      },
      { href: "/super-admin/administrators",label: "Administrators",      icon: ShieldCheck    },
      { href: "/super-admin/teachers",      label: "Teachers",            icon: GraduationCap  },
      { href: "/super-admin/students",      label: "Students",            icon: Users          },
    ],
  },
  {
    label: "Business",
    items: [
      { href: "/super-admin/subscriptions", label: "Subscription Plans", icon: CreditCard  },
      { href: "/super-admin/payments",      label: "Payments",           icon: DollarSign  },
      { href: "/super-admin/reports",       label: "Reports",            icon: BarChart2   },
    ],
  },
  {
    label: "System",
    items: [
      { href: "/super-admin/notifications", label: "Notifications",   icon: Bell       },
      { href: "/super-admin/settings",      label: "System Settings", icon: Settings   },
      { href: "/super-admin/audit-logs",    label: "Audit Logs",      icon: ScrollText },
    ],
  },
  {
    label: "Account",
    items: [
      { href: "/super-admin/profile", label: "Profile", icon: UserCircle },
    ],
  },
];

// ─── Page Title Map ───────────────────────────────────────────────────────────

const PAGE_TITLES: Record<string, string> = {
  "/super-admin":                  "Dashboard",
  "/super-admin/centers":          "Educational Centers",
  "/super-admin/branches":         "Branches",
  "/super-admin/administrators":   "Administrators",
  "/super-admin/teachers":         "Teachers",
  "/super-admin/students":         "Students",
  "/super-admin/subscriptions":    "Subscription Plans",
  "/super-admin/payments":         "Payments",
  "/super-admin/reports":          "Reports",
  "/super-admin/notifications":    "Notifications",
  "/super-admin/settings":         "System Settings",
  "/super-admin/audit-logs":       "Audit Logs",
  "/super-admin/profile":          "Profile",
};

// ─── Sidebar ──────────────────────────────────────────────────────────────────

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

function SuperAdminSidebar({ collapsed, onToggle }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 h-full bg-white border-r border-slate-100 z-30 flex flex-col transition-all duration-300",
        collapsed ? "w-16" : "w-[260px]"
      )}
    >
      {/* Logo */}
      <div className="flex items-center h-16 px-4 border-b border-slate-100 gap-3 flex-shrink-0">
        <div className="flex-shrink-0 h-9 w-9 bg-indigo-600 rounded-xl flex items-center justify-center shadow-sm">
          <Zap className="h-5 w-5 text-white" />
        </div>
        {!collapsed && (
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-lg font-bold text-slate-900 tracking-tight">
              EduCore
            </span>
            <span className="text-[11px] font-semibold bg-violet-100 text-violet-700 rounded-md px-1.5 py-0.5 leading-none flex-shrink-0">
              Super Admin
            </span>
          </div>
        )}
        <button
          onClick={onToggle}
          className={cn(
            "ml-auto flex-shrink-0 h-7 w-7 rounded-lg flex items-center justify-center text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors",
            collapsed && "rotate-180"
          )}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-5">
        {NAV_GROUPS.map((group) => (
          <div key={group.label}>
            {!collapsed && (
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-1.5 px-2">
                {group.label}
              </p>
            )}
            <ul className="space-y-0.5">
              {group.items.map(({ href, label, icon: Icon }) => {
                const isActive =
                  href === "/super-admin"
                    ? pathname === "/super-admin"
                    : pathname.startsWith(href);
                return (
                  <li key={href}>
                    <Link
                      href={href}
                      title={collapsed ? label : undefined}
                      className={cn(
                        "flex items-center gap-3 h-9 rounded-xl px-2.5 text-sm font-medium transition-all group",
                        isActive
                          ? "bg-indigo-50 text-indigo-700"
                          : "text-slate-600 hover:bg-slate-50 hover:text-slate-900",
                        collapsed && "justify-center"
                      )}
                    >
                      <Icon
                        className={cn(
                          "h-[18px] w-[18px] flex-shrink-0",
                          isActive
                            ? "text-indigo-600"
                            : "text-slate-400 group-hover:text-slate-700"
                        )}
                      />
                      {!collapsed && <span className="truncate">{label}</span>}
                      {isActive && !collapsed && (
                        <span className="ml-auto h-1.5 w-1.5 rounded-full bg-indigo-500 flex-shrink-0" />
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>
    </aside>
  );
}

// ─── Header ───────────────────────────────────────────────────────────────────

interface HeaderProps {
  sidebarCollapsed: boolean;
}

function SuperAdminHeader({ sidebarCollapsed }: HeaderProps) {
  const pathname = usePathname();
  const title = PAGE_TITLES[pathname] ?? "Super Admin";
  const unreadCount = SA_NOTIFICATIONS.filter((n) => !n.read).length;
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Derive initials from profile name
  const initials = SA_PROFILE.name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header
      className={cn(
        "fixed top-0 right-0 h-16 bg-white border-b border-slate-100 z-20 flex items-center gap-4 px-6 transition-all duration-300",
        sidebarCollapsed ? "left-16" : "left-[260px]"
      )}
    >
      {/* Page title */}
      <div>
        <h2 className="text-lg font-semibold text-slate-900 leading-none">
          {title}
        </h2>
        <p className="text-xs text-slate-400 mt-0.5">
          {new Date().toLocaleDateString("en-US", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </p>
      </div>

      <div className="flex-1" />

      {/* Search */}
      <div className="relative hidden md:block">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <input
          type="text"
          placeholder="Quick search..."
          className="h-9 w-60 pl-9 pr-4 rounded-xl border border-slate-200 bg-slate-50 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
        />
      </div>

      {/* Notifications */}
      <Link
        href="/super-admin/notifications"
        className="relative h-9 w-9 flex items-center justify-center rounded-xl hover:bg-slate-100 text-slate-500 transition-colors"
        aria-label={`Notifications (${unreadCount} unread)`}
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 h-4 w-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
            {unreadCount}
          </span>
        )}
      </Link>

      {/* User dropdown */}
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setDropdownOpen((o) => !o)}
          className="flex items-center gap-2.5 rounded-xl px-2 py-1.5 hover:bg-slate-100 transition-colors"
          aria-expanded={dropdownOpen}
          aria-haspopup="true"
        >
          <div className="h-8 w-8 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
            {initials}
          </div>
          <div className="hidden sm:block text-left">
            <p className="text-sm font-medium text-slate-900 leading-none">
              {SA_PROFILE.name}
            </p>
            <p className="text-xs text-slate-400 mt-0.5">{SA_PROFILE.role}</p>
          </div>
          <ChevronDown
            className={cn(
              "h-4 w-4 text-slate-400 transition-transform hidden sm:block",
              dropdownOpen && "rotate-180"
            )}
          />
        </button>

        {dropdownOpen && (
          <div className="absolute right-0 top-full mt-2 w-52 bg-white rounded-2xl shadow-lg border border-slate-100 py-1.5 z-50">
            <div className="px-4 py-2.5 border-b border-slate-50">
              <p className="text-sm font-semibold text-slate-900">
                {SA_PROFILE.name}
              </p>
              <p className="text-xs text-slate-400">{SA_PROFILE.email}</p>
            </div>
            <Link
              href="/super-admin/profile"
              onClick={() => setDropdownOpen(false)}
              className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
            >
              <UserCircle className="h-4 w-4 text-slate-400" />
              Profile
            </Link>
            <Link
              href="/super-admin/settings"
              onClick={() => setDropdownOpen(false)}
              className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
            >
              <Settings className="h-4 w-4 text-slate-400" />
              System Settings
            </Link>
            <div className="border-t border-slate-50 mt-1 pt-1">
              <button className="flex items-center gap-3 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors w-full">
                <LogOut className="h-4 w-4" />
                Sign Out
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}

// ─── Layout ───────────────────────────────────────────────────────────────────

export default function SuperAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50">
      <SuperAdminSidebar
        collapsed={collapsed}
        onToggle={() => setCollapsed((c) => !c)}
      />
      <SuperAdminHeader sidebarCollapsed={collapsed} />
      <main
        className={cn(
          "pt-16 min-h-screen transition-all duration-300",
          collapsed ? "pl-16" : "pl-[260px]"
        )}
      >
        <div className="p-6 max-w-[1400px]">{children}</div>
      </main>
    </div>
  );
}
