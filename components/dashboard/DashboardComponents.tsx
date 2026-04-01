/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { format, differenceInDays, startOfDay } from "date-fns";
import { 
  FileText, TrendingUp, Clock, AlertTriangle, 
  Users, Layers, CheckCircle2, ArrowRight, 
  Calendar, Package 
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
} from "recharts";

// ─── Stat Card ──────────────────────────────────────────────────────────────
type StatCardProps = { label: string; value: number; icon: any; accentClass: string; subLabel?: string };

export function StatCard({ label, value, icon: Icon, accentClass, subLabel }: StatCardProps) {
  return (
    <div className={`bg-white rounded-xl border shadow-sm p-6 flex items-start gap-4 hover:shadow-md transition-shadow`}>
      <div className={`p-3 rounded-xl ${accentClass}`}>
        <Icon className="w-6 h-6" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-3xl font-extrabold text-slate-900 tabular-nums">{value.toLocaleString()}</div>
        <div className="text-sm font-semibold text-slate-600 mt-0.5">{label}</div>
        {subLabel && <div className="text-xs text-slate-400 mt-1">{subLabel}</div>}
      </div>
    </div>
  );
}

// ─── Urgent Deliveries Panel ────────────────────────────────────────────────
const getPriorityTextClass = (dateStr: string | null) => {
  if (!dateStr) return "text-slate-500";
  const diff = differenceInDays(startOfDay(new Date(dateStr)), startOfDay(new Date()));
  if (diff < 0) return "text-red-700 font-bold";
  if (diff <= 2) return "text-red-600 font-semibold";
  return "text-amber-600 font-medium";
};

export function UrgentDeliveriesPanel({ deliveries }: { deliveries: any[] }) {
  const router = useRouter();

  if (!deliveries?.length) {
    return (
      <div className="flex items-center gap-3 text-green-700 bg-green-50 border border-green-200 rounded-xl p-5 text-sm font-medium">
        <CheckCircle2 className="w-5 h-5 shrink-0" />
        All clear! No urgent deliveries in the next 48 hours.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b">
            <th className="pb-2 text-left font-semibold text-slate-500 text-xs uppercase tracking-wide">Invoice</th>
            <th className="pb-2 text-left font-semibold text-slate-500 text-xs uppercase tracking-wide">Customer</th>
            <th className="pb-2 text-left font-semibold text-slate-500 text-xs uppercase tracking-wide">Due Date</th>
            <th className="pb-2 text-left font-semibold text-slate-500 text-xs uppercase tracking-wide">Assignee</th>
          </tr>
        </thead>
        <tbody>
          {deliveries.map((inv: any) => (
            <tr key={inv.id} className="hover:bg-slate-50 cursor-pointer transition-colors" onClick={() => router.push(`/dashboard/invoices/${inv.id}/edit`)}>
              <td className="py-3 pr-4">
                <span className="font-bold text-brand-forest">INV-{String(inv.invoiceNumber).padStart(4, "0")}</span>
              </td>
              <td className="py-3 pr-4 font-medium text-slate-700">{inv.customerName}</td>
              <td className={`py-3 pr-4 ${getPriorityTextClass(inv.finalDeliveryDate)}`}>
                {inv.finalDeliveryDate ? format(new Date(inv.finalDeliveryDate), "dd MMM yyyy") : "—"}
              </td>
              <td className="py-3 text-slate-600">{inv.assignee?.name || "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── WIP Summary Bar ────────────────────────────────────────────────────────
const PHASE_LABELS: Record<string, string> = {
  RAW_MATERIALS: "Raw Materials",
  DESIGN: "Design",
  PRINTING: "Printing",
  POST_PRINTING: "Post Printing",
};

const PHASE_COLORS: Record<string, string> = {
  RAW_MATERIALS: "bg-blue-400",
  DESIGN: "bg-purple-400",
  PRINTING: "bg-amber-400",
  POST_PRINTING: "bg-green-400",
};

export function WIPSummaryBar({ phases, total }: { phases: Record<string, number>; total: number }) {
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-4 gap-4">
        {Object.entries(PHASE_LABELS).map(([key, label]) => (
          <div key={key} className="text-center">
            <div className={`text-2xl font-bold text-slate-800 tabular-nums`}>{phases[key] ?? 0}</div>
            <div className="text-xs font-medium text-slate-500 mt-1">{label}</div>
          </div>
        ))}
      </div>

      {total > 0 && (
        <div className="flex h-3 rounded-full overflow-hidden">
          {Object.entries(PHASE_LABELS).map(([key]) => {
            const pct = ((phases[key] ?? 0) / total) * 100;
            if (pct === 0) return null;
            return (
              <div
                key={key}
                className={`${PHASE_COLORS[key]} transition-all`}
                style={{ width: `${pct}%` }}
                title={`${PHASE_LABELS[key]}: ${phases[key]}`}
              />
            );
          })}
        </div>
      )}

      {total === 0 && (
        <div className="h-3 rounded-full bg-slate-200 w-full" />
      )}
    </div>
  );
}

// ─── Recent Invoices Table ───────────────────────────────────────────────────
export function RecentInvoicesTable({ invoices }: { invoices: any[] }) {
  if (!invoices?.length) {
    return <p className="text-sm text-slate-500 py-4">No invoices yet.</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b">
            {["Invoice No", "Customer", "Amount", "Delivery Date", "Assignee", "Status"].map(h => (
              <th key={h} className="pb-2 text-left font-semibold text-slate-500 text-xs uppercase tracking-wide pr-4">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {invoices.map((inv: any) => (
            <tr key={inv.id} className="hover:bg-slate-50 transition-colors border-b last:border-0">
              <td className="py-3 pr-4">
                <span className="font-bold text-brand-forest text-xs font-mono">INV-{String(inv.invoiceNumber).padStart(4, "0")}</span>
              </td>
              <td className="py-3 pr-4 font-medium text-slate-700 max-w-[140px] truncate">{inv.customerName}</td>
              <td className="py-3 pr-4 font-semibold text-slate-800">₹{parseFloat(inv.totalAmount).toLocaleString("en-IN")}</td>
              <td className={`py-3 pr-4 text-xs ${getPriorityTextClass(inv.finalDeliveryDate)}`}>
                {inv.finalDeliveryDate ? format(new Date(inv.finalDeliveryDate), "dd MMM") : "—"}
              </td>
              <td className="py-3 pr-4 text-slate-600 text-xs">{inv.assignee?.name || "—"}</td>
              <td className="py-3">
                <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide ${
                  inv.status === "ACTIVE" ? "bg-blue-100 text-blue-700" : "bg-slate-100 text-slate-600"
                }`}>
                  {inv.status}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── Leads Chart ─────────────────────────────────────────────────────────────
const STATUS_COLORS: Record<string, string> = {
  NEW: "#3b82f6",
  CONTACTED: "#8b5cf6",
  NEGOTIATING: "#f59e0b",
  CONVERTED: "#22c55e",
  LOST: "#ef4444",
};

export function LeadsChart({ data }: { data: { status: string; count: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={180}>
      <BarChart data={data} layout="vertical" margin={{ left: 8, right: 16, top: 4, bottom: 4 }}>
        <XAxis type="number" tick={{ fontSize: 11 }} />
        <YAxis dataKey="status" type="category" width={90} tick={{ fontSize: 11 }} />
        <Tooltip
          formatter={(val: any) => [`${val} leads`, "Count"]}
          contentStyle={{ fontSize: 12, borderRadius: 8 }}
        />
        <Bar dataKey="count" radius={[0, 4, 4, 0]}>
          {data.map((entry) => (
            <Cell key={entry.status} fill={STATUS_COLORS[entry.status] ?? "#94a3b8"} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

// ─── Final Check Status ───────────────────────────────────────────────────────
export function FinalCheckStatus({ pending, completedThisMonth }: { pending: number; completedThisMonth: number }) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-4 p-4 bg-amber-50 border border-amber-200 rounded-xl">
        <Clock className="w-8 h-8 text-amber-600 shrink-0" />
        <div>
          <div className="text-2xl font-extrabold text-amber-700 tabular-nums">{pending}</div>
          <div className="text-sm font-medium text-amber-600">Pending Final Checks</div>
        </div>
      </div>
      <div className="flex items-center gap-4 p-4 bg-green-50 border border-green-200 rounded-xl">
        <CheckCircle2 className="w-8 h-8 text-green-600 shrink-0" />
        <div>
          <div className="text-2xl font-extrabold text-green-700 tabular-nums">{completedThisMonth}</div>
          <div className="text-sm font-medium text-green-600">Completed This Month</div>
        </div>
      </div>
      <Link
        href="/dashboard/final-check"
        className="inline-flex items-center justify-center gap-2 text-sm font-semibold text-brand-forest hover:underline"
      >
        Open Final Check <ArrowRight className="w-4 h-4" />
      </Link>
    </div>
  );
}

// Export icons so dashboard page can pass them in
export { FileText, TrendingUp, Clock, AlertTriangle, Users, Layers, Calendar, Package };
