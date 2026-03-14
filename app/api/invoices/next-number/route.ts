import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    await requireAuth();

    // Get the latest invoice created
    const latestInvoice = await prisma.invoice.findFirst({
      orderBy: { createdAt: "desc" },
      select: { invoiceNumber: true },
    });

    const currentNum = latestInvoice?.invoiceNumber || 0;
    const nextNum = currentNum + 1;
    const nextNumber = `INV-${nextNum.toString().padStart(4, "0")}`;

    return NextResponse.json({ nextNumber });
  } catch (error: unknown) {
    if (error instanceof NextResponse) return error;
    return new NextResponse("Internal Error", { status: 500 });
  }
}
