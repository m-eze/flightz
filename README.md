# NFlightz — Nigerian Flight Booking App

A modern one-stop flight reservation and booking platform for Nigerian domestic flights. Like Kayak, but built for Nigeria.

## Features

- **Flight Search** — Search flights between all 22 Nigerian airports by date and passengers
- **Compare & Filter** — Sort by price, duration, departure time; filter by airline
- **Instant Booking** — Book flights with passenger details, receive booking reference
- **Booking Dashboard** — View and search past bookings by reference number
- **Admin Panel** — System overview with airline fleet stats
- **18 Nigerian Airlines** seeded with realistic route data (Air Peace, Arik Air, Ibom Air, Max Air, etc.)
- **22 Airports** covering all major Nigerian cities
- **462 Routes** with realistic pricing based on distance

## Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **Database:** SQLite via Prisma ORM 7 + libsql adapter
- **State:** React hooks (no external state library)

## Getting Started

### Prerequisites
- Node.js 18+
- npm

### Install
```bash
npm install
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
flightz/
├── prisma/
│   ├── schema.prisma    # Database schema
│   └── seed.ts          # Nigerian flight data seeder
├── prisma.config.ts     # Prisma 7 datasource config
├── src/
│   ├── app/
│   │   ├── page.tsx           # Homepage with search form
│   │   ├── flights/
│   │   │   ├── page.tsx       # Search results + filters
│   │   │   └── [id]/book/     # Flight booking page
│   │   ├── dashboard/         # Booking history
│   │   ├── admin/             # Admin overview
│   │   └── api/
│   │       ├── flights/       # Flight search & detail APIs
│   │       ├── bookings/      # Booking CRUD APIs
│   │       └── admin/         # Admin stats APIs
│   ├── lib/
│   │   ├── prisma.ts          # Prisma client singleton
│   │   └── utils.ts           # Formatters (price, date, duration)
│   └── components/            # Reusable UI (future)
└── public/
```

## Airlines Included

Air Peace · Arik Air · Aero Contractors · Max Air · Azman Air · Ibom Air · Green Africa Airways · United Nigeria Airlines · Overland Airways · ValueJet · Rano Air · XEJet · NG Eagle · West Link Airlines · Pan African Airlines · Allied Air · K-Impex Airline · Dornier Aviation Nigeria

## Airports

LOS (Lagos) · ABV (Abuja) · KAN (Kano) · PHC (Port Harcourt) · ENU (Enugu) · QUO (Uyo) · CBQ (Calabar) · BNI (Benin) · QOW (Owerri) · ILR (Ilorin) · IBA (Ibadan) · JOS (Jos) · KAD (Kaduna) · AKR (Akure) · ABB (Asaba) · MDG (Maiduguri) · SKO (Sokoto) · YOL (Yola) · WAR (Warri) · GMO (Gombe) · BCU (Bauchi) · DKA (Katsina)

## License

MIT
