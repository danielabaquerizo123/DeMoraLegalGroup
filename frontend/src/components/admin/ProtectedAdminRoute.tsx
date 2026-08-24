import { useEffect, useState, type ReactNode } from "react";
import { Navigate } from "react-router-dom";
import type { AdminUser } from "../../types/api";
import { adminAuthApi } from "../../services/api/admin-auth-api";

type ProtectedAdminRouteProps = {
  children: (user: AdminUser) => ReactNode;
};

export function ProtectedAdminRoute({ children }: ProtectedAdminRouteProps) {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    adminAuthApi
      .me()
      .then((response) => {
        if (isMounted) {
          setUser(response.data.user);
        }
      })
      .catch(() => {
        if (isMounted) {
          setUser(null);
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  if (isLoading) {
    return <div className="admin-loading">Validando acceso administrativo...</div>;
  }

  if (!user) {
    return <Navigate to="/admin/login" replace />;
  }

  return children(user);
}
