import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const airlines = await prisma.airline.findMany({
      include: { _count: { select: { flights: true } } },
      orderBy: { flights: { _count: "desc" } },
    });
    return NextResponse.json(airlines);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
