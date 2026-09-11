/* eslint-disable no-console */
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const db = new PrismaClient();

const slug = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/[\s_-]+/g, "-");

// SEED_IMAGES=local usa ilustraciones locales (útil sin internet); por defecto fotos de Unsplash.
const LOCAL = process.env.SEED_IMAGES === "local";
let imgCounter = 0;
const img = (id: string, w = 1600) => (LOCAL ? `/demo/photo-${(imgCounter++ % 12) + 1}.svg` : `https://images.unsplash.com/${id}?w=${w}&q=80&auto=format&fit=crop`);

const PHOTOS = {
  living: ["photo-1600210492486-724fe5c67fb0", "photo-1600585154340-be6161a56a0c", "photo-1600607687939-ce8a6c25118c", "photo-1616486338812-3dadae4b4ace"],
  kitchen: ["photo-1556909114-f6e7ad7d3136", "photo-1600489000022-c2086d79f9d4", "photo-1556912173-3bb406ef7e77"],
  bedroom: ["photo-1616594039964-ae9021a400a0", "photo-1615874959474-d609969a20ed", "photo-1560185007-cde436f6a4d0"],
  exterior: ["photo-1600596542815-ffad4c1539a9", "photo-1600607687920-4e2a09cf159d", "photo-1580587771525-78b9dba3b914", "photo-1512917774080-9991f1c4c750", "photo-1568605114967-8130f3a36994", "photo-1600047509807-ba8f99d2cdde"],
  apartment: ["photo-1502672260266-1c1ef2d93688", "photo-1493809842364-78817add7ffb", "photo-1522708323590-d24dbb6b0267", "photo-1484154218962-a197022b5858"],
  beach: ["photo-1499793983690-e29da59ef1c2", "photo-1520250497591-112f2f40a3f4", "photo-1571003123894-1f0594d2b5d9"],
  building: ["photo-1545324418-cc1a3fa10c00", "photo-1486406146926-c627a92ad1ab", "photo-1479839672679-a46d2a1b4e1e", "photo-1517327421915-93b1e0ae1b6f"],
  office: ["photo-1497366216548-37526070297c", "photo-1497366754035-f200968a6e72"],
  land: ["photo-1500382017468-9049fed747ef", "photo-1464822759023-fed622ff2c3b"],
};

const AVATARS = [
  "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=300&q=80",
  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&q=80",
  "https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=300&q=80",
  "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&q=80",
  "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=300&q=80",
];

function pick<T>(arr: T[], n: number, offset = 0): T[] {
  const out: T[] = [];
  for (let i = 0; i < n; i++) out.push(arr[(offset + i) % arr.length]);
  return out;
}

async function main() {
  console.log("Limpiando base de datos…");
  const tables = [
    "Translation", "Wishlist", "Review", "Inquiry", "CreditTransaction", "Payment", "Invoice", "Coupon", "Package",
    "CustomFieldValue", "CustomField", "PropertyFacility", "PropertyFeature", "PropertyImage", "Property",
    "ProjectFacility", "ProjectFeature", "ProjectImage", "Project", "Investor", "Facility", "Feature", "Category",
    "CareerApplication", "Career", "Post", "PostCategory", "Page", "Media", "Agent", "User", "City", "State", "Country", "Setting", "Currency",
  ];
  for (const t of tables) await db.$executeRawUnsafe(`DELETE FROM "${t}"`);

  console.log("Monedas y configuración…");
  await db.currency.createMany({
    data: [
      { code: "USD", name: "Dólar estadounidense", symbol: "US$", rate: 1, decimals: 0, isDefault: true, order: 1 },
      { code: "COP", name: "Peso colombiano", symbol: "$", rate: 4100, decimals: 0, order: 2 },
      { code: "EUR", name: "Euro", symbol: "€", rate: 0.92, decimals: 0, order: 3 },
      { code: "MXN", name: "Peso mexicano", symbol: "MX$", rate: 17.2, decimals: 0, order: 4 },
    ],
  });

  console.log("Ubicaciones…");
  const co = await db.country.create({ data: { name: "Colombia", code: "CO" } });
  const states = await Promise.all(
    ["Antioquia", "Cundinamarca", "Bolívar", "Valle del Cauca", "Atlántico"].map((name) => db.state.create({ data: { name, countryId: co.id } })),
  );
  const [antioquia, cundinamarca, bolivar, valle, atlantico] = states;
  const cityRows = [
    { name: "Medellín", stateId: antioquia.id, lat: 6.2442, lng: -75.5812, imageUrl: img("photo-1599582909646-1b6c86cbb1d5"), isFeatured: true },
    { name: "Envigado", stateId: antioquia.id, lat: 6.1759, lng: -75.5917, isFeatured: false },
    { name: "Bogotá", stateId: cundinamarca.id, lat: 4.711, lng: -74.0721, imageUrl: img("photo-1568632234157-ce7aecd03d0d"), isFeatured: true },
    { name: "Chía", stateId: cundinamarca.id, lat: 4.8618, lng: -74.0587, isFeatured: false },
    { name: "Cartagena", stateId: bolivar.id, lat: 10.391, lng: -75.4794, imageUrl: img("photo-1583997052103-b7c4c6ae8b7d"), isFeatured: true },
    { name: "Cali", stateId: valle.id, lat: 3.4516, lng: -76.532, imageUrl: img("photo-1562095241-8c6714fd4178"), isFeatured: true },
    { name: "Barranquilla", stateId: atlantico.id, lat: 10.9685, lng: -74.7813, imageUrl: img("photo-1596305589427-3e3b5e9a4f7c"), isFeatured: true },
    { name: "Santa Marta", stateId: atlantico.id, lat: 11.2408, lng: -74.199, imageUrl: img("photo-1583531172005-814191b8b6c1"), isFeatured: true },
  ];
  const cities: Record<string, { id: string; lat: number; lng: number }> = {};
  for (const c of cityRows) {
    const row = await db.city.create({ data: { ...c, slug: slug(c.name) } });
    cities[c.name] = { id: row.id, lat: c.lat, lng: c.lng };
  }

  console.log("Catálogos…");
  const catData = [
    ["Apartamento", "Building2"], ["Casa", "Home"], ["Villa", "Palmtree"], ["Oficina", "Briefcase"], ["Local comercial", "Store"], ["Lote", "Map"], ["Finca", "TreePine"], ["Apartaestudio", "BedSingle"],
  ];
  const cats: Record<string, string> = {};
  for (let i = 0; i < catData.length; i++) {
    const [name, icon] = catData[i];
    const c = await db.category.create({ data: { name, icon, slug: slug(name), order: i, isDefault: i === 0 } });
    cats[name] = c.id;
  }
  const featureNames = ["Piscina", "Gimnasio", "Aire acondicionado", "Balcón", "Terraza", "Parqueadero", "Zona BBQ", "Seguridad 24/7", "Ascensor", "Amoblado", "Jardín", "Vista al mar", "Chimenea", "Cuarto útil", "Zona de mascotas", "Coworking", "Salón social", "Calentador de agua"];
  const featureIcons = ["Waves", "Dumbbell", "Snowflake", "Sun", "Mountain", "Car", "Flame", "ShieldCheck", "ArrowUpDown", "Sofa", "Flower2", "Sailboat", "Flame", "Package", "Dog", "Laptop", "PartyPopper", "Droplets"];
  const features: string[] = [];
  for (let i = 0; i < featureNames.length; i++) {
    const f = await db.feature.create({ data: { name: featureNames[i], icon: featureIcons[i] } });
    features.push(f.id);
  }
  const facilityNames = ["Colegio", "Universidad", "Hospital", "Centro comercial", "Supermercado", "Parque", "Estación de metro", "Aeropuerto", "Playa", "Restaurantes"];
  const facilityIcons = ["GraduationCap", "School", "Hospital", "ShoppingBag", "ShoppingCart", "Trees", "TrainFront", "Plane", "Umbrella", "Utensils"];
  const facilities: string[] = [];
  for (let i = 0; i < facilityNames.length; i++) {
    const f = await db.facility.create({ data: { name: facilityNames[i], icon: facilityIcons[i] } });
    facilities.push(f.id);
  }
  const investors = await Promise.all(
    [
      { name: "Constructora Altavista", website: "https://altavista.example" },
      { name: "Grupo Mar Azul", website: "https://marazul.example" },
      { name: "Urbania Desarrollos", website: "https://urbania.example" },
    ].map((i) => db.investor.create({ data: { ...i, slug: slug(i.name) } })),
  );

  console.log("Usuarios y agentes…");
  const pass = await bcrypt.hash("Habitta123!", 10);
  const admin = await db.user.create({
    data: { name: "Administrador Habitta", email: "admin@habitta.test", passwordHash: pass, role: "ADMIN", credits: 999, avatarUrl: AVATARS[1], phone: "+57 300 111 2233" },
  });
  const agentSeeds = [
    { name: "Valentina Restrepo", email: "valentina@habitta.test", title: "Asesora senior", agency: "Habitta Medellín", city: "Medellín", whatsapp: "573001112233", bio: "Más de 10 años ayudando a familias a encontrar su hogar en el Valle de Aburrá. Especialista en apartamentos de lujo en El Poblado y Laureles.", featured: true },
    { name: "Santiago Herrera", email: "santiago@habitta.test", title: "Consultor inmobiliario", agency: "Habitta Bogotá", city: "Bogotá", whatsapp: "573002223344", bio: "Experto en el mercado del norte de Bogotá: Chicó, Rosales y Usaquén. Acompaño todo el proceso, desde la visita hasta la escritura.", featured: true },
    { name: "Camila Torres", email: "camila@habitta.test", title: "Asesora de inversiones", agency: "Habitta Caribe", city: "Cartagena", whatsapp: "573003334455", bio: "Inversión en propiedades turísticas y de renta corta en la costa Caribe. Rentabilidad con datos, no con promesas.", featured: true },
    { name: "Andrés Mejía", email: "andres@habitta.test", title: "Asesor comercial", agency: "Habitta Cali", city: "Cali", whatsapp: "573004445566", bio: "Locales, oficinas y bodegas en el suroccidente colombiano. Negociación clara y rápida.", featured: false },
  ];
  const agents: { id: string; userId: string; name: string }[] = [];
  for (let i = 0; i < agentSeeds.length; i++) {
    const a = agentSeeds[i];
    const u = await db.user.create({
      data: { name: a.name, email: a.email, passwordHash: pass, role: "AGENT", credits: 12, avatarUrl: AVATARS[i % AVATARS.length], phone: `+${a.whatsapp}` },
    });
    const ag = await db.agent.create({
      data: { userId: u.id, slug: slug(a.name), title: a.title, agency: a.agency, bio: a.bio, whatsapp: a.whatsapp, cityId: cities[a.city].id, isFeatured: a.featured, instagram: "https://instagram.com", linkedin: "https://linkedin.com" },
    });
    agents.push({ id: ag.id, userId: u.id, name: a.name });
  }
  const customer = await db.user.create({
    data: { name: "Laura Gómez", email: "cliente@habitta.test", passwordHash: pass, role: "CUSTOMER", credits: 2, avatarUrl: AVATARS[4], phone: "+57 300 999 8877" },
  });

  console.log("Paquetes y cupones…");
  await db.package.createMany({
    data: [
      { name: "Básico", description: "Ideal para publicar una propiedad puntual.", price: 9, credits: 3, durationDays: 30, order: 1 },
      { name: "Profesional", description: "Para agentes con cartera activa. Incluye listados destacados.", price: 29, credits: 12, durationDays: 60, isFeaturedListing: true, isPopular: true, order: 2 },
      { name: "Agencia", description: "Publicaciones ilimitadas en la práctica y máxima visibilidad.", price: 79, credits: 40, durationDays: 90, isFeaturedListing: true, order: 3 },
    ],
  });
  await db.coupon.createMany({
    data: [
      { code: "BIENVENIDO20", type: "PERCENT", value: 20, maxUses: 100 },
      { code: "HABITTA5", type: "FIXED", value: 5, maxUses: 50 },
    ],
  });

  console.log("Proyectos…");
  const projectSeeds = [
    { name: "Reserva del Bosque", city: "Medellín", cat: "Apartamento", status: "SELLING", priceFrom: 145000, priceTo: 320000, units: 120, floors: 18, photos: [...PHOTOS.building, ...PHOTOS.apartment], investor: 0, desc: "Torres residenciales rodeadas de naturaleza en El Poblado, con senderos ecológicos, coworking y piscina infinita.", featured: true, latOff: [0.012, -0.02] },
    { name: "Mar Azul Beachfront", city: "Cartagena", cat: "Apartamento", status: "BUILDING", priceFrom: 210000, priceTo: 590000, units: 64, floors: 22, photos: [...PHOTOS.beach, ...PHOTOS.building], investor: 1, desc: "Apartamentos frente al mar en la zona norte de Cartagena, diseñados para renta corta y vida de playa.", featured: true, latOff: [0.04, 0.01] },
    { name: "Urbania Chicó 94", city: "Bogotá", cat: "Apartaestudio", status: "COMING_SOON", priceFrom: 98000, priceTo: 180000, units: 200, floors: 12, photos: [...PHOTOS.apartment, ...PHOTOS.office], investor: 2, desc: "Apartaestudios inteligentes a pasos del Parque de la 93 con amenidades premium y rooftop.", featured: true, latOff: [-0.03, 0.02] },
    { name: "Altos de Pance", city: "Cali", cat: "Casa", status: "FINISHED", priceFrom: 260000, priceTo: 480000, units: 36, floors: 2, photos: [...PHOTOS.exterior], investor: 0, desc: "Casas campestres con lotes desde 600 m² en el sur de Cali, en conjunto cerrado con club house.", featured: false, latOff: [-0.05, -0.01] },
  ];
  const projects: string[] = [];
  for (const p of projectSeeds) {
    const c = cities[p.city];
    const pr = await db.project.create({
      data: {
        name: p.name,
        slug: slug(p.name),
        description: p.desc,
        content: `<h2>Sobre el proyecto</h2><p>${p.desc}</p><p>Entrega programada con acabados de primera, zonas comunes completas y financiación directa con la constructora.</p><h2>Amenidades</h2><ul><li>Piscina y zona húmeda</li><li>Gimnasio equipado</li><li>Salón social y BBQ</li><li>Portería 24/7</li></ul>`,
        status: p.status,
        priceFrom: p.priceFrom,
        priceTo: p.priceTo,
        units: p.units,
        floors: p.floors,
        lat: c.lat + p.latOff[0],
        lng: c.lng + p.latOff[1],
        address: `${p.city}, Colombia`,
        cityId: c.id,
        categoryId: cats[p.cat],
        investorId: investors[p.investor].id,
        isFeatured: p.featured,
        views: 800 + Math.floor(Math.random() * 3000),
        videoUrl: "https://www.youtube.com/watch?v=ysz5S6PUM-U",
        finishAt: new Date("2026-12-15"),
        images: { create: p.photos.slice(0, 5).map((ph, i) => ({ url: img(ph), order: i })) },
        features: { create: pick(features, 6, projects.length * 2).map((featureId) => ({ featureId })) },
        facilities: { create: pick(facilities, 4, projects.length).map((facilityId, i) => ({ facilityId, distance: `${(i + 1) * 350} m` })) },
      },
    });
    projects.push(pr.id);
  }

  console.log("Propiedades…");
  type PS = { title: string; city: string; cat: string; type: "SALE" | "RENT"; price: number; area: number; bed: number; bath: number; parking?: number; photos: string[]; featured?: boolean; agent: number; off: [number, number]; desc: string; period?: string; project?: number; year?: number; status?: string; moderation?: string };
  const props: PS[] = [
    { title: "Apartamento con vista al Poblado", city: "Medellín", cat: "Apartamento", type: "SALE", price: 285000, area: 128, bed: 3, bath: 3, parking: 2, photos: [PHOTOS.living[0], PHOTOS.kitchen[0], PHOTOS.bedroom[0], PHOTOS.apartment[0]], featured: true, agent: 0, off: [0.01, -0.01], desc: "Amplio apartamento en piso alto con vista panorámica a las montañas, cocina abierta y balcón de 18 m².", year: 2019 },
    { title: "Casa moderna en Laureles", city: "Medellín", cat: "Casa", type: "SALE", price: 420000, area: 260, bed: 4, bath: 4, parking: 2, photos: [PHOTOS.exterior[0], PHOTOS.living[1], PHOTOS.kitchen[1], PHOTOS.bedroom[1]], featured: true, agent: 0, off: [-0.005, 0.012], desc: "Casa de dos niveles con patio interior, estudio independiente y terraza con jacuzzi en el corazón de Laureles.", year: 2021 },
    { title: "Apartaestudio amoblado en Provenza", city: "Medellín", cat: "Apartaestudio", type: "RENT", price: 950, period: "MONTH", area: 48, bed: 1, bath: 1, parking: 1, photos: [PHOTOS.apartment[1], PHOTOS.bedroom[2], PHOTOS.kitchen[2]], agent: 0, off: [0.004, -0.004], desc: "Totalmente amoblado, listo para vivir. A dos cuadras de Provenza, con gimnasio y coworking en el edificio." },
    { title: "Penthouse dúplex en Envigado", city: "Envigado", cat: "Apartamento", type: "SALE", price: 610000, area: 310, bed: 4, bath: 5, parking: 3, photos: [PHOTOS.living[2], PHOTOS.apartment[2], PHOTOS.bedroom[0], PHOTOS.kitchen[0]], featured: true, agent: 0, off: [0.002, 0.003], desc: "Dúplex con terraza privada de 90 m², piscina en la cubierta y acabados de importación.", year: 2022 },
    { title: "Apartamento en Chicó Norte", city: "Bogotá", cat: "Apartamento", type: "SALE", price: 330000, area: 145, bed: 3, bath: 3, parking: 2, photos: [PHOTOS.apartment[3], PHOTOS.living[3], PHOTOS.kitchen[1]], featured: true, agent: 1, off: [0.02, 0.01], desc: "Conjunto con seguridad 24/7, salón comunal y gimnasio. Iluminación natural todo el día.", year: 2016 },
    { title: "Loft en Chapinero Alto", city: "Bogotá", cat: "Apartaestudio", type: "RENT", price: 1200, period: "MONTH", area: 62, bed: 1, bath: 1, parking: 1, photos: [PHOTOS.living[1], PHOTOS.apartment[0], PHOTOS.bedroom[1]], agent: 1, off: [-0.02, 0.005], desc: "Loft de doble altura con vista a los cerros, ideal para profesionales. Incluye administración." },
    { title: "Casa campestre en Chía", city: "Chía", cat: "Casa", type: "SALE", price: 540000, area: 420, bed: 5, bath: 5, parking: 4, photos: [PHOTOS.exterior[3], PHOTOS.exterior[1], PHOTOS.living[0], PHOTOS.kitchen[2]], agent: 1, off: [0.003, -0.002], desc: "Casa en conjunto campestre con lote de 1.200 m², zona de caballerizas y vista a la sabana.", year: 2012 },
    { title: "Oficina en Parque 93", city: "Bogotá", cat: "Oficina", type: "RENT", price: 2500, period: "MONTH", area: 180, bed: 0, bath: 2, parking: 3, photos: [PHOTOS.office[0], PHOTOS.office[1], PHOTOS.building[1]], agent: 1, off: [0.03, -0.012], desc: "Oficina lista para operar, con cableado estructurado, sala de juntas y recepción compartida." },
    { title: "Villa frente al mar", city: "Cartagena", cat: "Villa", type: "SALE", price: 1590000, area: 520, bed: 6, bath: 7, parking: 4, photos: [PHOTOS.beach[0], PHOTOS.beach[1], PHOTOS.living[2], PHOTOS.bedroom[2], PHOTOS.beach[2]], featured: true, agent: 2, off: [0.05, 0.02], desc: "Villa de lujo con acceso directo a la playa, piscina infinita y casa de huéspedes. Ideal para renta vacacional premium.", year: 2020 },
    { title: "Apartamento en Bocagrande", city: "Cartagena", cat: "Apartamento", type: "RENT", price: 1800, period: "MONTH", area: 110, bed: 2, bath: 2, parking: 1, photos: [PHOTOS.apartment[2], PHOTOS.beach[1], PHOTOS.kitchen[0]], agent: 2, off: [-0.01, 0.01], desc: "Amoblado, con vista al mar desde todas las habitaciones y piscina en el piso 20." },
    { title: "Casa colonial en Getsemaní", city: "Cartagena", cat: "Casa", type: "SALE", price: 890000, area: 340, bed: 5, bath: 5, parking: 0, photos: [PHOTOS.exterior[4], PHOTOS.living[3], PHOTOS.bedroom[0]], featured: true, agent: 2, off: [0.002, 0.004], desc: "Casa restaurada de 1890 con patio central, piscina y terraza en la azotea. Operando actualmente como hotel boutique.", year: 1890 },
    { title: "Apartamento nuevo en Ciudad Jardín", city: "Cali", cat: "Apartamento", type: "SALE", price: 165000, area: 96, bed: 3, bath: 2, parking: 1, photos: [PHOTOS.living[0], PHOTOS.bedroom[1], PHOTOS.kitchen[1]], agent: 3, off: [-0.04, -0.01], desc: "Para estrenar en el sur de Cali, conjunto con piscina, canchas y zona de mascotas.", year: 2024 },
    { title: "Local comercial en Granada", city: "Cali", cat: "Local comercial", type: "RENT", price: 1400, period: "MONTH", area: 85, bed: 0, bath: 1, parking: 0, photos: [PHOTOS.office[1], PHOTOS.building[2]], agent: 3, off: [0.01, 0.006], desc: "Local esquinero sobre vía principal en el barrio Granada, alto flujo peatonal y vehicular." },
    { title: "Lote urbanizable en Pance", city: "Cali", cat: "Lote", type: "SALE", price: 120000, area: 1500, bed: 0, bath: 0, photos: [PHOTOS.land[0], PHOTOS.land[1]], agent: 3, off: [-0.06, -0.02], desc: "Lote plano con todos los servicios, apto para casa campestre o pequeño conjunto." },
    { title: "Apartamento en Alto Prado", city: "Barranquilla", cat: "Apartamento", type: "SALE", price: 210000, area: 132, bed: 3, bath: 3, parking: 2, photos: [PHOTOS.apartment[0], PHOTOS.living[2], PHOTOS.kitchen[2]], agent: 2, off: [0.01, 0.01], desc: "Edificio con lobby de doble altura, piscina y gimnasio. A pasos del Buenavista." , year: 2018 },
    { title: "Casa con piscina en Villa Campestre", city: "Barranquilla", cat: "Casa", type: "RENT", price: 2200, period: "MONTH", area: 300, bed: 4, bath: 4, parking: 2, photos: [PHOTOS.exterior[5], PHOTOS.living[1], PHOTOS.bedroom[2]], agent: 2, off: [0.03, -0.02], desc: "Casa de un nivel con piscina privada, kiosco y jardín amplio. Conjunto cerrado con vigilancia." },
    { title: "Apartamento con vista al mar en Rodadero", city: "Santa Marta", cat: "Apartamento", type: "SALE", price: 175000, area: 88, bed: 2, bath: 2, parking: 1, photos: [PHOTOS.beach[2], PHOTOS.apartment[1], PHOTOS.bedroom[0]], featured: true, agent: 2, off: [-0.02, 0.004], desc: "Vista frontal al mar, balcón amplio y piscina con bar. Excelente para renta turística.", year: 2021 },
    { title: "Finca con vista en el oriente antioqueño", city: "Medellín", cat: "Finca", type: "SALE", price: 380000, area: 6000, bed: 4, bath: 3, parking: 6, photos: [PHOTOS.exterior[2], PHOTOS.land[0], PHOTOS.living[3]], agent: 0, off: [0.12, 0.16], desc: "Finca de 6.000 m² con casa principal, huerta y nacimiento de agua a 40 minutos de Medellín.", year: 2008 },
    { title: "Apartamento en Reserva del Bosque (modelo 2 alcobas)", city: "Medellín", cat: "Apartamento", type: "SALE", price: 198000, area: 82, bed: 2, bath: 2, parking: 1, photos: [PHOTOS.building[0], PHOTOS.apartment[3], PHOTOS.living[0]], agent: 0, off: [0.012, -0.02], desc: "Unidad tipo del proyecto Reserva del Bosque, entrega diciembre 2026.", project: 0, year: 2026 },
    { title: "Apartamento amoblado en Usaquén", city: "Bogotá", cat: "Apartamento", type: "RENT", price: 1650, period: "MONTH", area: 90, bed: 2, bath: 2, parking: 1, photos: [PHOTOS.living[3], PHOTOS.kitchen[0], PHOTOS.bedroom[1]], agent: 1, off: [0.05, 0.003], desc: "Amoblado con gusto, a dos cuadras del parque de Usaquén, con gimnasio y terraza BBQ." },
    { title: "Apartamento pendiente de aprobación en Sabaneta", city: "Envigado", cat: "Apartamento", type: "SALE", price: 140000, area: 70, bed: 2, bath: 2, parking: 1, photos: [PHOTOS.apartment[2], PHOTOS.living[1]], agent: 0, off: [-0.02, -0.006], desc: "Publicación de ejemplo pendiente de moderación.", moderation: "PENDING" },
    { title: "Casa vendida en Belén", city: "Medellín", cat: "Casa", type: "SALE", price: 230000, area: 190, bed: 4, bath: 3, parking: 1, photos: [PHOTOS.exterior[1], PHOTOS.living[2]], agent: 0, off: [-0.015, 0.02], desc: "Ejemplo de propiedad ya vendida.", status: "SOLD" },
  ];

  let n = 1;
  const propertyIds: string[] = [];
  const now = Date.now();
  for (const p of props) {
    const c = cities[p.city];
    const ag = agents[p.agent];
    const created = new Date(now - Math.floor(Math.random() * 60) * 86400000);
    const row = await db.property.create({
      data: {
        uniqueId: `HB-${String(1000 + n).padStart(5, "0")}`,
        slug: slug(p.title),
        title: p.title,
        description: p.desc,
        content: `<p>${p.desc}</p><h2>Distribución</h2><p>${p.bed > 0 ? `${p.bed} habitaciones y ${p.bath} baños` : `${p.area} m² de área útil`}, con excelente iluminación natural y espacios pensados para el día a día.</p><h2>Entorno</h2><p>Sector consolidado con transporte, comercio y zonas verdes a pocos minutos.</p>`,
        type: p.type,
        status: p.status ?? "AVAILABLE",
        moderation: p.moderation ?? "APPROVED",
        price: p.price,
        currencyCode: "USD",
        period: p.type === "RENT" ? (p.period ?? "MONTH") : null,
        area: p.area,
        bedrooms: p.bed,
        bathrooms: p.bath,
        parking: p.parking ?? 0,
        floors: p.cat === "Casa" || p.cat === "Villa" ? 2 : 1,
        yearBuilt: p.year ?? null,
        address: `${p.city}, ${p.city === "Envigado" || p.city === "Medellín" ? "Antioquia" : "Colombia"}`,
        lat: c.lat + p.off[0],
        lng: c.lng + p.off[1],
        videoUrl: n % 3 === 0 ? "https://www.youtube.com/watch?v=ysz5S6PUM-U" : null,
        isFeatured: !!p.featured,
        views: 100 + Math.floor(Math.random() * 5000),
        expiresAt: new Date(now + 45 * 86400000),
        publishedAt: created,
        createdAt: created,
        cityId: c.id,
        categoryId: cats[p.cat],
        projectId: p.project !== undefined ? projects[p.project] : null,
        authorId: ag.userId,
        agentId: ag.id,
        images: { create: p.photos.map((ph, i) => ({ url: img(ph), order: i, alt: p.title })) },
        features: { create: pick(features, 5 + (n % 4), n).map((featureId) => ({ featureId })) },
        facilities: { create: pick(facilities, 3, n).map((facilityId, i) => ({ facilityId, distance: `${(i + 1) * 400} m` })) },
      },
    });
    propertyIds.push(row.id);
    n++;
  }

  console.log("Reseñas, consultas y favoritos…");
  const reviewers = ["Mariana P.", "Carlos R.", "Juliana M.", "Felipe A.", "Daniela V."];
  for (let i = 0; i < 12; i++) {
    await db.review.create({
      data: {
        propertyId: propertyIds[i % 9],
        authorName: reviewers[i % reviewers.length],
        rating: 4 + (i % 2),
        comment: ["Excelente atención y la propiedad es tal cual las fotos.", "El sector es muy tranquilo y el agente respondió rápido.", "Muy buena relación precio/ubicación.", "Las zonas comunes son espectaculares."][i % 4],
        status: "APPROVED",
      },
    });
  }
  for (let i = 0; i < 8; i++) {
    await db.inquiry.create({
      data: {
        name: ["Jorge Salazar", "Ana Lucía Ríos", "Miguel Cano", "Paola Vélez"][i % 4],
        email: `contacto${i}@correo.test`,
        phone: `+57 31${i} 555 00${i}${i}`,
        message: "Hola, me interesa esta propiedad. ¿Podemos agendar una visita esta semana?",
        propertyId: propertyIds[i],
        ownerId: agents[props[i].agent].userId,
        status: i < 3 ? "NEW" : i < 6 ? "READ" : "REPLIED",
      },
    });
  }
  await db.wishlist.createMany({ data: [0, 4, 8].map((i) => ({ userId: customer.id, propertyId: propertyIds[i] })) });

  console.log("Facturas y créditos…");
  const pkgs = await db.package.findMany();
  let inv = 1;
  for (const a of agents.slice(0, 3)) {
    const pk = pkgs[inv % pkgs.length];
    const invoice = await db.invoice.create({
      data: { number: `HB-2026-${String(inv).padStart(4, "0")}`, userId: a.userId, packageId: pk.id, subtotal: pk.price, discount: 0, tax: 0, total: pk.price, status: "PAID", paidAt: new Date(), payments: { create: { gateway: "SANDBOX", reference: `sbx_${inv}`, amount: pk.price, status: "COMPLETED" } } },
    });
    await db.creditTransaction.create({ data: { userId: a.userId, amount: pk.credits, reason: "PACKAGE_PURCHASE", reference: invoice.number } });
    inv++;
  }

  console.log("Contenido…");
  await db.page.createMany({
    data: [
      { slug: "nosotros", title: "Sobre Habitta", content: "<p>Habitta nació para hacer del proceso de comprar, vender o alquilar una experiencia clara y sin fricción. Combinamos tecnología con asesores locales que conocen cada barrio.</p><h2>Nuestra promesa</h2><ul><li>Propiedades verificadas</li><li>Precios transparentes</li><li>Acompañamiento de principio a fin</li></ul>", metaDescription: "Conoce el equipo y la misión de Habitta." },
      { slug: "servicios", title: "Servicios", content: "<p>Ofrecemos avalúos, administración de arriendos, asesoría legal y marketing inmobiliario para propietarios y agencias.</p>" },
      { slug: "terminos", title: "Términos y condiciones", content: "<p>Al usar Habitta aceptas nuestros términos de servicio. Las publicaciones deben ser veraces y corresponder a propiedades reales.</p>" },
      { slug: "privacidad", title: "Política de privacidad", content: "<p>Tratamos tus datos conforme a la Ley 1581 de 2012. Solo los usamos para conectar compradores y vendedores.</p>" },
    ],
  });
  const pc = await db.postCategory.create({ data: { name: "Mercado", slug: "mercado" } });
  const pc2 = await db.postCategory.create({ data: { name: "Consejos", slug: "consejos" } });
  const postSeeds = [
    { title: "Cómo se comportó el mercado inmobiliario en Medellín este año", cat: pc.id, cover: PHOTOS.building[0], excerpt: "Los precios por metro cuadrado en El Poblado y Laureles siguen subiendo, pero a un ritmo más moderado." },
    { title: "5 cosas que revisar antes de firmar un contrato de arriendo", cat: pc2.id, cover: PHOTOS.living[2], excerpt: "Depósitos, cláusulas de terminación y estado del inmueble: lo que nadie te cuenta." },
    { title: "Invertir en renta corta en Cartagena: ¿sigue siendo rentable?", cat: pc.id, cover: PHOTOS.beach[0], excerpt: "Analizamos ocupación, tarifas y regulación para responder con números." },
    { title: "Guía para vender tu apartamento más rápido (y mejor)", cat: pc2.id, cover: PHOTOS.kitchen[1], excerpt: "Fotografía, precio y presentación: los tres factores que aceleran una venta." },
  ];
  for (let i = 0; i < postSeeds.length; i++) {
    const p = postSeeds[i];
    await db.post.create({
      data: { title: p.title, slug: slug(p.title), excerpt: p.excerpt, coverUrl: img(p.cover, 1400), categoryId: p.cat, authorId: admin.id, isFeatured: i === 0, views: 300 + i * 120, publishedAt: new Date(now - i * 5 * 86400000), tags: "inmobiliaria,colombia", content: `<p>${p.excerpt}</p><h2>Contexto</h2><p>El mercado inmobiliario colombiano vive un momento de ajuste. Las tasas de interés empezaron a bajar y la demanda de vivienda usada se reactivó en las principales ciudades.</p><h2>Qué esperar</h2><p>Los expertos coinciden en que los próximos meses serán clave para quienes buscan comprar con financiación. Revisa siempre la ubicación, el estado del inmueble y la valorización histórica del sector.</p>` },
    });
  }
  await db.career.createMany({
    data: [
      { slug: "asesor-comercial-medellin", title: "Asesor(a) comercial inmobiliario", description: "Buscamos asesores con pasión por las personas y experiencia en ventas para nuestra oficina de Medellín.", content: "<h2>Responsabilidades</h2><ul><li>Captación y gestión de propiedades</li><li>Acompañamiento a clientes en visitas</li><li>Cierre de negociaciones</li></ul><h2>Requisitos</h2><ul><li>2 años de experiencia en ventas</li><li>Licencia de conducción</li></ul>", location: "Medellín", type: "FULL_TIME", salary: "Básico + comisiones", deadline: new Date(now + 30 * 86400000) },
      { slug: "fotografo-inmobiliario", title: "Fotógrafo(a) inmobiliario", description: "Fotografía y video con dron para propiedades en Bogotá y alrededores.", content: "<p>Trabajo por proyecto, equipo propio, portafolio requerido.</p>", location: "Bogotá", type: "CONTRACT", salary: "Por proyecto", deadline: new Date(now + 20 * 86400000) },
      { slug: "desarrollador-frontend", title: "Desarrollador(a) frontend", description: "Únete al equipo de producto de Habitta. React, Next.js y buen ojo para el diseño.", content: "<p>100 % remoto, contrato indefinido.</p>", location: "Remoto", type: "REMOTE", salary: "A convenir" },
    ],
  });

  await db.setting.createMany({
    data: [
      { key: "site_name", value: "Habitta", group: "general" },
      { key: "contact_whatsapp", value: "573001112233", group: "contact" },
      { key: "contact_phone", value: "+57 300 111 2233", group: "contact" },
      { key: "contact_email", value: "hola@habitta.test", group: "contact" },
    ],
  });

  console.log(`Listo. ${props.length} propiedades, ${projectSeeds.length} proyectos, ${agents.length} agentes.`);
  console.log("Accesos: admin@habitta.test / valentina@habitta.test / cliente@habitta.test — contraseña Habitta123!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
