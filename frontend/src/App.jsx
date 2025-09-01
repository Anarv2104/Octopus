// src/App.jsx
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { useEffect } from "react";

// Layout
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";

// Auth guards
import ProtectedRoute from "./components/ProtectedRoute";
import RedirectIfAuthed from "./components/RedirectIfAuthed";

// Pages
import Landing from "./pages/Landing";
import Docs from "./pages/Docs";
import Pricing from "./pages/Pricing";
import PricingDetails from "./pages/PricingDetails";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsOfService from "./pages/TermsOfService";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Dashboard from "./pages/Dashboard";

// 🔥 NEW page
import History from "./pages/History";

// -------- Small helpers --------

// Scroll to top on route change (when there is no hash)
function ScrollToTop() {
  const { pathname, hash } = useLocation();
  useEffect(() => {
    if (!hash) window.scrollTo(0, 0);
  }, [pathname, hash]);
  return null;
}

// Simple 404
function NotFound() {
  return (
    <main className="min-h-[60vh] bg-[#0d0d0d] text-white grid place-items-center">
      <div className="opacity-70">404 — Page not found</div>
    </main>
  );
}

// -------- App --------

export default function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <div className="min-h-screen flex flex-col bg-[#0d0d0d] text-white">
        <Navbar />

        <main className="flex-1">
          <Routes>
            {/* Public */}
            <Route path="/" element={<Landing />} />
            <Route path="/docs" element={<Docs />} />
            <Route path="/pricing" element={<Pricing />} />
            <Route path="/pricing/details" element={<PricingDetails />} />
            <Route path="/privacy" element={<PrivacyPolicy />} />
            <Route path="/terms" element={<TermsOfService />} />

            {/* If authed, skip auth pages */}
            <Route element={<RedirectIfAuthed />}>
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
            </Route>

            {/* Protected app */}
            <Route element={<ProtectedRoute />}>
              <Route path="/dashboard" element={<Dashboard />} />
              {/* 🔥 History route */}
              <Route path="/history" element={<History />} />
            </Route>

            {/* Aliases / redirects */}
            <Route path="/resources/getting-started" element={<Navigate to="/login" replace />} />
            <Route path="/resources/documentation" element={<Navigate to="/docs" replace />} />
            <Route path="/resources/community" element={<Navigate to="/#testimonials" replace />} />
            <Route path="/platform/features" element={<Navigate to="/#features" replace />} />

            {/* 404 */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </main>

        <Footer />
      </div>
    </BrowserRouter>
  );
}