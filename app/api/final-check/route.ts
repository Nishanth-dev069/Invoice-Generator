/* eslint-disable @typescript-eslint/no-explicit-any */
// SECURITY CHECKLIST:
// - [x] Authentication (getServerSession)
// - [x] Role-Based Access Control (N/A)
// - [x] Input Validation (Zod safeParse)
// - [x] SQL Injection protection (Prisma ORM)
// - [x] Rate Limiting
// - [x] Unified Error Handler (handleApiError)

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { checkRateLimit } from "@/lib/rate-limit";
import { handleApiError } from "@/lib/api-error";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const finalCheckCreateSchema = z.object({
  wipCardId: z.string().uuid()
});

export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    const rateLimitResponse = checkRateLimit(req, session.user.id, 100);
    if (rateLimitResponse) return rateLimitResponse;

    const finalChecks = await (prisma.finalCheck as any).findMany({
      where: { deletedAt: null },
      orderBy: { createdAt: "desc" },
      include: {
        invoice: {
          select: {
            finalDeliveryDate: true,
            status: true,
            customerName: true,
            wipCard: { include: { checklists: true } }
          }
        }
      }
    });

    const aggregated = finalChecks.map((fc: any) => {
      const checklists = fc.invoice?.wipCard?.checklists || [];
      const mergedChecklists = checklists.reduce((acc: Record<string, boolean>, curr: any) => {
        const booleansOnly = Object.keys(curr).reduce((bAcc: Record<string, boolean>, key: string) => {
          if (typeof curr[key] === 'boolean') {
            bAcc[key] = curr[key];
          }
          return bAcc;
        }, {});
        return { ...acc, ...booleansOnly };
      }, {});
      
      return { ...fc, ...mergedChecklists };
    });

    return NextResponse.json({ success: true, data: aggregated });
  } catch (error: unknown) {
    return handleApiError(error);
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    const rateLimitResponse = checkRateLimit(req, session.user.id, 100);
    if (rateLimitResponse) return rateLimitResponse;

    const body = await req.json();
    const parsed = finalCheckCreateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: parsed.error.flatten() }, { status: 400 });
    }
    const { wipCardId } = parsed.data;

    const wipCard = await (prisma as any).wIPCard.findUnique({
      where: { id: wipCardId },
      include: { invoice: true }
    });

    if (!wipCard) {
      return NextResponse.json({ success: false, error: 'WIP Card not found' }, { status: 404 });
    }

    const result = await prisma.$transaction(async (tx) => {
      // Create FinalCheck record from the completed WIP card and its invoice
      const finalCheck = await (tx as any).finalCheck.create({
        data: {
          invoiceId: wipCard.invoiceId,
          invoiceNumber: wipCard.invoiceNumber,
          description: wipCard.description,
          quantity: wipCard.quantity,
          modelNumber: wipCard.invoice.modelNumber,
          designer: wipCard.invoice.designer,
          printer: wipCard.invoice.printer,
        }
      });

      // Archive the original WIPCard by setting deletedAt securely so it drops off the board
      await (tx as any).wIPCard.update({
        where: { id: wipCardId },
        data: { deletedAt: new Date() }
      });

      return finalCheck;
    });

    return NextResponse.json({ success: true, data: result });
  } catch (error: unknown) {
    return handleApiError(error);
  }
}
