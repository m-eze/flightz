import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

setTimeout(async () => {
  const { PrismaClient } = await import("@prisma/client");
  const { PrismaPg } = await import("@prisma/adapter-pg");
  const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });

  try {
    console.log("Starting database seeding...");

    // Clear existing data
    await prisma.bookingLeg.deleteMany();
    await prisma.booking.deleteMany();
    await prisma.flight.deleteMany();
    await prisma.route.deleteMany();
    await prisma.airline.deleteMany();
    await prisma.airport.deleteMany();

    // Airports with coordinates for distance calculation
    const airports = [
      { code: "LOS", name: "Murtala Muhammed International Airport", city: "Lagos", state: "Lagos", lat: 6.5774, lng: 3.3210 },
      { code: "ABV", name: "Nnamdi Azikiwe International Airport", city: "Abuja", state: "Federal Capital Territory", lat: 9.0068, lng: 7.2631 },
      { code: "KAN", name: "Mallam Aminu Kano International Airport", city: "Kano", state: "Kano", lat: 12.0476, lng: 8.5246 },
      { code: "PHC", name: "Port Harcourt International Airport", city: "Port Harcourt", state: "Rivers", lat: 5.0152, lng: 6.9496 },
      { code: "ENU", name: "Akanu Ibiam International Airport", city: "Enugu", state: "Enugu", lat: 6.4745, lng: 7.5620 },
      { code: "QUO", name: "Victor Attah International Airport", city: "Uyo", state: "Akwa Ibom", lat: 4.8725, lng: 8.0930 },
      { code: "CBQ", name: "Margaret Ekpo International Airport", city: "Calabar", state: "Cross River", lat: 4.9760, lng: 8.3472 },
      { code: "BNI", name: "Benin Airport", city: "Benin City", state: "Edo", lat: 6.3163, lng: 5.5995 },
      { code: "QOW", name: "Sam Mbakwe International Airport", city: "Owerri", state: "Imo", lat: 5.4271, lng: 7.2060 },
      { code: "ILR", name: "Ilorin International Airport", city: "Ilorin", state: "Kwara", lat: 8.4402, lng: 4.4939 },
      { code: "IBA", name: "Ibadan Airport", city: "Ibadan", state: "Oyo", lat: 7.3625, lng: 3.9783 },
      { code: "JOS", name: "Yakubu Gowon Airport", city: "Jos", state: "Plateau", lat: 9.6398, lng: 8.8691 },
      { code: "KAD", name: "Kaduna Airport", city: "Kaduna", state: "Kaduna", lat: 10.6960, lng: 7.3201 },
      { code: "AKR", name: "Akure Airport", city: "Akure", state: "Ondo", lat: 7.2467, lng: 5.3010 },
      { code: "ABB", name: "Asaba International Airport", city: "Asaba", state: "Delta", lat: 6.2042, lng: 6.6654 },
      { code: "MDG", name: "Maiduguri International Airport", city: "Maiduguri", state: "Borno", lat: 11.8553, lng: 13.0810 },
      { code: "SKO", name: "Sadiq Abubakar III International Airport", city: "Sokoto", state: "Sokoto", lat: 12.9164, lng: 5.2076 },
      { code: "YOL", name: "Yola Airport", city: "Yola", state: "Adamawa", lat: 9.2576, lng: 12.4304 },
      { code: "WAR", name: "Osubi Airstrip", city: "Warri", state: "Delta", lat: 5.5169, lng: 5.7352 },
      { code: "GMO", name: "Gombe Lawanti International Airport", city: "Gombe", state: "Gombe", lat: 10.2990, lng: 10.8964 },
      { code: "BCU", name: "Bauchi State Airport", city: "Bauchi", state: "Bauchi", lat: 10.3007, lng: 9.8237 },
      { code: "DKA", name: "Katsina Airport", city: "Katsina", state: "Katsina", lat: 12.9855, lng: 7.6179 },
    ];

    // Haversine distance in km
    function haversine(lat1: number, lng1: number, lat2: number, lng2: number): number {
      const R = 6371;
      const dLat = (lat2 - lat1) * Math.PI / 180;
      const dLng = (lng2 - lng1) * Math.PI / 180;
      const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
      return Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
    }

    const airportMap = new Map<string, typeof airports[number] & { id: string }>();
    for (const ap of airports) {
      const { lat, lng, ...airportData } = ap;
      const airport = await prisma.airport.upsert({
        where: { code: ap.code },
        update: airportData,
        create: airportData,
      });
      airportMap.set(ap.code, { ...ap, id: airport.id });
    }
    console.log(`Seeded ${airports.length} airports`);

    // Airlines
    const airlines = [
      { name: "Air Peace", iata: "P4", icao: "APK", logo: "/airlines/air-peace.png", hub: "LOS" },
      { name: "Arik Air", iata: "W3", icao: "AKP", logo: "/airlines/arik-air.svg", hub: "LOS" },
      { name: "Aero Contractors", iata: "N2", icao: "NIG", logo: "/airlines/aero-contractors.png", hub: "ABV" },
      { name: "Max Air", iata: "VM", icao: "NGL", logo: "/airlines/max-air.jpg", hub: "KAN" },
      { name: "Azman Air", iata: "ZQ", icao: "AZM", logo: "/airlines/azman-air.png", hub: "KAN" },
      { name: "Ibom Air", iata: "QI", icao: "IAN", logo: "/airlines/ibom-air.png", hub: "QUO" },
      { name: "Green Africa Airways", iata: "Q9", icao: "GFY", logo: "/airlines/green-africa.svg", hub: "LOS" },
      { name: "United Nigeria Airlines", iata: "U5", icao: "UNN", logo: "/airlines/united-nigeria.png", hub: "ENU" },
      { name: "Overland Airways", iata: "OF", icao: "OLA", logo: "/airlines/overland-airways.png", hub: "ABV" },
      { name: "ValueJet", iata: "VK", icao: "VJT", logo: "/airlines/valuejet-logo-white.png", hub: "LOS" },
      { name: "Rano Air", iata: "RN", icao: "RAO", logo: "/airlines/rano_air-logo.jpg", hub: "KAN" },
      { name: "XEJet", iata: "U0", icao: "XEJ", logo: "/airlines/xejet-logo.svg", hub: "ABV" },
      { name: "NG Eagle", iata: "ND", icao: "NGE", logo: "/airlines/ngeagle_logo.png", hub: "ABV" },
      { name: "West Link Airlines", iata: "WL", icao: "WLA", logo: "/airlines/west_link_airlines-logo.png", hub: "ABV" },
      { name: "Pan African Airlines", iata: "PF", icao: "NFL", logo: "/airlines/Pan_African_Airlines-Logo.webp", hub: "LOS" },
      { name: "Allied Air", iata: "LP", icao: "AJK", logo: "/airlines/allied-air.png", hub: "LOS" },
      { name: "K-Impex Airline", iata: "KX", icao: "KXP", logo: "/airlines/kimpex-logo.jpg", hub: "ABV" },
      { name: "Dornier Aviation Nigeria", iata: "DH", icao: "DAV", logo: "/airlines/dornier_aviation-logo.png", hub: "LOS" },
      { name: "Enugu Air", iata: "E4", icao: "ENU", logo: "/airlines/enugu-air.svg", hub: "ENU" },
    ];

    const airlineMap = new Map<string, typeof airlines[number] & { id: string }>();
    for (const a of airlines) {
      const airline = await prisma.airline.upsert({
        where: { name: a.name },
        update: a,
        create: a,
      });
      airlineMap.set(a.name, { ...a, id: airline.id });
    }
    console.log(`Seeded ${airlines.length} airlines`);

    // Generate ALL airport pairs (22 x 21 = 462 routes)
    const airportList = Array.from(airportMap.values());
    let routeCount = 0;
    const routeMap = new Map<string, { id: string; originId: string; destinationId: string; distance: number }>();

    console.log("Creating all airport-pair routes...");
    for (const origin of airportList) {
      for (const destination of airportList) {
        if (origin.code === destination.code) continue;
        const distance = haversine(origin.lat, origin.lng, destination.lat, destination.lng);
        const route = await prisma.route.create({
          data: {
            originId: origin.id,
            destinationId: destination.id,
            distance,
          },
        });
        routeMap.set(`${origin.code}-${destination.code}`, {
          id: route.id, originId: origin.id, destinationId: destination.id, distance,
        });
        routeCount++;
      }
    }
    console.log(`Seeded ${routeCount} routes`);

    // Major airlines (P4, W3, N2, VM, QI, U5, Q9, VK) fly more routes
    const majorAirlines = ["Air Peace", "Arik Air", "Aero Contractors", "Max Air", "Ibom Air", "United Nigeria Airlines", "Green Africa Airways", "ValueJet"];
    const minorAirlines = airlines.filter(a => !majorAirlines.includes(a.name));

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let flightCount = 0;
    const routeEntries = Array.from(routeMap.values());

    // Each major airline flies ~30% of routes, minor airlines ~10%
    for (const airline of airlines) {
      const airlineWithId = airlineMap.get(airline.name)!;
      const isMajor = majorAirlines.includes(airline.name);
      const routeFraction = isMajor ? 0.30 : 0.10;
      const airlineRoutes = routeEntries.filter(() => Math.random() < routeFraction);

      for (const route of airlineRoutes) {
        // 1-3 flights per day for next 14 days
        const flightsPerDay = Math.floor(Math.random() * 3) + 1;
        for (let day = 0; day < 14; day++) {
          const date = new Date(today);
          date.setDate(today.getDate() + day);
          for (let f = 0; f < flightsPerDay; f++) {
            const hour = 6 + Math.floor(Math.random() * 16);
            const minute = [0, 15, 30, 45][Math.floor(Math.random() * 4)];
            const departureTime = new Date(date);
            departureTime.setHours(hour, minute, 0, 0);
            const baseDuration = Math.round((route.distance / 750) * 60);
            const durationMinutes = Math.max(25, baseDuration + Math.floor(Math.random() * 20) - 10);
            const arrivalTime = new Date(departureTime.getTime() + durationMinutes * 60000);
            const pricePerKm = 70 + Math.random() * 30;
            let price = Math.round(route.distance * pricePerKm);
            price = Math.max(8000, Math.round(price / 100) * 100);

            await prisma.flight.create({
              data: {
                flightNumber: `${airline.iata}${1000 + flightCount}`,
                airline: { connect: { id: airlineWithId.id } },
                route: { connect: { id: route.id } },
                origin: { connect: { id: route.originId } },
                destination: { connect: { id: route.destinationId } },
                departureTime,
                arrivalTime,
                duration: durationMinutes,
                price,
                availableSeats: 80 + Math.floor(Math.random() * 80),
                status: "scheduled",
              },
            });
            flightCount++;
          }
        }
      }
    }
    console.log(`Seeded ${flightCount} flights`);
    console.log("Database seeding completed!");
  } catch (e) {
    console.error("Seeding error:", e);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}, 0);