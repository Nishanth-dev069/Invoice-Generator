"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, FileText, Users, Kanban, CheckSquare } from "lucide-react";

const TABS = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Home" },
  { href: "/dashboard/invoices", icon: FileText, label: "Invoices" },
  { href: "/dashboard/leads", icon: Users, label: "Leads" },
  { href: "/dashboard/work-in-progress", icon: Kanban, label: "WIP" },
  { href: "/dashboard/final-check", icon: CheckSquare, label: "Final" },
];

export function MobileNav() {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === "/dashboard") return pathname === "/dashboard";
    return pathname.startsWith(href);
  };

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-app-border flex items-stretch h-16">
      {TABS.map(({ href, icon: Icon, label }) => {
        const active = isActive(href);
        return (
          <Link
            key={href}
            href={href}
            className={`flex-1 flex flex-col items-center justify-center gap-1 text-[10px] font-semibold transition-colors ${
              active ? "text-brand-forest" : "text-text-muted"
            }`}
          >
            <Icon className={`w-5 h-5 ${active ? "text-brand-forest" : "text-slate-400"}`} />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
