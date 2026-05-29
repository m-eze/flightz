import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { createHmac } from "crypto";

const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET_KEY || "";

export async function POST(req: NextRequest) {
  try {
    const body = await req.text();
    const signature = req.headers.get("x-paystack-signature") || "";

    // Verify webhook signature
    const hash = createHmac("sha512", PAYSTACK_SECRET).update(body).digest("hex");
    if (hash !== signature) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    const event = JSON.parse(body);

    // Only handle successful charge events
    if (event.event === "charge.success") {
      const reference = event.data.reference;

      const booking = await prisma.booking.findUnique({
        where: { bookingReference: reference },
      });

      if (booking && booking.paymentStatus !== "paid") {
        await prisma.booking.update({
          where: { bookingReference: reference },
          data: {
            paymentStatus: "paid",
            paymentRef: String(event.data.id),
          },
        });

        console.log(`Webhook: Booking ${reference} marked as paid`);
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json({ error: "Webhook failed" }, { status: 500 });
  }
}