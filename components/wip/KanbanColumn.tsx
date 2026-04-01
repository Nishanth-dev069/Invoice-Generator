/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { KanbanCard } from "./KanbanCard";

const PHASE_LABELS: Record<string, string> = {
  RAW_MATERIALS: "Raw Materials",
  DESIGN: "Design",
  PRINTING: "Printing",
  POST_PRINTING: "Post Printing",
  PAYMENT_PENDING: "Payment Pending",
};

export function KanbanColumn({ 
  id, 
  cards, 
  isAdmin,
  onDelete,
  onMarkComplete,
  onMarkPaymentPending,
}: { 
  id: string; 
  cards: any[]; 
  isAdmin: boolean;
  onDelete: (id: string) => void;
  onMarkComplete: (id: string) => void;
  onMarkPaymentPending: (id: string) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id });

  const isPaymentPending = id === "PAYMENT_PENDING";
  const bgClass = isPaymentPending ? "bg-amber-50" : "bg-slate-100";
  const borderClass = isPaymentPending ? "border-amber-500 shadow-md shadow-amber-500/10" : "border-slate-200 shadow-sm";
  const headerBgClass = isPaymentPending ? "bg-amber-100/50" : "bg-white";
  const headerTextClass = isPaymentPending ? "text-amber-900" : "text-slate-700";

  return (
    <div className={`flex flex-col flex-shrink-0 w-80 rounded-lg h-full max-h-[calc(100vh-140px)] border ${bgClass} ${borderClass}`}>
      <div className={`p-3 border-b flex justify-between items-center rounded-t-lg ${headerBgClass} ${isPaymentPending ? "border-amber-200" : "border-slate-200"}`}>
        <h3 className={`font-bold text-sm uppercase tracking-wide flex items-center gap-1.5 ${headerTextClass}`}>
          {isPaymentPending && <span className="p-1 rounded bg-amber-500 text-white"><svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="6" y1="3" x2="10" y2="3"/><line x1="14" y1="3" x2="18" y2="3"/><line x1="12" y1="3" x2="12" y2="21"/><path d="M12 3C8.686 3 6 5.686 6 9c0 3 2.1 5.5 5 5.9V21"/></svg></span>}
          {PHASE_LABELS[id] || id}
        </h3>
        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${isPaymentPending ? "bg-amber-200 text-amber-800" : "bg-slate-200 text-slate-600"}`}>
          {cards.length}
        </span>
      </div>

      <div 
        ref={setNodeRef}
        className={`flex-1 p-3 overflow-y-auto space-y-3 transition-colors ${
          isOver ? 'bg-slate-200 shadow-inner' : ''
        }`}
      >
        <SortableContext items={cards.map(c => c.id)} strategy={verticalListSortingStrategy}>
          {cards.map((card) => (
            <KanbanCard 
              key={card.id} 
              card={card} 
              isAdmin={isAdmin}
              onDelete={onDelete}
              onMarkComplete={onMarkComplete}
              onMarkPaymentPending={onMarkPaymentPending}
            />
          ))}
        </SortableContext>
        
        {cards.length === 0 && (
          <div className={`h-full border-2 border-dashed rounded-lg flex items-center justify-center text-sm ${isPaymentPending ? "border-amber-300 text-amber-500" : "border-slate-300 text-slate-400"}`}>
            Drop cards here
          </div>
        )}
      </div>
    </div>
  );
}
