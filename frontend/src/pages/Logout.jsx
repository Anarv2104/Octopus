// src/pages/Logout.jsx
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { signOut } from "firebase/auth";
import { auth } from "../lib/firebase";

export default function Logout() {
  const nav = useNavigate();

  useEffect(() => {
    (async () => {
      try {
        await signOut(auth);
        sessionStorage.setItem("flash", "Signed out successfully.");
      } catch {
        sessionStorage.setItem("flash", "You were signed out.");
      } finally {
        nav("/login", { replace: true });
      }
    })();
  }, [nav]);

  return null; // no UI
}