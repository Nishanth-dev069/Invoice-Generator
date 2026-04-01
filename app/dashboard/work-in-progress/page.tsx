"use client";

import { useQuery } from "@tanstack/react-query";
import { KanbanBoard } from "@/components/wip/KanbanBoard";
import { useSession } from "next-auth/react";
import { Loader2 } from "lucide-react";

export default function WorkInProgressPage() {
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === "ADMIN";

  const { data: columnsData, isLoading } = useQuery({
    queryKey: ["wip"],
    queryFn: async () => {
      const res = await fetch("/api/wip");
      if (!res.ok) throw new Error("Failed to load Kanban board");
      const json = await res.json();
      return json.success ? json.data : json;
    },
    staleTime: 10000,
  });

  return (
    <div className="h-[calc(100vh-100px)] flex flex-col space-y-4">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-brand-forest">Work in Progress</h1>
        <p className="text-sm text-slate-500 mt-1">Drag and drop production cards through the pipeline.</p>
      </div>

      <div className="flex-1 overflow-hidden relative">
        {isLoading ? (
          <div className="absolute inset-0 flex items-center justify-center bg-white/50 backdrop-blur-sm z-10 rounded-lg border border-slate-200">
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="w-8 h-8 text-brand-forest animate-spin" />
              <p className="text-sm font-medium text-slate-600">Loading Pipeline...</p>
            </div>
          </div>
        ) : (
          columnsData && <KanbanBoard initialData={columnsData} isAdmin={isAdmin} />
        )}
      </div>
    </div>
  );
}
