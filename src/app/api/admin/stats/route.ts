import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const [airlines, airports, flights, bookings] = await Promise.all([
      prisma.airline.count(),
      prisma.airport.count(),
      prisma.flight.count(),
      prisma.booking.count(),
    ]);
    return NextResponse.json({ airlines, airports, flights, bookings });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
