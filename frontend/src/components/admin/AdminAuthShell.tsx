import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { Headphones, Landmark, Scale, Shield } from "lucide-react";
import { logoAsset } from "../../constants/assets";

type AdminAuthShellProps = {
  eyebrow: string;
  title: string;
  children: ReactNode;
};

export function AdminAuthShell({ eyebrow, title, children }: AdminAuthShellProps) {
  return (
    <main className="admin-auth-page">
      <section className="admin-auth-brand" aria-label="Acceso administrativo De Mora Legal Group">
        <div className="admin-auth-brand__architecture" aria-hidden="true" />
        <div className="admin-auth-brand__content">
          <Link to="/" className="admin-auth-logo" aria-label="Ir al inicio de De Mora Legal Group">
            <img src={logoAsset} alt="De Mora Legal Group" />
          </Link>

          <div className="admin-auth-brand__headline">
            <div className="admin-auth-brand__separator" aria-hidden="true">
              <span />
              <Scale />
              <span />
            </div>
            <h1>
              <span>Acceso</span>
              <span>Administrativo</span>
            </h1>
            <p>Gestiona el contenido editorial del blog de De Mora Legal Group.</p>
            <i aria-hidden="true" />
          </div>

          <div className="admin-auth-trust">
            <div>
              <span className="admin-auth-icon" aria-hidden="true">
                <Shield strokeWidth={1.55} />
              </span>
              <strong>Seguro</strong>
              <span>Tus datos y contenido protegidos</span>
            </div>
            <div>
              <span className="admin-auth-icon" aria-hidden="true">
                <Landmark strokeWidth={1.55} />
              </span>
              <strong>Exclusivo</strong>
              <span>Acceso exclusivo para abogados del estudio</span>
            </div>
            <div>
              <span className="admin-auth-icon" aria-hidden="true">
                <Headphones strokeWidth={1.55} />
              </span>
              <strong>Profesional</strong>
              <span>Atención técnica especializada</span>
            </div>
          </div>
        </div>
      </section>

      <section className="admin-auth-panel" aria-labelledby="admin-auth-title">
        <div className="admin-auth-panel__content">
          <div className="admin-auth-card">
            <div className="admin-auth-card__ornament" aria-hidden="true" />
            <div className="admin-auth-lock" aria-hidden="true">
              <Scale strokeWidth={1.55} />
            </div>
            <p className="admin-auth-card__eyebrow">{eyebrow}</p>
            <h2 id="admin-auth-title">{title}</h2>
            <div className="admin-auth-card__rule" aria-hidden="true">
              <span />
              <i />
              <span />
            </div>
            {children}
          </div>

          <blockquote>
            Soluciones legales estratégicas,
            <br />
            resultados que generan confianza.
          </blockquote>
        </div>
      </section>
    </main>
  );
}
