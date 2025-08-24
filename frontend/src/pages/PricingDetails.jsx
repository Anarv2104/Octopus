// src/pages/PricingDetails.jsx
import { Link } from "react-router-dom";
import PropTypes from "prop-types";
import Pricing from "../components/Pricing"; // your 3-card component

function Pill({ children }) {
  return (
    <span className="inline-flex items-center rounded-full border border-neutral-800 bg-neutral-900/60 px-3 py-1 text-xs text-white/70">
      {children}
    </span>
  );
}
Pill.propTypes = { children: PropTypes.node.isRequired };

function CheckItem({ children }) {
  return (
    <li className="flex items-start gap-3">
      <span className="mt-1 h-4 w-4 rounded-full bg-emerald-500/90" />
      <span className="text-white/80">{children}</span>
    </li>
  );
}
CheckItem.propTypes = { children: PropTypes.node.isRequired };

function XItem({ children }) {
  return (
    <li className="flex items-start gap-3 opacity-60">
      <span className="mt-1 h-4 w-4 rounded-full bg-neutral-700" />
      <span className="text-white/60 line-through">{children}</span>
    </li>
  );
}
XItem.propTypes = { children: PropTypes.node.isRequired };

export default function PricingDetails() {
  return (
    <main className="min-h-screen bg-[#0d0d0d] text-white">
      {/* Hero (refined + tighter) */}
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(1200px_600px_at_30%_-10%,rgba(255,115,0,0.12),transparent_60%)]" />
        <div className="mx-auto max-w-6xl px-6 pt-12 md:pt-16 pb-4">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h1 className="text-[44px] leading-[1.1] md:text-6xl font-semibold">Pricing</h1>
              <p className="mt-3 max-w-2xl text-white/70">
                Start free. Scale to orchestrate complex, multi-tool workflows with priority
                execution and advanced analytics.
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <Pill>No credit card required</Pill>
                <Pill>Cancel anytime</Pill>
                <Pill>Team-friendly</Pill>
              </div>
            </div>

            {/* Quick anchors */}
            <div className="flex flex-wrap gap-2 text-sm">
              <a href="#plans" className="rounded-md border border-neutral-800 bg-neutral-900/60 px-3 py-1.5 text-white/80 hover:bg-neutral-900">
                Plans
              </a>
              <a href="#usage" className="rounded-md border border-neutral-800 bg-neutral-900/60 px-3 py-1.5 text-white/80 hover:bg-neutral-900">
                Usage pricing
              </a>
              <a href="#compare" className="rounded-md border border-neutral-800 bg-neutral-900/60 px-3 py-1.5 text-white/80 hover:bg-neutral-900">
                Feature comparison
              </a>
              <a href="#faq" className="rounded-md border border-neutral-800 bg-neutral-900/60 px-3 py-1.5 text-white/80 hover:bg-neutral-900">
                FAQ
              </a>
            </div>
          </div>
        </div>
        <div className="mx-auto max-w-6xl px-6">
          <div className="h-px w-full bg-neutral-900/80" />
        </div>
      </section>

      {/* Plans (your component, closer to hero) */}
      <section id="plans" className="scroll-mt-24">
        <div className="mx-auto max-w-6xl px-6 pt-4 pb-8 md:pt-6 md:pb-10">
          <Pricing tight /> {/* <- tighter spacing */}
        </div>
      </section>

      {/* Usage pricing (unchanged) */}
      <section id="usage" className="scroll-mt-24 border-t border-neutral-900 bg-neutral-950/40">
        <div className="mx-auto max-w-6xl px-6 py-12">
          <h2 className="text-2xl font-medium">Usage-based Pricing</h2>
          <p className="mt-2 max-w-3xl text-white/70">
            Total cost per run = <span className="text-white">Execution tokens</span> +{" "}
            <span className="text-white">Request fee</span>. Request fee varies by search/context size
            for reasoning-heavy tools.
          </p>

          <div className="mt-6 grid gap-6 md:grid-cols-2">
            <div className="rounded-2xl border border-neutral-800 bg-neutral-900/50 p-5">
              <div className="mb-3 text-sm font-medium text-white/80">Execution Tokens</div>
              <table className="w-full text-left text-sm text-white/80">
                <thead className="text-white/60">
                  <tr>
                    <th className="py-2">Model</th>
                    <th className="py-2">Input ($/1M)</th>
                    <th className="py-2">Output ($/1M)</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    ["Octopus", "$1", "$1"],
                    ["Octopus Pro", "$3", "$15"],
                    ["Octopus Reasoning", "$5", "$25"],
                  ].map(([m, i, o]) => (
                    <tr key={m} className="border-t border-neutral-800">
                      <td className="py-2">{m}</td>
                      <td className="py-2">{i}</td>
                      <td className="py-2">{o}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="rounded-2xl border border-neutral-800 bg-neutral-900/50 p-5">
              <div className="mb-3 text-sm font-medium text-white/80">Typical Request Fees</div>
              <table className="w-full text-left text-sm text-white/80">
                <thead className="text-white/60">
                  <tr>
                    <th className="py-2">Context Size</th>
                    <th className="py-2">Fee</th>
                    <th className="py-2">Use Case</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    ["Low", "$0.003", "Short tasks, no web search"],
                    ["Medium", "$0.01", "Standard, 1-2 tools"],
                    ["High", "$0.05+", "Deep search / long context"],
                  ].map(([c, fee, note]) => (
                    <tr key={c} className="border-t border-neutral-800">
                      <td className="py-2">{c}</td>
                      <td className="py-2">{fee}</td>
                      <td className="py-2">{note}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Examples */}
          <div className="mt-8 grid gap-6 md:grid-cols-2">
            <div className="rounded-2xl border border-neutral-800 bg-neutral-900/40 p-5">
              <div className="mb-2 text-sm font-medium text-white/80">Cost Example</div>
              <div className="text-white/80">Web summary + Notion page</div>
              <ul className="mt-3 space-y-2 text-sm text-white/70">
                <li>• Input tokens: 500k → <span className="text-white">$0.0005</span></li>
                <li>• Output tokens: 200k → <span className="text-white">$0.0002</span></li>
                <li>• Request fee: <span className="text-white">$0.005</span></li>
              </ul>
              <div className="mt-3 font-medium">Total ≈ $0.0057</div>
            </div>

            <div className="rounded-2xl border border-neutral-800 bg-neutral-900/40 p-5">
              <div className="mb-2 text-sm font-medium text-white/80">Cost Example</div>
              <div className="text-white/80">Deep research + Slack brief</div>
              <ul className="mt-3 space-y-2 text-sm text-white/70">
                <li>• Heavy reasoning & search queries</li>
                <li>• Typical total: <span className="text-white">$0.05 – $0.15</span></li>
              </ul>
              <div className="mt-3 font-medium">Total varies by depth</div>
            </div>
          </div>
        </div>
      </section>

      {/* Comparison */}
      <section id="compare" className="scroll-mt-24">
        <div className="mx-auto max-w-6xl px-6 py-12">
          <h2 className="text-2xl font-medium">Compare Plans</h2>
          <div className="mt-6 overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="text-white/60">
                <tr>
                  <th className="py-3">Feature</th>
                  <th className="py-3">Free</th>
                  <th className="py-3">Pro</th>
                  <th className="py-3">Enterprise</th>
                </tr>
              </thead>
              <tbody className="text-white/80">
                {[
                  ["Daily task runs", "5", "50", "Unlimited"],
                  ["Cross-Pod Collaboration", "—", "✓", "✓"],
                  ["AI Memory Sharing", "—", "✓", "✓"],
                  ["Secure Private Mode", "—", "✓", "✓"],
                  ["Analytics Dashboard", "Basic", "Advanced", "Advanced + Exports"],
                  ["Priority Support", "—", "—", "✓"],
                  ["Custom Pod Integration", "—", "—", "✓"],
                ].map(([f, a, b, c]) => (
                  <tr key={f} className="border-t border-neutral-900">
                    <td className="py-3">{f}</td>
                    <td className="py-3">{a}</td>
                    <td className="py-3">{b}</td>
                    <td className="py-3">{c}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="scroll-mt-24 border-t border-neutral-900 bg-neutral-950/40">
        <div className="mx-auto max-w-6xl px-6 py-12">
          <h2 className="text-2xl font-medium">Frequently Asked Questions</h2>
          <div className="mt-6 grid gap-6 md:grid-cols-2">
            {[
              [
                "How is usage billed?",
                "Runs consume execution tokens plus a small request fee depending on context size and search depth.",
              ],
              [
                "Can I switch plans anytime?",
                "Yes. Upgrades take effect immediately and are prorated; downgrades apply on your next cycle.",
              ],
              [
                "What happens after the daily run limit on Free?",
                "You’ll see a soft cap message; upgrade to Pro for higher limits.",
              ],
              [
                "Do you offer discounts?",
                "We offer annual and startup discounts. Contact sales for details.",
              ],
            ].map(([q, a]) => (
              <div key={q} className="rounded-2xl border border-neutral-800 bg-neutral-900/50 p-5">
                <div className="font-medium">{q}</div>
                <p className="mt-2 text-white/70">{a}</p>
              </div>
            ))}
          </div>

          <div className="mt-10 flex flex-wrap items-center gap-3">
            <Link
              to="/signup"
              className="rounded-xl bg-gradient-to-r from-orange-500 to-orange-800 px-4 py-2.5 text-sm font-medium hover:opacity-95"
            >
              Start Free
            </Link>
            <a
              href="mailto:sales@octopus.run?subject=Enterprise%20inquiry"
              className="rounded-xl border border-neutral-700 px-4 py-2.5 text-sm font-medium hover:bg-neutral-900"
            >
              Contact Sales
            </a>
          </div>
        </div>
      </section>

      <footer className="h-12" />
    </main>
  );
}