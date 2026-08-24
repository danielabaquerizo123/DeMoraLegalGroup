# Backend publico

La Fase 4 implementa una API publica de solo lectura para el sitio profesional.

Arquitectura:

```text
Routes
  -> Controllers
  -> Services
  -> Repositories
  -> Prisma Client
  -> PostgreSQL
```

Responsabilidades:

- `routes/`: define URLs y validadores.
- `controllers/`: recibe request y devuelve response.
- `services/`: aplica reglas, transforma DTOs publicos y resuelve recursos inexistentes.
- `repositories/`: concentra consultas Prisma.
- `middlewares/`: centraliza errores 400, 404 y 500.
- `validators/`: valida slugs, paginacion y filtros con Zod.

Endpoints:

- `GET /api/health`
- `GET /api/profesionales`
- `GET /api/profesionales/:slug`
- `GET /api/servicios`
- `GET /api/servicios/:slug`
- `GET /api/articulos`
- `GET /api/articulos/:slug`
- `GET /api/categorias`
- `GET /api/categorias/:slug`
- `GET /api/configuracion`

Blog:

- `GET /api/articulos` devuelve solo articulos publicados.
- Soporta `page` y `limit`, con limite maximo de 50.
- Soporta filtros opcionales `categoria`, `servicio` y `etiqueta`.
- Una base sin articulos publicados devuelve `data: []` y paginacion con total 0.

Seed:

- Ubicacion: `backend/prisma/seed/`.
- Ejecutar con `npm run seed`.
- Es idempotente y no borra datos.
- Inserta profesionales, sedes, servicios, categorias y configuracion publica inicial.

No se documentan credenciales ni valores de conexion.
