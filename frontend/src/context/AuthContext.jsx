/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useState } from "react";
import PropTypes from "prop-types";
import { auth } from "../lib/firebase";
import { onAuthStateChanged, getIdToken } from "firebase/auth";

const AuthCtx = createContext({ user: null, idToken: null, loading: true });

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [idToken, setIdToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        const t = await getIdToken(u, false);
        setIdToken(t);
      } else {
        setIdToken(null);
      }
      setLoading(false);
    });
    return () => unsub();
  }, []);

  return (
    <AuthCtx.Provider value={{ user, idToken, loading }}>
      {children}
    </AuthCtx.Provider>
  );
}

AuthProvider.propTypes = { children: PropTypes.node };

export function useAuth() {
  return useContext(AuthCtx);
}