/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, Edit2, Trash2, X, Save } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

function fmt(n: number) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);
}

const TYPE_STYLES: Record<string, string> = {
  CREDIT: "bg-green-100 text-green-700 border-green-200",
  DEBIT: "bg-red-100 text-red-700 border-red-200",
};
const MODE_STYLES: Record<string, string> = {
  CASH: "bg-amber-100 text-amber-700",
  ONLINE: "bg-blue-100 text-blue-700",
  UPI: "bg-purple-100 text-purple-700",
  BANK_TRANSFER: "bg-indigo-100 text-indigo-700",
};

function EditTxnModal({ txn, onClose, onSaved }: { txn: any; onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState({
    amount: String(txn.amount),
    description: txn.description,
    mode: txn.mode,
    date: new Date(txn.date).toISOString().slice(0, 10),
  });

  const mutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch(`/api/accounts/transactions/${txn.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    onSuccess: () => { toast.success("Transaction updated."); onSaved(); },
    onError: () => toast.error("Update failed."),
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 animate-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between px-5 py-4 border-b">
          <h3 className="font-bold text-slate-800">Edit Transaction</h3>
          <button onClick={onClose}><X className="w-4 h-4" /></button>
        </div>
        <div className="p-5 space-y-3">
          <div>
            <label className="text-xs font-bold text-slate-500 mb-1 block">Amount (₹)</label>
            <input type="number" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
              className="w-full h-10 px-3 text-sm border border-slate-200 rounded-lg outline-none font-bold" />
          </div>
          <div>
            <label className="text-xs font-bold text-slate-500 mb-1 block">Description</label>
            <input type="text" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              className="w-full h-10 px-3 text-sm border border-slate-200 rounded-lg outline-none" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-500 mb-1 block">Mode</label>
              <select value={form.mode} onChange={e => setForm(f => ({ ...f, mode: e.target.value }))}
                className="w-full h-10 px-2 text-sm border border-slate-200 rounded-lg outline-none">
                {["CASH", "ONLINE", "UPI"].map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-bold text-slate-500 mb-1 block">Date</label>
              <input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                className="w-full h-10 px-2 text-sm border border-slate-200 rounded-lg outline-none" />
            </div>
          </div>
          <button onClick={() => mutation.mutate(form)} disabled={mutation.isPending}
            className="w-full h-10 bg-brand-forest text-white rounded-lg font-bold flex items-center justify-center gap-2 disabled:opacity-50">
            {mutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}

export function TransactionLedger() {
  const queryClient = useQueryClient();
  const [modeTab, setModeTab] = useState("ALL");
  const [typeFilter, setTypeFilter] = useState("");
  const [search, setSearch] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [editTarget, setEditTarget] = useState<any | null>(null);
  const [page, setPage] = useState(1);

  const params = new URLSearchParams();
  if (modeTab !== "ALL") params.set("mode", modeTab);
  if (typeFilter) params.set("type", typeFilter);
  if (search) params.set("search", search);
  if (dateFrom) params.set("dateFrom", dateFrom);
  if (dateTo) params.set("dateTo", dateTo);
  params.set("page", String(page));
  params.set("limit", "50");

  const { data, isLoading } = useQuery({
    queryKey: ["accounts-transactions", params.toString()],
    queryFn: async () => {
      const res = await fetch(`/api/accounts/transactions?${params.toString()}`);
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    staleTime: 15000,
  });

  const transactions: any[] = data?.transactions || [];
  const totals = data?.totals || {};
  const pagination = data?.pagination || {};

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/accounts/transactions/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed");
    },
    onSuccess: () => {
      toast.success("Transaction removed. Balances recomputed.");
      queryClient.invalidateQueries({ queryKey: ["accounts-transactions"] });
      queryClient.invalidateQueries({ queryKey: ["accounts-summary"] });
    },
  });

  return (
    <div className="bg-white rounded-xl border border-brand-border shadow-sm overflow-hidden">
      <div className="p-4 border-b border-brand-border space-y-3">
        <h2 className="text-base font-bold text-brand-forest">Transaction Ledger</h2>

        {/* Mode Tabs */}
        <div className="flex gap-1 bg-brand-cream rounded-lg p-1 w-fit">
          {["ALL", "CASH", "ONLINE", "UPI"].map(tab => (
            <button key={tab} onClick={() => { setModeTab(tab); setPage(1); }}
              className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all ${modeTab === tab ? "bg-brand-forest text-white shadow-sm" : "text-brand-muted hover:text-brand-forest"}`}>
              {tab}
            </button>
          ))}
        </div>

        {/* Filters row */}
        <div className="flex flex-wrap gap-2">
          <select value={typeFilter} onChange={e => { setTypeFilter(e.target.value); setPage(1); }}
            className="h-9 px-3 text-xs bg-brand-cream border border-brand-border rounded-lg outline-none">
            <option value="">All Types</option>
            <option value="CREDIT">Credits</option>
            <option value="DEBIT">Debits</option>
          </select>
          <input type="text" placeholder="Search description / invoice…" value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            className="h-9 px-3 text-xs bg-brand-cream border border-brand-border rounded-lg outline-none flex-1 min-w-[180px]"
          />
          <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
            className="h-9 px-3 text-xs bg-brand-cream border border-brand-border rounded-lg outline-none" />
          <span className="text-brand-muted text-xs self-center">to</span>
          <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
            className="h-9 px-3 text-xs bg-brand-cream border border-brand-border rounded-lg outline-none" />
        </div>

        {/* Totals bar */}
        {totals && (
          <div className="flex flex-wrap gap-4 text-xs font-semibold">
            <span className="text-green-600">Credits: {fmt(totals.totalCredits || 0)}</span>
            <span className="text-slate-400">|</span>
            <span className="text-red-500">Debits: {fmt(totals.totalDebits || 0)}</span>
            <span className="text-slate-400">|</span>
            <span className={totals.netBalance >= 0 ? "text-brand-forest" : "text-red-600"}>
              Net: {fmt(totals.netBalance || 0)}
            </span>
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center p-10"><Loader2 className="w-7 h-7 animate-spin text-brand-forest" /></div>
      ) : transactions.length === 0 ? (
        <div className="p-8 text-center text-brand-muted text-sm">No transactions found.</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm" style={{ minWidth: "900px" }}>
            <thead className="bg-brand-cream text-brand-forest sticky top-0">
              <tr>
                <th className="px-3 py-2.5 text-left text-xs font-bold">Date</th>
                <th className="px-3 py-2.5 text-left text-xs font-bold">Type</th>
                <th className="px-3 py-2.5 text-left text-xs font-bold">Mode</th>
                <th className="px-3 py-2.5 text-left text-xs font-bold">Category</th>
                <th className="px-3 py-2.5 text-left text-xs font-bold min-w-[180px]">Description</th>
                <th className="px-3 py-2.5 text-left text-xs font-bold">Invoice</th>
                <th className="px-3 py-2.5 text-right text-xs font-bold">Amount</th>
                <th className="px-3 py-2.5 text-right text-xs font-bold">Balance</th>
                <th className="px-3 py-2.5 text-left text-xs font-bold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((t: any) => (
                <tr key={t.id}
                  className={`border-t border-brand-border/40 border-l-4 ${t.type === "CREDIT" ? "border-l-green-400 hover:bg-green-50/30" : "border-l-red-400 hover:bg-red-50/30"} transition-colors`}>
                  <td className="px-3 py-2.5 text-xs text-brand-muted whitespace-nowrap">
                    {format(new Date(t.date), "dd MMM yyyy")}
                  </td>
                  <td className="px-3 py-2.5">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full border font-bold ${TYPE_STYLES[t.type]}`}>
                      {t.type}
                    </span>
                  </td>
                  <td className="px-3 py-2.5">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${MODE_STYLES[t.mode] || "bg-slate-100 text-slate-600"}`}>
                      {t.mode}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 text-[10px] text-brand-muted whitespace-nowrap">{t.category.replace(/_/g, " ")}</td>
                  <td className="px-3 py-2.5 text-xs text-slate-700 max-w-[180px] truncate" title={t.description}>{t.description}</td>
                  <td className="px-3 py-2.5 text-xs font-mono text-brand-forest">{t.invoiceNumber || "—"}</td>
                  <td className={`px-3 py-2.5 text-right font-bold text-sm ${t.type === "CREDIT" ? "text-green-600" : "text-red-500"}`}>
                    {t.type === "CREDIT" ? "+" : "−"}{fmt(Number(t.amount))}
                  </td>
                  <td className={`px-3 py-2.5 text-right text-xs font-bold ${Number(t.runningBalance) < 0 ? "text-red-500" : "text-slate-700"}`}>
                    {fmt(Number(t.runningBalance))}
                  </td>
                  <td className="px-3 py-2.5">
                    <div className="flex gap-1">
                      <button onClick={() => setEditTarget(t)} className="p-1.5 text-brand-sage hover:bg-brand-cream rounded-lg transition-colors">
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => { if (confirm("Delete this transaction? All subsequent balances will be recomputed.")) deleteMutation.mutate(t.id); }}
                        className="p-1.5 text-red-400 hover:bg-red-50 rounded-lg transition-colors">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {pagination.total > 50 && (
        <div className="flex items-center justify-between px-4 py-3 border-t border-brand-border bg-brand-cream/30">
          <span className="text-xs text-brand-muted">Showing {((page - 1) * 50) + 1}–{Math.min(page * 50, pagination.total)} of {pagination.total}</span>
          <div className="flex gap-2">
            <button disabled={page === 1} onClick={() => setPage(p => p - 1)}
              className="px-3 py-1 text-xs border border-brand-border rounded-lg disabled:opacity-40 hover:bg-white transition-colors">←</button>
            <button disabled={page * 50 >= pagination.total} onClick={() => setPage(p => p + 1)}
              className="px-3 py-1 text-xs border border-brand-border rounded-lg disabled:opacity-40 hover:bg-white transition-colors">→</button>
          </div>
        </div>
      )}

      {editTarget && (
        <EditTxnModal txn={editTarget} onClose={() => setEditTarget(null)} onSaved={() => {
          setEditTarget(null);
          queryClient.invalidateQueries({ queryKey: ["accounts-transactions"] });
          queryClient.invalidateQueries({ queryKey: ["accounts-summary"] });
        }} />
      )}
    </div>
  );
}
