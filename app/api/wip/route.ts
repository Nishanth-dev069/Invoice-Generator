/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    await requireAuth();
    
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

    return NextResponse.json(columns);
  } catch (error: unknown) {
    if (error instanceof NextResponse) return error;
    return new NextResponse("Internal Error", { status: 500 });
  }
}
