"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  BookOpen,
  Users2,
  Calendar,
  ClipboardCheck,
  CreditCard,
  Bell,
  Settings,
  ChevronLeft,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  {
    group: "Main",
    items: [
      { href: "/", label: "Dashboard", icon: LayoutDashboard },
    ],
  },
  {
    group: "People",
    items: [
      { href: "/students", label: "Students", icon: Users },
      { href: "/teachers", label: "Teachers", icon: GraduationCap },
    ],
  },
  {
    group: "Academics",
    items: [
      { href: "/courses", label: "Courses", icon: BookOpen },
      { href: "/groups", label: "Groups", icon: Users2 },
      { href: "/schedule", label: "Schedule", icon: Calendar },
      { href: "/attendance", label: "Attendance", icon: ClipboardCheck },
    ],
  },
  {
    group: "Administration",
    items: [
      { href: "/finance", label: "Finance", icon: CreditCard },
      { href: "/notifications", label: "Notifications", icon: Bell },
      { href: "/settings", label: "Settings", icon: Settings },
    ],
  },
];

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 h-full bg-white border-r border-slate-100 z-30 flex flex-col transition-all duration-300",
        collapsed ? "w-16" : "w-[260px]"
      )}
    >
      {/* Logo */}
      <div className="flex items-center h-16 px-4 border-b border-slate-100 gap-3">
        <div className="flex-shrink-0 h-9 w-9 bg-indigo-600 rounded-xl flex items-center justify-center shadow-sm">
          <Zap className="h-5 w-5 text-white" />
        </div>
        {!collapsed && (
          <span className="text-lg font-bold text-slate-900 tracking-tight">
            EduCore
          </span>
        )}
        <button
          onClick={onToggle}
          className={cn(
            "ml-auto flex-shrink-0 h-7 w-7 rounded-lg flex items-center justify-center text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors",
            collapsed && "rotate-180"
          )}
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-5">
        {NAV_ITEMS.map((group) => (
          <div key={group.group}>
            {!collapsed && (
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-1.5 px-2">
                {group.group}
              </p>
            )}
            <ul className="space-y-0.5">
              {group.items.map(({ href, label, icon: Icon }) => {
                const isActive =
                  href === "/" ? pathname === "/" : pathname.startsWith(href);
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
                      {!collapsed && <span>{label}</span>}
                      {isActive && !collapsed && (
                        <span className="ml-auto h-1.5 w-1.5 rounded-full bg-indigo-500" />
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
