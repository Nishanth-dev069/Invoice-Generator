/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Save } from "lucide-react";
import { invoiceSchema } from "@/lib/validations";
import dynamic from "next/dynamic";

const PDFDownloadButton = dynamic(
  () => import("./PDFDownloadButton"),
  { ssr: false }
);

type FormValues = z.infer<typeof invoiceSchema>;

export function InvoiceForm({ initialData, invoiceId }: {
  initialData?: Partial<FormValues> & { invoiceNumber?: string, balance?: number };
  invoiceId?: string;
}) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [mounted, setMounted] = useState(false);

  const { data: nextNumberData } = useQuery({
    queryKey: ["next-invoice-number"],
    queryFn: async () => {
      const res = await fetch("/api/invoices/next-number");
      if (!res.ok) throw new Error("Failed to fetch next number");
      return res.json();
    },
    enabled: !invoiceId, // only fetch if new
  });

  const { data: users } = useQuery({
    queryKey: ["users"],
    queryFn: async () => {
      const res = await fetch("/api/users");
      if (!res.ok) throw new Error("Failed to fetch users");
      return res.json();
    },
  });

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(invoiceSchema) as any,
    defaultValues: (initialData as FormValues) || {
      date: new Date().toISOString().slice(0, 10),
      // Typecasting the rest explicitly if needed, but FormValues as fallback is usually sufficient
      quantity: 0,
      unitRate: 0,
      advancePaid: false,
      packing: "WITHOUT_PACKING",
      contentConfirmedOn: new Date().toISOString().slice(0, 10),
    } as any,
  });

  // Watch fields for live calculations
  const qty = useWatch({ control, name: "quantity" }) || 0;
  const rate = useWatch({ control, name: "unitRate" }) || 0;
  const advPaid = useWatch({ control, name: "advancePaid" });
  const advAmount = useWatch({ control, name: "advanceAmount" }) || 0;
  
  const totalAmount = Number(qty) * Number(rate);
  const balance = advPaid ? totalAmount - Number(advAmount) : totalAmount;
  const toleranceQty = Math.floor(Number(qty) * 0.95);

  const mutation = useMutation({
    mutationFn: async (data: FormValues) => {
      const url = invoiceId ? `/api/invoices/${invoiceId}` : "/api/invoices";
      const method = invoiceId ? "PUT" : "POST";
      
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      
      if (!res.ok) {
        const err = await res.text();
        throw new Error(err);
      }
      return res.json();
    },
    onSuccess: () => {
      toast.success(invoiceId ? "Invoice updated successfully" : "Invoice generated successfully");
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      if (!invoiceId) {
        router.push("/invoices");
        router.refresh();
      }
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to save invoice.");
    },
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  const invoiceNumberRaw = initialData?.invoiceNumber;
  const invoiceNumber = invoiceNumberRaw ? (typeof invoiceNumberRaw === "string" ? invoiceNumberRaw : `INV-${String(invoiceNumberRaw).padStart(4, "0")}`) : nextNumberData?.nextNumber || "Loading...";

  // PDF Preview Data Object
  const currentFormData = useWatch({ control });
  const pdfData = {
    ...currentFormData,
    customerName: currentFormData.customerName || "",
    phone: currentFormData.phone || "",
    description: currentFormData.description || "",
    packing: currentFormData.packing || "WITHOUT_PACKING",
    advancePaid: currentFormData.advancePaid || false,
    invoiceNumber,
    quantity: Number(currentFormData.quantity || 0),
    unitRate: Number(currentFormData.unitRate || 0),
  };

  return (
    <form onSubmit={handleSubmit((d) => mutation.mutate(d as any))} className="space-y-8 pb-12 w-full max-w-5xl mx-auto">
      <div className="flex justify-between items-center pb-4 border-b">
        <div>
          <h2 className="text-2xl font-bold text-brand-navy">
            {invoiceId ? `Edit Invoice: ${invoiceNumber}` : `New Invoice: ${invoiceNumber}`}
          </h2>
          <p className="text-sm text-muted-foreground mt-1">Fill in the sections below to complete the invoice.</p>
        </div>
        <div className="flex gap-3">
          {mounted && invoiceId && (
            <PDFDownloadButton pdfData={pdfData} invoiceNumber={invoiceNumber} />
          )}

          <button
            type="submit"
            disabled={mutation.isPending}
            className="inline-flex items-center justify-center rounded-md bg-brand-orange text-white px-4 py-2 text-sm font-medium hover:bg-brand-orange-hover transition-colors disabled:opacity-50"
          >
            {mutation.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
            {invoiceId ? "Update Invoice" : "Generate Invoice"}
          </button>
        </div>
      </div>

      <div className="grid gap-8 md:grid-cols-2">
        {/* SECTION 1 */}
        <div className="space-y-6 bg-card p-6 border rounded-lg shadow-sm">
          <div className="border-b pb-2 mb-4">
            <h3 className="text-lg font-semibold text-brand-orange">Section 1: Customer Details</h3>
            <p className="text-xs text-muted-foreground">Visible on printed invoice</p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Date *</label>
            <input type="date" {...register("date")} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-brand-orange" />
            {errors.date && <p className="text-xs text-destructive">{errors.date.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Customer Name *</label>
              <input {...register("customerName")} placeholder="John Doe" className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-brand-orange" />
              {errors.customerName && <p className="text-xs text-destructive">{errors.customerName.message}</p>}
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Phone Number *</label>
              <input type="tel" {...register("phone")} placeholder="+91 9876543210" className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-brand-orange" />
              {errors.phone && <p className="text-xs text-destructive">{errors.phone.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Bride&apos;s Name</label>
              <input {...register("brideName")} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-brand-orange" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Groom&apos;s Name</label>
              <input {...register("groomName")} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-brand-orange" />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Model Number</label>
            <input {...register("modelNumber")} placeholder="e.g. CARD-WC-500" className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-brand-orange" />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Description *</label>
            <textarea {...register("description")} rows={3} placeholder="Describe the print order..." className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-brand-orange resize-none" />
            {errors.description && <p className="text-xs text-destructive">{errors.description.message}</p>}
          </div>
        </div>

        {/* SECTION 2 */}
        <div className="space-y-6 bg-card p-6 border rounded-lg shadow-sm">
          <div className="border-b pb-2 mb-4">
            <h3 className="text-lg font-semibold text-brand-orange">Section 2: Order Details</h3>
            <p className="text-xs text-muted-foreground">Visible on printed invoice</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Quantity *</label>
              <input type="number" min="1" {...register("quantity")} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-brand-orange" />
              <p className="text-xs text-muted-foreground">Effective quantity after 5% tolerance: <span className="font-bold">{toleranceQty}</span> cards</p>
              {errors.quantity && <p className="text-xs text-destructive">{errors.quantity.message}</p>}
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Unit Rate (₹) *</label>
              <input type="number" step="0.01" min="0" {...register("unitRate")} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-brand-orange" />
              {errors.unitRate && <p className="text-xs text-destructive">{errors.unitRate.message}</p>}
            </div>
          </div>

          <div className="p-4 bg-muted/50 rounded-lg flex justify-between items-center border">
            <span className="font-medium">Total Amount</span>
            <span className="text-xl font-bold">₹{totalAmount.toFixed(2)}</span>
          </div>

          <div className="space-y-4 p-4 border rounded-lg">
            <div className="flex items-center justify-between">
              <label className="text-sm font-bold flex items-center gap-2">
                <input type="checkbox" {...register("advancePaid")} className="h-4 w-4 rounded border-gray-300 text-brand-orange focus:ring-brand-orange" />
                Advance Paid?
              </label>
            </div>

            {advPaid && (
              <div className="grid grid-cols-2 gap-4 pt-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Advance Amount (₹)</label>
                  <input type="number" step="0.01" {...register("advanceAmount")} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-brand-orange" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Advance Mode</label>
                  <select {...register("advanceMode")} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-brand-orange">
                     <option value="">Select Mode</option>
                     <option value="ONLINE">Online</option>
                     <option value="CASH">Cash</option>
                  </select>
                </div>
              </div>
            )}

            <div className="pt-2 border-t mt-4 flex justify-between items-center">
              <span className="font-medium text-sm">Balance</span>
              {!advPaid ? (
                <span className="px-2 py-1 bg-red-100 text-red-700 text-xs font-bold rounded-full">Unpaid</span>
              ) : (
                <span className="font-bold text-brand-orange flex items-center gap-2">
                  ₹{balance.toFixed(2)}
                  {balance === 0 && <span className="text-green-600 text-xs">(Paid)</span>}
                </span>
              )}
            </div>

            {advPaid && balance > 0 && (
              <div className="space-y-2">
                <label className="text-xs font-medium">Balance Payment Mode</label>
                <select {...register("balanceMode")} className="flex h-8 w-full rounded-md border border-input bg-background px-3 text-xs focus:ring-1 focus:ring-brand-orange">
                  <option value="">Pending</option>
                  <option value="ONLINE">Online</option>
                  <option value="CASH">Cash</option>
                </select>
              </div>
            )}
          </div>
          
          <div className="grid grid-cols-2 gap-4">
             <div className="space-y-2">
               <label className="text-sm font-medium">Est. Setup/Design Time</label>
               <input {...register("estimatedDesignTime")} placeholder="e.g. 2 Days" className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-brand-orange" />
             </div>
             <div className="space-y-2">
               <label className="text-sm font-medium">Est. Print Time</label>
               <input {...register("estimatedPrintTime")} placeholder="e.g. 3 Days after proof" className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-brand-orange" />
             </div>
          </div>

          <div className="space-y-2">
             <label className="text-sm font-medium">Packing Type</label>
             <select {...register("packing")} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-brand-orange">
                <option value="WITH_PACKING">With Packing</option>
                <option value="WITHOUT_PACKING">Without Packing</option>
             </select>
          </div>
        </div>

        {/* SECTION 3 */}
        <div className="md:col-span-2 space-y-6 bg-slate-50 p-6 border-2 border-dashed border-slate-300 rounded-lg">
          <div className="border-b border-slate-300 pb-2 mb-4 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-slate-800">Section 3: Internal Tracking</h3>
            <span className="text-xs font-bold bg-slate-200 text-slate-600 px-2 py-1 rounded">For Internal Use Only — Not Printed</span>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Assignee *</label>
                <select {...register("assigneeId")} className="flex h-10 w-full rounded-md border border-input bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-brand-orange">
                   <option value="">Select Assignee</option>
                   {users?.map((u: { id: string, name: string, role: string }) => (
                     <option key={u.id} value={u.id}>{u.name} ({u.role})</option>
                   ))}
                </select>
                {errors.assigneeId && <p className="text-xs text-destructive">{errors.assigneeId.message}</p>}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Printing Color</label>
                <input {...register("printingColor")} className="flex h-10 w-full rounded-md border border-input bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-brand-orange" />
              </div>
            </div>

            <div className="space-y-4 border-l border-slate-200 pl-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Designer</label>
                <input {...register("designer")} className="flex h-10 w-full rounded-md border border-input bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-brand-orange" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Printer Assigned</label>
                <input {...register("printer")} className="flex h-10 w-full rounded-md border border-input bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-brand-orange" />
              </div>
            </div>

            <div className="space-y-4 border-l border-slate-200 pl-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Final Delivery Date *</label>
                <input type="date" {...register("finalDeliveryDate")} className="flex h-10 w-full rounded-md border border-input bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-brand-orange" />
                {errors.finalDeliveryDate && <p className="text-xs text-destructive">{errors.finalDeliveryDate.message}</p>}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Content Confirmed On</label>
                <input type="date" {...register("contentConfirmedOn")} className="flex h-10 w-full rounded-md border border-input bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-brand-orange" />
              </div>
            </div>
          </div>

          <div className="space-y-2 pt-4 border-t border-slate-200">
            <label className="text-sm font-medium">Additional Internal Notes</label>
            <textarea {...register("additionalNotes")} rows={3} placeholder="Private notes..." className="flex w-full rounded-md border border-input bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-brand-orange resize-none" />
          </div>
        </div>
      </div>
    </form>
  );
}
