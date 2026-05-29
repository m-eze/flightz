import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const session = await auth();
  const role = (session?.user as any)?.role;

  if (role !== "admin") {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status") || "";

    const where: any = {};
    if (search) {
      where.OR = [
        { bookingReference: { contains: search.toUpperCase() } },
        { passengerName: { contains: search, mode: "insensitive" } },
        { passengerEmail: { contains: search, mode: "insensitive" } },
      ];
    }
    if (status && status !== "all") {
      where.status = status;
    }

    const bookings = await prisma.booking.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 100,
      include: {
        user: { select: { name: true, email: true } },
        legs: {
          include: {
            flight: {
              select: {
                flightNumber: true,
                airline: { select: { name: true } },
                origin: { select: { code: true } },
                destination: { select: { code: true } },
                departureTime: true,
                price: true,
              },
            },
          },
        },
      },
    });

    const summary = await prisma.booking.groupBy({
      by: ["status", "paymentStatus"],
      _count: true,
    });

    return NextResponse.json({ bookings, summary });
  } catch (error) {
    console.error("Admin bookings error:", error);
    return NextResponse.json({ error: "Failed to load bookings" }, { status: 500 });
  }
}