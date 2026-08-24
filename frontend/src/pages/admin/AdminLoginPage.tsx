import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { Landmark } from "lucide-react";
import { AdminFormField } from "../../components/admin/AdminFormField";
import { AdminAuthShell } from "../../components/admin/AdminAuthShell";
import { adminAuthApi } from "../../services/api/admin-auth-api";
import { ApiError } from "../../services/api/api-client";

export function AdminLoginPage() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (!username || !password) {
      setError("Completa tu usuario y contraseña.");
      return;
    }

    setIsSubmitting(true);
    try {
      await adminAuthApi.login({ username, password });
      navigate("/admin/blog", { replace: true });
    } catch (caughtError) {
      setError(caughtError instanceof ApiError ? caughtError.message : "No pudimos iniciar sesión.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AdminAuthShell eyebrow="Bienvenido de nuevo" title="Iniciar sesión">
      <form className="admin-auth-form" onSubmit={handleSubmit} autoComplete="off">
        {error ? <p className="admin-form-message admin-form-message--error">{error}</p> : null}
        <AdminFormField label="Usuario" icon="user" type="text" name="username" value={username} placeholder="Ingresa tu usuario" autoComplete="username" onChange={setUsername} />
        <AdminFormField label="Contraseña" icon="lock" type="password" name="password" value={password} placeholder="Ingresa tu contraseña" autoComplete="current-password" onChange={setPassword} />
        <button className="admin-submit" type="submit" disabled={isSubmitting}>
          <Landmark aria-hidden="true" />
          {isSubmitting ? "Iniciando sesión..." : "Iniciar sesión"} <span>→</span>
        </button>
      </form>
    </AdminAuthShell>
  );
}
