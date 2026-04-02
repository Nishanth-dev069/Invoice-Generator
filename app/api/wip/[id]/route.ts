export const dynamic = "force-dynamic";
/* eslint-disable @typescript-eslint/no-explicit-any */
// SECURITY CHECKLIST:
// - [x] Authentication (getServerSession)
// - [x] Role-Based Access Control (requireRole)
// - [x] Input Validation (Zod safeParse inline)
// - [x] UUID Validation
// - [x] SQL Injection protection (Prisma ORM)
// - [x] Rate Limiting
// - [x] Unified Error Handler

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { requireRole } from "@/lib/auth-helpers";
import { checkRateLimit } from "@/lib/rate-limit";
import { handleApiError } from "@/lib/api-error";
import { isValidUUID } from "@/lib/utils";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const wipUpdateSchema = z.object({
  phase: z.enum(["RAW_MATERIALS", "DESIGN", "PRINTING", "POST_PRINTING", "PAYMENT_PENDING"]).optional(),
  order: z.number().int().optional()
});

export async function PUT(req: Request, { params }: { params: { id: string } }) {
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

    const body = await req.json();
    const parsed = wipUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: parsed.error.flatten() }, { status: 400 });
    }
    const { phase, order } = parsed.data;

    // DB Query uses Prisma ORM which automatically parameterizes inputs
    const existingCard = await (prisma as any).wIPCard.findUnique({
      where: { id },
      select: { invoiceId: true, phase: true }
    });

    if (!existingCard) {
      return NextResponse.json({ success: false, error: 'Card not found' }, { status: 404 });
    }

    if (phase && phase !== existingCard.phase) {
      const existingChecklist = await (prisma as any).wIPChecklist.findFirst({
        where: { wipCardId: id, phase }
      });
      if (!existingChecklist) {
        await (prisma as any).wIPChecklist.create({
          data: { wipCardId: id, phase, invoiceId: existingCard.invoiceId }
        });
      }
    }

    const updated = await (prisma as any).wIPCard.update({
      where: { id },
      data: { phase, order },
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error: unknown) {
    return handleApiError(error);
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await auth();
    requireRole(session, "ADMIN");

    const rateLimitResponse = checkRateLimit(req, session?.user?.id || null, 100);
    if (rateLimitResponse) return rateLimitResponse;

    const { id } = params;
    if (!isValidUUID(id)) {
      return NextResponse.json({ success: false, error: 'Invalid ID' }, { status: 400 });
    }

    await (prisma as any).wIPCard.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    return NextResponse.json({ success: true, message: "Deleted successfully" });
  } catch (error: unknown) {
    return handleApiError(error);
  }
}
