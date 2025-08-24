export default function Privacy() {
  return (
    <main className="bg-[#0d0d0d] text-white">
      <div className="max-w-4xl mx-auto px-6 py-16">
        <h1 className="text-3xl md:text-4xl font-semibold">Privacy Policy</h1>
        <p className="text-white/70 mt-3">Last updated: Aug 2025</p>

        <section className="mt-10 space-y-6 text-white/80 leading-7">
          <p>
            We only collect the minimum data required to operate Octopus. Your
            authentication is handled by Firebase, and your ID token is used to
            authorize API requests to our backend.
          </p>
          <p>
            We do not sell your data. Aggregated analytics may be used to
            improve reliability and product experience.
          </p>
          <p>
            For deletion requests or questions, contact
            {" "}
            <a className="underline" href="mailto:support@octopus.run">support@octopus.run</a>.
          </p>
        </section>
      </div>
    </main>
  );
}