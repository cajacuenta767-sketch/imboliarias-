# Habitta · Sistema inmobiliario

Plataforma completa para comprar, vender y alquilar propiedades: sitio público, área de cuenta para agentes y clientes, panel de administración y API REST. Construida con **Next.js 15**, **TypeScript**, **Tailwind CSS 4**, **Prisma** y **Auth.js**.

## Arranque rápido

```bash
cp .env.example .env          # ajusta AUTH_SECRET
npm install                   # instala dependencias y genera el cliente Prisma
npx prisma migrate dev        # crea la base de datos (SQLite por defecto)
npm run db:seed               # datos de demostración (Colombia)
npm run dev                   # http://localhost:3000
```

Cuentas de prueba (contraseña `Habitta123!`):

| Rol | Correo |
|---|---|
| Administrador | admin@habitta.test |
| Agente | valentina@habitta.test |
| Cliente | cliente@habitta.test |

> Sin internet: `SEED_IMAGES=local npm run db:seed` usa ilustraciones locales en lugar de fotos de Unsplash.

## Qué incluye

**Sitio público** (`/`): inicio con buscador por pestañas (comprar, alquilar, proyectos), categorías, propiedades y proyectos destacados, ciudades, asesores, testimonios y blog. Listado con filtros avanzados, vistas cuadrícula/lista/mapa (marcadores de precio con clúster y búsqueda al mover el mapa), ficha de propiedad con galería, lightbox, video, mapa, detalles, características, lugares cercanos, reseñas, formulario de contacto y WhatsApp. Proyectos, agentes, noticias, empleos, páginas CMS, contacto, favoritos, registro e inicio de sesión. Selector de idioma (ES/EN) y de moneda.

**Área de cuenta** (`/cuenta`): resumen, mis propiedades (crear, editar, renovar, duplicar, eliminar), formulario de propiedad por pestañas con subida de fotos y mapa para fijar el pin, créditos y paquetes con checkout (cupones, sandbox), facturas imprimibles, consultas recibidas, favoritos y perfil de asesor.

**Panel de administración** (`/admin`): dashboard con KPIs y gráficas; propiedades (moderación, acciones masivas, importar/exportar CSV), proyectos, categorías, características, instalaciones, inversores, reseñas, campos personalizados, ubicaciones (país/departamento/ciudad); paquetes, facturas, plantilla de factura, cupones, monedas; páginas, blog, carreras y postulaciones; biblioteca de medios; cuentas y roles; apariencia y configuración.

**API REST** (`/api/v1`): todos los módulos anteriores con validación Zod y respuestas uniformes `{ data, meta }` / `{ error, details }`. Ejemplos:

```
GET  /api/v1/properties?type=SALE&city=medellin&minPrice=100000&sort=price_asc
GET  /api/v1/properties/map?bbox=6.1,-75.7,6.4,-75.4
POST /api/v1/inquiries        { name, email, phone, message, propertyId }
POST /api/v1/auth/register    { name, email, password, asAgent }
POST /api/v1/invoices/checkout { packageId, coupon }
```

## Arquitectura

```
prisma/               esquema y seed
src/app/(site)        sitio público (App Router)
src/app/cuenta        área del agente / cliente
src/app/admin         panel de administración
src/app/api/v1        route handlers delgados → llaman a los servicios
src/server/modules/*  BACKEND: schema.ts (Zod) + service.ts (reglas y Prisma) por módulo
src/server/auth       Auth.js (credenciales, JWT, roles ADMIN | AGENT | CUSTOMER)
src/server/lib        paginación, slugs, CSV, correo, almacenamiento (adaptador local → S3)
src/components        ui (primitivas), site, account, admin, shared (formularios reutilizables)
src/i18n              mensajes es/en (next-intl, idioma por cookie)
src/lib               utilidades compartidas, hooks (moneda, favoritos, configuración)
```

Las páginas de servidor llaman a los servicios directamente (sin salto HTTP); los componentes de cliente usan `src/lib/api.ts` contra `/api/v1`. Cualquier app móvil o frontend externo puede consumir la misma API.

## Reglas de negocio

- Publicar cuesta créditos (`credits_per_listing`), destacar cuesta extra (`credits_per_featured`). Los créditos se compran con paquetes; el administrador publica sin costo.
- Las publicaciones de agentes entran en moderación (`moderation_required`) y expiran a los `listing_days` días; se pueden renovar.
- Pagos: la pasarela la decide **solo el servidor** con `PAYMENT_GATEWAY`. `SANDBOX` aprueba al instante (solo para pruebas); cualquier otro valor (o ninguno) se comporta como `MANUAL`: la factura queda pendiente hasta que el administrador la marque pagada. Una factura pagada solo puede pasar a `REFUNDED`, y al hacerlo se retiran los créditos otorgados.
- Créditos: el cobro es atómico (dos publicaciones simultáneas no dejan el saldo en negativo). La vigencia (`listing_days`) empieza a contar cuando la publicación se aprueba, no cuando se crea.
- Cupones: `PERCENT` no puede superar 100; los `FIXED` y la compra mínima aplican solo a paquetes en la moneda del cupón.
- Contenido enriquecido (propiedades, proyectos, blog, páginas, empleos) se sanea en el servidor al guardarse; el correo de consultas escapa el HTML.
- Subidas: el tipo real se detecta por los primeros bytes del archivo y la extensión la fija el servidor; cada usuario ve y borra solo sus archivos (el administrador, todos).
- Límite de peticiones en memoria para inicio de sesión, registro, consultas, reseñas, postulaciones y validación de cupones (para varias réplicas conviene respaldarlo en Redis).
- Correos: si no hay `SMTP_HOST` se imprimen en consola.

## PostgreSQL en producción

1. En `prisma/schema.prisma` cambia `provider = "sqlite"` por `provider = "postgresql"`.
2. `DATABASE_URL="postgresql://habitta:habitta@localhost:5432/habitta"` (hay un `docker-compose.yml` con Postgres listo).
3. `npx prisma migrate dev --name init` y `npm run db:seed`.

## Scripts

| Comando | Descripción |
|---|---|
| `npm run dev` / `build` / `start` | desarrollo, compilación y producción |
| `npm run lint` / `typecheck` / `test` | ESLint, TypeScript y Vitest |
| `npm run db:migrate` / `db:seed` / `db:reset` / `db:studio` | base de datos |
| `node scripts/screenshot.mjs <url> <out.png>` | captura de pantalla con Chromium |
| `node scripts/smoke.mjs` | prueba de humo end-to-end contra `http://localhost:3000` (login, subida, checkout, créditos, límites) |

## Despliegue

Funciona en Vercel, Railway, Render, un VPS con `npm run build && npm start` o Docker. Configura `AUTH_SECRET`, `DATABASE_URL`, `NEXT_PUBLIC_SITE_URL` y, opcionalmente, SMTP y pasarela de pago. `NEXT_PUBLIC_DEMO_LOGIN=1` muestra los accesos de prueba en `/ingresar`; no lo actives en producción. El sitio expone `robots.txt`, `sitemap.xml` y `manifest.webmanifest`. Las imágenes subidas se guardan en `public/uploads`; para S3/R2 implementa `StorageAdapter` en `src/server/lib/storage.ts`.
