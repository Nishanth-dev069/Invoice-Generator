/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Minus, X, Loader2 } from "lucide-react";
import { toast } from "sonner";

function fmt(n: number) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);
}

const CATEGORIES_CREDIT = ["INVOICE_ADVANCE", "INVOICE_BALANCE", "INVOICE_FULL_PAYMENT", "MISC_INCOME"];
const CATEGORIES_DEBIT = ["VENDOR_PAYMENT", "OVERHEAD", "MISC_EXPENSE"];
const MODES = ["CASH", "ONLINE", "UPI"];

function QuickEntryModal({
  type,
  onClose,
  onSaved,
}: { type: "CREDIT" | "DEBIT"; onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState({
    mode: "CASH",
    amount: "",
    description: "",
    category: type === "CREDIT" ? "INVOICE_FULL_PAYMENT" : "MISC_EXPENSE",
    date: new Date().toISOString().slice(0, 10),
    invoiceNumber: "",
  });

  const mutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch("/api/accounts/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, type }),
      });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    onSuccess: () => { toast.success(`${type === "CREDIT" ? "Credit" : "Debit"} recorded.`); onSaved(); },
    onError: () => toast.error("Failed to save transaction."),
  });

  const categories = type === "CREDIT" ? CATEGORIES_CREDIT : CATEGORIES_DEBIT;
  const accentColor = type === "CREDIT" ? "bg-green-600" : "bg-red-600";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden animate-in zoom-in-95 duration-150">
        <div className={`${accentColor} text-white px-6 py-4 flex items-center justify-between`}>
          <h3 className="font-bold text-lg">{type === "CREDIT" ? "➕ Add Credit" : "➖ Add Debit"}</h3>
          <button onClick={onClose}><X className="w-5 h-5" /></button>
        </div>
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-500 mb-1 block">Date</label>
              <input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                className="w-full h-10 px-3 text-sm border border-slate-200 rounded-lg outline-none focus:ring-1 focus:ring-brand-sage" />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-500 mb-1 block">Mode</label>
              <select value={form.mode} onChange={e => setForm(f => ({ ...f, mode: e.target.value }))}
                className="w-full h-10 px-3 text-sm border border-slate-200 rounded-lg outline-none">
                {MODES.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="text-xs font-bold text-slate-500 mb-1 block">Amount (₹)</label>
            <input type="number" min={0} placeholder="0.00" value={form.amount}
              onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
              className="w-full h-10 px-3 text-sm border border-slate-200 rounded-lg outline-none focus:ring-1 focus:ring-brand-sage font-bold text-base"
            />
          </div>
          <div>
            <label className="text-xs font-bold text-slate-500 mb-1 block">Category</label>
            <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
              className="w-full h-10 px-3 text-sm border border-slate-200 rounded-lg outline-none">
              {categories.map(c => <option key={c} value={c}>{c.replace(/_/g, " ")}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-bold text-slate-500 mb-1 block">Description</label>
            <input type="text" placeholder="e.g. INV-0042 advance payment" value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              className="w-full h-10 px-3 text-sm border border-slate-200 rounded-lg outline-none focus:ring-1 focus:ring-brand-sage"
            />
          </div>
          <div>
            <label className="text-xs font-bold text-slate-500 mb-1 block">Invoice No. (optional)</label>
            <input type="text" placeholder="INV-0042" value={form.invoiceNumber}
              onChange={e => setForm(f => ({ ...f, invoiceNumber: e.target.value }))}
              className="w-full h-10 px-3 text-sm border border-slate-200 rounded-lg outline-none focus:ring-1 focus:ring-brand-sage"
            />
          </div>
          <button
            disabled={!form.amount || !form.description || mutation.isPending}
            onClick={() => mutation.mutate(form)}
            className={`w-full h-11 ${accentColor} text-white rounded-lg font-bold flex items-center justify-center gap-2 disabled:opacity-50 hover:opacity-90 transition-opacity`}
          >
            {mutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            Save {type === "CREDIT" ? "Credit" : "Debit"}
          </button>
        </div>
      </div>
    </div>
  );
}

export function CounterBalanceHero({ balance }: { balance: any }) {
  const queryClient = useQueryClient();
  const [modal, setModal] = useState<"CREDIT" | "DEBIT" | null>(null);

  const total = balance?.total ?? 0;
  const cash = balance?.cash ?? 0;
  const online = balance?.online ?? 0;
  const upi = balance?.upi ?? 0;
  const lastUpdated = balance?.lastUpdated;

  function onSaved() {
    setModal(null);
    queryClient.invalidateQueries({ queryKey: ["accounts-transactions"] });
    queryClient.invalidateQueries({ queryKey: ["accounts-summary"] });
  }

  return (
    <>
      <div className="bg-brand-forest rounded-2xl p-6 md:p-8 text-brand-cream shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          {/* Main balance */}
          <div className="flex-1">
            <p className="text-brand-cream/60 text-sm font-medium tracking-wide mb-1">Current Counter Balance</p>
            <div className={`text-4xl md:text-6xl font-bold tracking-tight ${total < 0 ? "text-red-300" : "text-brand-cream"}`}>
              {fmt(total)}
            </div>
            {lastUpdated && (
              <p className="text-brand-cream/40 text-xs mt-2">
                Last updated: {new Date(lastUpdated).toLocaleString("en-IN")}
              </p>
            )}

            {/* Mode breakdown pills */}
            <div className="flex flex-wrap gap-3 mt-4">
              {[
                { label: "💰 Cash", value: cash },
                { label: "📱 Online", value: online },
                { label: "🔄 UPI", value: upi },
              ].map(pill => (
                <div key={pill.label} className="bg-white/10 border border-white/20 rounded-full px-4 py-1.5 text-sm">
                  <span className="text-brand-cream/70">{pill.label}: </span>
                  <span className={`font-bold ${pill.value < 0 ? "text-red-300" : "text-brand-cream"}`}>
                    {fmt(pill.value)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex gap-3 md:flex-col">
            <button
              onClick={() => setModal("CREDIT")}
              className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-green-500 hover:bg-green-400 text-white font-bold rounded-xl transition-colors shadow-lg"
            >
              <Plus className="w-5 h-5" /> Add Credit
            </button>
            <button
              onClick={() => setModal("DEBIT")}
              className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-red-500 hover:bg-red-400 text-white font-bold rounded-xl transition-colors shadow-lg"
            >
              <Minus className="w-5 h-5" /> Add Debit
            </button>
          </div>
        </div>
      </div>

      {modal && (
        <QuickEntryModal type={modal} onClose={() => setModal(null)} onSaved={onSaved} />
      )}
    </>
  );
}
