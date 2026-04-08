export const dynamic = "force-dynamic";
/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { checkRateLimit } from "@/lib/rate-limit";
import { handleApiError } from "@/lib/api-error";

 // 5 minutes cache

export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    const rateLimitResponse = checkRateLimit(req, session.user.id, 50);
    if (rateLimitResponse) return rateLimitResponse;

    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");
    const startDateStr = searchParams.get("startDate");
    const endDateStr = searchParams.get("endDate");
    
    // Default to last 6 months if not provided
    let numMonths = 6;
    let endDt = new Date();
    let startDt = new Date(endDt.getFullYear(), endDt.getMonth() - 5, 1);
    
    if (startDateStr && endDateStr) {
      startDt = new Date(startDateStr);
      endDt = new Date(endDateStr);
      // set endDt to end of day
      endDt.setHours(23, 59, 59, 999);
      
      const diffMonths = (endDt.getFullYear() - startDt.getFullYear()) * 12 + (endDt.getMonth() - startDt.getMonth()) + 1;
      numMonths = Math.max(1, diffMonths);
    }

    if (!userId) {
      return NextResponse.json({ success: false, error: "Missing userId parameter" }, { status: 400 });
    }

    const trendData = [];
    
    // Also fetch the grand total for the exact requested window
    const grandTotalStats = await (prisma.invoice as any).aggregate({
      where: {
        assigneeId: userId,
        createdAt: { gte: startDt, lte: endDt },
        deletedAt: null
      },
      _count: { id: true },
      _sum: { totalAmount: true }
    });

    // Loop backwards to collect monthly data inside the window
    for (let i = numMonths - 1; i >= 0; i--) {
      const d = new Date(endDt.getFullYear(), endDt.getMonth() - i, 1);
      const mStart = new Date(d.getFullYear(), d.getMonth(), 1);
      const mEnd = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);

      // Clamp within actual requested dates
      const actualStart = mStart < startDt ? startDt : mStart;
      const actualEnd = mEnd > endDt ? endDt : mEnd;

      const stats: any = await (prisma.invoice as any).aggregate({
        where: {
          assigneeId: userId,
          createdAt: { gte: actualStart, lte: actualEnd },
          deletedAt: null
        },
        _count: { id: true },
        _sum: { totalAmount: true },
      });

      trendData.push({
        month: d.toLocaleString("default", { month: "short" }) + " '" + String(d.getFullYear()).slice(2),
        invoices: stats._count.id || 0,
        revenue: Number(stats._sum.totalAmount || 0)
      });
    }

    return NextResponse.json({ 
      success: true, 
      data: {
        totals: {
          invoices: grandTotalStats._count.id || 0,
          revenue: Number(grandTotalStats._sum.totalAmount || 0)
        },
        trend: trendData
      } 
    });
  } catch (error: unknown) {
    return handleApiError(error);
  }
}
