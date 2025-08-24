import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
} from "firebase/auth";
import { auth } from "../lib/firebase";

export default function Login() {
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [pwd, setPwd] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [flashMsg, setFlashMsg] = useState(null);

  // Pull flash from sessionStorage (survives navigation/refresh)
  useEffect(() => {
    const msg = sessionStorage.getItem("flash");
    if (msg) {
      setFlashMsg(msg);
      sessionStorage.removeItem("flash");
    }
  }, []);

  const onLogin = async (e) => {
    e.preventDefault();
    setErr("");
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, pwd);
      nav("/dashboard");
    } catch (e) {
      setErr(e.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  const google = async () => {
    setErr("");
    setLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      nav("/dashboard");
    } catch (e) {
      setErr(e.message || "Google sign-in failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#0b0b0b] text-white grid place-items-center relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-40 -left-40 h-80 w-80 rounded-full blur-3xl bg-orange-600/10" />
        <div className="absolute -bottom-40 -right-40 h-80 w-80 rounded-full blur-3xl bg-orange-500/10" />
      </div>

      <div className="relative w-full max-w-md rounded-3xl border border-white/10 bg-gradient-to-b from-[#121212] to-[#0b0b0b] p-8 shadow-[0_0_60px_rgba(255,90,0,0.15)]">
        <h1 className="text-2xl md:text-3xl font-semibold">Welcome Back to Octopus</h1>
        <p className="text-white/60 mt-1">Login to orchestrate without micro-managing.</p>

        {flashMsg && (
          <div className="mt-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-300 px-4 py-2 text-sm">
            {flashMsg}
          </div>
        )}

        <form onSubmit={onLogin} className="mt-6 space-y-4">
          <input
            type="email"
            placeholder="Email"
            className="w-full rounded-xl bg-black/40 border border-white/10 px-4 py-3 outline-none focus:border-orange-500/60"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
          />
          <input
            type="password"
            placeholder="Password"
            className="w-full rounded-xl bg-black/40 border border-white/10 px-4 py-3 outline-none focus:border-orange-500/60"
            value={pwd}
            onChange={(e) => setPwd(e.target.value)}
            required
            autoComplete="current-password"
          />

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-2xl py-3 font-semibold bg-gradient-to-r from-orange-500 to-orange-700 hover:from-orange-400 hover:to-orange-600 disabled:opacity-60"
          >
            {loading ? "Logging in…" : "Login"}
          </button>
        </form>

        <div className="my-5 flex items-center gap-3 text-white/40">
          <div className="h-px flex-1 bg-white/10" />
          <span className="text-xs">or</span>
          <div className="h-px flex-1 bg-white/10" />
        </div>

        <button
          onClick={google}
          disabled={loading}
          className="w-full rounded-2xl py-3 font-medium bg-white text-black hover:bg-neutral-100 disabled:opacity-60"
        >
          <span className="inline-flex items-center gap-2">
            <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="" className="h-5 w-5" />
            Continue with Google
          </span>
        </button>

        {err && <div className="mt-4 text-sm text-red-400">{err}</div>}

        <p className="mt-6 text-center text-white/60">
          Don’t have an account?{" "}
          <Link to="/signup" className="text-orange-400 hover:text-orange-300 font-medium">Sign up</Link>
        </p>
      </div>
    </main>
  );
}