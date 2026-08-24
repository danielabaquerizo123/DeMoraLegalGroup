import { professionalImagePositions, professionalImages, studioMeetingAsset } from "../../constants/assets";
import type { Professional, SiteConfiguration } from "../../types/api";
import { buildWhatsAppUrl } from "../../utils/whatsapp";

type ProfessionalProfileProps = {
  professional: Professional;
  configuration: SiteConfiguration | null;
};

type ContactChannel = Professional["canales"][number];

type ProfileEditorialContent = {
  intro: string;
  quote: string;
  sections: Array<{
    title: string;
    text: string;
  }>;
};

const profileContentBySlug: Record<string, ProfileEditorialContent> = {
  "lia-margarita-de-mora-campi": {
    intro: "Acompaña a sus clientes con análisis riguroso, criterio jurídico y estrategias claras para tomar decisiones informadas.",
    quote: "La diferencia entre ganar y perder rara vez está en la ley. Está en quién la leyó con más cuidado.",
    sections: [
      {
        title: "Perfil profesional",
        text: "Cada asunto se aborda con rigor y cercanía a partes iguales. No hay fórmulas genéricas: hay análisis cuidadoso, lectura precisa del contexto y acompañamiento real en cada etapa del proceso, desde la primera conversación hasta la resolución final.",
      },
      {
        title: "Enfoque de trabajo",
        text: "Ningún caso es igual a otro, y se trata como tal. Se estudian las particularidades, se identifican los escenarios posibles y se definen las alternativas jurídicas con claridad, comunicando cada paso sin tecnicismos innecesarios.",
      },
      {
        title: "Áreas de atención",
        text: "Su ejercicio se desarrolla dentro de las áreas de práctica del estudio, adaptando el acompañamiento jurídico a lo que cada cliente realmente necesita: no una respuesta estándar, sino una estrategia adecuada.",
      },
      {
        title: "Compromiso profesional",
        text: "Preparación técnica, criterio jurídico y responsabilidad sostienen cada intervención. El objetivo no es solo resolver, sino hacerlo con la estrategia correcta para cada caso, sin atajos.",
      },
    ],
  },
  "maria-belen-vargas-gonzalez": {
    intro: "Desarrolla su práctica con precisión, lectura crítica del caso y una comunicación clara durante cada etapa del proceso.",
    quote: "No se trata de tener razón. Se trata de saber demostrarla.",
    sections: [
      {
        title: "Perfil profesional",
        text: "Su ejercicio se sostiene en la precisión: cada detalle revisado, cada hipótesis contrastada, cada decisión fundamentada. La solidez no se improvisa, se construye caso por caso.",
      },
      {
        title: "Enfoque de trabajo",
        text: "Antes de actuar, entiende. Cada asunto se examina desde múltiples ángulos antes de definir una estrategia, priorizando siempre la solución que mejor proteja los intereses del cliente.",
      },
      {
        title: "Áreas de atención",
        text: "Ejerce dentro de las áreas de práctica del estudio, con un acompañamiento jurídico que se ajusta a cada cliente, no al revés. La particularidad del caso define el camino.",
      },
      {
        title: "Compromiso profesional",
        text: "Detrás de cada intervención hay preparación constante y un criterio que no se apresura. Su compromiso no es solo resolver el asunto, sino hacerlo con la solidez que merece.",
      },
    ],
  },
  "ronald-ariel-marin-paredes": {
    intro: "Aporta criterio técnico, escucha cercana y una mirada estratégica para ordenar cada situación jurídica desde el inicio.",
    quote: "Donde otros ven un conflicto, aquí se ve una estrategia por construir.",
    sections: [
      {
        title: "Perfil profesional",
        text: "Combina el criterio técnico con una escucha genuina: entender primero, actuar después. Cada cliente llega con una historia distinta, y esa historia es el punto de partida de su trabajo.",
      },
      {
        title: "Enfoque de trabajo",
        text: "El proceso se construye junto al cliente, no a sus espaldas. Se analizan los escenarios posibles, se sopesan las alternativas y se traza una estrategia jurídica clara.",
      },
      {
        title: "Áreas de atención",
        text: "Su práctica se desarrolla dentro de las áreas del estudio, con un enfoque que prioriza lo que cada situación realmente exige: atención jurídica hecha a la medida del caso.",
      },
      {
        title: "Compromiso profesional",
        text: "Preparación, criterio y responsabilidad guían cada paso. No se trata de encontrar cualquier salida, sino la estrategia correcta que sostiene el caso desde el principio hasta el final.",
      },
    ],
  },
  "paul-cepeda-chimbolema": {
    intro: "Construye cada defensa con análisis riguroso, argumentos sólidos y comunicación responsable durante el proceso.",
    quote: "No se gana un caso el día de la sentencia. Se gana en cada decisión tomada antes de llegar a ella.",
    sections: [
      {
        title: "Perfil profesional",
        text: "Su trabajo se sostiene en la coherencia entre lo que se promete y lo que se ejecuta. No hay discursos vacíos: hay análisis riguroso, argumentos sólidos y una defensa que se construye con la misma seriedad con la que se estudia cada expediente.",
      },
      {
        title: "Enfoque de trabajo",
        text: "Cada estrategia nace de una pregunta simple: ¿qué es lo mejor para este cliente, en este caso específico? A partir de ahí se evalúan los caminos posibles, se elige el más sólido y se acompaña su ejecución con comunicación constante, sin zonas grises.",
      },
      {
        title: "Áreas de atención",
        text: "Ejerce dentro de las áreas de práctica del estudio, con una atención jurídica que responde a la realidad concreta de cada cliente, no a un modelo replicado de un caso a otro.",
      },
      {
        title: "Compromiso profesional",
        text: "Criterio jurídico, disciplina y responsabilidad son la base de cada intervención. El compromiso no termina cuando se presenta un escrito: termina cuando el caso está verdaderamente resuelto.",
      },
    ],
  },
};

const fallbackContent: ProfileEditorialContent = {
  intro: "Acompaña a sus clientes con análisis cuidadoso, criterio jurídico y comunicación clara durante cada etapa del proceso.",
  quote: "Cada caso merece una estrategia propia.",
  sections: [
    {
      title: "Perfil profesional",
      text: "Cada asunto se aborda con rigor, lectura precisa del contexto y acompañamiento responsable durante las distintas etapas del proceso.",
    },
    {
      title: "Enfoque de trabajo",
      text: "El trabajo parte del análisis de las particularidades del caso para definir alternativas jurídicas claras y comprensibles.",
    },
    {
      title: "Áreas de atención",
      text: "El acompañamiento se adapta a las áreas de práctica del estudio y a las necesidades concretas de cada situación.",
    },
    {
      title: "Compromiso profesional",
      text: "Preparación, criterio jurídico y responsabilidad orientan cada intervención, sin promesas absolutas ni respuestas genéricas.",
    },
  ],
};

function professionalMessage(name: string) {
  return `Hola, quisiera realizar una consulta con el equipo de De Mora Legal Group y conocer más sobre la atención de ${name}.`;
}

function findEmailChannel(channels: ContactChannel[]) {
  return channels.find((channel) => {
    const kind = `${channel.tipo} ${channel.etiqueta ?? ""}`.toLowerCase();
    return (kind.includes("email") || kind.includes("correo")) && (channel.url || channel.valor.includes("@"));
  });
}

function emailHref(channel: ContactChannel) {
  if (channel.url) {
    return channel.url;
  }

  return `mailto:${channel.valor}`;
}

export function ProfessionalHero({ professional, configuration }: ProfessionalProfileProps) {
  const image = professionalImages[professional.slug] ?? professional.fotoUrl ?? "";
  const imagePosition = professionalImagePositions[professional.slug] ?? "center 24%";
  const whatsapp = configuration?.contacto_whatsapp_principal;
  const email = findEmailChannel(professional.canales);
  const editorial = profileContentBySlug[professional.slug] ?? fallbackContent;

  return (
    <section className="profile-hero" aria-labelledby="profile-title">
      <div className="profile-hero__media">
        {image ? (
          <img
            src={image}
            alt={`Retrato profesional de ${professional.nombreCompleto}`}
            loading="eager"
            style={{ objectPosition: imagePosition }}
          />
        ) : null}
      </div>

      <div className="profile-hero__content">
        <p className="eyebrow">{professional.cargo ?? "Profesional"}</p>
        <h1 id="profile-title">
          <span>{professional.nombres}</span>
          {" "}
          <span>{professional.apellidos}</span>
        </h1>
        <span className="profile-rule" aria-hidden="true" />
        <p>{editorial.intro}</p>

        <div className="profile-actions" aria-label="Acciones de contacto">
          {whatsapp ? (
            <a className="button button--primary" href={buildWhatsAppUrl(whatsapp.url, professionalMessage(professional.nombreCompleto))} target="_blank" rel="noreferrer">
              Consultar por WhatsApp
            </a>
          ) : null}
          {email ? (
            <a className="button button--secondary" href={emailHref(email)}>
              Enviar correo
            </a>
          ) : null}
        </div>
      </div>
    </section>
  );
}

export function ProfessionalQuote({ professional }: { professional: Professional }) {
  const editorial = profileContentBySlug[professional.slug] ?? fallbackContent;
  const [firstPart, highlightedPart] = editorial.quote.split(". ");

  return (
    <section className="profile-quote-band" aria-labelledby="profile-quote-title">
      <div className="profile-quote-band__copy">
        <span className="profile-quote-mark" aria-hidden="true">
          &#8220;
        </span>
        <h2 id="profile-quote-title">
          {highlightedPart ? (
            <>
              {firstPart}.<br />
              {" "}
              <span>{highlightedPart}</span>
            </>
          ) : (
            editorial.quote
          )}
        </h2>
        <i aria-hidden="true" />
        <p>Cada decisión hoy construye tu tranquilidad mañana.</p>
      </div>
      <div className="profile-quote-band__image" aria-hidden="true">
        <img src={studioMeetingAsset} alt="" loading="lazy" />
      </div>
    </section>
  );
}

export function ProfessionalEditorialSections({ professional }: { professional: Professional }) {
  const editorial = profileContentBySlug[professional.slug] ?? fallbackContent;

  return (
    <section className="profile-editorial-sections" aria-label="Contenido profesional">
      {editorial.sections.map((section, index) => (
        <article className="profile-editorial-card" key={section.title}>
          <span className={`profile-editorial-card__icon profile-editorial-card__icon--${index + 1}`} aria-hidden="true" />
          <h2>{section.title}</h2>
          <i aria-hidden="true" />
          <p>{section.text}</p>
        </article>
      ))}
    </section>
  );
}

export function ProfessionalContactCTA({ professional, configuration }: ProfessionalProfileProps) {
  const whatsapp = configuration?.contacto_whatsapp_principal;

  if (!whatsapp) {
    return null;
  }

  return (
    <section className="profile-contact-cta" aria-labelledby="profile-contact-title">
      <div>
        <p>¿Necesita orientación jurídica?</p>
        <h2 id="profile-contact-title">Conversemos sobre su caso.</h2>
      </div>
      <a className="button button--primary" href={buildWhatsAppUrl(whatsapp.url, professionalMessage(professional.nombreCompleto))} target="_blank" rel="noreferrer">
        Consultar por WhatsApp
      </a>
    </section>
  );
}
