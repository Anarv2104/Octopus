import Navbar from "./components/Navbar";
import HeroSection from "./components/HeroSection";
import FeatureSection from "./components/FeatureSection";
import Workflow from "./components/Workflow";
import Footer from "./components/Footer";
import Pricing from "./components/Pricing";
import Testimonials from "./components/Testimonials";

const App = () => {
  return (
    <>
      <>
  <Navbar />
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
    <Footer />
  </div>
</>
    </>
  );
};

export default App;
