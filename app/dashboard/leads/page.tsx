/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Search, X } from "lucide-react";
import { toast } from "sonner";
import { LeadCard } from "@/components/leads/LeadCard";
import { AddEditLeadModal } from "@/components/leads/AddEditLeadModal";

// Assuming role is checked or fetched via context/layout. We'll pass it simply for now or fetch it.
import { useSession } from "next-auth/react";

export default function LeadsPage() {
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === "ADMIN";
  const queryClient = useQueryClient();

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string[]>([]);
  const [assigneeId, setAssigneeId] = useState("all");
  const [sort, setSort] = useState("Newest");

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLead, setEditingLead] = useState<any>(null);
  
  // Delete Modal
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Debounce search
  useState(() => {
    const handler = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(handler);
  });

  const { data: usersData } = useQuery({
    queryKey: ["users"],
    queryFn: async () => {
      const res = await fetch("/api/users");
      if (!res.ok) return [];
      const json = await res.json();
      return json.success ? json.data : json;
    },
    staleTime: 60000,
  });

  const statusStr = statusFilter.length > 0 ? statusFilter.join(",") : "ALL";
  const queryKey = ["leads", debouncedSearch, statusStr, assigneeId, sort];

  const { data: leads, isLoading } = useQuery({
    queryKey,
    queryFn: async () => {
      const params = new URLSearchParams({
        search: debouncedSearch,
        status: statusStr,
        assigneeId,
        sort,
      });
      const res = await fetch(`/api/leads?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch leads");
      const json = await res.json();
      return json.success ? json.data : json;
    },
    staleTime: 30000,
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/leads/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete lead");
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey });
      const previousData = queryClient.getQueryData(queryKey) as any[];
      if (previousData) {
        queryClient.setQueryData(queryKey, previousData.filter(l => l.id !== id));
      }
      return { previousData };
    },
    onError: (err, id, context) => {
      if (context?.previousData) {
         queryClient.setQueryData(queryKey, context.previousData);
      }
      toast.error("Failed to delete lead.");
    },
    onSuccess: () => {
      toast.success("Lead securely removed.");
      setDeleteId(null);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["leads"] });
    }
  });

  const toggleStatus = (s: string) => {
    setStatusFilter(prev => 
      prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]
    );
  };

  const resetFilters = () => {
    setSearch("");
    setDebouncedSearch("");
    setStatusFilter([]);
    setAssigneeId("all");
    setSort("Newest");
  };

  const statuses = ["NEW", "CONTACTED", "NEGOTIATING", "CONVERTED", "LOST"];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-brand-forest">Leads Pipeline</h1>
          <p className="text-sm text-slate-500 mt-1">Manage and track your print inquiries.</p>
        </div>
        <button 
          onClick={() => { setEditingLead(null); setIsModalOpen(true); }}
          className="inline-flex items-center justify-center rounded-md bg-brand-forest text-white px-4 py-2 text-sm font-medium hover:bg-brand-forest/90 transition-colors shadow-sm"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Lead
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-lg shadow-sm border space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search leads by name or desc..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm border rounded-md focus:ring-2 focus:ring-brand-sage"
            />
          </div>
          <select 
            value={assigneeId} 
            onChange={(e) => setAssigneeId(e.target.value)}
            className="px-3 py-2 text-sm border rounded-md focus:ring-2 focus:ring-brand-sage bg-white"
          >
            <option value="all">All Assignees</option>
            {usersData?.map((u: any) => (
              <option key={u.id} value={u.id}>{u.name}</option>
            ))}
          </select>
          <div className="flex gap-2 items-center">
            <span className="text-sm text-slate-500 font-medium whitespace-nowrap">Sort By:</span>
            <select 
              value={sort} 
              onChange={(e) => setSort(e.target.value)}
              className="w-full px-3 py-2 text-sm border rounded-md focus:ring-2 focus:ring-brand-sage bg-white"
            >
              <option value="Newest">Newest First</option>
              <option value="Oldest">Oldest First</option>
              <option value="Highest Value">Highest Value</option>
              <option value="Lowest Value">Lowest Value</option>
            </select>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-slate-500 font-medium">Statuses:</span>
          {statuses.map(s => (
            <button
              key={s}
              onClick={() => toggleStatus(s)}
              className={`px-3 py-1 rounded-full text-xs font-semibold border transition-colors ${
                statusFilter.includes(s) 
                  ? "bg-brand-forest text-white border-brand-forest" 
                  : "bg-slate-50 text-slate-600 hover:bg-slate-100"
              }`}
            >
              {s}
            </button>
          ))}

          {(search || statusFilter.length > 0 || assigneeId !== "all" || sort !== "Newest") && (
            <button 
              onClick={resetFilters}
              className="ml-auto inline-flex items-center text-xs font-medium px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-md transition-colors"
            >
              <X className="w-3 h-3 mr-1" /> Clear Filters
            </button>
          )}
        </div>
      </div>

      {/* Grid Layout Configuration: "4 columns desktop, 2 tablet, 1 mobile" */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="bg-white rounded-lg border p-4 h-[180px] animate-pulse flex flex-col justify-between">
              <div className="w-1/3 h-4 bg-slate-200 rounded mb-4"></div>
              <div className="w-3/4 h-5 bg-slate-200 rounded mb-2"></div>
              <div className="w-1/2 h-4 bg-slate-200 rounded mb-4"></div>
              <div className="w-full h-8 bg-slate-200 rounded mt-auto"></div>
            </div>
          ))}
        </div>
      ) : leads?.length === 0 ? (
        <div className="bg-white border text-center p-12 rounded-lg shadow-sm">
          <p className="text-slate-500">
            {search || statusFilter.length > 0 || assigneeId !== "all" 
              ? "No leads match your active filters." 
              : "No leads yet. Create your first lead to expand your funnel."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
          {leads?.map((lead: any) => (
            <LeadCard 
              key={lead.id} 
              lead={lead} 
              onEdit={(l) => { setEditingLead(l); setIsModalOpen(true); }}
              onDelete={(id) => setDeleteId(id)}
              isAdmin={isAdmin}
            />
          ))}
        </div>
      )}

      {/* Modals */}
      <AddEditLeadModal 
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setEditingLead(null); }}
        lead={editingLead}
      />

      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-sm">
            <h3 className="text-lg font-bold text-slate-900 mb-2">Delete Lead</h3>
            <p className="text-sm text-slate-500 mb-6">Are you sure you want to delete this lead? This cannot be reversed.</p>
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
