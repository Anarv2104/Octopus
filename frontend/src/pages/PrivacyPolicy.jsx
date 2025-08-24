// src/pages/PrivacyPolicy.jsx
export default function PrivacyPolicy() {
  return (
    <main className="bg-[#0d0d0d] text-white">
      <div className="max-w-4xl mx-auto px-6 py-16">
        <h1 className="text-3xl md:text-4xl font-semibold">Privacy Policy</h1>
        <p className="text-white/70 mt-3">
          Last updated: {new Date().toLocaleDateString()}
        </p>

        <section className="mt-8 space-y-6 text-white/80 leading-relaxed">
          <p>
            We collect the minimum data required to operate Octopus (account email and
            product usage events). We do not sell your data. Third-party processors include
            Firebase (auth) and analytics.
          </p>
          <p>
            You can request deletion of your account and associated personal data at any time
            by contacting support@octopus.run.
          </p>
        </section>
      </div>
    </main>
  );
}