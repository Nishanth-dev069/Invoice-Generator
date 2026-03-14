/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import { invoiceSchema } from "@/lib/validations";
import { z } from "zod";

export async function GET(req: Request) {
  try {
    await requireAuth();
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const search = searchParams.get("search") || "";
    const assigneeId = searchParams.get("assigneeId") || "";
    const sortBy = searchParams.get("sortBy") || "finalDeliveryDate";
    const order = searchParams.get("order") || "asc";
    const status = searchParams.get("status") || "ACTIVE";
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    const where: any = { deletedAt: null };

    if (search) {
      where.OR = [
        { customerName: { contains: search, mode: "insensitive" } },
        { invoiceNumber: { contains: search, mode: "insensitive" } },
      ];
    }

    if (assigneeId && assigneeId !== "all") {
      where.assigneeId = assigneeId;
    }

    if (status && status !== "ALL") {
      where.status = status;
    }

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        where.createdAt.lte = end;
      }
    }

    const skip = (page - 1) * limit;

    const [invoices, total] = await Promise.all([
      (prisma.invoice as any).findMany({
        where,
        orderBy: { [sortBy]: order },
        skip,
        take: limit,
        include: {
          assignee: { select: { id: true, name: true } },
        },
      }),
      (prisma.invoice as any).count({ where })
    ]);

    return NextResponse.json({
      data: invoices,
      metadata: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      }
    });
  } catch (error: unknown) {
    if (error instanceof NextResponse) return error;
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await requireAuth();
    const body = await req.json();
    const data = invoiceSchema.parse(body);

    const quantity = Number(data.quantity);
    const unitRate = Number(data.unitRate);
    const toleranceQuantity = Math.floor(quantity * 0.95);
    const totalAmount = quantity * unitRate;
    const advanceAmount = data.advancePaid ? Number(data.advanceAmount || 0) : null;
    let balance: number | null = totalAmount;
    if (data.advancePaid && advanceAmount !== null) {
      balance = totalAmount - advanceAmount;
    }

    // Auto generate invoice number synchronously via Postgres autoincrement
    const result = await prisma.$transaction(async (tx) => {
      const invoice = await (tx as any).invoice.create({
        data: {
          customerName: data.customerName,
          phone: data.phone,
          brideName: data.brideName || "",
          groomName: data.groomName || "",
          modelNumber: data.modelNumber || "",
          description: data.description,
          date: data.date ? new Date(data.date) : new Date(),
          quantity,
          toleranceQuantity,
          unitRate,
          totalAmount,
          advancePaid: data.advancePaid,
          advanceAmount,
          advanceMode: data.advancePaid && data.advanceMode ? data.advanceMode : null,
          balance,
          balancePaid: balance !== null && balance <= 0,
          balanceMode: data.balanceMode || null,
          estimatedDesignTime: data.estimatedDesignTime || "",
          estimatedPrintTime: data.estimatedPrintTime || "",
          packing: data.packing,
          printingColor: data.printingColor,
          designer: data.designer,
          printer: data.printer,
          additionalNotes: data.additionalNotes,
          contentConfirmedOn: data.contentConfirmedOn ? new Date(data.contentConfirmedOn) : null,
          finalDeliveryDate: data.finalDeliveryDate ? new Date(data.finalDeliveryDate) : null,
          assigneeId: data.assigneeId,
          createdById: user.id,
          status: "ACTIVE",
        },
      });

      const formattedNumber = `INV-${String(invoice.invoiceNumber).padStart(4, "0")}`;

      // Auto create WIPCard
      await (tx as any).wIPCard.create({
        data: {
          invoiceId: invoice.id,
          invoiceNumber: formattedNumber,
          description: data.description,
          quantity,
          customerName: data.customerName,
          phase: "RAW_MATERIALS",
          order: 0,
        },
      });

      return { ...invoice, invoiceNumberFormatted: formattedNumber };
    });

    return NextResponse.json(result);
  } catch (error: unknown) {
    console.error("CREATE INVOICE ENCOUNTERED AN ERROR", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json((error as any).errors, { status: 422 });
    }
    if (error instanceof NextResponse) return error;
    return new NextResponse("Internal Error", { status: 500 });
  }
}
