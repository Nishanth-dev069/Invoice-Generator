/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    await requireAuth();

    const finalChecks = await (prisma.finalCheck as any).findMany({
      where: { deletedAt: null },
      orderBy: { createdAt: "desc" },
      include: {
        invoice: {
          select: {
            finalDeliveryDate: true,
            status: true,
            customerName: true,
          }
        }
      }
    });

    return NextResponse.json(finalChecks);
  } catch (error: unknown) {
    if (error instanceof NextResponse) return error;
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    await requireAuth();
    const body = await req.json();
    const { wipCardId } = body;

    if (!wipCardId) {
      return new NextResponse("wipCardId is required", { status: 400 });
    }

    const wipCard = await (prisma as any).wIPCard.findUnique({
      where: { id: wipCardId },
      include: { invoice: true }
    });

    if (!wipCard) {
      return new NextResponse("WIP Card not found", { status: 404 });
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

    return NextResponse.json(result);
  } catch (error: unknown) {
    console.error("Final Check POST Error:", error);
    if (error instanceof NextResponse) return error;
    return new NextResponse("Internal Error", { status: 500 });
  }
}
