import { prisma } from "@/lib/prisma";
import { sendBookingConfirmationEmail } from "@/lib/email";
import { NextRequest, NextResponse } from "next/server";

const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET_KEY || "";

export async function POST(req: NextRequest) {
  try {
    const { reference } = await req.json();

    if (!reference) {
      return NextResponse.json({ error: "Reference required" }, { status: 400 });
    }

    // If Paystack key is set, verify with Paystack; otherwise trust the callback
    if (PAYSTACK_SECRET) {
      const res = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
        headers: { Authorization: `Bearer ${PAYSTACK_SECRET}` },
      });
      const data = await res.json();

      if (!data.status || data.data.status !== "success") {
        return NextResponse.json({ error: "Payment not verified" }, { status: 400 });
      }
    }

    // Update booking payment status
    const booking = await prisma.booking.findUnique({
      where: { bookingReference: reference },
      include: {
        legs: {
          include: {
            flight: {
              include: { airline: true, origin: true, destination: true },
            },
          },
        },
      },
    });

    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    if (booking.paymentStatus !== "paid") {
      const txRef = `PAY-${Date.now()}`;
      await prisma.booking.update({
        where: { bookingReference: reference },
        data: { paymentStatus: "paid", paymentRef: txRef },
      });

      // Send confirmation email
      const legDetails = booking.legs.map((l) => ({
        flightNumber: l.flight.flightNumber,
        airline: l.flight.airline.name,
        origin: l.flight.origin.code,
        destination: l.flight.destination.code,
        departureTime: l.flight.departureTime.toISOString(),
        arrivalTime: l.flight.arrivalTime.toISOString(),
        price: l.flight.price,
      }));

      await sendBookingConfirmationEmail({
        bookingReference: booking.bookingReference,
        passengerName: booking.passengerName,
        passengerEmail: booking.passengerEmail,
        totalPrice: booking.totalPrice,
        status: booking.status,
        paymentStatus: "paid",
        tripType: booking.tripType,
        legs: legDetails,
      });
    }

    return NextResponse.json({
      success: true,
      reference,
      paymentStatus: "paid",
    });
  } catch (error) {
    console.error("Payment verify error:", error);
    return NextResponse.json({ error: "Payment verification failed" }, { status: 500 });
  }
}