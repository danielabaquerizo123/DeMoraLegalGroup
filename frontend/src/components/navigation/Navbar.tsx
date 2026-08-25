import { useEffect, useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { Phone } from "lucide-react";
import { logoAsset } from "../../constants/assets";
import type { SiteConfiguration } from "../../types/api";
import { buildWhatsAppUrl } from "../../utils/whatsapp";

const navigationItems = [
  { label: "Inicio", to: "/" },
  { label: "Profesionales", to: "/#profesionales" },
  { label: "Servicios", to: "/servicios" },
  { label: "Blog", to: "/blog" },
  { label: "Contacto", to: "/contacto" },
];

type NavbarProps = {
  configuration: SiteConfiguration | null;
};

export function Navbar({ configuration }: NavbarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const location = useLocation();
  const whatsapp = configuration?.contacto_whatsapp_principal;

  useEffect(() => {
    setIsOpen(false);
  }, [location.pathname, location.hash]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    document.addEventListener("keydown", onKeyDown);
    document.body.classList.toggle("menu-open", isOpen);

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.classList.remove("menu-open");
    };
  }, [isOpen]);

  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 24);

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });

    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header className={`site-header ${isScrolled ? "site-header--scrolled" : ""}`}>
      <nav className="navbar" aria-label="Navegacion principal">
        <Link className="brand brand--logo" to="/" aria-label={`Ir al inicio de ${configuration?.nombre_estudio?.nombre ?? "De Mora Legal Group"}`}>
          <img src={logoAsset} alt={configuration?.nombre_estudio?.nombre ?? "De Mora Legal Group"} />
        </Link>

        <div className="navbar__links">
          {navigationItems.map((item) =>
            item.to.includes("#") ? (
              <a key={item.to} href={item.to}>
                {item.label}
              </a>
            ) : (
              <NavLink key={item.to} to={item.to}>
                {item.label}
              </NavLink>
            ),
          )}
        </div>

        {whatsapp ? (
          <a className="button button--nav" href={buildWhatsAppUrl(whatsapp.url)} target="_blank" rel="noreferrer">
            <Phone aria-hidden="true" />
            Consultar
          </a>
        ) : null}

        <button className="menu-button" type="button" aria-label="Abrir menu" aria-expanded={isOpen} onClick={() => setIsOpen((value) => !value)}>
          <span />
          <span />
        </button>
      </nav>

      <div className={`mobile-menu ${isOpen ? "mobile-menu--open" : ""}`}>
        {navigationItems.map((item) =>
          item.to.includes("#") ? (
            <a key={item.to} href={item.to}>
              {item.label}
            </a>
          ) : (
            <NavLink key={item.to} to={item.to}>
              {item.label}
            </NavLink>
          ),
        )}
        {whatsapp ? (
          <a className="button button--primary" href={buildWhatsAppUrl(whatsapp.url)} target="_blank" rel="noreferrer">
            <Phone aria-hidden="true" />
            Contactar
          </a>
        ) : null}
      </div>
    </header>
  );
}
