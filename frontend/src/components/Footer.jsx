// src/components/Footer.jsx
import { Link, useNavigate } from "react-router-dom";
import logo from "../assets/logo.png";

export default function Footer() {
  const nav = useNavigate();

  const goDocsSection = (id) => {
    nav(`/docs#${id}`);
    setTimeout(() => {
      const el = document.getElementById(id);
      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 0);
  };

  return (
    <footer className="border-t border-neutral-800 bg-[#0b0b0b] text-white">
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid md:grid-cols-4 gap-10">
          {/* Brand */}
          <div>
            <Link to="/" className="inline-flex items-center">
              <img src={logo} alt="Octopus logo" className="h-8 w-8 mr-2" />
              <span className="text-lg font-medium">Octopus</span>
            </Link>
            <p className="text-white/60 mt-3 max-w-sm">
              Orchestrate work across your tools with one instruction.
            </p>
          </div>

          {/* Resources */}
          <div>
            <h4 className="text-white font-medium mb-4">Resources</h4>
            <ul className="space-y-3">
              <li><Link to="/docs" className="text-white/70 hover:text-white transition">Documentation</Link></li>
              <li>
                <button onClick={() => goDocsSection("supported-devices")}
                        className="text-left text-white/70 hover:text-white transition">
                  Supported Devices
                </button>
              </li>
              <li>
                <button onClick={() => goDocsSection("system-requirements")}
                        className="text-left text-white/70 hover:text-white transition">
                  System Requirements
                </button>
              </li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="text-white font-medium mb-4">Company</h4>
            <ul className="space-y-3">
              {/* 👉 send users to the full pricing page */}
              <li><Link to="/pricing/details" className="text-white/70 hover:text-white transition">Pricing</Link></li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="text-white font-medium mb-4">Legal</h4>
            <ul className="space-y-3">
              <li><Link to="/privacy" className="text-white/70 hover:text-white transition">Privacy Policy</Link></li>
              <li><Link to="/terms" className="text-white/70 hover:text-white transition">Terms of Service</Link></li>
            </ul>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-neutral-800 text-sm text-white/50">
          © {new Date().getFullYear()} Octopus. All rights reserved.
        </div>
      </div>
    </footer>
  );
}