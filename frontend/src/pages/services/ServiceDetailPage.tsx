import { Navigate, useParams } from "react-router-dom";

export function ServiceDetailPage() {
  const { slug = "" } = useParams();

  return <Navigate to={`/servicios#${encodeURIComponent(slug)}`} replace />;
}
