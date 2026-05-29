import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const flight = await prisma.flight.findUnique({
      where: { id },
      include: {
        airline: { select: { id: true, name: true, iata: true, logo: true } },
        origin: { select: { code: true, name: true, city: true } },
        destination: { select: { code: true, name: true, city: true } },
      },
    });

    if (!flight) {
      return NextResponse.json({ error: "Flight not found" }, { status: 404 });
    }

    return NextResponse.json(flight);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to load flight" }, { status: 500 });
  }
}
