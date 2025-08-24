// src/components/docs/Sidebar.jsx
import PropTypes from "prop-types";

const groups = [
  {
    label: "Getting Started",
    items: [
      { href: "#overview", text: "Overview" },
      { href: "#quickstart", text: "Quickstart" },
    ],
  },
  {
    label: "Guides",
    items: [
      { href: "#prompt-guide", text: "Prompt Guide" },
      { href: "#structured-outputs", text: "Structured Outputs" },
    ],
  },
  {
    label: "Platform",
    items: [
      { href: "#supported-devices", text: "Supported Devices" },
      { href: "#system-requirements", text: "System Requirements" },
    ],
  },
];

export default function Sidebar({ onNavigate }) {
  return (
    <aside className="hidden lg:block w-64 shrink-0">
      <nav className="sticky top-20 space-y-8">
        {groups.map((g) => (
          <div key={g.label}>
            <div className="text-xs uppercase tracking-wider text-white/40 mb-3">
              {g.label}
            </div>
            <ul className="space-y-1">
              {g.items.map((it) => (
                <li key={it.href}>
                  <a
                    href={it.href}
                    onClick={onNavigate}
                    className="block px-2 py-1 rounded-md text-white/70 hover:text-white hover:bg-white/5"
                  >
                    {it.text}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>
    </aside>
  );
}

Sidebar.propTypes = {
  onNavigate: PropTypes.func,
};