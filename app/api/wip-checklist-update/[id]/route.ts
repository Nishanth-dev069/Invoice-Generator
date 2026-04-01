/* eslint-disable @typescript-eslint/no-explicit-any */
// SECURITY CHECKLIST:
// - [x] Authentication (getServerSession)
// - [x] Role-Based Access Control (N/A)
// - [x] UUID Validation (isValidUUID)
// - [x] Input Validation (Strict field set validation)
// - [x] SQL Injection protection (Prisma parameterization)
// - [x] Rate Limiting
// - [x] Unified Error Handler (handleApiError)

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { checkRateLimit } from "@/lib/rate-limit";
import { handleApiError } from "@/lib/api-error";
import { isValidUUID } from "@/lib/utils";
import { prisma } from "@/lib/prisma";

const VALID_CHECKLIST_FIELDS = new Set([
  // RAW_MATERIALS
  "rm_billNumberVerified", "rm_modelNumberVerified", "rm_descriptionVerified", "rm_quantityVerified", "rm_printerAssigned", "rm_dtpAssigned", "rm_colourExplainedToCustomer", "rm_leadTimeExplained", "rm_wastageRemarksAdjusted", "rm_dtpAssignedAndStarted",
  // DESIGN
  "d_materialCardsReceived", "d_dtpConfirmed", "d_cardsStockUpdated", "d_currentStockChecked", "d_stickersQualityChecked", "d_stickerQualityUpdated", "d_logoCheckedOnDtp", "d_printerScheduleInformed", "d_dtpSentToCustomer",
  // PRINTING
  "p_namePlatesReceived1", "p_namePlatesQualityChecked", "p_dtpConfirmedByCustomer", "p_namePlatesReceivedFinal", "p_signaturesFromCustomer", "p_leadTimeUpdated", "p_leftRightExplained", "p_masterTracingsReady", "p_samplesCollectedFromDtp", "p_masterCheckWithPdfCard", "p_timeColourWrittenOnCards", "p_timeColourSentInGroup", "p_cardOrientationSentToGroup", "p_materialSentToPrinter", "p_estimatedPrintingDateSet", "p_printerFollowUp", "p_cardOrientationConfirmed",
  // POST_PRINTING
  "pp_paddingBoxingScheduled", "pp_printedMaterialReceived", "pp_printedMaterialQC", "pp_cardsToBinder", "pp_binderFollowUp", "pp_estimatedTimeToBinder", "pp_endProductCheck", "pp_sampleExchanged", "pp_customerInformedBag", "pp_customerInformedReadiness", "pp_paymentCollected", "pp_reminderFollowUp", "pp_ratingTaken", "pp_checkRatingName", "pp_balanceCollected",
  // PAYMENT_PENDING
  "pay_invoiceAmountConfirmed", "pay_paymentReminderSent", "pay_partialPaymentReceived", "pay_fullPaymentReceived", "pay_receiptIssued"
]);

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    const rateLimitResponse = checkRateLimit(req, session.user.id, 100);
    if (rateLimitResponse) return rateLimitResponse;

    const { id } = params;
    if (!isValidUUID(id)) {
      return NextResponse.json({ success: false, error: 'Invalid ID' }, { status: 400 });
    }
    
    // Accept { fieldName: string, value: boolean }
    const { fieldName, value } = await req.json();

    if (!fieldName || typeof value !== "boolean") {
      return NextResponse.json({ success: false, error: 'Invalid payload' }, { status: 400 });
    }

    if (!VALID_CHECKLIST_FIELDS.has(fieldName)) {
      return NextResponse.json({ success: false, error: 'Invalid field name' }, { status: 400 });
    }

    // Now update that specific field
    const updated = await (prisma as any).wIPChecklist.update({
      where: { id },
      data: {
        [fieldName]: value
      }
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error: unknown) {
    return handleApiError(error);
  }
}
