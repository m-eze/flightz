// import { Resend } from "resend";

// const resend = process.env.RESEND_API_KEY
//   ? new Resend(process.env.RESEND_API_KEY)
//   : null;

// For now, emails are stubbed. Set RESEND_API_KEY in .env.local to enable real emails.
//
// Usage:
// await sendBookingConfirmation({ booking, passengerEmail, passengerName });
//
// When ready to enable, uncomment the Resend import and instantiation above,
// then implement the email functions below.

interface BookingDetails {
  bookingReference: string;
  passengerName: string;
  passengerEmail: string;
  totalPrice: number;
  status: string;
  paymentStatus: string;
  tripType: string;
  legs: Array<{
    flightNumber: string;
    airline: string;
    origin: string;
    destination: string;
    departureTime: string;
    arrivalTime: string;
    price: number;
  }>;
}

export async function sendBookingConfirmationEmail(booking: BookingDetails): Promise<void> {
  if (!process.env.RESEND_API_KEY) {
    console.log(`[EMAIL STUB] Would send confirmation to ${booking.passengerEmail} for ${booking.bookingReference}`);
    return;
  }

  const legsHtml = booking.legs.map((leg, i) => `
    <tr>
      <td style="padding:8px;border:1px solid #e5e7eb">
        <strong>${leg.flightNumber}</strong> · ${leg.airline}
      </td>
      <td style="padding:8px;border:1px solid #e5e7eb">
        ${leg.origin} → ${leg.destination}
      </td>
      <td style="padding:8px;border:1px solid #e5e7eb">
        ${new Date(leg.departureTime).toLocaleString("en-NG")}
      </td>
      <td style="padding:8px;border:1px solid #e5e7eb;text-align:right">
        ₦${leg.price.toLocaleString()}
      </td>
    </tr>
  `).join("");

  const html = `
    <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
      <h2 style="color:#4f46e5">✈️ Booking Confirmed — ${booking.bookingReference}</h2>
      <p>Hi ${booking.passengerName}, your flight booking is confirmed.</p>

      <table style="width:100%;border-collapse:collapse;margin:20px 0">
        <thead>
          <tr style="background:#f9fafb">
            <th style="padding:8px;border:1px solid #e5e7eb;text-align:left">Flight</th>
            <th style="padding:8px;border:1px solid #e5e7eb;text-align:left">Route</th>
            <th style="padding:8px;border:1px solid #e5e7eb;text-align:left">Departure</th>
            <th style="padding:8px;border:1px solid #e5e7eb;text-align:right">Price</th>
          </tr>
        </thead>
        <tbody>${legsHtml}</tbody>
      </table>

      <p><strong>Total paid:</strong> ₦${booking.totalPrice.toLocaleString()}</p>
      <p><strong>Payment status:</strong> ${booking.paymentStatus === "paid" ? "✅ Paid" : "⏳ Pending"}</p>
      <p><strong>Booking reference:</strong> ${booking.bookingReference}</p>

      <hr style="margin:20px 0" />
      <p style="color:#6b7280;font-size:12px">Powered by NFlightz · Nigeria's flight booking platform</p>
    </div>
  `;

  // const { error } = await resend.emails.send({
  //   from: "NFlightz <bookings@nflightz.com>",
  //   to: booking.passengerEmail,
  //   subject: `Booking Confirmed — ${booking.bookingReference}`,
  //   html,
  // });

  // if (error) console.error("Email error:", error);
  console.log(`[EMAIL] Confirmation sent to ${booking.passengerEmail} (stub mode)`);
}

export async function sendPaymentReceivedEmail(booking: BookingDetails): Promise<void> {
  if (!process.env.RESEND_API_KEY) {
    console.log(`[EMAIL STUB] Payment received email to ${booking.passengerEmail} for ${booking.bookingReference}`);
    return;
  }
  // Implement similarly when Resend is configured
}