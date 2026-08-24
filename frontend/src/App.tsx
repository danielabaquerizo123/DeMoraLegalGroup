import { Route, Routes } from "react-router-dom";
import { ProtectedAdminRoute } from "./components/admin/ProtectedAdminRoute";
import { AppLayout } from "./components/layout/AppLayout";
import { AdminBlogPage } from "./pages/admin/AdminBlogPage";
import { AdminLoginPage } from "./pages/admin/AdminLoginPage";
import { BlogDetailPage } from "./pages/blog/BlogDetailPage";
import { BlogPage } from "./pages/blog/BlogPage";
import { ContactPage } from "./pages/contact/ContactPage";
import { HomePage } from "./pages/home/HomePage";
import { ProfessionalDetailPage } from "./pages/home/ProfessionalDetailPage";
import { NotFoundPage } from "./pages/NotFoundPage";
import { ServiceDetailPage } from "./pages/services/ServiceDetailPage";
import { ServicesPage } from "./pages/services/ServicesPage";

function App() {
  return (
    <Routes>
      <Route path="/admin/login" element={<AdminLoginPage />} />
      <Route
        path="/admin/blog"
        element={
          <ProtectedAdminRoute>
            {(user) => <AdminBlogPage user={user} />}
          </ProtectedAdminRoute>
        }
      />
      <Route element={<AppLayout />}>
        <Route index element={<HomePage />} />
        <Route path="profesionales/:slug" element={<ProfessionalDetailPage />} />
        <Route path="servicios" element={<ServicesPage />} />
        <Route path="servicios/:slug" element={<ServiceDetailPage />} />
        <Route path="blog" element={<BlogPage />} />
        <Route path="blog/:slug" element={<BlogDetailPage />} />
        <Route path="contacto" element={<ContactPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}

export default App;
