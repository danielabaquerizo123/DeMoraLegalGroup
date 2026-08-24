# Frontend

La Fase 7 mantiene el frontend publico de De Mora Legal Group con React, Vite, TypeScript y React Router, e incorpora una direccion artistica juridica premium sobre la capa de experiencia creada con GSAP y ScrollTrigger.

Estructura principal:

- `components/layout`: layout, navbar y footer.
- `components/navigation`: navegacion responsive.
- `components/sections`: tarjetas, CTA y bloques visuales reutilizables.
- `components/common`: estados de carga, error y vacio.
- `components/whatsapp`: boton institucional de WhatsApp.
- `components/assistant`: asistente legal orientativo sin IA.
- `animations`: configuracion centralizada, GSAP, reveals, parallax, hero y secciones.
- `pages`: rutas publicas.
- `services/api`: cliente API centralizado.
- `types`: tipos compartidos de respuestas publicas.
- `constants/assets.ts`: rutas centralizadas a logo y fotografias.
- `assets/styles/global.css`: sistema visual global.
- `assets/styles/art-direction.css`: direccion visual premium, hero, composicion editorial y responsive de alto nivel.

Direccion visual:

- Paleta negro/carbon, marfil calido y dorado sobrio basado en el logo.
- Profundidad mediante gradientes, luz radial sutil, lineas finas y superficies oscuras diferenciadas.
- Titulares editoriales con serif y navegacion/copy con sans-serif.
- Se evita copy tecnico visible para clientes.

Hero:

- Usa `frontend/public/images/hero/lady-justice.png` como escena principal integrada, no como imagen en card.
- El contenido se ubica editorialmente sobre el lado izquierdo y Lady Justice domina la composicion visual.
- En movil se aplica crop e intensidad especificos para mantener lectura y evitar overflow.
- El logo de navbar usa `frontend/public/images/logo/LOGO.png`, preparado para fondo oscuro, sin caja blanca ni texto redundante junto al logo.

API:

- La base URL se configura con `VITE_API_BASE_URL`.
- Este valor es publico y no debe contener secretos.
- El frontend consume solo endpoints publicos del backend.
- El asistente obtiene servicios desde `/api/servicios`.
- WhatsApp obtiene su URL base desde `/api/configuracion`.

Motion:

- GSAP es la unica dependencia nueva de animacion.
- `animations/motion/config.ts` centraliza duraciones, easing, distancias, stagger y breakpoints.
- `animations/scroll/index.ts` inicializa la experiencia por ruta y limpia timelines/ScrollTriggers al desmontar.
- Hero usa capas CSS pseudo-3D y parallax suave.
- Lady Justice tiene entrada suave y parallax/escala muy ligera al hacer scroll.
- Profesionales y tarjetas usan reveal progresivo, hover sobrio y parallax limitado en imagenes.
- Servicios usan composicion editorial de lista en lugar de cards genericas; en movil se mantiene lectura directa.
- No se instalo Three.js, Lenis, Framer Motion ni librerias equivalentes.

Reduced motion:

- Si `prefers-reduced-motion: reduce` esta activo, se desactivan parallax, pinning y transforms complejos.
- El contenido sigue visible y navegable sin depender de animaciones.

Asistente legal:

- No usa IA real ni API keys.
- No responde preguntas juridicas abiertas.
- Orienta hacia servicios, equipo, blog, contacto y WhatsApp.
- Muestra una nota clara: la guia es orientativa y no sustituye asesoria profesional.
- En movil funciona como panel inferior compacto; en desktop como ventana flotante.
- El launcher visual se identifica como "Guia" para evitar una torre de circulos anonimos.

WhatsApp:

- El boton flotante usa exclusivamente la configuracion publica del backend.
- El mensaje general precargado es institucional.
- En paginas de detalle de servicio se genera un mensaje contextual con el nombre del servicio obtenido por API.

Rutas:

- `/`
- `/profesionales/:slug`
- `/servicios`
- `/servicios/:slug`
- `/blog`
- `/blog/:slug`
- `/contacto`

Responsive:

- Mobile first.
- Navbar completo en escritorio amplio.
- Menu hamburguesa accesible en movil y tablet estrecha para preservar presencia del logo.
- Grids fluidos para profesionales, servicios y blog.
- No debe existir scroll horizontal accidental.
- Las animaciones tienen comportamiento reducido en movil y tablet.
- Boton de WhatsApp y asistente se apilan para evitar superposicion.

Assets:

- Logo: `frontend/public/images/logo/LOGO.png`
- Hero: `frontend/public/images/hero/lady-justice.png`
- Fotografias: `frontend/public/images/professionals/`
- La API todavia puede devolver `fotoUrl = null`; el mapeo temporal por slug vive en `frontend/src/constants/assets.ts`.

Seguridad:

- No usar `DATABASE_URL` en frontend.
- No colocar tokens, contrasenas, API keys privadas ni secretos en `.env`, `src`, `public` o `dist`.
- Cualquier integracion futura que requiera secreto debe pasar por backend.
