/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { leadSchema } from "@/lib/validations";
import * as z from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2, X } from "lucide-react";

type FormValues = z.infer<typeof leadSchema>;

export function AddEditLeadModal({ 
  isOpen, 
  onClose, 
  lead 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  lead?: any 
}) {
  const queryClient = useQueryClient();

  // Fix form mounting bugs by explicitly re-registering defaults
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm<FormValues>({
    resolver: zodResolver(leadSchema) as any,
    defaultValues: {
      customerName: "",
      phone: "",
      category: "",
      description: "",
      quantity: 1,
      assignedToId: "",
      estimatedBillValue: 0,
      status: "NEW",
      notes: "",
    }
  });

  useEffect(() => {
    if (lead) {
      reset({
        customerName: lead.customerName,
        phone: lead.phone,
        category: lead.category,
        description: lead.description,
        quantity: lead.quantity,
        assignedToId: lead.assignedToId,
        estimatedBillValue: typeof lead.estimatedBillValue === 'string' ? parseFloat(lead.estimatedBillValue) : lead.estimatedBillValue,
        status: lead.status,
        notes: lead.notes || "",
      });
    } else {
      reset({
        customerName: "",
        phone: "",
        category: "",
        description: "",
        quantity: 1,
        assignedToId: "",
        estimatedBillValue: 0,
        status: "NEW",
        notes: "",
      });
    }
  }, [lead, reset, isOpen]);

  const { data: users } = useQuery({
    queryKey: ["users"],
    queryFn: async () => {
      const res = await fetch("/api/users");
      if (!res.ok) return [];
      const json = await res.json();
      return Array.isArray(json.data) ? json.data : (Array.isArray(json) ? json : []);
    },
    enabled: isOpen
  });

  const mutation = useMutation({
    mutationFn: async (data: FormValues) => {
      const url = lead ? `/api/leads/${lead.id}` : "/api/leads";
      const method = lead ? "PUT" : "POST";
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
      toast.success(lead ? "Lead updated successfully" : "Lead created successfully");
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      onClose();
    },
    onError: (err: any) => {
      toast.error(err.message || "Something went wrong.");
    }
  });

  const onSubmit = (data: FormValues) => {
    mutation.mutate(data);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-4 border-b sticky top-0 bg-white z-10">
          <h2 className="text-xl font-bold text-brand-forest">
            {lead ? "Edit Lead" : "Add New Lead"}
          </h2>
          <button onClick={onClose} className="p-1 hover:bg-slate-100 rounded-full transition-colors">
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Customer Name *</label>
              <input {...register("customerName")} placeholder="John Doe" className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-brand-sage text-sm" />
              {errors.customerName && <p className="text-xs text-red-500">{errors.customerName.message}</p>}
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Phone Number *</label>
              <input {...register("phone")} placeholder="+91 9876543210" className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-brand-sage text-sm" />
              {errors.phone && <p className="text-xs text-red-500">{errors.phone.message}</p>}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Category *</label>
              <input {...register("category")} placeholder="e.g. Wedding Cards, Business Cards" className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-brand-sage text-sm" />
              {errors.category && <p className="text-xs text-red-500">{errors.category.message}</p>}
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Quantity *</label>
              <input type="number" min="1" {...register("quantity")} className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-brand-sage text-sm" />
              {errors.quantity && <p className="text-xs text-red-500">{errors.quantity.message}</p>}
            </div>

            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium">Description *</label>
              <textarea {...register("description")} rows={2} placeholder="Brief description of the requirement..." className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-brand-sage text-sm resize-none" />
              {errors.description && <p className="text-xs text-red-500">{errors.description.message}</p>}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Assigned To *</label>
              <select {...register("assignedToId")} className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-brand-sage text-sm bg-white">
                <option value="">Select Assignee</option>
                {(Array.isArray(users) ? users : (users?.data || [])).map((u: any) => (
                  <option key={u.id} value={u.id}>{u.name}</option>
                ))}
              </select>
              {errors.assignedToId && <p className="text-xs text-red-500">{errors.assignedToId.message}</p>}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Estimated Bill Value (₹) *</label>
              <input type="number" step="0.01" min="0" {...register("estimatedBillValue")} className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-brand-sage text-sm" />
              {errors.estimatedBillValue && <p className="text-xs text-red-500">{errors.estimatedBillValue.message}</p>}
            </div>

            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium">Status</label>
              <select {...register("status")} className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-brand-sage text-sm bg-white">
                <option value="NEW">New</option>
                <option value="CONTACTED">Contacted</option>
                <option value="NEGOTIATING">Negotiating</option>
                <option value="CONVERTED">Converted</option>
                <option value="LOST">Lost</option>
              </select>
            </div>

            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium">Internal Notes</label>
              <textarea {...register("notes")} rows={3} placeholder="Any private notes regarding this lead..." className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-brand-sage text-sm resize-none" />
            </div>
          </div>

          <div className="pt-4 flex justify-end gap-3 border-t mt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium border rounded-md hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={mutation.isPending}
              className="inline-flex items-center px-4 py-2 text-sm font-medium bg-brand-forest text-white rounded-md hover:bg-brand-forest/90 transition-colors disabled:opacity-50"
            >
              {mutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {lead ? "Update Lead" : "Create Lead"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
