export const dynamic = "force-dynamic";
/* eslint-disable @typescript-eslint/no-explicit-any */
// SECURITY CHECKLIST:
// - [x] Authentication (getServerSession)
// - [x] Role-Based Access Control (requireRole)
// - [x] Input Validation (Zod safeParse)
// - [x] UUID Validation (isValidUUID)
// - [x] SQL Injection protection (Prisma parameterization)
// - [x] Rate Limiting
// - [x] Unified Error Handler (handleApiError)

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { requireRole } from "@/lib/auth-helpers";
import { checkRateLimit } from "@/lib/rate-limit";
import { handleApiError } from "@/lib/api-error";
import { isValidUUID } from "@/lib/utils";
import { prisma } from "@/lib/prisma";
import { leadCreateSchema } from "@/lib/validations";

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    const rateLimitResponse = checkRateLimit(req, session.user.id, 100);
    if (rateLimitResponse) return rateLimitResponse;

    const { id } = params;
    if (!isValidUUID(id)) {
      return NextResponse.json({ success: false, error: 'Invalid ID' }, { status: 400 });
    }

    const body = await req.json();
    const parsed = leadCreateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: parsed.error.flatten() }, { status: 400 });
    }

    const lead = await (prisma.lead as any).update({
      where: { id },
      data: parsed.data,
      include: { assignedTo: { select: { id: true, name: true } } }
    });

    return NextResponse.json({ success: true, data: lead });
  } catch (error: unknown) {
    return handleApiError(error);
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await auth();
    requireRole(session, "ADMIN"); // Only admins can delete

    const rateLimitResponse = checkRateLimit(req, session?.user?.id || null, 100);
    if (rateLimitResponse) return rateLimitResponse;

    const { id } = params;
    if (!isValidUUID(id)) {
      return NextResponse.json({ success: false, error: 'Invalid ID' }, { status: 400 });
    }

    const lead = await (prisma.lead as any).update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    return NextResponse.json({ success: true, message: "Deleted successfully" });
  } catch (error: unknown) {
    return handleApiError(error);
  }
}
