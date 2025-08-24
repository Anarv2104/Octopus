// src/components/ProtectedRoute.jsx
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function ProtectedRoute() {
  const { user, loading } = useAuth() || {};
  const loc = useLocation();

  if (loading) {
    return (
      <main className="min-h-screen bg-[#0d0d0d] text-white grid place-items-center">
        <div className="text-white/60">Loading…</div>
      </main>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: loc.pathname }} replace />;
  }

  return <Outlet />;
}