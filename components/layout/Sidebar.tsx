/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import {
  LayoutDashboard, FileText, Users, Kanban,
  CheckSquare, UserCog, ChevronLeft, ChevronRight, LogOut, IndianRupee, ShoppingCart
} from "lucide-react";
import { useUIStore } from "@/lib/store";
import Image from "next/image";

const NAV_ITEMS = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/dashboard/invoices", icon: FileText, label: "Invoices" },
  { href: "/dashboard/leads", icon: Users, label: "Leads" },
  { href: "/dashboard/work-in-progress", icon: Kanban, label: "Work in Progress" },
  { href: "/dashboard/final-check", icon: CheckSquare, label: "Final Check" },
];

const ADMIN_ITEMS = [
  { href: "/dashboard/users", icon: UserCog, label: "Users" },
  { href: "/dashboard/accounts", icon: IndianRupee, label: "Accounts" },
  { href: "/dashboard/purchases", icon: ShoppingCart, label: "Purchases" },
];

export function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const { isSidebarCollapsed, toggleSidebar } = useUIStore();

  const isAdmin = session?.user?.role === "ADMIN";
  const name = session?.user?.name || "User";
  const initials = name.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2);

  const isActive = (href: string) => {
    if (href === "/dashboard") return pathname === "/dashboard";
    return pathname.startsWith(href);
  };

  const collapsed = isSidebarCollapsed;

  return (
    <aside
      className={`hidden md:flex flex-col bg-brand-forest text-white transition-all duration-300 relative shrink-0 ${
        collapsed ? "w-16" : "w-60"
      }`}
      style={{ minHeight: "100vh" }}
    >
      {/* Logo */}
      <div className={`flex items-center gap-3 px-4 py-5 border-b border-white/10 ${collapsed ? "justify-center" : "justify-center"}`}>
        {collapsed ? (
           <div className="w-8 h-8 rounded-lg flex items-center justify-center font-black text-sm shrink-0 overflow-hidden relative bg-white">
              <Image src="/logo.png" alt="Logo" fill className="object-contain p-1" />
           </div>
        ) : (
           <div className="w-40 h-10 relative bg-white rounded p-1 overflow-hidden pointer-events-none">
              <Image src="/logo.png" alt="Ink & Prints Studio" fill className="object-contain" priority />
           </div>
        )}
      </div>

      {/* Nav Items */}
      <nav className="flex-1 py-4 px-2 space-y-1">
        {NAV_ITEMS.map(({ href, icon: Icon, label }) => {
          const active = isActive(href);
          return (
            <Link
              key={href}
              href={href}
              title={collapsed ? label : undefined}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
                active
                  ? "bg-white/20 text-white border-l-4 border-white"
                  : "text-slate-300 hover:bg-white/10 hover:text-white border-l-4 border-transparent"
              } ${collapsed ? "justify-center px-2" : ""}`}
            >
              <Icon className="w-5 h-5 shrink-0" />
              {!collapsed && <span>{label}</span>}
            </Link>
          );
        })}

        {isAdmin && (
          <>
            <div className={`my-2 border-t border-white/10 ${collapsed ? "" : "mx-1"}`} />
            {ADMIN_ITEMS.map(({ href, icon: Icon, label }) => {
              const active = isActive(href);
              return (
                <Link
                  key={href}
                  href={href}
                  title={collapsed ? label : undefined}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
                    active
                      ? "bg-white/20 text-white border-l-4 border-white"
                      : "text-slate-300 hover:bg-white/10 hover:text-white border-l-4 border-transparent"
                  } ${collapsed ? "justify-center px-2" : ""}`}
                >
                  <Icon className="w-5 h-5 shrink-0" />
                  {!collapsed && <span>{label}</span>}
                </Link>
              );
            })}
          </>
        )}
      </nav>

      {/* User Section */}
      <div className={`border-t border-white/10 p-3 ${collapsed ? "flex justify-center" : ""}`}>
        {!collapsed ? (
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-brand-forest flex items-center justify-center text-white text-xs font-bold shrink-0">
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold truncate">{name}</div>
              <div className="text-[10px] text-slate-400">{session?.user?.role}</div>
            </div>
            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-white/10 rounded transition-colors"
              title="Sign out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-white/10 rounded transition-colors"
            title="Sign out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Collapse Toggle */}
      <button
        onClick={toggleSidebar}
        className="absolute -right-3 top-20 w-6 h-6 bg-brand-forest border border-white/20 rounded-full flex items-center justify-center text-slate-400 hover:text-white transition-colors z-10"
      >
        {collapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
      </button>
    </aside>
  );
}
