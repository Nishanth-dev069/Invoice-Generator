export const dynamic = "force-dynamic";
/* eslint-disable @typescript-eslint/no-explicit-any */
// SECURITY CHECKLIST:
// - [x] Authentication (NextAuth auth())
// - [x] Role-Based Access Control (N/A)
// - [x] Input Validation (N/A)
// - [x] SQL Injection protection (Prisma ORM)
// - [x] Rate Limiting
// - [x] Unified Error Handler (handleApiError)

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { checkRateLimit } from "@/lib/rate-limit";
import { handleApiError } from "@/lib/api-error";
import { prisma } from "@/lib/prisma";

 // cache for 60 seconds

export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    const rateLimitResponse = checkRateLimit(req, session.user.id, 100);
    if (rateLimitResponse) return rateLimitResponse;

    const now = new Date();
    const startOfToday = new Date(now);
    startOfToday.setHours(0, 0, 0, 0);
    const in48Hours = new Date(now.getTime() + 48 * 60 * 60 * 1000);
    const in7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    // Execute queries in tightly controlled parallel batches to vastly improve Vercel cold-start latency
    // while ensuring we don't accidentally exceed Hobby PostgreSQL connection limits (max 15 concurrent)
    
    const [totalInvoices, activeInvoices, deliveriesThisWeek, overdueInvoices] = await Promise.all([
      (prisma.invoice as any).count({ where: { deletedAt: null } }),
      (prisma.invoice as any).count({ where: { deletedAt: null, status: "ACTIVE" } }),
      (prisma.invoice as any).count({
        where: {
          deletedAt: null,
          status: "ACTIVE",
          finalDeliveryDate: { gte: startOfToday, lte: in7Days },
        },
      }),
      (prisma.invoice as any).count({
        where: {
          deletedAt: null,
          status: "ACTIVE",
          finalDeliveryDate: { lt: startOfToday },
        },
      }),
    ]);

    const [totalLeads, wipCounts, leadsByStatus] = await Promise.all([
      (prisma.lead as any).count({ where: { deletedAt: null } }),
      (prisma.wIPCard as any).groupBy({
        by: ["phase"],
        where: { deletedAt: null },
        _count: { _all: true },
      }),
      (prisma.lead as any).groupBy({
        by: ["status"],
        where: { deletedAt: null },
        _count: { _all: true },
      }),
    ]);

    const [urgentDeliveries, recentInvoices, pendingFinalChecks, completedFinalChecksThisMonth] = await Promise.all([
      (prisma.invoice as any).findMany({
        where: {
          deletedAt: null,
          status: "ACTIVE",
          finalDeliveryDate: { gte: startOfToday, lte: in48Hours },
        },
        orderBy: { finalDeliveryDate: "asc" },
        select: {
          id: true,
          invoiceNumber: true,
          customerName: true,
          finalDeliveryDate: true,
          assignee: { select: { name: true } },
        },
      }),
      (prisma.invoice as any).findMany({
        where: { deletedAt: null },
        orderBy: { createdAt: "desc" },
        take: 10,
        select: {
          id: true,
          invoiceNumber: true,
          customerName: true,
          totalAmount: true,
          finalDeliveryDate: true,
          status: true,
          assignee: { select: { name: true } },
        },
      }),
      (prisma.finalCheck as any).count({ where: { deletedAt: null, isComplete: false } }),
      (prisma.finalCheck as any).count({
        where: {
          deletedAt: null,
          isComplete: true,
          completedAt: { gte: startOfMonth, lte: endOfMonth },
        },
      }),
    ]);

    // Process WIP counts into a flat object
    const wipPhases: Record<string, number> = {
      RAW_MATERIALS: 0,
      DESIGN: 0,
      PRINTING: 0,
      POST_PRINTING: 0,
    };
    (wipCounts as any[]).forEach((g: any) => {
      wipPhases[g.phase] = g._count._all;
    });
    const totalWip = Object.values(wipPhases).reduce((a, b) => a + b, 0);

    // Process leads by status
    const leadsStatusMap: Record<string, number> = {
      NEW: 0,
      CONTACTED: 0,
      NEGOTIATING: 0,
      CONVERTED: 0,
      LOST: 0,
    };
    (leadsByStatus as any[]).forEach((g: any) => {
      leadsStatusMap[g.status] = g._count._all;
    });

    return NextResponse.json({
      success: true,
      data: {
        stats: {
          totalInvoices,
          activeInvoices,
          deliveriesThisWeek,
          overdueInvoices,
          totalLeads,
          totalWip,
        },
        wipPhases,
        urgentDeliveries,
        recentInvoices,
        leadsByStatus: Object.entries(leadsStatusMap).map(([status, count]) => ({ status, count })),
        finalCheck: {
          pending: pendingFinalChecks,
          completedThisMonth: completedFinalChecksThisMonth,
        },
      }
    });
  } catch (error: unknown) {
    return handleApiError(error);
  }
}
