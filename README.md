# Web Estudio Juridico

Proyecto web profesional para un estudio juridico.

La estructura del proyecto separa:

- `frontend/`
- `backend/`
- `docs/`

Estado actual:

- **Fase 1:** estructura inicial completada.
- **Fase 2:** configuracion tecnica base.

Stack configurado en esta fase:

- Frontend: React + Vite + TypeScript.
- Backend: Node.js + Express + TypeScript.

Persistencia configurada:

- PostgreSQL.
- Prisma ORM 7.9.1.
- Modelo inicial con 13 tablas de aplicacion.
- Schema en `backend/prisma/schema.prisma`.
- Configuracion en `backend/prisma.config.ts`.

Backend publico:

- Arquitectura por capas: routes, controllers, services, repositories y Prisma Client.
- Seed inicial idempotente en `backend/prisma/seed/`.
- Endpoints de lectura para profesionales, servicios, articulos, categorias y configuracion publica.

Ejecucion local del backend:

```bash
cd backend
npm run seed
npm run dev
```

Endpoints principales:

- `GET /api/health`
- `GET /api/profesionales`
- `GET /api/profesionales/:slug`
- `GET /api/servicios`
- `GET /api/servicios/:slug`
- `GET /api/articulos?page=1&limit=10`
- `GET /api/articulos/:slug`
- `GET /api/categorias`
- `GET /api/categorias/:slug`
- `GET /api/configuracion`

Frontend:

- Aplicacion React + Vite + TypeScript en `frontend/`.
- Consume la API publica mediante `VITE_API_BASE_URL`.
- Rutas: `/`, `/profesionales/:slug`, `/servicios`, `/servicios/:slug`, `/blog`, `/blog/:slug`, `/contacto`.
- Usa assets locales reales en `frontend/public/images/`.
- No requiere claves privadas en el navegador.
