# NFlightz — Nigerian Flight Booking App

A modern one-stop flight reservation and booking platform for Nigerian domestic flights. Like Kayak, but built for Nigeria.

## Features

- **Flight Search** — Search flights between all 22 Nigerian airports by date and passengers
- **Compare & Filter** — Sort by price, duration, departure time; filter by airline
- **Instant Booking** — Book flights with passenger details, receive booking reference
- **Booking Dashboard** — View and search past bookings by reference number
- **Admin Panel** — System overview with airline fleet stats (admin role required)
- **Authentication** — NextAuth with credentials + Google OAuth
- **Paystack Payments** — Real payment integration (initialize, verify, webhook)
- **Email Notifications** — Booking confirmation via Resend (stubbed, ready to activate)
- **18 Nigerian Airlines** seeded with realistic route data (Air Peace, Arik Air, Ibom Air, Max Air, etc.)
- **22 Airports** covering all major Nigerian cities
- **462 Routes** with realistic pricing based on distance

## Tech Stack

- **Framework:** Next.js 16 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS 4
- **Database:** PostgreSQL via Prisma ORM 7 (Neon serverless)
- **Auth:** NextAuth v5 (Credentials + Google OAuth)
- **Payments:** Paystack
- **Email:** Resend (stubbed)

## Getting Started

### Prerequisites
- Node.js 18+
- PostgreSQL database (free at [neon.tech](https://neon.tech))
- npm

### Install
```bash
npm install
```

### Setup environment
```bash
cp .env.example .env.local
# Edit .env.local with your credentials
```

### Setup database
```bash
npx prisma generate
npx prisma db push
npx tsx prisma/seed.ts
```

### Run dev server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Project Structure

```
nflightz/
├── prisma/
│   ├── schema.prisma    # Database schema (PostgreSQL)
│   └── seed.ts          # Nigerian flight data seeder
├── prisma.config.ts     # Prisma 7 datasource config
├── src/
│   ├── app/
│   │   ├── page.tsx              # Homepage with search form
│   │   ├── flights/
│   │   │   ├── page.tsx          # Search results + filters
│   │   │   └── [id]/book/        # Flight booking page
│   │   ├── dashboard/            # Booking history
│   │   ├── admin/                # Admin overview
│   │   ├── payment/              # Payment pages (callback)
│   │   ├── auth/                 # Login & register pages
│   │   └── api/
│   │       ├── flights/          # Flight search & detail APIs
│   │       ├── bookings/         # Booking CRUD APIs
│   │       ├── payment/          # Paystack (init, verify, webhook)
│   │       ├── auth/             # Auth endpoints (register)
│   │       └── admin/            # Admin stats APIs
│   ├── middleware.ts             # Route protection (/admin)
│   ├── lib/
│   │   ├── prisma.ts             # Prisma client singleton
│   │   ├── auth.ts               # NextAuth configuration
│   │   ├── email.ts              # Email stubs (Resend)
│   │   └── utils.ts              # Formatters (price, date, duration)
│   └── components/               # Reusable UI
│       └── Navbar.tsx
└── public/
```

## Airlines Included

Air Peace · Arik Air · Aero Contractors · Max Air · Azman Air · Ibom Air · Green Africa Airways · United Nigeria Airlines · Overland Airways · ValueJet · Rano Air · XEJet · NG Eagle · West Link Airlines · Pan African Airlines · Allied Air · K-Impex Airline · Dornier Aviation Nigeria

## Airports

LOS (Lagos) · ABV (Abuja) · KAN (Kano) · PHC (Port Harcourt) · ENU (Enugu) · QUO (Uyo) · CBQ (Calabar) · BNI (Benin) · QOW (Owerri) · ILR (Ilorin) · IBA (Ibadan) · JOS (Jos) · KAD (Kaduna) · AKR (Akure) · ABB (Asaba) · MDG (Maiduguri) · SKO (Sokoto) · YOL (Yola) · WAR (Warri) · GMO (Gombe) · BCU (Bauchi) · DKA (Katsina)

## License

MIT