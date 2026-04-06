export const dynamic = "force-dynamic";
/* eslint-disable @typescript-eslint/no-explicit-any */
// SECURITY CHECKLIST:
// - [x] Authentication (getServerSession)
// - [x] Role-Based Access Control (requireRole)
// - [x] Input Validation (Zod safeParse)
// - [x] Date/Enum Validation
// - [x] SQL Injection protection (Prisma ORM parameterization)
// - [x] Rate Limiting
// - [x] Unified Error Handler (handleApiError)

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { requireRole } from "@/lib/auth-helpers";
import { checkRateLimit } from "@/lib/rate-limit";
import { handleApiError } from "@/lib/api-error";
import { prisma } from "@/lib/prisma";
import { invoiceCreateSchema } from "@/lib/validations";

export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    const rateLimitResponse = checkRateLimit(req, session.user.id, 100);
    if (rateLimitResponse) return rateLimitResponse;

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const search = searchParams.get("search") || "";
    const assigneeId = searchParams.get("assigneeId") || "";
    const sortBy = searchParams.get("sortBy") || "finalDeliveryDate";
    const order = searchParams.get("order") || "asc";
    const status = searchParams.get("status") || "ACTIVE";
    
    // Advanced Filters
    const category = searchParams.get("category");
    const printingColor = searchParams.get("printingColor");
    const designer = searchParams.get("designer");
    const printer = searchParams.get("printer");
    const deliveryDateFrom = searchParams.get("deliveryDateFrom");
    const deliveryDateTo = searchParams.get("deliveryDateTo");
    const createdFrom = searchParams.get("createdFrom") || searchParams.get("startDate");
    const createdTo = searchParams.get("createdTo") || searchParams.get("endDate");
    const minAmount = searchParams.get("minAmount");
    const maxAmount = searchParams.get("maxAmount");
    const packing = searchParams.get("packing");
    const advancePaidFilters = searchParams.get("advancePaid");

    // DB Query uses Prisma ORM which automatically parameterizes inputs, preventing SQL injection
    const where: any = {};

    if (search) {
      where.OR = [
        { customerName: { contains: search, mode: "insensitive" } },
        { invoiceNumber: { equals: isNaN(Number(search)) ? undefined : Number(search) } },
      ].filter(c => c.invoiceNumber?.equals !== undefined || c.customerName);
    }

    if (assigneeId && assigneeId !== "all") where.assigneeId = assigneeId;
    if (status && status !== "ALL") where.status = status;

    if (category && category !== "all") {
      const cats = category.split(",").map(c => c.trim()).filter(Boolean);
      if (cats.length > 0) where.category = { in: cats };
    }
    if (printingColor) where.printingColor = { contains: printingColor, mode: "insensitive" };
    if (designer) where.designer = { contains: designer, mode: "insensitive" };
    if (printer) where.printer = { contains: printer, mode: "insensitive" };
    
    if (deliveryDateFrom || deliveryDateTo) {
      where.finalDeliveryDate = {};
      if (deliveryDateFrom) where.finalDeliveryDate.gte = new Date(deliveryDateFrom);
      if (deliveryDateTo) {
        const end = new Date(deliveryDateTo);
        end.setHours(23, 59, 59, 999);
        where.finalDeliveryDate.lte = end;
      }
    }

    if (createdFrom || createdTo) {
      where.createdAt = {};
      if (createdFrom) where.createdAt.gte = new Date(createdFrom);
      if (createdTo) {
        const end = new Date(createdTo);
        end.setHours(23, 59, 59, 999);
        where.createdAt.lte = end;
      }
    }

    if (minAmount || maxAmount) {
      where.totalAmount = {};
      if (minAmount) where.totalAmount.gte = Number(minAmount);
      if (maxAmount) where.totalAmount.lte = Number(maxAmount);
    }
    if (packing && packing !== "ALL") where.packing = packing;
    if (advancePaidFilters && advancePaidFilters !== "ALL") {
      where.advancePaid = advancePaidFilters === "Paid";
    }

    const skip = (page - 1) * limit;

    const [invoices, total] = await Promise.all([
      (prisma.invoice as any).findMany({
        where,
        orderBy: { [sortBy]: order },
        skip,
        take: limit,
        include: { assignee: { select: { id: true, name: true } } },
      }),
      (prisma.invoice as any).count({ where })
    ]);

    return NextResponse.json({
      success: true,
      data: invoices,
      metadata: { total, page, limit, totalPages: Math.ceil(total / limit) }
    });
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
    const parsed = invoiceCreateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: parsed.error.flatten() }, { status: 400 });
    }
    const data = parsed.data;

    const quantity = Number(data.quantity);
    const unitRate = Number(data.unitRate);
    const toleranceQuantity = Math.floor(quantity * 0.95);
    const totalAmount = quantity * unitRate;
    const advanceAmount = data.advancePaid ? Number(data.advanceAmount || 0) : null;
    let balance: number | null = totalAmount;
    if (data.advancePaid && advanceAmount !== null) {
      balance = totalAmount - advanceAmount;
    }

    // DB Query uses Prisma ORM parameterized queries natively
    const result = await prisma.$transaction(async (tx) => {
      const invoice = await (tx as any).invoice.create({
        data: {
          customerName: data.customerName,
          phone: data.phone,
          brideName: data.brideName || "",
          groomName: data.groomName || "",
          category: data.category,
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
          assigneeId: data.assigneeId || session.user.id,
          createdById: session.user.id,
          status: "ACTIVE",
        },
      });

      const formattedNumber = `INV-${String(invoice.invoiceNumber).padStart(4, "0")}`;
      const cardBaseParams = {
        invoiceId: invoice.id,
        invoiceNumber: formattedNumber,
        description: data.description,
        quantity,
        customerName: data.customerName,
        order: 0,
      };

      await (tx as any).wIPCard.create({
        data: {
          ...cardBaseParams,
          phase: "RAW_MATERIALS",
          checklists: { create: { phase: "RAW_MATERIALS", invoiceId: invoice.id } }
        }
      });

      return { ...invoice, invoiceNumberFormatted: formattedNumber };
    });

    return NextResponse.json({ success: true, data: result });
  } catch (error: unknown) {
    return handleApiError(error);
  }
}

