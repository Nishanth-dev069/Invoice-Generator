export const dynamic = "force-dynamic";
/* eslint-disable @typescript-eslint/no-explicit-any */
// SECURITY CHECKLIST:
// - [x] Authentication (getServerSession)
// - [x] Role-Based Access Control (N/A)
// - [x] UUID Validation (isValidUUID)
// - [x] SQL Injection protection (Prisma parameterization)
// - [x] Rate Limiting
// - [x] Unified Error Handler (handleApiError)

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { checkRateLimit } from "@/lib/rate-limit";
import { handleApiError } from "@/lib/api-error";
import { isValidUUID } from "@/lib/utils";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request, { params }: { params: { wipCardId: string } }) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    const rateLimitResponse = checkRateLimit(req, session.user.id, 100);
    if (rateLimitResponse) return rateLimitResponse;

    const { wipCardId } = params;
    if (!isValidUUID(wipCardId)) {
      return NextResponse.json({ success: false, error: 'Invalid ID' }, { status: 400 });
    }

    // DB Query uses Prisma ORM which intrinsically prevents SQL injection
    const card = await (prisma as any).wIPCard.findUnique({
      where: { id: wipCardId },
      select: { phase: true, invoiceId: true }
    });

    if (!card) return NextResponse.json({ success: false, error: 'Card not found' }, { status: 404 });

    let checklist = await (prisma as any).wIPChecklist.findFirst({
      where: { wipCardId, phase: card.phase }
    });

    if (!checklist) {
      checklist = await (prisma as any).wIPChecklist.create({
        data: {
          wipCardId,
          phase: card.phase,
          invoiceId: card.invoiceId
        }
      });
    }

    return NextResponse.json({ success: true, data: checklist });
  } catch (error: unknown) {
    return handleApiError(error);
  }
}
