// src/pages/TermsOfService.jsx
export default function TermsOfService() {
  return (
    <main className="bg-[#0d0d0d] text-white">
      <div className="max-w-4xl mx-auto px-6 py-16">
        <h1 className="text-3xl md:text-4xl font-semibold">Terms of Service</h1>
        <p className="text-white/70 mt-3">Please read these terms carefully.</p>

        <section className="mt-8 space-y-6 text-white/80 leading-relaxed">
          <p>
            By using Octopus, you agree to follow all applicable laws and refrain from abusing
            the service or integrations. Octopus is provided “as is” without warranties; liability
            is limited to the amount you paid in the last 12 months.
          </p>
          <p>
            We may update these terms from time to time. Continued use after changes constitutes
            acceptance of the updated terms.
          </p>
        </section>
      </div>
    </main>
  );
}