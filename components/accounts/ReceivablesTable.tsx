/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { X, Loader2, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

function fmt(n: number) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);
}

function MarkPaidModal({ invoice, onClose, onSaved }: { invoice: any; onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState({
    amount: String(invoice.balance || 0),
    mode: "CASH",
    date: new Date().toISOString().slice(0, 10),
  });

  const mutation = useMutation({
    mutationFn: async (data: any) => {
      // 1. Record Counter Transaction
      await fetch("/api/accounts/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "CREDIT",
          mode: data.mode,
          amount: data.amount,
          date: data.date,
          description: `Balance payment for ${invoice.invoiceNumber}`,
          invoiceNumber: invoice.invoiceNumber,
          invoiceId: invoice.id,
          category: "INVOICE_BALANCE",
        }),
      });
      // 2. Mark invoice balancePaid = true
      const res = await fetch(`/api/invoices/${invoice.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ balancePaid: true }),
      });
      if (!res.ok) throw new Error("Invoice update failed");
      return res.json();
    },
    onSuccess: () => {
      toast.success(`Balance for ${invoice.invoiceNumber} marked as paid.`);
      onSaved();
    },
    onError: () => toast.error("Failed to mark as paid."),
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 animate-in zoom-in-95 duration-150">
        <div className="bg-green-600 text-white px-5 py-4 rounded-t-2xl flex items-center justify-between">
          <h3 className="font-bold">Mark Balance as Paid</h3>
          <button onClick={onClose}><X className="w-5 h-5" /></button>
        </div>
        <div className="p-5 space-y-4">
          <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-sm">
            <p className="font-semibold text-green-800">{invoice.invoiceNumber} — {invoice.customerName}</p>
            <p className="text-green-600 text-xs mt-1">Balance Due: <strong>{fmt(Number(invoice.balance))}</strong></p>
          </div>
          <div>
            <label className="text-xs font-bold text-slate-500 mb-1 block">Amount Received (₹)</label>
            <input type="number" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
              className="w-full h-10 px-3 text-sm border border-slate-200 rounded-lg outline-none font-bold" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-500 mb-1 block">Mode</label>
              <select value={form.mode} onChange={e => setForm(f => ({ ...f, mode: e.target.value }))}
                className="w-full h-10 px-3 text-sm border border-slate-200 rounded-lg outline-none">
                {["CASH", "ONLINE", "UPI"].map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-bold text-slate-500 mb-1 block">Date</label>
              <input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                className="w-full h-10 px-3 text-sm border border-slate-200 rounded-lg outline-none" />
            </div>
          </div>
          <button onClick={() => mutation.mutate(form)} disabled={mutation.isPending || !form.amount}
            className="w-full h-11 bg-green-600 text-white rounded-lg font-bold flex items-center justify-center gap-2 disabled:opacity-50">
            {mutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
            Confirm Payment
          </button>
        </div>
      </div>
    </div>
  );
}

export function ReceivablesTable({ data }: { data: any }) {
  const queryClient = useQueryClient();
  const [markPaidTarget, setMarkPaidTarget] = useState<any | null>(null);

  const invoices: any[] = data?.invoices || [];
  const totalReceivable = data?.totalReceivable || 0;

  const today = new Date();

  return (
    <div className="bg-white rounded-xl border border-brand-border shadow-sm overflow-hidden">
      <div className="flex items-center justify-between p-4 border-b border-brand-border">
        <div>
          <h2 className="text-base font-bold text-brand-forest">Pending Receivables</h2>
          <p className="text-xs text-brand-muted mt-0.5">Outstanding balances from active invoices</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-brand-muted">Total Outstanding</p>
          <p className="text-xl font-bold text-red-600">{fmt(totalReceivable)}</p>
        </div>
      </div>

      {invoices.length === 0 ? (
        <div className="p-8 text-center text-brand-muted text-sm flex flex-col items-center gap-2">
          <AlertCircle className="w-8 h-8 opacity-30" />
          <p>No outstanding balances. All invoices are settled! 🎉</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm" style={{ minWidth: "800px" }}>
            <thead className="bg-brand-cream text-brand-forest">
              <tr>
                <th className="px-4 py-2.5 text-left text-xs font-bold">Invoice</th>
                <th className="px-4 py-2.5 text-left text-xs font-bold">Customer</th>
                <th className="px-4 py-2.5 text-left text-xs font-bold">Phone</th>
                <th className="px-4 py-2.5 text-right text-xs font-bold">Total Bill</th>
                <th className="px-4 py-2.5 text-right text-xs font-bold">Advance Paid</th>
                <th className="px-4 py-2.5 text-right text-xs font-bold">Balance Due</th>
                <th className="px-4 py-2.5 text-left text-xs font-bold">Due Date</th>
                <th className="px-4 py-2.5 text-left text-xs font-bold">Assignee</th>
                <th className="px-4 py-2.5 text-left text-xs font-bold">Action</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((inv: any) => {
                const dueDate = inv.finalDeliveryDate ? new Date(inv.finalDeliveryDate) : null;
                const isOverdue = dueDate && dueDate < today;
                return (
                  <tr key={inv.id} className={`border-t border-brand-border/40 transition-colors ${isOverdue ? "bg-red-50/30 hover:bg-red-50/60" : "hover:bg-brand-cream/20"}`}>
                    <td className="px-4 py-2.5 font-mono font-bold text-xs text-brand-forest">
                      {`INV-${String(inv.invoiceNumber).padStart(4, "0")}`}
                    </td>
                    <td className="px-4 py-2.5 text-xs font-semibold max-w-[140px] truncate" title={inv.customerName}>{inv.customerName}</td>
                    <td className="px-4 py-2.5 text-xs text-brand-muted">{inv.phone || "—"}</td>
                    <td className="px-4 py-2.5 text-right text-xs font-semibold">{fmt(Number(inv.totalAmount))}</td>
                    <td className="px-4 py-2.5 text-right text-xs text-green-600">{fmt(Number(inv.advance || 0))}</td>
                    <td className="px-4 py-2.5 text-right font-bold text-red-600">{fmt(Number(inv.balance || 0))}</td>
                    <td className="px-4 py-2.5 text-xs">
                      {dueDate ? (
                        <span className={isOverdue ? "text-red-600 font-bold" : "text-brand-muted"}>
                          {format(dueDate, "dd MMM yyyy")}
                          {isOverdue && <span className="ml-1 text-[9px] bg-red-100 text-red-600 px-1 rounded-full">OVERDUE</span>}
                        </span>
                      ) : "—"}
                    </td>
                    <td className="px-4 py-2.5 text-xs text-brand-muted">{inv.assignee?.name || "—"}</td>
                    <td className="px-4 py-2.5">
                      <button onClick={() => setMarkPaidTarget(inv)}
                        className="px-3 py-1.5 bg-green-600 text-white text-xs font-bold rounded-lg hover:bg-green-700 transition-colors">
                        Mark Paid
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-red-200 bg-red-50/30">
                <td colSpan={5} className="px-4 py-3 text-sm font-bold text-red-700">Total Receivable</td>
                <td className="px-4 py-3 text-right font-bold text-red-700 text-base">{fmt(totalReceivable)}</td>
                <td colSpan={3} />
              </tr>
            </tfoot>
          </table>
        </div>
      )}

      {markPaidTarget && (
        <MarkPaidModal invoice={markPaidTarget} onClose={() => setMarkPaidTarget(null)} onSaved={() => {
          setMarkPaidTarget(null);
          queryClient.invalidateQueries({ queryKey: ["accounts-receivables"] });
          queryClient.invalidateQueries({ queryKey: ["accounts-transactions"] });
          queryClient.invalidateQueries({ queryKey: ["accounts-summary"] });
        }} />
      )}
    </div>
  );
}
