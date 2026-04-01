/* eslint-disable @typescript-eslint/no-explicit-any */
// SECURITY CHECKLIST:
// - [x] Authentication (NextAuth auth())
// - [x] Role-Based Access Control (requireRole ADMIN)
// - [x] Input Validation (Zod safeParse for POST)
// - [x] SQL Injection protection (Prisma ORM)
// - [x] Rate Limiting
// - [x] Unified Error Handler (handleApiError)

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { requireRole } from "@/lib/auth-helpers";
import { checkRateLimit } from "@/lib/rate-limit";
import { handleApiError } from "@/lib/api-error";
import { prisma } from "@/lib/prisma";
import { Decimal } from "@prisma/client/runtime/library";
import { z } from "zod";

const transactionSchema = z.object({
  type: z.enum(["CREDIT", "DEBIT"]),
  mode: z.enum(["CASH", "ONLINE", "UPI", "BANK_TRANSFER"]),
  amount: z.number().positive(),
  description: z.string().min(1),
  category: z.string(),
  invoiceId: z.string().uuid().optional(),
  invoiceNumber: z.string().optional(),
  date: z.string().datetime().optional()
});

export async function GET(req: Request) {
  try {
    const session = await auth();
    requireRole(session, "ADMIN");
    const rateLimitResponse = checkRateLimit(req, session?.user?.id || null, 100);
    if (rateLimitResponse) return rateLimitResponse;

    const { searchParams } = new URL(req.url);
    const mode = searchParams.get("mode") || "";
    const type = searchParams.get("type") || "";
    const category = searchParams.get("category") || "";
    const dateFrom = searchParams.get("dateFrom") || "";
    const dateTo = searchParams.get("dateTo") || "";
    const search = searchParams.get("search") || "";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");

    const where: any = { deletedAt: null };
    if (mode) where.mode = mode;
    if (type) where.type = type;
    if (category) where.category = category;
    if (search) where.OR = [
      { description: { contains: search, mode: "insensitive" } },
      { invoiceNumber: { contains: search, mode: "insensitive" } },
    ];
    if (dateFrom || dateTo) {
      where.date = {};
      if (dateFrom) where.date.gte = new Date(dateFrom);
      if (dateTo) { const e = new Date(dateTo); e.setHours(23, 59, 59, 999); where.date.lte = e; }
    }

    const [transactions, total] = await Promise.all([
      (prisma as any).counterTransaction.findMany({
        where, orderBy: { date: "desc" },
        skip: (page - 1) * limit, take: limit,
      }),
      (prisma as any).counterTransaction.count({ where }),
    ]);

    // Totals for current filter
    const all = await (prisma as any).counterTransaction.findMany({
      where, select: { amount: true, type: true, mode: true },
    });
    let totalCredits = 0, totalDebits = 0, cashBalance = 0, onlineBalance = 0, upiBalance = 0;
    for (const t of all) {
      const amt = Number(t.amount);
      if (t.type === "CREDIT") { totalCredits += amt; }
      else { totalDebits += amt; }
      const net = t.type === "CREDIT" ? amt : -amt;
      if (t.mode === "CASH") cashBalance += net;
      else if (t.mode === "ONLINE" || t.mode === "BANK_TRANSFER") onlineBalance += net;
      else if (t.mode === "UPI") upiBalance += net;
    }

    // Pending receivables count
    const pendingReceivables = await (prisma as any).invoice.count({
      where: { balancePaid: false, balance: { gt: 0 }, deletedAt: null, status: "ACTIVE" },
    });

    return NextResponse.json({
      success: true,
      data: {
        transactions,
        pagination: { page, limit, total },
        totals: {
          totalCredits, totalDebits,
          netBalance: totalCredits - totalDebits,
          cashBalance, onlineBalance, upiBalance,
        },
        pendingReceivables,
      }
    });
  } catch (error: unknown) {
    return handleApiError(error);
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    requireRole(session, "ADMIN");
    const rateLimitResponse = checkRateLimit(req, session?.user?.id || null, 100);
    if (rateLimitResponse) return rateLimitResponse;

    const body = await req.json();
    const parsed = transactionSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: parsed.error.flatten() }, { status: 400 });
    }
    const { type, mode, amount, description, category, invoiceId, invoiceNumber, date } = parsed.data;

    const amountDecimal = new Decimal(amount);

    const result = await prisma.$transaction(async (tx) => {
      // Get latest transaction's running balance
      const latest = await (tx as any).counterTransaction.findFirst({
        where: { deletedAt: null },
        orderBy: { createdAt: "desc" },
        select: { runningBalance: true },
      });

      const prevBalance = latest ? new Decimal(latest.runningBalance) : new Decimal(0);
      const runningBalance = type === "CREDIT"
        ? prevBalance.plus(amountDecimal)
        : prevBalance.minus(amountDecimal);

      const txn = await (tx as any).counterTransaction.create({
        data: {
          type, mode,
          amount: amountDecimal,
          description,
          category,
          invoiceId: invoiceId || null,
          invoiceNumber: invoiceNumber || null,
          runningBalance,
          createdBy: session?.user?.id || "system",
          date: date ? new Date(date) : new Date(),
        },
      });

      return txn;
    }, { isolationLevel: "Serializable" });

    return NextResponse.json({ success: true, data: result }, { status: 201 });
  } catch (error: unknown) {
    return handleApiError(error);
  }
}
