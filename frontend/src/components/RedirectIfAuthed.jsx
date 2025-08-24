// src/components/RedirectIfAuthed.jsx
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function RedirectIfAuthed() {
  const { user, loading } = useAuth() || {};

  if (loading) return null; // don't flicker

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }
  return <Outlet />;
}