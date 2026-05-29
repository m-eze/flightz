import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { reference, status, transactionId } = await req.json();

    if (!reference) {
      return NextResponse.json({ error: "Reference required" }, { status: 400 });
    }

    const booking = await prisma.booking.findUnique({
      where: { bookingReference: reference },
    });

    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    if (status === "success") {
      await prisma.booking.update({
        where: { bookingReference: reference },
        data: {
          paymentStatus: "paid",
          paymentRef: transactionId || `PAY-${Date.now()}`,
        },
      });

      return NextResponse.json({ success: true, reference });
    }

    return NextResponse.json({ success: false, reference });
  } catch (error) {
    console.error("Payment verify error:", error);
    return NextResponse.json({ error: "Payment verification failed" }, { status: 500 });
  }
}