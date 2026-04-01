/* eslint-disable @typescript-eslint/no-explicit-any */
// SECURITY CHECKLIST:
// - [x] Authentication (getServerSession)
// - [x] Role-Based Access Control (N/A - basic auth is fine)
// - [x] Input Validation (N/A - no payload)
// - [x] SQL Injection protection (Prisma ORM)
// - [x] Rate Limiting
// - [x] Unified Error Handler (handleApiError)

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { checkRateLimit } from "@/lib/rate-limit";
import { handleApiError } from "@/lib/api-error";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    const rateLimitResponse = checkRateLimit(req, session.user.id, 100);
    if (rateLimitResponse) return rateLimitResponse;
    
    // DB Query uses Prisma ORM which intrinsically prevents SQL injection
    // Fetch all active WIPCards and group them by phase
    const rawWipCards = await (prisma as any).wIPCard.findMany({
      where: { deletedAt: null },
      orderBy: { order: "asc" },
      include: {
        invoice: {
          select: {
            finalDeliveryDate: true,
            status: true,
            assignee: { select: { id: true, name: true } },
          }
        }
      }
    });

    const columns = {
      RAW_MATERIALS: [],
      DESIGN: [],
      PRINTING: [],
      POST_PRINTING: [],
    } as Record<string, any[]>;

    rawWipCards.forEach((card: any) => {
      if (columns[card.phase]) {
        columns[card.phase].push(card);
      }
    });

    return NextResponse.json({ success: true, data: columns });
  } catch (error: unknown) {
    return handleApiError(error);
  }
}
