export default function Terms() {
  return (
    <main className="bg-[#0d0d0d] text-white">
      <div className="max-w-4xl mx-auto px-6 py-16">
        <h1 className="text-3xl md:text-4xl font-semibold">Terms of Service</h1>
        <p className="text-white/70 mt-3">Last updated: Aug 2025</p>

        <ol className="mt-10 space-y-6 text-white/80 leading-7 list-decimal list-inside">
          <li>
            You are responsible for actions taken in your account and for
            complying with all applicable laws when using integrations.
          </li>
          <li>
            The service is provided “as is” without warranties. We limit
            liability to the amount you paid in the last 3 months.
          </li>
          <li>
            We may update these terms; continued use constitutes acceptance.
          </li>
        </ol>
      </div>
    </main>
  );
}