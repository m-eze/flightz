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
        legs: {
          orderBy: { legOrder: "asc" },
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
        },
      },
    });

    // Flatten for the dashboard's expected format
    const flat = bookings.map((b) => ({
      id: b.id,
      bookingReference: b.bookingReference,
      passengerName: b.passengerName,
      passengerEmail: b.passengerEmail,
      passengers: b.passengers,
      totalPrice: b.totalPrice,
      status: b.status,
      tripType: b.tripType,
      createdAt: b.createdAt,
      legs: b.legs.map((l) => ({
        legType: l.legType,
        legOrder: l.legOrder,
        flight: l.flight,
      })),
      // Backward compat: first flight info
      flight: b.legs[0]?.flight || null,
    }));

    return NextResponse.json(flat);
  } catch (error) {
    console.error("GET bookings error:", error);
    return NextResponse.json({ error: "Failed to load bookings" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      flightIds,
      flightId,
      tripType,
      passengerName,
      passengerEmail,
      passengerPhone,
      passengers,
    } = body;

    if (!passengerName || !passengerEmail || !passengers) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Support both old single-flight and new multi-flight
    const ids: string[] = flightIds || (flightId ? [flightId] : []);
    if (ids.length === 0) {
      return NextResponse.json({ error: "No flights provided" }, { status: 400 });
    }

    // Verify all flights exist and have enough seats
    const flights = await Promise.all(
      ids.map((id) => prisma.flight.findUnique({ where: { id } }))
    );

    const missingIdx = flights.findIndex((f) => !f);
    if (missingIdx !== -1) {
      return NextResponse.json({ error: `Flight not found: ${ids[missingIdx]}` }, { status: 404 });
    }

    for (const flight of flights) {
      if (flight!.availableSeats < passengers) {
        return NextResponse.json(
          { error: `Not enough seats on ${flight!.flightNumber}` },
          { status: 400 }
        );
      }
    }

    const totalPrice = flights.reduce((sum, f) => sum + f!.price * passengers, 0);
    const bookingReference = generateRef();

    // Determine leg types
    const legTypes: string[] = [];
    if (ids.length === 1) {
      legTypes.push("outbound");
    } else if (tripType === "return") {
      legTypes.push("outbound", "inbound");
    } else {
      legTypes.push("outbound", ...ids.slice(1).map(() => "connection"));
    }

    // Create booking with legs in a transaction
    const txOps: any[] = [
      prisma.booking.create({
        data: {
          passengerName,
          passengerEmail,
          passengerPhone: passengerPhone || null,
          passengers,
          totalPrice,
          bookingReference,
          status: "confirmed",
          tripType: tripType || "oneway",
        },
      }),
    ];

    const booking = await prisma.$transaction(async (tx) => {
      const booking = await tx.booking.create({
        data: {
          passengerName,
          passengerEmail,
          passengerPhone: passengerPhone || null,
          passengers,
          totalPrice,
          bookingReference,
          status: "confirmed",
          tripType: tripType || "oneway",
        },
      });

      // Create legs and update seats
      for (let i = 0; i < ids.length; i++) {
        await tx.bookingLeg.create({
          data: {
            bookingId: booking.id,
            flightId: ids[i],
            legOrder: i + 1,
            legType: legTypes[i],
          },
        });

        await tx.flight.update({
          where: { id: ids[i] },
          data: { availableSeats: flights[i]!.availableSeats - passengers },
        });
      }

      return booking;
    });

    return NextResponse.json({ bookingReference, totalPrice, id: booking.id });
  } catch (error) {
    console.error("Booking error:", error);
    return NextResponse.json({ error: "Booking failed" }, { status: 500 });
  }
}