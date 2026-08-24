import { useState } from "react";
import { Eye, EyeOff, Lock, Mail, User } from "lucide-react";

type AdminFormFieldProps = {
  label: string;
  icon: "email" | "lock" | "user";
  type?: "email" | "password" | "text";
  value: string;
  placeholder: string;
  name: string;
  autoComplete?: string;
  error?: string;
  onChange: (value: string) => void;
};

export function AdminFormField({ label, icon, type = "text", value, placeholder, name, autoComplete, error, onChange }: AdminFormFieldProps) {
  const [isVisible, setIsVisible] = useState(false);
  const inputType = type === "password" && isVisible ? "text" : type;
  const Icon = icon === "email" ? Mail : icon === "lock" ? Lock : User;

  return (
    <label className={`admin-field ${error ? "admin-field--error" : ""}`}>
      <span>{label}</span>
      <div className="admin-field__control">
        <Icon className="admin-field__icon" aria-hidden="true" strokeWidth={1.8} />
        <input
          name={name}
          type={inputType}
          value={value}
          placeholder={placeholder}
          autoComplete={autoComplete}
          onChange={(event) => onChange(event.target.value)}
        />
        {type === "password" ? (
          <button type="button" className="admin-field__toggle" aria-label={isVisible ? "Ocultar contraseña" : "Mostrar contraseña"} onClick={() => setIsVisible((current) => !current)}>
            {isVisible ? <EyeOff aria-hidden="true" strokeWidth={1.8} /> : <Eye aria-hidden="true" strokeWidth={1.8} />}
          </button>
        ) : null}
      </div>
      {error ? <small>{error}</small> : null}
    </label>
  );
}
