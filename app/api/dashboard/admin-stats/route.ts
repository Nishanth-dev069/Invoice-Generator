export const dynamic = "force-dynamic";
/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { requireRole } from "@/lib/auth-helpers";
import { checkRateLimit } from "@/lib/rate-limit";
import { handleApiError } from "@/lib/api-error";

export async function GET(req: Request) {
  try {
    const session = await auth();
    requireRole(session, "ADMIN"); // Protected
    
    const rateLimitResponse = checkRateLimit(req, session?.user?.id || null, 50);
    if (rateLimitResponse) return rateLimitResponse;

    const { searchParams } = new URL(req.url);
    const numMonths = parseInt(searchParams.get("months") || "12");
    const catStartStr = searchParams.get("catStart");
    const catEndStr = searchParams.get("catEnd");
    
    const now = new Date();
    const monthlyData = [];

    // Monthly breakdown over the last N months — all queries run in parallel per month
    for (let i = numMonths - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const mStart = new Date(d.getFullYear(), d.getMonth(), 1);
      const mEnd = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);
      const mMonth = d.getMonth() + 1;
      const mYear = d.getFullYear();

      const [invoiceStats, purchases, expenses] = await Promise.all([
        (prisma.invoice as any).aggregate({
          where: { createdAt: { gte: mStart, lte: mEnd }, deletedAt: null },
          _count: { id: true },
          _sum: { totalAmount: true },
          _avg: { totalAmount: true },
        }),
        (prisma as any).purchase.findMany({
          where: { deletedAt: null, completedAt: { gte: mStart, lte: mEnd } },
          select: { profit: true, totalProductionCost: true },
        }),
        (prisma as any).monthlyExpense.findMany({
          where: { month: mMonth, year: mYear, deletedAt: null },
          select: { amount: true },
        }),
      ]);

      const grossProfit = purchases.reduce((s: number, p: any) => s + Number(p.profit || 0), 0);
      const totalExpenses = expenses.reduce((s: number, e: any) => s + Number(e.amount || 0), 0);
      const netProfit = grossProfit - totalExpenses;

      monthlyData.push({
        month: d.toLocaleString("default", { month: "short", year: "numeric" }),
        totalInvoices: invoiceStats._count.id || 0,
        revenue: Number(invoiceStats._sum.totalAmount || 0),
        avgInvoiceValue: Number(invoiceStats._avg.totalAmount || 0),
        netProfit,
      });
    }

    // Category Distribution — use custom date range if supplied, else last numMonths
    const catStart = catStartStr ? new Date(catStartStr) : new Date(now.getFullYear(), now.getMonth() - numMonths + 1, 1);
    const catEnd = catEndStr ? (() => { const d = new Date(catEndStr); d.setHours(23, 59, 59, 999); return d; })() : now;

    // Using Prisma groupBy for category pie chart
    const categoriesAggr = await (prisma.invoice as any).groupBy({
      by: ['category'],
      where: { createdAt: { gte: catStart, lte: catEnd }, deletedAt: null },
      _sum: { totalAmount: true },
    });

    const categoryDistribution = categoriesAggr
      .map((c: any) => ({
        name: c.category || "Uncategorized",
        value: Number(c._sum.totalAmount || 0)
      }))
      .filter((c: any) => c.value > 0)
      .sort((a: any, b: any) => b.value - a.value);

    return NextResponse.json({ 
      success: true, 
      data: {
        monthlyData,
        categoryDistribution
      } 
    });
  } catch (error: unknown) {
    return handleApiError(error);
  }
}
