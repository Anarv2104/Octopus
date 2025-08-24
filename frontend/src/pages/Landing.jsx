// src/pages/Landing.jsx
import { useEffect } from "react";

import HeroSection from "../components/HeroSection";
import FeatureSection from "../components/FeatureSection";
import Workflow from "../components/Workflow";
import Pricing from "../components/Pricing";
import Testimonials from "../components/Testimonials";

export default function Landing() {
  // Auto-scroll to a section when visiting /#features, /#pricing, etc.
  useEffect(() => {
    const id = window.location.hash?.slice(1);
    if (id) {
      const el = document.getElementById(id);
      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, []);

  return (
    <div className="max-w-7xl mx-auto pt-20 px-6">
      <HeroSection />
      <section id="features">
        <FeatureSection />
      </section>
      <section id="workflow">
        <Workflow />
      </section>
      <section id="pricing">
        <Pricing />
      </section>
      <section id="testimonials">
        <Testimonials />
      </section>
    </div>
  );
}