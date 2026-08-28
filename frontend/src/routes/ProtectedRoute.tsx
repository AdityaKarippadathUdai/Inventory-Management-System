import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@/auth/AuthContext";

export function ProtectedRoute() {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();
  if (loading) return <div className="min-h-screen grid place-items-center text-muted-foreground">Loading your workspace...</div>;
  return isAuthenticated ? <Outlet /> : <Navigate to={`/login?redirect=${encodeURIComponent(location.pathname)}`} replace />;
}
