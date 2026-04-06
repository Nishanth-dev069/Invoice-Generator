/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Edit2, Trash2, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

function fmt(n: number) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 }).format(n);
}

const EXPENSE_CATEGORIES = ["RENT", "SALARY", "ELECTRICITY", "FUEL", "INTERNET", "MISC", "OTHER"];
const PAYMENT_MODES = ["CASH", "ONLINE", "UPI", "BANK_TRANSFER"];

const CAT_COLORS: Record<string, string> = {
  RENT: "bg-purple-100 text-purple-700",
  SALARY: "bg-blue-100 text-blue-700",
  ELECTRICITY: "bg-yellow-100 text-yellow-700",
  FUEL: "bg-orange-100 text-orange-700",
  INTERNET: "bg-cyan-100 text-cyan-700",
  MISC: "bg-slate-100 text-slate-700",
  OTHER: "bg-pink-100 text-pink-700",
};

function ExpenseModal({
  month, year, existing, onClose, onSaved,
}: { month: number; year: number; existing?: any; onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState({
    category: existing?.category || "RENT",
    amount: existing?.amount ? String(existing.amount) : "",
    description: existing?.description || "",
    paidOn: existing?.paidOn ? new Date(existing.paidOn).toISOString().slice(0, 10) : "",
    paymentMode: existing?.paymentMode || "",
  });

  const mutation = useMutation({
    mutationFn: async (data: any) => {
      const url = existing ? `/api/accounts/expenses/${existing.id}` : "/api/accounts/expenses";
      const method = existing ? "PUT" : "POST";
      const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...data, month, year }) });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    onSuccess: () => { toast.success(existing ? "Expense updated." : "Expense added."); onSaved(); },
    onError: () => toast.error("Failed to save expense."),
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 animate-in zoom-in-95 duration-150">
        <div className="bg-brand-forest text-white px-6 py-4 flex items-center justify-between rounded-t-2xl">
          <h3 className="font-bold">{existing ? "Edit Expense" : "Add Expense"}</h3>
          <button onClick={onClose}><X className="w-5 h-5" /></button>
        </div>
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-500 mb-1 block">Category</label>
              <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                className="w-full h-10 px-3 text-sm border border-slate-200 rounded-lg outline-none">
                {EXPENSE_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-bold text-slate-500 mb-1 block">Amount (₹)</label>
              <input type="number" min={0} value={form.amount}
                onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
                className="w-full h-10 px-3 text-sm border border-slate-200 rounded-lg outline-none focus:ring-1 focus:ring-brand-sage font-bold"
              />
            </div>
          </div>
          <div>
            <label className="text-xs font-bold text-slate-500 mb-1 block">Description</label>
            <input type="text" value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              className="w-full h-10 px-3 text-sm border border-slate-200 rounded-lg outline-none focus:ring-1 focus:ring-brand-sage"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-500 mb-1 block">Paid On</label>
              <input type="date" value={form.paidOn}
                onChange={e => setForm(f => ({ ...f, paidOn: e.target.value }))}
                className="w-full h-10 px-3 text-sm border border-slate-200 rounded-lg outline-none"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-500 mb-1 block">Payment Mode</label>
              <select value={form.paymentMode} onChange={e => setForm(f => ({ ...f, paymentMode: e.target.value }))}
                className="w-full h-10 px-3 text-sm border border-slate-200 rounded-lg outline-none">
                <option value="">Select…</option>
                {PAYMENT_MODES.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
          </div>
          <button
            disabled={!form.amount || !form.category || mutation.isPending}
            onClick={() => mutation.mutate(form)}
            className="w-full h-11 bg-brand-forest text-white rounded-lg font-bold flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {mutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
            {existing ? "Update" : "Add"} Expense
          </button>
        </div>
      </div>
    </div>
  );
}

export function ExpensesTable({ month, year, expenses }: { month: number; year: number; expenses: any[] }) {
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [editTarget, setEditTarget] = useState<any | null>(null);

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/accounts/expenses/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed");
    },
    onSuccess: () => {
      toast.success("Expense removed.");
      queryClient.invalidateQueries({ queryKey: ["accounts-expenses"] });
      queryClient.invalidateQueries({ queryKey: ["accounts-summary"] });
    },
  });

  const total = expenses.reduce((s, e) => s + Number(e.amount), 0);

  // Category breakdown
  const byCategory = expenses.reduce((acc: Record<string, number>, e) => {
    acc[e.category] = (acc[e.category] || 0) + Number(e.amount);
    return acc;
  }, {});

  function onSaved() {
    setShowModal(false);
    setEditTarget(null);
    queryClient.invalidateQueries({ queryKey: ["accounts-expenses"] });
    queryClient.invalidateQueries({ queryKey: ["accounts-summary"] });
  }

  const monthName = new Date(year, month - 1, 1).toLocaleString("en-IN", { month: "long", year: "numeric" });

  return (
    <div className="bg-white rounded-xl border border-brand-border shadow-sm overflow-hidden">
      <div className="flex items-center justify-between p-4 border-b border-brand-border">
        <div>
          <h2 className="text-base font-bold text-brand-forest">Monthly Expenses — {monthName}</h2>
          <div className="flex flex-wrap gap-2 mt-2">
            {Object.entries(byCategory).map(([cat, amt]) => (
              <span key={cat} className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${CAT_COLORS[cat] || "bg-slate-100 text-slate-700"}`}>
                {cat}: {fmt(amt as number)}
              </span>
            ))}
          </div>
        </div>
        <button onClick={() => setShowModal(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-brand-forest text-white rounded-lg text-sm font-semibold hover:bg-brand-sage transition-colors">
          <Plus className="w-4 h-4" /> Add Expense
        </button>
      </div>

      {expenses.length === 0 ? (
        <div className="p-8 text-center text-brand-muted text-sm">No expenses recorded for this month.</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-brand-cream text-brand-forest">
              <tr>
                <th className="px-4 py-2.5 text-left text-xs font-bold">Category</th>
                <th className="px-4 py-2.5 text-left text-xs font-bold">Description</th>
                <th className="px-4 py-2.5 text-left text-xs font-bold">Amount</th>
                <th className="px-4 py-2.5 text-left text-xs font-bold">Paid On</th>
                <th className="px-4 py-2.5 text-left text-xs font-bold">Mode</th>
                <th className="px-4 py-2.5 text-left text-xs font-bold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {expenses.map(e => (
                <tr key={e.id} className="border-t border-brand-border/40 hover:bg-brand-cream/20 transition-colors">
                  <td className="px-4 py-2.5">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${CAT_COLORS[e.category] || ""}`}>{e.category}</span>
                  </td>
                  <td className="px-4 py-2.5 text-slate-600 text-xs">{e.description || "—"}</td>
                  <td className="px-4 py-2.5 font-bold text-slate-800">{fmt(Number(e.amount))}</td>
                  <td className="px-4 py-2.5 text-xs text-brand-muted">{e.paidOn ? format(new Date(e.paidOn), "dd MMM yyyy") : "—"}</td>
                  <td className="px-4 py-2.5 text-xs text-brand-muted">{e.paymentMode || "—"}</td>
                  <td className="px-4 py-2.5">
                    <div className="flex gap-1.5">
                      <button onClick={() => setEditTarget(e)} className="p-1.5 text-brand-sage hover:bg-brand-cream rounded-lg transition-colors">
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => { if (confirm("Delete this expense?")) deleteMutation.mutate(e.id); }}
                        className="p-1.5 text-red-400 hover:bg-red-50 rounded-lg transition-colors">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-brand-border bg-brand-cream/50">
                <td colSpan={2} className="px-4 py-3 text-sm font-bold text-brand-forest">Total Expenses</td>
                <td className="px-4 py-3 font-bold text-brand-forest text-base">{fmt(total)}</td>
                <td colSpan={3} />
              </tr>
            </tfoot>
          </table>
        </div>
      )}

      {(showModal || editTarget) && (
        <ExpenseModal
          month={month} year={year} existing={editTarget || undefined}
          onClose={() => { setShowModal(false); setEditTarget(null); }}
          onSaved={onSaved}
        />
      )}
    </div>
  );
}
