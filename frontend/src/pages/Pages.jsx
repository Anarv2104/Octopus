// src/pages/Pricing.jsx
export default function Pricing() {
  const tiers = [
    {
      name: "Starter",
      price: "$0",
      tagline: "Kick the tires",
      features: [
        "100 runs / month",
        "Community support",
        "Basic integrations",
      ],
      cta: "Get started",
      highlight: false,
    },
    {
      name: "Pro",
      price: "$29",
      tagline: "For solo operators",
      features: [
        "10k runs / month",
        "Priority support",
        "All integrations",
        "Custom webhooks",
      ],
      cta: "Start Pro",
      highlight: true,
    },
    {
      name: "Team",
      price: "$99",
      tagline: "For small teams",
      features: [
        "50k runs / month",
        "SAML SSO",
        "Audit logs",
        "Role-based access",
      ],
      cta: "Contact sales",
      highlight: false,
    },
  ];

  return (
    <main className="bg-[#0d0d0d] text-white">
      <div className="max-w-6xl mx-auto px-6 py-16">
        <header className="text-center mb-12">
          <h1 className="text-4xl font-semibold">Pricing</h1>
          <p className="text-white/70 mt-3">
            Flexible plans that scale with your team. No credit card required to try.
          </p>
        </header>

        <div className="grid md:grid-cols-3 gap-6">
          {tiers.map((t) => (
            <div
              key={t.name}
              className={[
                "rounded-2xl border p-6",
                t.highlight
                  ? "border-orange-700/60 bg-gradient-to-b from-orange-900/10 to-transparent shadow-[0_0_80px_-30px_rgba(234,88,12,.6)]"
                  : "border-neutral-800 bg-neutral-900/50",
              ].join(" ")}
            >
              <div className="flex items-baseline justify-between">
                <h2 className="text-xl font-medium">{t.name}</h2>
                <span className="text-white/60">{t.tagline}</span>
              </div>
              <div className="mt-4 text-4xl font-semibold">{t.price}
                <span className="text-base text-white/50 font-normal">/mo</span>
              </div>

              <ul className="mt-6 space-y-2 text-white/80">
                {t.features.map((f) => (
                  <li key={f} className="flex gap-2">
                    <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-white/40" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>

              <button className="mt-8 w-full rounded-lg border border-neutral-700 hover:border-neutral-500 py-2">
                {t.cta}
              </button>
            </div>
          ))}
        </div>

        <p className="text-center text-white/50 text-sm mt-10">
          All prices in USD. Taxes may apply. Usage beyond plan limits billed at metered rates.
        </p>
      </div>
    </main>
  );
}