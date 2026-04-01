/* eslint-disable @typescript-eslint/no-explicit-any */
// SECURITY CHECKLIST:
// - [x] Authentication (NextAuth auth())
// - [x] Role-Based Access Control (N/A)
// - [x] Input Validation (Zod safeParse for POST)
// - [x] SQL Injection protection (Prisma ORM)
// - [x] Rate Limiting
// - [x] Unified Error Handler (handleApiError)

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { checkRateLimit } from "@/lib/rate-limit";
import { handleApiError } from "@/lib/api-error";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const purchaseCreateSchema = z.object({
  invoiceId: z.string().uuid(),
  completedAt: z.string().datetime().optional().or(z.date().optional())
});

export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    const rateLimitResponse = checkRateLimit(req, session.user.id, 100);
    if (rateLimitResponse) return rateLimitResponse;

    const { searchParams } = new URL(req.url);

    const search = searchParams.get("search") || "";
    const category = searchParams.get("category") || "";
    const leadSource = searchParams.get("leadSource") || "";
    const dateFrom = searchParams.get("dateFrom") || "";
    const dateTo = searchParams.get("dateTo") || "";
    const sortBy = searchParams.get("sortBy") || "completedAt";
    const order = (searchParams.get("order") || "desc") as "asc" | "desc";

    const where: any = { deletedAt: null };

    if (search) {
      where.OR = [
        { customerName: { contains: search, mode: "insensitive" } },
        { invoiceNumber: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ];
    }
    if (category) where.category = { equals: category, mode: "insensitive" };
    if (leadSource) where.leadSource = { equals: leadSource, mode: "insensitive" };
    if (dateFrom || dateTo) {
      where.completedAt = {};
      if (dateFrom) where.completedAt.gte = new Date(dateFrom);
      if (dateTo) {
        const end = new Date(dateTo);
        end.setHours(23, 59, 59, 999);
        where.completedAt.lte = end;
      }
    }

    const validSorts = ["profit", "billValue", "completedAt", "profitPercentage", "totalProductionCost"];
    const orderByField = validSorts.includes(sortBy) ? sortBy : "completedAt";

    const purchases = await (prisma as any).purchase.findMany({
      where,
      orderBy: { [orderByField]: order },
    });

    return NextResponse.json({ success: true, data: purchases });
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
    const parsed = purchaseCreateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: parsed.error.flatten() }, { status: 400 });
    }
    const { invoiceId, completedAt } = parsed.data;

    // Check for existing purchase
    const existing = await (prisma as any).purchase.findUnique({ where: { invoiceId } });
    if (existing) return NextResponse.json({ success: true, data: existing });

    const invoice = await (prisma as any).invoice.findUnique({ where: { id: invoiceId } });
    if (!invoice) return NextResponse.json({ success: false, error: 'Invoice not found' }, { status: 404 });

    const purchase = await (prisma as any).purchase.create({
      data: {
        invoiceId,
        invoiceNumber: `INV-${String(invoice.invoiceNumber).padStart(4, "0")}`,
        customerName: invoice.customerName,
        description: invoice.description,
        category: invoice.category || "Uncategorized",
        quantity: invoice.quantity,
        billValue: invoice.totalAmount,
        completedAt: completedAt ? new Date(completedAt) : new Date(),
      },
    });

    return NextResponse.json({ success: true, data: purchase }, { status: 201 });
  } catch (error: unknown) {
    return handleApiError(error);
  }
}
