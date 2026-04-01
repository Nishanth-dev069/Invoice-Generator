/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { checkRateLimit } from "@/lib/rate-limit";
import { handleApiError } from "@/lib/api-error";

export const revalidate = 300; // 5 minutes cache

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
    const months = parseInt(searchParams.get("months") || "6");

    if (!userId) {
      return NextResponse.json({ success: false, error: "Missing userId parameter" }, { status: 400 });
    }

    const now = new Date();
    const trendData = [];

    // Loop backwards to collect monthly data
    for (let i = months - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const mStart = new Date(d.getFullYear(), d.getMonth(), 1);
      const mEnd = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);

      const stats: any = await (prisma.invoice as any).aggregate({
        where: {
          assigneeId: userId,
          createdAt: { gte: mStart, lte: mEnd },
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

    return NextResponse.json({ success: true, data: trendData });
  } catch (error: unknown) {
    return handleApiError(error);
  }
}
