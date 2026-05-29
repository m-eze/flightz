import { PrismaClient } from "@prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";
import { randomInt } from "crypto";

const prisma = new PrismaClient({
  adapter: new PrismaLibSql({ url: "file:./prisma/flightz.db" }),
});

const airlines = [
  { name: "Air Peace", iata: "P4", icao: "APK", hub: "Abuja", logo: "✈️" },
  { name: "Arik Air", iata: "W3", icao: "ARA", hub: "Lagos", logo: "🛫" },
  { name: "Aero Contractors", iata: "N2", icao: "NIG", hub: "Lagos", logo: "🛩️" },
  { name: "Max Air", iata: "VM", icao: "NGL", hub: "Kano", logo: "✈️" },
  { name: "Azman Air", iata: "ZQ", icao: "AZM", hub: "Kano", logo: "🛫" },
  { name: "Ibom Air", iata: "QI", icao: "IAN", hub: "Uyo", logo: "🛩️" },
  { name: "Green Africa Airways", iata: "Q9", icao: "GWG", hub: "Lagos", logo: "💚" },
  { name: "United Nigeria Airlines", iata: "U5", icao: "UNA", hub: "Enugu", logo: "🇳🇬" },
  { name: "Overland Airways", iata: "OF", icao: "OLA", hub: "Abuja", logo: "🛫" },
  { name: "ValueJet", iata: "VK", icao: "FVJ", hub: "Lagos", logo: "💺" },
  { name: "Rano Air", iata: null, icao: null, hub: "Maiduguri", logo: "🛩️" },
  { name: "XEJet", iata: "U0", icao: "VBR", hub: "Lagos", logo: "✈️" },
  { name: "NG Eagle", iata: null, icao: null, hub: "Lagos", logo: "🦅" },
  { name: "West Link Airlines", iata: null, icao: "WLN", hub: "Abuja", logo: "🔗" },
  { name: "Pan African Airlines", iata: "PF", icao: null, hub: "Lagos", logo: "🌍" },
  { name: "Allied Air", iata: null, icao: "AJK", hub: "Lagos", logo: "📦" },
  { name: "K-Impex Airline", iata: null, icao: null, hub: "Abuja", logo: "🛫" },
  { name: "Dornier Aviation Nigeria", iata: null, icao: "DAV", hub: "Kaduna", logo: "✈️" },
];

const airports = [
  { code: "LOS", name: "Murtala Muhammed International Airport", city: "Lagos", state: "Lagos" },
  { code: "ABV", name: "Nnamdi Azikiwe International Airport", city: "Abuja", state: "FCT" },
  { code: "KAN", name: "Mallam Aminu Kano International Airport", city: "Kano", state: "Kano" },
  { code: "PHC", name: "Port Harcourt International Airport", city: "Port Harcourt", state: "Rivers" },
  { code: "ENU", name: "Akanu Ibiam International Airport", city: "Enugu", state: "Enugu" },
  { code: "QUO", name: "Akwa Ibom Airport", city: "Uyo", state: "Akwa Ibom" },
  { code: "CBQ", name: "Margaret Ekpo International Airport", city: "Calabar", state: "Cross River" },
  { code: "BNI", name: "Benin Airport", city: "Benin City", state: "Edo" },
  { code: "QOW", name: "Sam Mbakwe Airport", city: "Owerri", state: "Imo" },
  { code: "ILR", name: "Ilorin International Airport", city: "Ilorin", state: "Kwara" },
  { code: "IBA", name: "Ibadan Airport", city: "Ibadan", state: "Oyo" },
  { code: "JOS", name: "Yakubu Gowon Airport", city: "Jos", state: "Plateau" },
  { code: "KAD", name: "Kaduna International Airport", city: "Kaduna", state: "Kaduna" },
  { code: "AKR", name: "Akure Airport", city: "Akure", state: "Ondo" },
  { code: "ABB", name: "Asaba International Airport", city: "Asaba", state: "Delta" },
  { code: "MDG", name: "Maiduguri International Airport", city: "Maiduguri", state: "Borno" },
  { code: "SKO", name: "Sadiq Abubakar III International Airport", city: "Sokoto", state: "Sokoto" },
  { code: "YOL", name: "Yola Airport", city: "Yola", state: "Adamawa" },
  { code: "WAR", name: "Warri Airport", city: "Warri", state: "Delta" },
  { code: "GMO", name: "Gombe Lawanti International Airport", city: "Gombe", state: "Gombe" },
  { code: "BCU", name: "Bauchi Airport", city: "Bauchi", state: "Bauchi" },
  { code: "DKA", name: "Katsina Airport", city: "Katsina", state: "Katsina" },
];

// All airport-to-airport distances in km (approximate)
const distanceMap: Record<string, Record<string, number>> = {
  LOS: { ABV: 512, KAN: 830, PHC: 440, ENU: 470, QUO: 560, CBQ: 550, BNI: 250, QOW: 410, ILR: 260, IBA: 115, JOS: 710, KAD: 640, AKR: 310, ABB: 370, MDG: 1250, SKO: 780, YOL: 980, WAR: 300, GMO: 890, BCU: 800, DKA: 750 },
  ABV: { LOS: 512, KAN: 350, PHC: 480, ENU: 290, QUO: 530, CBQ: 510, BNI: 360, QOW: 390, ILR: 330, IBA: 430, JOS: 200, KAD: 170, AKR: 370, ABB: 340, MDG: 740, SKO: 480, YOL: 560, WAR: 460, GMO: 420, BCU: 280, DKA: 370 },
  KAN: { LOS: 830, ABV: 350, PHC: 820, ENU: 600, QUO: 850, CBQ: 820, BNI: 720, QOW: 760, ILR: 580, IBA: 700, JOS: 240, KAD: 200, AKR: 650, ABB: 650, MDG: 420, SKO: 280, YOL: 380, WAR: 790, GMO: 430, BCU: 250, DKA: 150 },
  PHC: { LOS: 440, ABV: 480, KAN: 820, ENU: 190, QUO: 120, CBQ: 120, BNI: 240, QOW: 55, ILR: 490, IBA: 500, JOS: 680, KAD: 650, AKR: 370, ABB: 140, MDG: 1000, SKO: 900, YOL: 820, WAR: 150, GMO: 750, BCU: 720, DKA: 780 },
  ENU: { LOS: 470, ABV: 290, KAN: 600, PHC: 190, QUO: 230, CBQ: 200, BNI: 240, QOW: 140, ILR: 420, IBA: 420, JOS: 420, KAD: 390, AKR: 300, ABB: 130, MDG: 680, SKO: 720, YOL: 600, WAR: 250, GMO: 480, BCU: 450, DKA: 550 },
  QUO: { LOS: 560, ABV: 530, KAN: 850, PHC: 120, ENU: 230, CBQ: 80, BNI: 310, QOW: 80, ILR: 550, IBA: 560, JOS: 710, KAD: 680, AKR: 420, ABB: 180, MDG: 1050, SKO: 950, YOL: 870, WAR: 200, GMO: 780, BCU: 750, DKA: 800 },
  CBQ: { LOS: 550, ABV: 510, KAN: 820, PHC: 120, ENU: 200, QUO: 80, BNI: 290, QOW: 95, ILR: 530, IBA: 540, JOS: 690, KAD: 660, AKR: 400, ABB: 160, MDG: 1030, SKO: 930, YOL: 850, WAR: 220, GMO: 760, BCU: 730, DKA: 780 },
  BNI: { LOS: 250, ABV: 360, KAN: 720, PHC: 240, ENU: 240, QUO: 310, CBQ: 290, QOW: 210, ILR: 280, IBA: 150, JOS: 560, KAD: 520, AKR: 120, ABB: 200, MDG: 900, SKO: 670, YOL: 730, WAR: 100, GMO: 620, BCU: 580, DKA: 650 },
  QOW: { LOS: 410, ABV: 390, KAN: 760, PHC: 55, ENU: 140, QUO: 80, CBQ: 95, BNI: 210, ILR: 450, IBA: 460, JOS: 630, KAD: 600, AKR: 330, ABB: 100, MDG: 950, SKO: 850, YOL: 770, WAR: 160, GMO: 690, BCU: 660, DKA: 720 },
};

function getDistance(from: string, to: string): number {
  return distanceMap[from]?.[to] || 400;
}

function generateFlightNumber(airlineCode: string, idx: number): string {
  const num = String(100 + idx).padStart(3, "0");
  if (airlineCode) return `${airlineCode}${num}`;
  return `NG${num}`;
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

async function main() {
  console.log("🌍 Seeding Nigerian flight database...\n");

  // Clean existing data
  await prisma.booking.deleteMany();
  await prisma.flight.deleteMany();
  await prisma.route.deleteMany();
  await prisma.airline.deleteMany();
  await prisma.airport.deleteMany();

  // Create airlines
  console.log("✈️  Creating airlines...");
  const createdAirlines: Record<string, string> = {};
  for (const a of airlines) {
    const airline = await prisma.airline.create({ data: a });
    createdAirlines[airline.name] = airline.id;
  }
  console.log(`   ✅ ${airlines.length} airlines created`);

  // Create airports
  console.log("🛬 Creating airports...");
  const createdAirports: Record<string, string> = {};
  for (const a of airports) {
    const airport = await prisma.airport.create({ data: a });
    createdAirports[a.code] = airport.id;
  }
  console.log(`   ✅ ${airports.length} airports created`);

  // Create routes and flights
  console.log("🛫 Creating routes and flights...");
  const aircraftTypes = ["Boeing 737-800", "Boeing 737-300", "Embraer E195", "Airbus A320", "Bombardier CRJ900", "ATR 72-600", "Boeing 767-300", "Embraer E175"];

  const popularRoutes = [
    ["LOS", "ABV"], ["ABV", "LOS"],
    ["LOS", "PHC"], ["PHC", "LOS"],
    ["LOS", "KAN"], ["KAN", "LOS"],
    ["ABV", "KAN"], ["KAN", "ABV"],
    ["LOS", "ENU"], ["ENU", "LOS"],
    ["LOS", "QOW"], ["QOW", "LOS"],
    ["ABV", "PHC"], ["PHC", "ABV"],
    ["LOS", "BNI"], ["BNI", "LOS"],
    ["LOS", "QUO"], ["QUO", "LOS"],
    ["ABV", "ENU"], ["ENU", "ABV"],
  ];

  // All possible routes (popular ones get more flights)
  const allRoutes: [string, string][] = [];
  for (const from of airports) {
    for (const to of airports) {
      if (from.code !== to.code) {
        allRoutes.push([from.code, to.code]);
      }
    }
  }

  let flightCount = 0;
  const majorAirlines = ["Air Peace", "Arik Air", "Ibom Air", "Max Air", "United Nigeria Airlines", "Green Africa Airways", "Aero Contractors"];
  const regionalAirlines = ["Azman Air", "Overland Airways", "ValueJet", "Rano Air", "XEJet", "NG Eagle", "West Link Airlines"];

  // Create routes in DB
  const routeMap: Record<string, string> = {};
  for (const [from, to] of allRoutes) {
    const key = `${from}-${to}`;
    const dist = getDistance(from, to);
    const route = await prisma.route.create({
      data: {
        originId: createdAirports[from],
        destinationId: createdAirports[to],
        distance: dist,
      },
    });
    routeMap[key] = route.id;
  }
  console.log(`   ✅ ${allRoutes.length} routes created`);

  // Generate flights for the next 30 days
  const baseDate = new Date();
  baseDate.setHours(0, 0, 0, 0);

  // Popular routes: 3-5 flights per day per airline
  // Other routes: 0-2 flights per day per airline
  const popularSet = new Set(popularRoutes.map(([f, t]) => `${f}-${t}`));

  for (let dayOffset = 0; dayOffset < 30; dayOffset++) {
    const date = new Date(baseDate);
    date.setDate(date.getDate() + dayOffset);

    for (const [from, to] of allRoutes) {
      const routeKey = `${from}-${to}`;
      const isPopular = popularSet.has(routeKey);
      const dist = getDistance(from, to);

      // How many airlines fly this route today
      const airlinePool = isPopular ? majorAirlines : [...majorAirlines, ...regionalAirlines];
      const numAirlines = isPopular ? randomInt(3, 6) : randomInt(0, 3);

      const selectedAirlines = new Set<string>();
      while (selectedAirlines.size < numAirlines) {
        selectedAirlines.add(pick(airlinePool));
      }

      for (const airlineName of selectedAirlines) {
        const numFlights = isPopular ? randomInt(1, 4) : 1;

        for (let f = 0; f < numFlights; f++) {
          const hour = 6 + randomInt(0, 13); // 6am to 7pm
          const minute = pick([0, 15, 30, 45]);
          const depTime = new Date(date);
          depTime.setHours(hour, minute, 0, 0);

          const durationHours = dist / 600; // ~600 km/h average
          const durationMin = Math.round(durationHours * 60) + randomInt(-10, 10);
          const arrTime = new Date(depTime.getTime() + durationMin * 60000);

          // Price based on distance and demand
          const basePrice = dist * 80; // ~₦80 per km
          const demandFactor = isPopular ? randomInt(8, 14) / 10 : randomInt(7, 12) / 10;
          const price = Math.round(basePrice * demandFactor / 100) * 100;

          const airlineObj = airlines.find((a) => a.name === airlineName)!;
          const iata = airlineObj.iata || "NG";
          const flightNum = generateFlightNumber(iata, flightCount);

          await prisma.flight.create({
            data: {
              flightNumber: flightNum,
              airlineId: createdAirlines[airlineName],
              routeId: routeMap[routeKey],
              originId: createdAirports[from],
              destinationId: createdAirports[to],
              departureTime: depTime,
              arrivalTime: arrTime,
              duration: durationMin,
              price,
              currency: "NGN",
              availableSeats: randomInt(20, 120),
              aircraft: pick(aircraftTypes),
              status: "scheduled",
            },
          });

          flightCount++;
        }
      }
    }

    if ((dayOffset + 1) % 5 === 0) {
      console.log(`   📅 Day ${dayOffset + 1}/30 — ${flightCount} flights so far`);
    }
  }

  console.log(`\n🎉 Seed complete!`);
  console.log(`   Airlines: ${airlines.length}`);
  console.log(`   Airports: ${airports.length}`);
  console.log(`   Routes: ${allRoutes.length}`);
  console.log(`   Flights: ${flightCount}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
