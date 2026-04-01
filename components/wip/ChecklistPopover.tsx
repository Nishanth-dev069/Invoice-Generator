"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { CheckSquare, Square, Loader2, ClipboardCheck, ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

const CHECKLIST_SCHEMA: Record<string, { key: string, label: string }[]> = {
  RAW_MATERIALS: [
    { key: "rm_billNumberVerified", label: "Bill Number Verified" },
    { key: "rm_modelNumberVerified", label: "Model Number Verified" },
    { key: "rm_descriptionVerified", label: "Description Verified" },
    { key: "rm_quantityVerified", label: "Quantity Verified" },
    { key: "rm_printerAssigned", label: "Printer Assigned" },
    { key: "rm_dtpAssigned", label: "DTP Assigned" },
    { key: "rm_colourExplainedToCustomer", label: "Colour Explained" },
    { key: "rm_leadTimeExplained", label: "Lead Time Explained" },
    { key: "rm_wastageRemarksAdjusted", label: "Wastage Remarks Adjusted" },
    { key: "rm_dtpAssignedAndStarted", label: "DTP Assigned and Started" },
  ],
  DESIGN: [
    { key: "d_materialCardsReceived", label: "Material/Cards Received" },
    { key: "d_dtpConfirmed", label: "DTP Confirmed" },
    { key: "d_cardsStockUpdated", label: "Cards Stock Updated" },
    { key: "d_currentStockChecked", label: "Current Stock Checked" },
    { key: "d_stickersQualityChecked", label: "Stickers Quality Checked" },
    { key: "d_stickerQualityUpdated", label: "Sticker Quality Updated" },
    { key: "d_logoCheckedOnDtp", label: "Logo Checked on DTP" },
    { key: "d_printerScheduleInformed", label: "Printer Schedule Informed" },
    { key: "d_dtpSentToCustomer", label: "DTP Sent to Customer" },
  ],
  PRINTING: [
    { key: "p_namePlatesReceived1", label: "Name Plates (Initial)" },
    { key: "p_namePlatesQualityChecked", label: "Name Plates QC" },
    { key: "p_dtpConfirmedByCustomer", label: "DTP Confirmed" },
    { key: "p_namePlatesReceivedFinal", label: "Name Plates (Final)" },
    { key: "p_signaturesFromCustomer", label: "Signatures Got From Cust" },
    { key: "p_leadTimeUpdated", label: "Lead Time Updated" },
    { key: "p_leftRightExplained", label: "Left/Right Explained" },
    { key: "p_masterTracingsReady", label: "Master Tracings Ready" },
    { key: "p_samplesCollectedFromDtp", label: "Samples Collected from DTP" },
    { key: "p_masterCheckWithPdfCard", label: "Master Checked with PDF" },
    { key: "p_timeColourWrittenOnCards", label: "Time/Colour Authored" },
    { key: "p_timeColourSentInGroup", label: "Time/Colour Sent in Group" },
    { key: "p_cardOrientationSentToGroup", label: "Orientation Sent to Group" },
    { key: "p_materialSentToPrinter", label: "Material Sent to Printer" },
    { key: "p_estimatedPrintingDateSet", label: "Printing Date Estimated" },
    { key: "p_printerFollowUp", label: "Printer Follow Up" },
    { key: "p_cardOrientationConfirmed", label: "Card Orientation Confirmed" },
  ],
  POST_PRINTING: [
    { key: "pp_paddingBoxingScheduled", label: "Padding/Boxing Scheduled" },
    { key: "pp_printedMaterialReceived", label: "Printed Material Received" },
    { key: "pp_printedMaterialQC", label: "Printed Material QC" },
    { key: "pp_cardsToBinder", label: "Cards Sent to Binder" },
    { key: "pp_binderFollowUp", label: "Binder Follow Up" },
    { key: "pp_estimatedTimeToBinder", label: "Estimated Time to Binder" },
    { key: "pp_endProductCheck", label: "End Product Checked" },
    { key: "pp_sampleExchanged", label: "Sample Exchanged" },
    { key: "pp_customerInformedBag", label: "Customer Informed about Bag" },
    { key: "pp_customerInformedReadiness", label: "Customer Readiness Push" },
    { key: "pp_paymentCollected", label: "Payment Collected" },
    { key: "pp_reminderFollowUp", label: "Reminder Follow Up" },
    { key: "pp_ratingTaken", label: "Rating Taken" },
    { key: "pp_checkRatingName", label: "Check Rating Name" },
    { key: "pp_balanceCollected", label: "Balance Collected" },
  ],
  PAYMENT_PENDING: [
    { key: "pay_invoiceAmountConfirmed", label: "Invoice Amount Confirmed" },
    { key: "pay_paymentReminderSent", label: "Payment Reminder Sent" },
    { key: "pay_partialPaymentReceived", label: "Partial Payment Received" },
    { key: "pay_fullPaymentReceived", label: "Full Payment Received" },
    { key: "pay_receiptIssued", label: "Receipt Issued" },
  ]
};

const PHASE_NAMES: Record<string, string> = {
  RAW_MATERIALS: "Raw Materials",
  DESIGN: "Design",
  PRINTING: "Printing",
  POST_PRINTING: "Post Printing",
  PAYMENT_PENDING: "Payment Pending",
};

export function ChecklistPopover({ cardId, phase, isHovered }: { cardId: string; phase: string; isHovered: boolean }) {
  const queryClient = useQueryClient();

  // The GET endpoint reads based on wipCardId because we unified them
  const { data: checklist, isLoading } = useQuery({
    queryKey: ["checklist", cardId, phase],
    queryFn: async () => {
      const res = await fetch(`/api/wip-checklist/${cardId}`);
      if (!res.ok) throw new Error("Failed to load checklist");
      return res.json();
    },
    staleTime: 60000,
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, fieldName, value }: { id: string, fieldName: string, value: boolean }) => {
      // PATCH endpoint also uses id (the wipChecklist's ID)
      const res = await fetch(`/api/wip-checklist/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fieldName, value })
      });
      if (!res.ok) throw new Error("Failed to update checklist");
    },
    onMutate: async ({ fieldName, value }) => {
      await queryClient.cancelQueries({ queryKey: ["checklist", cardId, phase] });
      const previous = queryClient.getQueryData(["checklist", cardId, phase]);
      if (previous) {
        queryClient.setQueryData(["checklist", cardId, phase], {
          ...(previous as any),
          [fieldName]: value
        });
      }
      return { previous };
    },
    onError: (err, vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(["checklist", cardId, phase], context.previous);
      }
      toast.error("Failed to update checklist item");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["checklist", cardId, phase] });
    }
  });

  const schema = CHECKLIST_SCHEMA[phase] || [];
  const totalItems = schema.length;
  let completedItems = 0;

  if (checklist) {
    completedItems = schema.filter(item => checklist[item.key] === true).length;
  }

  const fractionText = `${completedItems}/${totalItems}`;
  const isComplete = totalItems > 0 && completedItems === totalItems;
  const isPartial = completedItems > 0 && completedItems < totalItems;

  const colorClass = isComplete ? "text-green-600 bg-green-50 border-green-200" 
    : isPartial ? "text-amber-600 bg-amber-50 border-amber-200" 
    : "text-slate-500 bg-slate-50 border-slate-200";

  if (totalItems === 0) return null;

  return (
    <div className="relative isolate group/popover">
      <div 
        className={`px-2 py-0.5 rounded-full text-[10px] font-bold border flex items-center gap-1 cursor-help transition-colors select-none ${colorClass}`}
        onPointerDown={(e) => e.stopPropagation()}
      >
        <ClipboardCheck className="w-3 h-3" />
        {fractionText}
      </div>
      
      {/* Absolute Popover (Appears on Hover) */}
      <div 
        className={`absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-72 bg-white rounded-xl shadow-xl border border-brand-border z-50 overflow-hidden transform transition-all duration-200 pointer-events-none opacity-0 translate-y-2 group-hover/popover:pointer-events-auto group-hover/popover:opacity-100 group-hover/popover:translate-y-0`}
        onPointerDown={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()} // Prevent DND drag intercept
      >
        <div className="bg-brand-cream/40 p-3 border-b border-brand-border">
          <div className="flex justify-between items-center mb-2">
            <h4 className="text-xs font-bold text-brand-forest uppercase tracking-wider flex items-center gap-1.5">
              <ClipboardCheck className="w-4 h-4 text-brand-sage" />
              {PHASE_NAMES[phase]}
            </h4>
            <span className="text-[10px] font-bold text-brand-muted bg-white px-2 py-0.5 rounded-full border border-brand-border">
              {fractionText}
            </span>
          </div>
          
          <div className="h-1.5 w-full bg-brand-border/50 rounded-full overflow-hidden">
            <div 
              className={`h-full transition-all duration-500 rounded-full ${isComplete ? 'bg-green-500' : 'bg-brand-sage'}`} 
              style={{ width: `${(completedItems / totalItems) * 100}%` }}
            />
          </div>
        </div>

        {isComplete && (
          <div className="bg-green-50 px-3 py-1.5 border-b border-green-100/50 text-green-700 text-xs font-bold flex items-center justify-center">
            All checks done ✓
          </div>
        )}

        <div className="max-h-60 overflow-y-auto p-2 scrollbar-thin scrollbar-thumb-brand-sage/20">
          {isLoading ? (
            <div className="flex items-center justify-center py-6 text-brand-muted">
              <Loader2 className="w-5 h-5 animate-spin" />
            </div>
          ) : (
            <div className="space-y-1">
              {schema.map((item) => {
                const checked = checklist ? checklist[item.key] === true : false;
                
                return (
                  <button
                    key={item.key}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      if (checklist) {
                        updateMutation.mutate({ id: checklist.id, fieldName: item.key, value: !checked });
                      }
                    }}
                    className="w-full text-left flex items-start gap-2 p-1.5 hover:bg-brand-cream/50 rounded transition-colors group/btn"
                  >
                    <div className={`mt-0.5 flex-shrink-0 transition-colors ${checked ? 'text-green-500' : 'text-slate-300 group-hover/btn:text-brand-sage'}`}>
                      {checked ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
                    </div>
                    <span className={`text-[11px] leading-tight select-none transition-colors ${checked ? 'text-slate-400 line-through' : 'text-brand-black font-semibold'}`}>
                      {item.label}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="bg-brand-cream/30 p-2 border-t border-brand-border">
          <Link 
            href={`/dashboard/final-check?invoiceId=${checklist?.invoiceId || ''}`}
            className="w-full flex items-center justify-center gap-1.5 text-xs font-bold text-brand-forest hover:text-brand-sage transition-colors p-1"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
            target="_blank"
          >
            Full Audit Log <ArrowUpRight className="w-3 h-3" />
          </Link>
        </div>
      </div>
    </div>
  );
}
