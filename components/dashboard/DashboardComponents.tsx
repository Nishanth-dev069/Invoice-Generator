/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { format, differenceInDays, startOfDay } from "date-fns";
import { 
  FileText, TrendingUp, Clock, AlertTriangle, 
  Users, Layers, CheckCircle2, ArrowRight, 
  Calendar, Package, X 
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
import { useState, memo } from "react";

// ─── Stat Card ──────────────────────────────────────────────────────────────
type StatCardProps = { label: string; value: number; icon: any; accentClass: string; subLabel?: string; href?: string };

export const StatCard = memo(function StatCard({ label, value, icon: Icon, accentClass, subLabel, href }: StatCardProps) {
  const content = (
    <div className={`bg-white rounded-xl border shadow-sm p-6 flex items-start gap-4 hover:shadow-md transition-shadow h-full cursor-pointer`}>
      <div className={`p-3 rounded-xl ${accentClass} shrink-0`}>
        <Icon className="w-6 h-6" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-3xl font-extrabold text-slate-900 tabular-nums">{value.toLocaleString()}</div>
        <div className="text-sm font-semibold text-slate-600 mt-0.5">{label}</div>
        <div className="text-xs text-slate-400 mt-1 flex items-center gap-1">
          <span className="font-medium text-slate-500">This Month</span> {subLabel && `• ${subLabel}`}
        </div>
      </div>
    </div>
  );

  if (href) {
    return <Link href={href} className="block h-full">{content}</Link>;
  }
  return content;
});

// ─── Urgent Deliveries Panel ────────────────────────────────────────────────
const getPriorityTextClass = (dateStr: string | null) => {
  if (!dateStr) return "text-slate-500";
  const diff = differenceInDays(startOfDay(new Date(dateStr)), startOfDay(new Date()));
  if (diff < 0) return "text-red-700 font-bold";
  if (diff <= 1) return "text-red-600 font-semibold";
  return "text-amber-600 font-medium";
};

const getUrgentBorderClass = (dateStr: string | null) => {
  if (!dateStr) return "border-slate-200";
  const diff = differenceInDays(startOfDay(new Date(dateStr)), startOfDay(new Date()));
  if (diff < 0) return "border-l-4 border-l-red-500";
  if (diff <= 1) return "border-l-4 border-l-orange-500";
  if (diff <= 3) return "border-l-4 border-l-yellow-400";
  return "border-l-4 border-l-green-500";
};

export const UrgentDeliveriesPanel = memo(function UrgentDeliveriesPanel({ deliveries }: { deliveries: any[] }) {
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);

  // For the panel, show only past due or due within 24 hours
  const urgentItems = deliveries?.filter(d => {
    const diff = differenceInDays(startOfDay(new Date(d.finalDeliveryDate)), startOfDay(new Date()));
    return diff <= 1; // 0 or 1 is within 24h depending on time of day, diff < 0 is overdue
  }) || [];

  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
            🚨 Urgent Deliveries
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">Due in the next 24 hours</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="text-xs font-semibold text-brand-forest hover:underline flex items-center gap-1 bg-transparent border-0 cursor-pointer"
        >
          View All Deliveries <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {!urgentItems.length ? (
        <div className="flex items-center gap-3 text-green-700 bg-green-50 border border-green-200 rounded-xl p-5 text-sm font-medium">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          All clear! No urgent deliveries in the next 24 hours.
        </div>
      ) : (
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
              {urgentItems.slice(0, 5).map((inv: any) => (
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
      )}

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="px-6 py-4 border-b flex items-center justify-between bg-slate-50">
              <div>
                <h3 className="font-bold text-lg text-slate-900">All Pending Deliveries</h3>
                <p className="text-xs text-slate-500 mt-0.5">Showing {deliveries.length} items</p>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-2 hover:bg-slate-200 rounded-lg transition-colors text-slate-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1 flex flex-col gap-3">
              {deliveries.length === 0 ? (
                <div className="py-12 text-center text-slate-500 font-medium">No pending deliveries found.</div>
              ) : (
                deliveries.map(inv => (
                  <div 
                    key={inv.id} 
                    onClick={() => {
                      setIsModalOpen(false);
                      router.push(`/dashboard/invoices/${inv.id}`);
                    }}
                    className={`bg-white border rounded-lg p-4 cursor-pointer hover:shadow-md hover:border-slate-300 transition-all ${getUrgentBorderClass(inv.finalDeliveryDate)} shrink-0 flex items-center justify-between gap-4`}
                  >
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-bold text-brand-forest text-sm">INV-{String(inv.invoiceNumber).padStart(4, "0")}</span>
                        <span className="text-sm font-semibold text-slate-700">{inv.customerName}</span>
                      </div>
                      <div className="text-xs text-slate-500 font-medium">
                        Value: ₹{Number(inv.totalAmount).toLocaleString("en-IN")}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`text-sm ${getPriorityTextClass(inv.finalDeliveryDate)}`}>
                        {format(new Date(inv.finalDeliveryDate), "dd MMM yyyy")}
                      </div>
                      <div className="text-xs text-slate-400 mt-1">Delivery Date</div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
});

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

export const WIPSummaryBar = memo(function WIPSummaryBar({ phases, total }: { phases: Record<string, number>; total: number }) {
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
});

// ─── Recent Invoices Table ───────────────────────────────────────────────────
const getInvoiceStatusNode = (inv: any) => {
  if (inv.status === "CLOSED") return <span className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide bg-green-100 text-green-700">Closed</span>;
  
  if (!inv.wipCard) {
    return <span className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide bg-slate-100 text-slate-500">Not Started</span>;
  }
  
  // If WIP exists
  const phaseLabel = PHASE_LABELS[inv.wipCard.phase] || inv.wipCard.phase;
  const phaseColorClasses: Record<string, string> = {
    RAW_MATERIALS: "bg-blue-100 text-blue-700 border border-blue-200",
    DESIGN: "bg-purple-100 text-purple-700 border border-purple-200",
    PRINTING: "bg-amber-100 text-amber-700 border border-amber-200",
    POST_PRINTING: "bg-green-100 text-green-700 border border-green-200",
    PAYMENT_PENDING: "bg-orange-100 text-orange-700 border border-orange-200",
  };
  
  const phaseKey = inv.wipCard.phase;
  const classStr = phaseColorClasses[phaseKey] || "bg-slate-100 text-slate-700 border border-slate-200";

  return <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide ${classStr}`}>{phaseLabel}</span>;
}

export const RecentInvoicesTable = memo(function RecentInvoicesTable({ invoices }: { invoices: any[] }) {
  if (!invoices?.length) {
    return <p className="text-sm text-slate-500 py-4">No invoices yet.</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b">
            {["Invoice No", "Customer", "Amount", "Delivery Date", "Assignee", "Pipeline Stage"].map(h => (
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
                {getInvoiceStatusNode(inv)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
});

// ─── Leads Chart ─────────────────────────────────────────────────────────────
const STATUS_COLORS: Record<string, string> = {
  NEW: "#3b82f6",
  CONTACTED: "#8b5cf6",
  NEGOTIATING: "#f59e0b",
  CONVERTED: "#22c55e",
  LOST: "#ef4444",
};

export const LeadsChart = memo(function LeadsChart({ data }: { data: { status: string; count: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={180}>
      <BarChart data={data} layout="vertical" margin={{ left: 8, right: 16, top: 4, bottom: 4 }}>
        <XAxis type="number" tick={{ fontSize: 11 }} allowDecimals={false} domain={[0, 'auto']} />
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
});

// ─── Final Check Status ───────────────────────────────────────────────────────
export const FinalCheckStatus = memo(function FinalCheckStatus({ pending, completedThisMonth }: { pending: number; completedThisMonth: number }) {
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
});

// ─── Dashboard Skeleton ──────────────────────────────────────────────────────
export function DashboardSkeleton() {
  return (
    <div className="flex flex-col gap-8 w-full animate-pulse">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {[1,2,3,4,5,6].map(i => (
          <div key={i} className="bg-slate-100 rounded-xl h-[120px] shadow-sm border border-slate-200"></div>
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-slate-100 rounded-xl h-[300px] border border-slate-200"></div>
        <div className="bg-slate-100 rounded-xl h-[300px] border border-slate-200"></div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-slate-100 rounded-xl h-[350px] border border-slate-200"></div>
        <div className="flex flex-col gap-6">
          <div className="bg-slate-100 rounded-xl h-[200px] border border-slate-200"></div>
          <div className="bg-slate-100 rounded-xl h-[150px] border border-slate-200"></div>
        </div>
      </div>
    </div>
  );
}

// Export icons so dashboard page can pass them in
export { FileText, TrendingUp, Clock, AlertTriangle, Users, Layers, Calendar, Package };
