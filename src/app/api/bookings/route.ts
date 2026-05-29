import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

function generateRef(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  return "FLZ-" + Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const ref = searchParams.get("ref");

    const where: any = {};
    if (ref) {
      where.bookingReference = ref.toUpperCase();
    }

    const bookings = await prisma.booking.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 50,
      include: {
        flight: {
          select: {
            flightNumber: true,
            departureTime: true,
            arrivalTime: true,
            duration: true,
            airline: { select: { name: true } },
            origin: { select: { code: true, city: true } },
            destination: { select: { code: true, city: true } },
          },
        },
      },
    });

    return NextResponse.json(bookings);
  } catch (error) {
    console.error("GET bookings error:", error);
    return NextResponse.json({ error: "Failed to load bookings" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { flightId, passengerName, passengerEmail, passengerPhone, passengers } = body;

    if (!flightId || !passengerName || !passengerEmail || !passengers) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Get flight and verify availability
    const flight = await prisma.flight.findUnique({ where: { id: flightId } });
    if (!flight) {
      return NextResponse.json({ error: "Flight not found" }, { status: 404 });
    }
    if (flight.availableSeats < passengers) {
      return NextResponse.json({ error: "Not enough seats available" }, { status: 400 });
    }

    const totalPrice = flight.price * passengers;
    const bookingReference = generateRef();

    // Create booking and update seats in a transaction
    const [booking] = await prisma.$transaction([
      prisma.booking.create({
        data: {
          flightId,
          passengerName,
          passengerEmail,
          passengerPhone: passengerPhone || null,
          passengers,
          totalPrice,
          bookingReference,
          status: "confirmed",
        },
      }),
      prisma.flight.update({
        where: { id: flightId },
        data: { availableSeats: flight.availableSeats - passengers },
      }),
    ]);

    return NextResponse.json({ bookingReference, totalPrice, id: booking.id });
  } catch (error) {
    console.error("Booking error:", error);
    return NextResponse.json({ error: "Booking failed" }, { status: 500 });
  }
}
