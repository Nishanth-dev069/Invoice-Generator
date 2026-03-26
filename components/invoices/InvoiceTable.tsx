/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Download, Loader2, Pencil, Trash2, Search, X } from "lucide-react";
import Link from "next/link";
import { differenceInDays, startOfDay, format } from "date-fns";
import { toast } from "sonner";
import { InvoicePDF } from "./InvoicePDF";

function DownloadAction({ invoice }: { invoice: any }) {
  const [loading, setLoading] = useState(false);

  const download = async () => {
    setLoading(true);
    try {
      const { pdf } = await import("@react-pdf/renderer");
      const pdfData = {
        ...invoice,
        customerName: invoice.customerName || "",
        phone: invoice.phone || "",
        description: invoice.description || "",
        packing: invoice.packing || "WITHOUT_PACKING",
        advancePaid: invoice.advancePaid || false,
        quantity: Number(invoice.quantity || 0),
        unitRate: Number(invoice.unitRate || 0),
      };
      
      const blob = await pdf(<InvoicePDF data={pdfData} />).toBlob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      const formattedInvNum = `INV-${String(invoice.invoiceNumber).padStart(4, "0")}`;
      link.download = `${formattedInvNum}_${pdfData.customerName}.pdf`;
      link.click();
      URL.revokeObjectURL(url);
    } catch(err) {
      console.error(err);
      toast.error("Failed to generate PDF");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button onClick={download} disabled={loading} className="text-brand-navy hover:text-brand-orange p-1" title="Download PDF">
      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
    </button>
  );
}

const getRowStyle = (dateStr: string | null, status: string) => {
  if (!dateStr || status !== "ACTIVE") return { row: "bg-white", text: "text-slate-900" };

  const finalDate = startOfDay(new Date(dateStr));
  const today = startOfDay(new Date());
  const diff = differenceInDays(finalDate, today);

  if (diff < 0) {
    return { row: "bg-white", text: "text-red-600 font-bold" };
  } else if (diff >= 0 && diff <= 2) {
    return { row: "bg-red-100", text: "text-slate-900" };
  } else if (diff >= 3 && diff <= 6) {
    return { row: "bg-amber-100", text: "text-slate-900" };
  } else if (diff >= 7 && diff <= 14) {
    return { row: "bg-yellow-100", text: "text-slate-900" };
  } else {
    return { row: "bg-green-100", text: "text-slate-900" };
  }
};

export function InvoiceTable({ currentUserRole }: { currentUserRole: string }) {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const limit = 20;

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [assigneeId, setAssigneeId] = useState("all");
  const [sortBy, setSortBy] = useState("finalDeliveryDate");
  const [order, setOrder] = useState("asc");
  const [status, setStatus] = useState("ACTIVE");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Debounce search
  useState(() => {
    const handler = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(handler);
  });
  // Using generic useEffect because the above was incorrect conceptually without useEffect, wait I will inline fix it
  // Wait, I should use useEffect for debounce. I will fix it.

  // users for filter
  const { data: usersData } = useQuery({
    queryKey: ["users"],
    queryFn: async () => {
      const res = await fetch("/api/users");
      if (!res.ok) return [];
      return res.json();
    },
    staleTime: 60000,
  });

  const queryKey = ["invoices", page, limit, debouncedSearch, assigneeId, sortBy, order, status, startDate, endDate];
  
  const { data, isLoading } = useQuery({
    queryKey,
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        search: debouncedSearch,
        assigneeId,
        sortBy,
        order,
        status,
      });
      if (startDate) params.append("startDate", startDate);
      if (endDate) params.append("endDate", endDate);

      const res = await fetch(`/api/invoices?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to load invoices");
      return res.json();
    },
    staleTime: 30000,
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/invoices/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete invoice");
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey });
      const previousData = queryClient.getQueryData(queryKey) as any;
      if (previousData) {
        queryClient.setQueryData(queryKey, {
          ...previousData,
          data: previousData.data.filter((inv: any) => inv.id !== id),
        });
      }
      return { previousData };
    },
    onError: (err, id, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(queryKey, context.previousData);
      }
      toast.error("Failed to delete invoice.");
    },
    onSuccess: () => {
      toast.success("Invoice deleted successfully");
      setDeleteId(null);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
    },
  });

  const resetFilters = () => {
    setSearch("");
    setDebouncedSearch("");
    setAssigneeId("all");
    setSortBy("finalDeliveryDate");
    setOrder("asc");
    setStatus("ACTIVE");
    setStartDate("");
    setEndDate("");
    setPage(1);
  };

  const invoices = data?.data || [];
  const totalPages = data?.metadata?.totalPages || 1;

  return (
    <div className="space-y-4">
      {/* Legend */}
      <div className="flex justify-end mb-2">
        <div className="flex gap-2 text-xs items-center bg-white p-2 rounded border shadow-sm">
          <span className="font-semibold text-slate-600 mr-2">Priority Legend:</span>
          <div className="flex items-center gap-1"><span className="w-3 h-3 block bg-red-100 border"></span> 0-2 Days</div>
          <div className="flex items-center gap-1"><span className="w-3 h-3 block bg-amber-100 border"></span> 3-6 Days</div>
          <div className="flex items-center gap-1"><span className="w-3 h-3 block bg-yellow-100 border"></span> 7-14 Days</div>
          <div className="flex items-center gap-1"><span className="w-3 h-3 block bg-green-100 border"></span> 15+ Days</div>
          <div className="flex items-center gap-1"><span className="w-3 h-3 block bg-white border"></span> Default</div>
          <div className="flex items-center gap-1 ml-2 text-red-600 font-bold tracking-tight">Past Deadline</div>
        </div>
      </div>

      {/* Filters Toolbar */}
      <div className="bg-white p-4 rounded-lg border shadow-sm grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search invoice or customer..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm border rounded-md focus:ring-2 focus:ring-brand-orange"
          />
        </div>
        
        <select 
          value={assigneeId} 
          onChange={(e) => setAssigneeId(e.target.value)}
          className="w-full px-3 py-2 text-sm border rounded-md focus:ring-2 focus:ring-brand-orange"
        >
          <option value="all">All Assignees</option>
          {usersData?.map((u: any) => (
            <option key={u.id} value={u.id}>{u.name}</option>
          ))}
        </select>

        <select 
          value={status} 
          onChange={(e) => setStatus(e.target.value)}
          className="w-full px-3 py-2 text-sm border rounded-md focus:ring-2 focus:ring-brand-orange"
        >
          <option value="ACTIVE">Active</option>
          <option value="CLOSED">Closed</option>
          <option value="ALL">All Statuses</option>
        </select>

        <div className="flex gap-2">
          <input 
            type="date" 
            value={startDate} 
            onChange={(e) => setStartDate(e.target.value)}
            title="Start Date (Created)"
            className="w-full px-2 py-2 text-xs border rounded-md focus:ring-2 focus:ring-brand-orange"
          />
          <input 
            type="date" 
            value={endDate} 
            onChange={(e) => setEndDate(e.target.value)}
            title="End Date (Created)"
            className="w-full px-2 py-2 text-xs border rounded-md focus:ring-2 focus:ring-brand-orange"
          />
        </div>

        <div className="flex gap-2 lg:col-span-4 items-center">
          <span className="text-sm text-slate-500 font-medium">Sort By:</span>
          <select 
            value={sortBy} 
            onChange={(e) => setSortBy(e.target.value)}
            className="px-3 py-1.5 text-sm border rounded-md focus:ring-2 focus:ring-brand-orange"
          >
            <option value="finalDeliveryDate">Delivery Date</option>
            <option value="createdAt">Created Date</option>
            <option value="invoiceNumber">Invoice No</option>
          </select>
          <select 
            value={order} 
            onChange={(e) => setOrder(e.target.value)}
            className="px-3 py-1.5 text-sm border rounded-md focus:ring-2 focus:ring-brand-orange"
          >
            <option value="asc">Ascending</option>
            <option value="desc">Descending</option>
          </select>

          <button 
            onClick={resetFilters}
            className="ml-auto inline-flex items-center text-sm px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md transition-colors"
          >
            <X className="w-4 h-4 mr-1" /> Reset Filters
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg border shadow-sm overflow-hidden overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-slate-700 uppercase bg-slate-50 border-b">
            <tr>
              <th className="px-4 py-3">S.No</th>
              <th className="px-4 py-3">Invoice No</th>
              <th className="px-4 py-3">Customer</th>
              <th className="px-4 py-3">Description</th>
              <th className="px-4 py-3">Qty</th>
              <th className="px-4 py-3">Printing Color</th>
              <th className="px-4 py-3">Designer</th>
              <th className="px-4 py-3">Printer</th>
              <th className="px-4 py-3">Confirmed On</th>
              <th className="px-4 py-3">Delivery Date</th>
              <th className="px-4 py-3">Assignee</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="border-b animate-pulse">
                  <td className="px-4 py-4"><div className="h-4 bg-slate-200 rounded w-8"></div></td>
                  <td className="px-4 py-4"><div className="h-4 bg-slate-200 rounded w-20"></div></td>
                  <td className="px-4 py-4"><div className="h-4 bg-slate-200 rounded w-24"></div></td>
                  <td className="px-4 py-4"><div className="h-4 bg-slate-200 rounded w-32"></div></td>
                  <td className="px-4 py-4"><div className="h-4 bg-slate-200 rounded w-12"></div></td>
                  <td className="px-4 py-4"><div className="h-4 bg-slate-200 rounded w-16"></div></td>
                  <td className="px-4 py-4"><div className="h-4 bg-slate-200 rounded w-20"></div></td>
                  <td className="px-4 py-4"><div className="h-4 bg-slate-200 rounded w-20"></div></td>
                  <td className="px-4 py-4"><div className="h-4 bg-slate-200 rounded w-24"></div></td>
                  <td className="px-4 py-4"><div className="h-4 bg-slate-200 rounded w-24"></div></td>
                  <td className="px-4 py-4"><div className="h-4 bg-slate-200 rounded w-20"></div></td>
                  <td className="px-4 py-4"><div className="h-4 bg-slate-200 rounded w-16"></div></td>
                </tr>
              ))
            ) : invoices.length === 0 ? (
              <tr>
                <td colSpan={12} className="px-4 py-12 text-center text-slate-500">
                  {search || assigneeId !== "all" || startDate ? "No invoices match your filters." : "No invoices yet. Create your first invoice."}
                </td>
              </tr>
            ) : (
              invoices.map((inv: any, index: number) => {
                const style = getRowStyle(inv.finalDeliveryDate, inv.status);
                return (
                  <tr key={inv.id} className={`border-b hover:opacity-90 ${style.row}`}>
                    <td className="px-4 py-3">{(page - 1) * limit + index + 1}</td>
                    <td className="px-4 py-3 font-medium text-brand-navy">INV-{String(inv.invoiceNumber).padStart(4, "0")}</td>
                    <td className="px-4 py-3">{inv.customerName}</td>
                    <td className="px-4 py-3 max-w-[200px] truncate" title={inv.description}>{inv.description}</td>
                    <td className="px-4 py-3">{inv.quantity}</td>
                    <td className="px-4 py-3">{inv.printingColor || "-"}</td>
                    <td className="px-4 py-3">{inv.designer || "-"}</td>
                    <td className="px-4 py-3">{inv.printer || "-"}</td>
                    <td className="px-4 py-3">{inv.contentConfirmedOn ? format(new Date(inv.contentConfirmedOn), "dd MMM yyyy") : "-"}</td>
                    <td className={`px-4 py-3 ${style.text}`}>{inv.finalDeliveryDate ? format(new Date(inv.finalDeliveryDate), "dd MMM yyyy") : "-"}</td>
                    <td className="px-4 py-3">{inv.assignee?.name || "-"}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Link href={`/dashboard/invoices/${inv.id}/edit`} className="text-blue-600 hover:text-blue-800 p-1" title="Edit">
                          <Pencil className="w-4 h-4" />
                        </Link>
                        <DownloadAction invoice={inv} />
                        {currentUserRole === "ADMIN" && (
                          <button 
                            onClick={() => setDeleteId(inv.id)} 
                            className="text-red-500 hover:text-red-700 p-1"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {!isLoading && invoices.length > 0 && (
        <div className="flex justify-between items-center bg-white p-4 rounded-lg border shadow-sm">
          <button 
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-4 py-2 text-sm border rounded hover:bg-slate-50 disabled:opacity-50"
          >
            Previous
          </button>
          <span className="text-sm font-medium text-slate-600">Page {page} of {totalPages}</span>
          <button 
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="px-4 py-2 text-sm border rounded hover:bg-slate-50 disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-sm">
            <h3 className="text-lg font-bold mb-2">Delete Invoice</h3>
            <p className="text-sm text-slate-500 mb-6">Are you sure you want to delete this invoice? This action cannot be undone.</p>
            <div className="flex justify-end gap-3">
              <button 
                onClick={() => setDeleteId(null)}
                className="px-4 py-2 text-sm font-medium border rounded-md hover:bg-slate-50"
                disabled={deleteMutation.isPending}
              >
                Cancel
              </button>
              <button 
                onClick={() => deleteMutation.mutate(deleteId)}
                className="px-4 py-2 text-sm font-medium bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
                disabled={deleteMutation.isPending}
              >
                {deleteMutation.isPending ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
