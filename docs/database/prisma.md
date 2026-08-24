# Base de datos

La Fase 3 define el modelo inicial de persistencia con PostgreSQL y Prisma ORM 7.9.1.

- Schema Prisma: `backend/prisma/schema.prisma`
- Configuracion Prisma 7: `backend/prisma.config.ts`
- Prisma Client: `backend/src/generated/prisma/`
- Migraciones: `backend/prisma/migrations/`

El modelo inicial contiene 13 tablas de aplicacion:

- `profesional`
- `sede`
- `profesional_sede`
- `canal_contacto_profesional`
- `servicio`
- `profesional_servicio`
- `categoria_blog`
- `articulo_blog`
- `articulo_autor`
- `articulo_servicio`
- `etiqueta_blog`
- `articulo_etiqueta`
- `configuracion_sitio`

Relaciones principales:

- Profesionales con sedes mediante `profesional_sede`.
- Profesionales con servicios mediante `profesional_servicio`.
- Articulos con autores, servicios y etiquetas mediante tablas intermedias explicitas.
- Articulos asociados a una categoria obligatoria.

No se documentan credenciales ni valores de conexion.

Datos iniciales de Fase 4:

- 3 profesionales publicos.
- 2 sedes de atencion profesional.
- 6 servicios juridicos.
- 3 categorias editoriales.
- Configuracion publica institucional.

No se insertan articulos ficticios ni etiquetas iniciales.
