/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useState } from "react";
import PropTypes from "prop-types";
import { auth } from "../lib/firebase";
import {
  onAuthStateChanged,
  onIdTokenChanged,
  getIdToken,
  signOut,
} from "firebase/auth";

const AuthCtx = createContext({
  user: null,
  idToken: null,
  loading: true,
  logout: async () => {},
});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [idToken, setIdToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // Keep user in sync
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) setIdToken(await getIdToken(u, false));
      else setIdToken(null);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  // Keep idToken fresh (token rotates ~hourly)
  useEffect(() => {
    const unsub = onIdTokenChanged(auth, async (u) => {
      if (u) setIdToken(await getIdToken(u, false));
      else setIdToken(null);
    });
    return () => unsub();
  }, []);

  const logout = async () => {
    try {
      await signOut(auth);
      // local cleanup (defensive)
      setUser(null);
      setIdToken(null);
      localStorage.removeItem("idToken");
      sessionStorage.removeItem("idToken");
    } catch (e) {
      console.error("Logout failed:", e);
      // still clear locally to avoid a stuck UI
      setUser(null);
      setIdToken(null);
    }
  };

  return (
    <AuthCtx.Provider value={{ user, idToken, loading, logout }}>
      {children}
    </AuthCtx.Provider>
  );
}

AuthProvider.propTypes = { children: PropTypes.node };

export function useAuth() {
  return useContext(AuthCtx);
}