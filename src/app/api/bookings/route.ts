import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

function generateRef(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  return "NFL-" + Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
}

// GET /api/bookings — list bookings
// - Authenticated users see their own bookings
// - Admin users see all bookings
// - ?ref=NFL-XXXXXX searches by booking reference (public — no auth needed)
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const ref = searchParams.get("ref");

    // If searching by reference, no auth required (public lookup)
    if (ref) {
      const booking = await prisma.booking.findUnique({
        where: { bookingReference: ref.toUpperCase() },
        include: {
          legs: {
            orderBy: { legOrder: "asc" },
            include: {
              flight: {
                select: {
                  id: true,
                  flightNumber: true,
                  departureTime: true,
                  arrivalTime: true,
                  duration: true,
                  price: true,
                  currency: true,
                  aircraft: true,
                  airline: { select: { id: true, name: true, iata: true } },
                  origin: { select: { code: true, name: true, city: true } },
                  destination: { select: { code: true, name: true, city: true } },
                },
              },
            },
          },
        },
      });

      if (!booking) {
        return NextResponse.json({ error: "Booking not found" }, { status: 404 });
      }

      return NextResponse.json({
        id: booking.id,
        bookingReference: booking.bookingReference,
        passengerName: booking.passengerName,
        passengerEmail: booking.passengerEmail,
        passengerPhone: booking.passengerPhone,
        passengers: booking.passengers,
        totalPrice: booking.totalPrice,
        status: booking.status,
        paymentStatus: booking.paymentStatus,
        tripType: booking.tripType,
        createdAt: booking.createdAt,
        legs: booking.legs.map((l) => ({
          legType: l.legType,
          legOrder: l.legOrder,
          flight: l.flight,
        })),
        flight: booking.legs[0]?.flight || null,
      });
    }

    // Otherwise: list bookings scoped by user
    const session = await auth();
    const userId = (session?.user as any)?.id;
    const role = (session?.user as any)?.role;

    const where: any = {};

    // Non-admin users only see their own bookings
    if (role !== "admin") {
      if (!userId) {
        return NextResponse.json({ error: "Authentication required" }, { status: 401 });
      }
      where.userId = userId;
    }

    const bookings = await prisma.booking.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 100,
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

    const flat = bookings.map((b) => ({
      id: b.id,
      bookingReference: b.bookingReference,
      passengerName: b.passengerName,
      passengerEmail: b.passengerEmail,
      passengers: b.passengers,
      totalPrice: b.totalPrice,
      status: b.status,
      paymentStatus: b.paymentStatus,
      tripType: b.tripType,
      createdAt: b.createdAt,
      legs: b.legs.map((l) => ({
        legType: l.legType,
        legOrder: l.legOrder,
        flight: l.flight,
      })),
      flight: b.legs[0]?.flight || null,
    }));

    return NextResponse.json(flat);
  } catch (error) {
    console.error("GET bookings error:", error);
    return NextResponse.json({ error: "Failed to load bookings" }, { status: 500 });
  }
}

// POST /api/bookings — create a new booking
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { flightIds, flightId, tripType, passengerName, passengerEmail, passengerPhone, passengers } = body;

    if (!passengerName || !passengerEmail || !passengers) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Get authenticated user (optional)
    const session = await auth();
    const userId = (session?.user as any)?.id || null;

    const ids: string[] = flightIds || (flightId ? [flightId] : []);
    if (ids.length === 0) {
      return NextResponse.json({ error: "No flights provided" }, { status: 400 });
    }

    // Verify all flights exist and have enough seats
    const flights = await Promise.all(ids.map((id) => prisma.flight.findUnique({ where: { id } })));

    const missingIdx = flights.findIndex((f) => !f);
    if (missingIdx !== -1) {
      return NextResponse.json({ error: `Flight not found: ${ids[missingIdx]}` }, { status: 404 });
    }

    for (const flight of flights) {
      if (flight!.availableSeats < passengers) {
        return NextResponse.json({ error: `Not enough seats on ${flight!.flightNumber}` }, { status: 400 });
      }
    }

    const totalPrice = flights.reduce((sum, f) => sum + f!.price * passengers, 0);
    const bookingReference = generateRef();

    const legTypes: string[] = [];
    if (ids.length === 1) {
      legTypes.push("outbound");
    } else if (tripType === "return") {
      legTypes.push("outbound", "inbound");
    } else {
      legTypes.push("outbound", ...ids.slice(1).map(() => "connection"));
    }

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
          paymentStatus: "unpaid",
          tripType: tripType || "oneway",
          userId,
        },
      });

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

// PATCH /api/bookings — cancel a booking
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, action } = body;

    if (!id || action !== "cancel") {
      return NextResponse.json({ error: "Provide { id, action: 'cancel' }" }, { status: 400 });
    }

    const session = await auth();
    const userId = (session?.user as any)?.id;
    const role = (session?.user as any)?.role;

    // Find the booking
    const booking = await prisma.booking.findUnique({
      where: { id },
      include: { legs: true },
    });

    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    // Only the owner or an admin can cancel
    if (role !== "admin" && booking.userId !== userId) {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }

    if (booking.status === "cancelled") {
      return NextResponse.json({ error: "Booking is already cancelled" }, { status: 400 });
    }

    // Restore seats and mark cancelled
    await prisma.$transaction(async (tx) => {
      await tx.booking.update({
        where: { id },
        data: { status: "cancelled" },
      });

      for (const leg of booking.legs) {
        await tx.flight.update({
          where: { id: leg.flightId },
          data: { availableSeats: { increment: booking.passengers } },
        });
      }
    });

    return NextResponse.json({ success: true, status: "cancelled", id });
  } catch (error) {
    console.error("Cancel booking error:", error);
    return NextResponse.json({ error: "Failed to cancel booking" }, { status: 500 });
  }
}