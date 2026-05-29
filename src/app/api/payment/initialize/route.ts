import { NextRequest, NextResponse } from "next/server";

const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET_KEY || "";

export async function POST(req: NextRequest) {
  try {
    const { email, amount, reference, callbackUrl } = await req.json();

    if (!email || !amount || !reference) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    // Amount in kobo (Paystack uses kobo)
    const amountInKobo = Math.round(amount * 100);

    const res = await fetch("https://api.paystack.co/transaction/initialize", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email,
        amount: amountInKobo,
        reference,
        callback_url: callbackUrl || `${process.env.NEXT_PUBLIC_APP_URL}/payment/callback`,
        metadata: { source: "nflightz" },
      }),
    });

    const data = await res.json();

    if (!data.status) {
      return NextResponse.json({ error: data.message || "Payment init failed" }, { status: 400 });
    }

    return NextResponse.json({
      accessCode: data.data.access_code,
      authorizationUrl: data.data.authorization_url,
      reference: data.data.reference,
    });
  } catch (error) {
    console.error("Paystack init error:", error);
    return NextResponse.json({ error: "Payment initialization failed" }, { status: 500 });
  }
}
