export const dynamic = "force-dynamic";
/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { requireRole } from "@/lib/auth-helpers";
import { checkRateLimit } from "@/lib/rate-limit";
import { handleApiError } from "@/lib/api-error";

 // 5 minutes cache

export async function GET(req: Request) {
  try {
    const session = await auth();
    requireRole(session, "ADMIN"); // Protected
    
    const rateLimitResponse = checkRateLimit(req, session?.user?.id || null, 50);
    if (rateLimitResponse) return rateLimitResponse;

    const { searchParams } = new URL(req.url);
    const numMonths = parseInt(searchParams.get("months") || "12");
    
    const now = new Date();
    const monthlyData = [];

    // Monthly breakdown over the last N months
    for (let i = numMonths - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const mStart = new Date(d.getFullYear(), d.getMonth(), 1);
      const mEnd = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);

      const stats = await (prisma.invoice as any).aggregate({
        where: { createdAt: { gte: mStart, lte: mEnd }, deletedAt: null },
        _count: { id: true },
        _sum: { totalAmount: true },
        _avg: { totalAmount: true },
      });

      const closed = await (prisma.invoice as any).count({
        where: { createdAt: { gte: mStart, lte: mEnd }, status: "CLOSED", deletedAt: null },
      });

      // Find top salesperson
      const topSellerData = await (prisma.invoice as any).groupBy({
        by: ['assigneeId'],
        where: { createdAt: { gte: mStart, lte: mEnd }, deletedAt: null },
        _sum: { totalAmount: true },
        orderBy: { _sum: { totalAmount: 'desc' } },
        take: 1
      });

      let topSalesperson = "N/A";
      if (topSellerData.length > 0) {
        const topUser = await prisma.user.findUnique({ where: { id: topSellerData[0].assigneeId }, select: { name: true }});
        topSalesperson = topUser ? topUser.name : "Unknown";
      }

      monthlyData.push({
        month: d.toLocaleString("default", { month: "short", year: "numeric" }),
        totalInvoices: stats._count.id || 0,
        revenue: Number(stats._sum.totalAmount || 0),
        avgInvoiceValue: Number(stats._avg.totalAmount || 0),
        closedJobs: closed,
        pendingJobs: (stats._count.id || 0) - closed,
        topSalesperson
      });
    }

    // Category Distribution over the requested timespan
    const earliestStart = new Date(now.getFullYear(), now.getMonth() - numMonths + 1, 1);
    
    // Using string manipulation for the category pie chart because Prisma group by is simple
    const categoriesAggr = await (prisma.invoice as any).groupBy({
      by: ['category'],
      where: { createdAt: { gte: earliestStart }, deletedAt: null },
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
