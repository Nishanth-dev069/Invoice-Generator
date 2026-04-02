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

import { useState } from "react";
import { X } from "lucide-react";

// (Keep the schema and other things below)

export function ChecklistPopover({ cardId, phase }: { cardId: string; phase: string; isHovered?: boolean }) {
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);

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
      const res = await fetch(`/api/wip-checklist/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fieldName, value })
      });
      if (!res.ok) throw new Error("Failed to update");
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
    onSettled: () => queryClient.invalidateQueries({ queryKey: ["checklist", cardId, phase] }),
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
    <>
      <button 
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); setIsOpen(true); }}
        onPointerDown={(e) => e.stopPropagation()}
        className={`px-2 py-0.5 rounded-full text-[10px] font-bold border flex items-center gap-1 cursor-pointer transition-colors select-none hover:opacity-80 ${colorClass}`}
        title="Open Checklist"
      >
        <ClipboardCheck className="w-3 h-3" />
        {fractionText}
      </button>
      
      {isOpen && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
          onClick={(e) => { e.stopPropagation(); setIsOpen(false); }}
          onPointerDown={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
        >
          <div 
            className="w-full max-w-sm bg-white rounded-xl shadow-2xl border border-brand-border flex flex-col md:max-h-[85vh] max-h-[80vh] overflow-hidden animate-in zoom-in-95 duration-100"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-brand-cream/40 p-4 border-b border-brand-border relative">
              <button 
                onClick={() => setIsOpen(false)}
                className="absolute right-3 top-3 p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
              
              <div className="pr-6">
                <h4 className="text-sm font-bold text-brand-forest uppercase tracking-wider flex items-center gap-2 mb-3">
                  <ClipboardCheck className="w-4 h-4 text-brand-sage" />
                  {PHASE_NAMES[phase]}
                </h4>
                
                <div className="flex items-center justify-between gap-3 mb-1">
                  <div className="h-2 w-full bg-brand-border/50 rounded-full overflow-hidden">
                    <div 
                      className={`h-full transition-all duration-500 rounded-full ${isComplete ? 'bg-green-500' : 'bg-brand-sage'}`} 
                      style={{ width: `${(completedItems / totalItems) * 100}%` }}
                    />
                  </div>
                  <span className="text-[10px] font-bold text-brand-muted shrink-0 w-8 text-right">
                    {fractionText}
                  </span>
                </div>
              </div>
            </div>

            {isComplete && (
              <div className="bg-green-50 px-4 py-2 border-b border-green-100/50 text-green-700 text-xs font-bold flex items-center justify-center shrink-0">
                All checks securely completed ✓
              </div>
            )}

            <div className="flex-1 overflow-y-auto p-2 scrollbar-thin scrollbar-thumb-brand-sage/20">
              {isLoading ? (
                <div className="flex items-center justify-center py-10 text-brand-muted">
                  <Loader2 className="w-6 h-6 animate-spin text-brand-sage" />
                </div>
              ) : (
                <div className="space-y-1">
                  {schema.map((item) => {
                    const checked = checklist ? checklist[item.key] === true : false;
                    return (
                      <button
                        key={item.key}
                        onClick={(e) => {
                          e.preventDefault(); e.stopPropagation();
                          if (checklist) {
                            updateMutation.mutate({ id: checklist.id, fieldName: item.key, value: !checked });
                          }
                        }}
                        className="w-full py-2.5 px-3 text-left flex items-start gap-3 hover:bg-brand-cream/50 rounded-lg transition-colors group/btn border border-transparent hover:border-brand-border"
                      >
                        <div className={`mt-0.5 flex-shrink-0 transition-colors ${checked ? 'text-green-500' : 'text-slate-300 group-hover/btn:text-brand-sage'}`}>
                          {checked ? <CheckSquare className="w-5 h-5" /> : <Square className="w-5 h-5" />}
                        </div>
                        <span className={`text-[13px] leading-snug select-none transition-colors ${checked ? 'text-slate-400 line-through' : 'text-brand-black font-semibold'}`}>
                          {item.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="bg-brand-cream/30 p-3 border-t border-brand-border shrink-0">
              <Link 
                href={`/dashboard/final-check?invoiceId=${checklist?.invoiceId || ''}`}
                className="flex items-center justify-center gap-1.5 w-full bg-white border border-brand-border rounded-lg py-2 text-xs font-bold text-brand-forest hover:bg-brand-sage hover:text-white transition-colors"
                onClick={(e) => e.stopPropagation()}
                target="_blank"
              >
                Open Full Audit Log <ArrowUpRight className="w-3 h-3" />
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
