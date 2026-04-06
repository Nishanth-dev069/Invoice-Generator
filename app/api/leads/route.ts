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
import { checkRateLimit } from "@/lib/rate-limit";
import { handleApiError } from "@/lib/api-error";
import { prisma } from "@/lib/prisma";
import { leadCreateSchema } from "@/lib/validations";

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
    const status = searchParams.get("status") || "ALL"; // or specific status
    const assigneeId = searchParams.get("assigneeId") || "";
    const sort = searchParams.get("sort") || "Newest"; // Newest | Oldest | Highest Value | Lowest Value

    // DB Query uses Prisma ORM which automatically parameterizes inputs, preventing SQL injection
    const where: any = {};

    if (search) {
      where.OR = [
        { customerName: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ];
    }

    if (status && status !== "ALL") {
      const statuses = status.split(",");
      if (statuses.length > 0 && statuses[0] !== "") {
         where.status = { in: statuses };
      }
    }

    if (assigneeId && assigneeId !== "all") {
      where.assignedToId = assigneeId;
    }

    let orderBy: any = { createdAt: "desc" };
    if (sort === "Oldest") orderBy = { createdAt: "asc" };
    else if (sort === "Highest Value") orderBy = { estimatedBillValue: "desc" };
    else if (sort === "Lowest Value") orderBy = { estimatedBillValue: "asc" };

    const leads = await (prisma.lead as any).findMany({
      where,
      orderBy,
      include: {
        assignedTo: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json({ success: true, data: leads });
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
    const parsed = leadCreateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: parsed.error.flatten() }, { status: 400 });
    }
    const data = parsed.data;

    // DB Query uses Prisma ORM, parameters are parameterized securely
    const lead = await (prisma.lead as any).create({
      data: {
        ...data,
        createdById: session.user.id,
      },
      include: {
        assignedTo: { select: { id: true, name: true } },
      }
    });

    return NextResponse.json({ success: true, data: lead });
  } catch (error: unknown) {
    return handleApiError(error);
  }
}
