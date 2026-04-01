/* eslint-disable @typescript-eslint/no-explicit-any */
// SECURITY CHECKLIST:
// - [x] Authentication (NextAuth auth())
// - [x] Role-Based Access Control (requireRole)
// - [x] UUID Validation (isValidUUID)
// - [x] SQL Injection protection (Prisma ORM)
// - [x] Rate Limiting
// - [x] Unified Error Handler (handleApiError)

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { requireRole } from "@/lib/auth-helpers";
import { checkRateLimit } from "@/lib/rate-limit";
import { handleApiError } from "@/lib/api-error";
import { isValidUUID } from "@/lib/utils";
import { prisma } from "@/lib/prisma";
import { Decimal } from "@prisma/client/runtime/library";

function toNum(v: any): number {
  if (!v) return 0;
  return typeof v === "object" && v instanceof Decimal ? Number(v) : Number(v);
}

function computeFields(data: any, current: any) {
  const merged = { ...current, ...data };

  const totalDesignerCost = toNum(merged.designer1Cost) + toNum(merged.designer2Cost);
  const totalPrinterCost = toNum(merged.printer1Cost) + toNum(merged.printer2Cost);
  const totalRawMaterialCost = toNum(merged.rawMaterial1Cost) + toNum(merged.rawMaterial2Cost);
  const totalPostProcessCost = toNum(merged.postProcess1Cost) + toNum(merged.postProcess2Cost);
  const totalProductionCost = totalDesignerCost + totalPrinterCost + totalRawMaterialCost + totalPostProcessCost;
  const billValue = toNum(merged.billValue);
  const profit = billValue - totalProductionCost;
  const profitPercentage = billValue > 0 ? parseFloat(((profit / billValue) * 100).toFixed(2)) : 0;

  return {
    totalDesignerCost,
    totalPrinterCost,
    totalRawMaterialCost,
    totalPostProcessCost,
    totalProductionCost,
    profit,
    profitPercentage,
  };
}

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    const rateLimitResponse = checkRateLimit(req, session.user.id, 100);
    if (rateLimitResponse) return rateLimitResponse;

    const { id } = params;
    if (!isValidUUID(id)) return NextResponse.json({ success: false, error: 'Invalid ID' }, { status: 400 });

    const purchase = await (prisma as any).purchase.findUnique({ where: { id } });
    if (!purchase) return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 });
    return NextResponse.json({ success: true, data: purchase });
  } catch (error: unknown) {
    return handleApiError(error);
  }
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    const rateLimitResponse = checkRateLimit(req, session.user.id, 100);
    if (rateLimitResponse) return rateLimitResponse;

    const { id } = params;
    if (!isValidUUID(id)) return NextResponse.json({ success: false, error: 'Invalid ID' }, { status: 400 });

    const body = await req.json();

    const current = await (prisma as any).purchase.findUnique({ where: { id } });
    if (!current) return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 });

    const computed = computeFields(body, current);

    const updated = await (prisma as any).purchase.update({
      where: { id },
      data: { ...body, ...computed },
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error: unknown) {
    return handleApiError(error);
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await auth();
    requireRole(session, "ADMIN");
    const rateLimitResponse = checkRateLimit(req, session?.user?.id || null, 100);
    if (rateLimitResponse) return rateLimitResponse;

    const { id } = params;
    if (!isValidUUID(id)) return NextResponse.json({ success: false, error: 'Invalid ID' }, { status: 400 });

    const deleted = await (prisma as any).purchase.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
    return NextResponse.json({ success: true, message: "Deleted successfully" });
  } catch (error: unknown) {
    return handleApiError(error);
  }
}
