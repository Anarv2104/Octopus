import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  createUserWithEmailAndPassword,
  updateProfile,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
} from "firebase/auth";
import { auth } from "../lib/firebase";

export default function Signup() {
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [pwd, setPwd] = useState("");
  const [workspace, setWorkspace] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const onSignup = async (e) => {
    e.preventDefault();
    setErr("");
    setLoading(true);
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, pwd);

      // Set display name while still signed in.
      if (username) {
        await updateProfile(cred.user, { displayName: username });
      }

      // Flash message that survives navigation/refresh.
      sessionStorage.setItem("flash", "Account created. Please log in.");

      // Enforce “login after signup”.
      await signOut(auth);

      // Go to login (no fragile location state).
      nav("/login", { replace: true });
    } catch (e) {
      setErr(e.message || "Signup failed");
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
        <div className="absolute -top-40 -left-32 h-80 w-80 rounded-full blur-3xl bg-orange-600/10" />
        <div className="absolute -bottom-40 -right-40 h-80 w-80 rounded-full blur-3xl bg-orange-500/10" />
      </div>

      <div className="relative w-full max-w-md rounded-3xl border border-white/10 bg-gradient-to-b from-[#121212] to-[#0b0b0b] p-8 shadow-[0_0_60px_rgba(255,90,0,0.15)]">
        {/* loading overlay */}
        {loading && (
          <div className="absolute inset-0 rounded-3xl bg-black/40 backdrop-blur-sm flex items-center justify-center z-10">
            <div className="text-white/80 text-sm px-4 py-2 rounded-lg border border-white/10 bg-black/30">
              Finishing setup…
            </div>
          </div>
        )}

        <h1 className="text-3xl md:text-4xl font-semibold text-center mb-6">Sign Up</h1>

        <form onSubmit={onSignup} className="space-y-4">
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
            type="text"
            placeholder="Username"
            className="w-full rounded-xl bg-black/40 border border-white/10 px-4 py-3 outline-none focus:border-orange-500/60"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
          <input
            type="password"
            placeholder="Password"
            className="w-full rounded-xl bg-black/40 border border-white/10 px-4 py-3 outline-none focus:border-orange-500/60"
            value={pwd}
            onChange={(e) => setPwd(e.target.value)}
            required
            autoComplete="new-password"
          />
          <input
            type="text"
            placeholder="Workspace name (optional)"
            className="w-full rounded-xl bg-black/40 border border-white/10 px-4 py-3 outline-none focus:border-orange-500/60"
            value={workspace}
            onChange={(e) => setWorkspace(e.target.value)}
          />

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-2xl py-3 font-semibold bg-gradient-to-r from-orange-500 to-orange-700 hover:from-orange-400 hover:to-orange-600 disabled:opacity-60"
          >
            {loading ? "Creating account…" : "Sign Up"}
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
          Already have an account?{" "}
          <Link to="/login" className="text-orange-400 hover:text-orange-300 font-medium">Sign in</Link>
        </p>
      </div>
    </main>
  );
}