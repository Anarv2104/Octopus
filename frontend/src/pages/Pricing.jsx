// src/pages/Pricing.jsx
import PropTypes from "prop-types";

function PlanCard({ name, price, per, bullets, featured = false, badge }) {
  return (
    <div className={`rounded-2xl border ${featured ? "border-orange-600/70" : "border-neutral-800"} bg-neutral-900/60 p-6`}>
      <div className="flex items-baseline gap-3">
        <h3 className="text-2xl font-semibold">{name}</h3>
        {badge ? (
          <span className="text-xs px-2 py-1 rounded-full border border-orange-600/60 text-orange-400">
            {badge}
          </span>
        ) : null}
      </div>
      <div className="mt-4">
        <span className="text-4xl font-bold">${price}</span>
        <span className="text-white/60 ml-1">{per}</span>
      </div>
      <ul className="mt-6 space-y-3 text-white/80">
        {bullets.map((b, i) => (
          <li key={i} className="flex gap-2">
            <span>✅</span>
            <span>{b}</span>
          </li>
        ))}
      </ul>
      <button className={`mt-8 w-full rounded-lg py-2 ${featured ? "bg-gradient-to-r from-orange-500 to-orange-700" : "border border-neutral-700"}`}>
        Subscribe
      </button>
    </div>
  );
}

PlanCard.propTypes = {
  name: PropTypes.string.isRequired,
  price: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
  per: PropTypes.string.isRequired,
  bullets: PropTypes.arrayOf(PropTypes.string).isRequired,
  featured: PropTypes.bool,
  badge: PropTypes.string,
};

// ...your existing page component can keep using <PlanCard .../>
export default function Pricing() {
  const plans = [
    {
      name: "Free",
      price: 0,
      per: "/Month",
      bullets: [
        "Access to Public Agent Pods",
        "5 Agent Task Runs / day",
        "Basic Usage Analytics",
      ],
    },
    {
      name: "Pro",
      price: 10,
      per: "/Month",
      featured: true,
      badge: "Most Popular",
      bullets: [
        "Access to Public Agent Pods",
        "50 Agent Task Runs / day",
        "Cross-Pod Collaboration",
        "AI Memory Sharing",
        "Secure Private Mode",
        "Advanced Analytics Dashboard",
      ],
    },
    {
      name: "Enterprise",
      price: 200,
      per: "/Month",
      bullets: [
        "Unlimited Agent Pods",
        "Unlimited Task Execution",
        "Dedicated AI Network",
        "Multi-Agent Orchestration",
        "Reasoning Logs",
        "Priority Support",
      ],
    },
  ];

  return (
    <main className="bg-[#0d0d0d] text-white">
      <div className="max-w-7xl mx-auto px-6 py-16">
        <h1 className="text-4xl font-semibold text-center">Pricing</h1>
        <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {plans.map((p) => (
            <PlanCard key={p.name} {...p} />
          ))}
        </div>
      </div>
    </main>
  );
}