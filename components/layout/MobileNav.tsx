"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { 
  LayoutDashboard, FileText, Users, Kanban, CheckSquare, 
  UserCog, IndianRupee, ShoppingCart 
} from "lucide-react";

const TABS = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Home" },
  { href: "/dashboard/invoices", icon: FileText, label: "Invoices" },
  { href: "/dashboard/leads", icon: Users, label: "Leads" },
  { href: "/dashboard/work-in-progress", icon: Kanban, label: "WIP" },
  { href: "/dashboard/final-check", icon: CheckSquare, label: "Final" },
];

const ADMIN_TABS = [
  { href: "/dashboard/users", icon: UserCog, label: "Users" },
  { href: "/dashboard/accounts", icon: IndianRupee, label: "Accounts" },
  { href: "/dashboard/purchases", icon: ShoppingCart, label: "Purchases" },
];

export function MobileNav() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === "ADMIN";

  const visibleTabs = isAdmin ? [...TABS, ...ADMIN_TABS] : TABS;

  const isActive = (href: string) => {
    if (href === "/dashboard") return pathname === "/dashboard";
    return pathname.startsWith(href);
  };

  return (
    <nav 
      className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-app-border flex items-stretch h-16 overflow-x-auto overflow-y-hidden"
      style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
    >
      <style dangerouslySetInnerHTML={{ __html: `nav::-webkit-scrollbar { display: none; }` }} />
      {visibleTabs.map(({ href, icon: Icon, label }) => {
        const active = isActive(href);
        return (
          <Link
            key={href}
            href={href}
            prefetch={true}
            className={`min-w-[72px] flex-shrink-0 flex-1 flex flex-col items-center justify-center gap-1 text-[10px] font-semibold transition-colors ${
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
