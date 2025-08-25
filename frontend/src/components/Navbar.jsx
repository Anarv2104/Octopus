import { Menu, X } from "lucide-react";
import { useState } from "react";
import logo from "../assets/logo.png";
import { navItems } from "../constants";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const Navbar = () => {
  const { user, logout } = useAuth(); // <- needs logout() in context
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const nav = useNavigate();
  const loc = useLocation();

  const isDashboard = loc.pathname === "/dashboard";
  const showDashboardCta = !!user && !isDashboard;

  const toggleNavbar = () => setMobileDrawerOpen((v) => !v);

  const gotoSection = (id) => {
    if (loc.pathname === "/") {
      const el = document.getElementById(id);
      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    } else {
      nav(`/#${id}`);
      setTimeout(() => {
        const el = document.getElementById(id);
        if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 0);
    }
    if (mobileDrawerOpen) setMobileDrawerOpen(false);
  };

  const handleLogout = async () => {
    try {
      if (typeof logout === "function") {
        await logout();            // from AuthContext (recommended)
      } else {
        // fallback: clear token if you're storing it manually
        localStorage.removeItem("idToken");
      }
      nav("/login");
    } catch (err) {
      console.error("Logout error:", err);
      nav("/login");
    }
  };

  return (
    <nav className="sticky top-0 z-50 py-3 backdrop-blur-lg border-b border-neutral-700/80">
      <div className="container px-4 mx-auto relative lg:text-sm">
        <div className="flex justify-between items-center">
          <Link to="/" className="flex items-center flex-shrink-0">
            <img className="h-10 w-10 mr-2" src={logo} alt="Logo" />
            <span className="text-xl tracking-tight">Octopus</span>
          </Link>

          <ul className="hidden lg:flex ml-14 space-x-12">
            {navItems.map((item) => (
              <li key={item.label}>
                <button
                  onClick={() => gotoSection(item.href.replace("#", ""))}
                  className="text-white/80 hover:text-white transition"
                >
                  {item.label}
                </button>
              </li>
            ))}
            <li>
              <Link
                to="/docs"
                className="text-white/80 hover:text-white transition"
                aria-current={loc.pathname === "/docs" ? "page" : undefined}
              >
                Documentation
              </Link>
            </li>
          </ul>

          {/* Desktop CTAs */}
          <div className="hidden lg:flex justify-center space-x-12 items-center">
            {showDashboardCta && (
              <Link to="/dashboard" className="py-2 px-3 border rounded-md">
                Dashboard
              </Link>
            )}

            {user ? (
              <button
                onClick={handleLogout}
                className="bg-gradient-to-r from-orange-500 to-orange-800 py-2 px-3 rounded-md"
              >
                Logout
              </button>
            ) : (
              <>
                <Link to="/login" className="py-2 px-3 border rounded-md">
                  Sign In
                </Link>
                <Link
                  to="/signup"
                  className="bg-gradient-to-r from-orange-500 to-orange-800 py-2 px-3 rounded-md"
                >
                  Create an account
                </Link>
              </>
            )}
          </div>

          {/* Mobile toggle */}
          <div className="lg:hidden md:flex flex-col justify-end">
            <button onClick={toggleNavbar} aria-label="Toggle navigation">
              {mobileDrawerOpen ? <X /> : <Menu />}
            </button>
          </div>
        </div>

        {/* Mobile drawer */}
        {mobileDrawerOpen && (
          <div className="fixed right-0 z-20 bg-neutral-900 w-full p-12 flex flex-col justify-center items-center lg:hidden">
            <ul>
              {navItems.map((item) => (
                <li key={item.label} className="py-4">
                  <button
                    onClick={() => gotoSection(item.href.replace("#", ""))}
                    className="text-white/80 hover:text-white transition"
                  >
                    {item.label}
                  </button>
                </li>
              ))}
              <li className="py-4">
                <Link
                  to="/docs"
                  onClick={() => setMobileDrawerOpen(false)}
                  className="text-white/80 hover:text-white transition"
                  aria-current={loc.pathname === "/docs" ? "page" : undefined}
                >
                  Documentation
                </Link>
              </li>
            </ul>

            <div className="flex space-x-6 mt-6">
              {showDashboardCta && (
                <Link
                  to="/dashboard"
                  onClick={() => setMobileDrawerOpen(false)}
                  className="py-2 px-3 border rounded-md"
                >
                  Dashboard
                </Link>
              )}

              {user ? (
                <button
                  onClick={() => {
                    setMobileDrawerOpen(false);
                    handleLogout();
                  }}
                  className="py-2 px-3 rounded-md bg-gradient-to-r from-orange-500 to-orange-800"
                >
                  Logout
                </button>
              ) : (
                <>
                  <Link
                    to="/login"
                    onClick={() => setMobileDrawerOpen(false)}
                    className="py-2 px-3 border rounded-md"
                  >
                    Sign In
                  </Link>
                  <Link
                    to="/signup"
                    onClick={() => setMobileDrawerOpen(false)}
                    className="py-2 px-3 rounded-md bg-gradient-to-r from-orange-500 to-orange-800"
                  >
                    Create an account
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;