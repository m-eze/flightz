import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const from = searchParams.get("from")?.toUpperCase();
    const to = searchParams.get("to")?.toUpperCase();
    const depart = searchParams.get("depart");
    const pax = parseInt(searchParams.get("pax") || "1");
    const sortBy = searchParams.get("sort") || "price";
    const airlineFilter = searchParams.get("airline");
    const minPrice = parseFloat(searchParams.get("minPrice") || "0");
    const maxPrice = parseFloat(searchParams.get("maxPrice") || "1000000");

    if (!from || !to) {
      return NextResponse.json({ error: "Origin and destination required" }, { status: 400 });
    }

    if (!depart) {
      return NextResponse.json({ error: "Departure date required" }, { status: 400 });
    }

    // Parse date range for that day
    const departDate = new Date(depart);
    const nextDay = new Date(departDate);
    nextDay.setDate(nextDay.getDate() + 1);

    const where: any = {
      origin: { code: from },
      destination: { code: to },
      departureTime: { gte: departDate, lt: nextDay },
      availableSeats: { gte: pax },
      status: "scheduled",
      price: { gte: minPrice, lte: maxPrice },
    };

    if (airlineFilter) {
      where.airlineId = airlineFilter;
    }

    const orderBy: any = {};
    if (sortBy === "price") orderBy.price = "asc";
    else if (sortBy === "duration") orderBy.duration = "asc";
    else if (sortBy === "departure") orderBy.departureTime = "asc";
    else orderBy.price = "asc";

    const flights = await prisma.flight.findMany({
      where,
      orderBy,
      include: {
        airline: { select: { id: true, name: true, iata: true, logo: true } },
        origin: { select: { code: true, name: true, city: true } },
        destination: { select: { code: true, name: true, city: true } },
      },
    });

    // Get all airlines for filter sidebar
    const allAirlines = await prisma.airline.findMany({
      select: { id: true, name: true, iata: true, logo: true },
      orderBy: { name: "asc" },
    });

    return NextResponse.json({ flights, airlines: allAirlines, total: flights.length });
  } catch (error) {
    console.error("Search error:", error);
    return NextResponse.json({ error: "Search failed" }, { status: 500 });
  }
}
