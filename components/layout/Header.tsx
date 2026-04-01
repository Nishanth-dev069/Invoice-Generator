/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { ChevronDown, LogOut } from "lucide-react";
import { useState, useRef, useEffect } from "react";

const ROUTE_LABELS: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/dashboard/invoices": "Invoices",
  "/dashboard/invoices/new": "New Invoice",
  "/dashboard/leads": "Leads",
  "/dashboard/work-in-progress": "Work in Progress",
  "/dashboard/final-check": "Final Check",
  "/dashboard/users": "User Management",
  "/dashboard/accounts": "Accounts",
  "/dashboard/purchases": "Purchases",
};

function getTitle(pathname: string): string {
  if (ROUTE_LABELS[pathname]) return ROUTE_LABELS[pathname];
  if (pathname.includes("/invoices/") && pathname.includes("/edit")) return "Edit Invoice";
  if (pathname.includes("/invoices/")) return "Invoice Details";
  return "Dashboard";
}

function getBreadcrumbs(pathname: string) {
  const crumbs: { label: string; href: string }[] = [{ label: "Dashboard", href: "/dashboard" }];
  if (pathname === "/dashboard") return crumbs;

  const segments = pathname.replace("/dashboard/", "").split("/");
  let accumulated = "/dashboard";

  for (const seg of segments) {
    if (!seg) continue;
    accumulated += `/${seg}`;
    const label = ROUTE_LABELS[accumulated] || (seg.startsWith("INV-") ? seg : seg.charAt(0).toUpperCase() + seg.slice(1).replace(/-/g, " "));
    crumbs.push({ label, href: accumulated });
  }

  return crumbs;
}

export function Header() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const name = session?.user?.name || "User";
  const role = session?.user?.role;
  const initials = name.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2);

  const title = getTitle(pathname);
  const breadcrumbs = getBreadcrumbs(pathname);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <header className="h-[60px] border-b border-app-border bg-white px-6 flex items-center justify-between shrink-0 z-20 sticky top-0">
      {/* Left: Title + Breadcrumb */}
      <div className="flex flex-col justify-center">
        {breadcrumbs.length > 1 ? (
          <nav className="flex items-center gap-1 text-xs text-slate-500">
            {breadcrumbs.map((crumb, i) => (
              <span key={crumb.href} className="flex items-center gap-1">
                {i > 0 && <span className="text-slate-300">/</span>}
                {i === breadcrumbs.length - 1 ? (
                  <span className="text-brand-forest font-semibold">{crumb.label}</span>
                ) : (
                  <a href={crumb.href} className="hover:text-brand-sage transition-colors">{crumb.label}</a>
                )}
              </span>
            ))}
          </nav>
        ) : (
          <h2 className="text-base font-bold text-brand-forest">{title}</h2>
        )}
      </div>

      {/* Right: User Dropdown */}
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setDropdownOpen(!dropdownOpen)}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-slate-100 transition-colors text-sm"
        >
          <div className="w-7 h-7 rounded-full bg-brand-forest text-white flex items-center justify-center text-xs font-bold">
            {initials}
          </div>
          <span className="hidden sm:block font-medium text-text-primary max-w-[120px] truncate">{name}</span>
          <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${dropdownOpen ? "rotate-180" : ""}`} />
        </button>

        {dropdownOpen && (
          <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl border border-app-border shadow-lg z-50 py-1 animate-fade-in">
            <div className="px-4 py-3 border-b border-app-border">
              <div className="font-semibold text-sm text-slate-900">{name}</div>
              <div className="text-xs text-slate-500 mt-0.5 flex items-center gap-1.5">
                <span className={`inline-block w-2 h-2 rounded-full ${role === "ADMIN" ? "bg-brand-forest" : "bg-green-500"}`} />
                {role}
              </div>
            </div>
            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
