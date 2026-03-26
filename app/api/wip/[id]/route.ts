/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    await requireAuth();
    const body = await req.json();
    const { phase, order } = body;

    const updated = await (prisma as any).wIPCard.update({
      where: { id: params.id },
      data: {
        phase,
        order,
      },
    });

    return NextResponse.json(updated);
  } catch (error: unknown) {
    if (error instanceof NextResponse) return error;
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    await requireAuth("ADMIN");

    const deleted = await (prisma as any).wIPCard.update({
      where: { id: params.id },
      data: { deletedAt: new Date() },
    });

    return NextResponse.json(deleted);
  } catch (error: unknown) {
    if (error instanceof NextResponse) return error;
    return new NextResponse("Internal Error", { status: 500 });
  }
}
