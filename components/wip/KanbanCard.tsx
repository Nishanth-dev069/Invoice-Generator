/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { differenceInDays, startOfDay } from "date-fns";
import { Trash2, ExternalLink, CheckCircle, IndianRupee } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { ChecklistPopover } from "./ChecklistPopover";

const getPriorityDot = (dateStr: string | null, invoiceStatus: string) => {
  if (!dateStr || invoiceStatus !== "ACTIVE") return "bg-slate-300";

  const finalDate = startOfDay(new Date(dateStr));
  const today = startOfDay(new Date());
  const diff = differenceInDays(finalDate, today);

  if (diff < 0) return "bg-red-600";
  if (diff >= 0 && diff <= 2) return "bg-red-400";
  if (diff >= 3 && diff <= 6) return "bg-amber-400";
  if (diff >= 7 && diff <= 14) return "bg-yellow-400";
  return "bg-green-400";
};

export function KanbanCard({ 
  card, 
  isAdmin, 
  onDelete, 
  onMarkComplete,
  onMarkPaymentPending,
  isOverlay = false 
}: { 
  card: any; 
  isAdmin: boolean; 
  onDelete: (id: string) => void;
  onMarkComplete: (id: string) => void;
  onMarkPaymentPending: (id: string) => void;
  isOverlay?: boolean;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: card.id, data: { ...card } });

  const [isHovered, setIsHovered] = useState(false);

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  const deliveryDate = card.invoice?.finalDeliveryDate;
  const status = card.invoice?.status || "ACTIVE";
  const priorityDot = getPriorityDot(deliveryDate, status);
  const initials = card.invoice?.assignee?.name ? card.invoice.assignee.name.substring(0, 2).toUpperCase() : "??";
  
  const isPostPrinting = card.phase === "POST_PRINTING";
  const isPaymentPending = card.phase === "PAYMENT_PENDING";

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`bg-white p-3 rounded-lg border shadow-sm relative group cursor-grab active:cursor-grabbing flex flex-col gap-2 ${isOverlay ? 'shadow-xl scale-105 rotate-2' : ''} ${isPaymentPending ? 'border-amber-300' : ''}`}
    >
      {isPaymentPending && (
        <div className="absolute -top-2.5 -right-2.5 bg-amber-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm flex items-center gap-0.5">
          <IndianRupee className="w-3 h-3" /> Awaiting Payment
        </div>
      )}

      <div className="flex justify-between items-start">
        <span className="font-bold text-sm text-brand-forest flex items-center gap-1.5">
          <span className={`w-2.5 h-2.5 rounded-full ${priorityDot}`} title="Priority Indicator" />
          {card.invoiceNumber}
        </span>
        <div className="flex items-center gap-1">
          {isPostPrinting && (
            <button
              onClick={(e) => { e.stopPropagation(); onMarkPaymentPending(card.id); }}
              className={`p-1 text-amber-500 hover:bg-amber-50 rounded bg-white relative z-10 transition-opacity ${isHovered ? 'opacity-100' : 'opacity-0'}`}
              title="Payment Pending ->"
            >
              <IndianRupee className="w-4 h-4" />
            </button>
          )}
          {(isPostPrinting || isPaymentPending) && (
            <button
              onClick={(e) => { e.stopPropagation(); onMarkComplete(card.id); }}
              className={`p-1 text-green-600 hover:bg-green-50 rounded bg-white relative z-10 transition-opacity ${isHovered ? 'opacity-100' : 'opacity-0'}`}
              title="Mark Complete -> Final Check"
            >
              <CheckCircle className="w-4 h-4" />
            </button>
          )}
          {isAdmin && (
            <button
              onClick={(e) => { e.stopPropagation(); onDelete(card.id); }}
              className={`p-1 text-red-500 hover:bg-red-50 rounded bg-white relative z-10 transition-opacity ${isHovered ? 'opacity-100' : 'opacity-0'}`}
              title="Remove from board"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      <div className="text-xs font-semibold text-slate-700">
        {card.customerName}
      </div>

      <p className="text-xs text-slate-500 line-clamp-2" title={card.description}>
        {card.description}
      </p>

      <div className="flex justify-between items-end mt-2 pt-2 border-t">
        <div className="flex items-center gap-3">
          <div className="flex flex-col relative z-20">
            <ChecklistPopover cardId={card.id} phase={card.phase} isHovered={isHovered} />
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {card.invoice?.id && (
            <Link 
              href={`/dashboard/invoices/${card.invoice.id}/edit`} 
              className="text-brand-sage hover:text-brand-forest relative z-10"
              onPointerDown={(e) => e.stopPropagation()}
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>
          )}
          <div 
            className="w-6 h-6 rounded-full bg-brand-cream text-brand-forest flex items-center justify-center text-[9px] font-bold" 
            title={card.invoice?.assignee?.name || "Unassigned"}
          >
            {initials}
          </div>
        </div>
      </div>
    </div>
  );
}
