import { Link, useOutletContext } from "react-router-dom";
import { ErrorState } from "../../components/common/ErrorState";
import { LoadingState } from "../../components/common/LoadingState";
import { CTASection } from "../../components/sections/CTASection";
import { ProfessionalCard } from "../../components/sections/ProfessionalCard";
import { heroLadyJusticeAsset, studioMeetingAsset } from "../../constants/assets";
import { professionalApi } from "../../services/api/professional-api";
import { serviceApi } from "../../services/api/service-api";
import { blogApi } from "../../services/api/blog-api";
import { useApi } from "../../hooks/use-api";
import { buildWhatsAppUrl } from "../../utils/whatsapp";
import type { SiteConfiguration } from "../../types/api";

type LayoutContext = {
  configuration: SiteConfiguration | null;
};

function SectionMark({ number, label }: { number: string; label: string }) {
  return (
    <div className="home-section-mark">
      <div>
        <span>{number}</span>
        <i aria-hidden="true" />
      </div>
      <p>{label}</p>
    </div>
  );
}

export function HomePage() {
  const { configuration } = useOutletContext<LayoutContext>();
  const professionals = useApi(professionalApi.list, []);
  const services = useApi(serviceApi.list, []);
  const articles = useApi(() => blogApi.listArticles(1, 3), []);
  const whatsapp = configuration?.contacto_whatsapp_principal;

  return (
    <>
      <section className="hero-section" id="inicio">
        <div className="hero-depth-layer hero-depth-layer--halo" aria-hidden="true" />
        <div className="hero-depth-layer hero-depth-layer--frame" aria-hidden="true" />
        <div className="hero-visual" aria-hidden="true">
          <img className="hero-justice" src={heroLadyJusticeAsset} alt="" />
        </div>
        <div className="hero-section__content reveal">
          <p className="eyebrow">Estudio jurídico</p>
          <h1>
            Su defensa exige estrategia, criterio y <span className="hero-accent">precisión.</span>
          </h1>
          <p>Asesoría jurídica, litigación y acompañamiento profesional para decisiones que requieren análisis responsable.</p>
          <div className="hero-actions">
            {whatsapp ? (
              <a className="button button--primary" href={buildWhatsAppUrl(whatsapp.url)} target="_blank" rel="noreferrer">
                Consultar <span aria-hidden="true">-&gt;</span>
              </a>
            ) : null}
            <a className="button button--secondary" href="#servicios">
              Conocer servicios <span aria-hidden="true">-&gt;</span>
            </a>
          </div>
        </div>
      </section>

      <section className="studio-section reveal" id="estudio" aria-labelledby="estudio-title">
        <div className="studio-section__content">
          <SectionMark number="01" label="El estudio" />
          <h2 id="estudio-title">Defensa.<br />Estrategia.<br />Criterio.</h2>
          <p>El estudio integra práctica profesional, formación académica y atención institucional para acompañar cada caso con análisis responsable.</p>
          <a className="text-link" href="#profesionales">
            Conocer más sobre el estudio
          </a>
        </div>
        <div className="studio-section__image">
          <img src={studioMeetingAsset} alt="Sala de reuniones de De Mora Legal Group" loading="lazy" />
        </div>
      </section>

      <section className="professionals-showcase reveal cinematic-section" id="profesionales">
        <div className="professionals-showcase__intro">
          <SectionMark number="02" label="Nuestro equipo" />
          <h2>Profesionales<br />a su servicio.</h2>
          <p>Abogados comprometidos con la excelencia y la defensa de sus intereses.</p>
        </div>
        {professionals.isLoading ? <LoadingState /> : null}
        {professionals.error ? <ErrorState message={professionals.error} /> : null}
        {professionals.data ? (
          <>
            <div className="professional-grid professional-grid--showcase" aria-label="Carrusel de profesionales">
              {professionals.data.data.map((professional, index) => (
                <ProfessionalCard key={professional.slug} professional={professional} priority={index === 0} variant="showcase" />
              ))}
            </div>
            <div className="mobile-carousel-dots" aria-hidden="true">
              {professionals.data.data.map((professional, index) => (
                <span className={index === 0 ? "is-active" : ""} key={professional.slug} />
              ))}
            </div>
          </>
        ) : null}
      </section>

      <section className="practice-section reveal" id="servicios" aria-labelledby="servicios-title">
        <div className="practice-section__intro">
          <SectionMark number="03" label="Nuestras áreas de práctica" />
          <h2 id="servicios-title">Soluciones jurídicas para asuntos que requieren <span>precisión.</span></h2>
          <p>Cada caso es único y merece una estrategia especializada.</p>
        </div>
        <div className="practice-section__list">
          {services.isLoading ? <LoadingState label="Cargando servicios" /> : null}
          {services.error ? <ErrorState message={services.error} /> : null}
          {services.data?.data.map((service, index) => (
            <Link className="practice-service-row" key={service.slug} to={`/servicios#${service.slug}`}>
              <span>{String(index + 1).padStart(2, "0")}</span>
              <strong>{service.nombre}</strong>
              <i aria-hidden="true">-&gt;</i>
            </Link>
          ))}
        </div>
        {services.data ? (
          <div className="mobile-carousel-dots mobile-carousel-dots--services" aria-hidden="true">
            {services.data.data.map((service, index) => (
              <span className={index === 0 ? "is-active" : ""} key={service.slug} />
            ))}
          </div>
        ) : null}
        <div className="practice-section__image" aria-hidden="true">
          <img src={studioMeetingAsset} alt="" loading="lazy" />
        </div>
      </section>

      <section className="case-statement reveal" aria-label="Principio de trabajo">
        <p>Cada caso exige una <span>estrategia</span> propia.</p>
        <small>Análisis <b>•</b> Experiencia <b>•</b> Resultados</small>
      </section>

      <section className="home-blog-section reveal" id="blog-home">
        <div className="home-blog-section__intro">
          <SectionMark number="04" label="Análisis, actualidad y videos" />
          <h2>Información jurídica que aporta valor.</h2>
          <Link className="button button--primary" to="/blog">
            Ver contenido <span aria-hidden="true">-&gt;</span>
          </Link>
        </div>
        <div className="home-blog-section__content">
          <div className="blog-tabs" aria-label="Formatos editoriales disponibles">
            <span>Artículos</span>
            <span>Actualidad jurídica</span>
            <span>Videos</span>
          </div>
          {articles.isLoading ? <LoadingState /> : null}
          {articles.error ? <ErrorState message={articles.error} /> : null}
          {articles.data && articles.data.data.length === 0 ? (
            <div className="empty-state">
              <h2>Pronto publicaremos nuevos contenidos.</h2>
              <p>Este espacio está preparado para artículos, actualidad jurídica y videos del estudio.</p>
            </div>
          ) : null}
          {articles.data && articles.data.data.length > 0 ? (
            <div className="blog-grid blog-grid--home">
              {articles.data.data.map((article) => (
                <article className="blog-card" key={article.slug}>
                  {article.imagen ? <img className="blog-card__image" src={article.imagen} alt="" loading="lazy" /> : null}
                  <p className="eyebrow">{article.categoria?.nombre ?? "Blog juridico"}</p>
                  <h3>
                    <Link to={`/blog/${article.slug}`}>{article.titulo}</Link>
                  </h3>
                  {article.extracto ? <p>{article.extracto}</p> : null}
                  <Link className="text-link" to={`/blog/${article.slug}`}>
                    Leer más
                  </Link>
                </article>
              ))}
            </div>
          ) : null}
        </div>
      </section>

      <CTASection configuration={configuration} />
    </>
  );
}
