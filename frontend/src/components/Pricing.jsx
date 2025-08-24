// src/components/Pricing.jsx
import PropTypes from "prop-types";
import { CheckCircle2, XCircle } from "lucide-react";
import { pricingOptions } from "../constants";

const Pricing = ({ tight = false }) => {
  const containerMargin = tight ? "mt-6" : "mt-20";

  return (
    <div className={containerMargin}>
      <h2 className="text-3xl sm:text-5xl lg:text-6xl text-center my-8 tracking-wide">
        Pricing
      </h2>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 items-stretch">
        {pricingOptions.map((option, index) => (
          <div key={index} className="min-w-0">
            <div className="flex h-full flex-col rounded-2xl border border-neutral-800 bg-neutral-950/60 p-8">
              <p className="text-3xl mb-6">
                {option.title}
                {option.title === "Pro" && (
                  <span className="align-middle bg-gradient-to-r from-orange-500 to-red-400 text-transparent bg-clip-text text-base ml-2">
                    (Most Popular)
                  </span>
                )}
              </p>

              <p className="mb-6">
                <span className="text-5xl mr-2">{option.price}</span>
                <span className="text-neutral-400 tracking-tight">/Month</span>
              </p>

              <ul className="flex-1">
                {option.features.map((feature, i) => (
                  <li key={i} className="mt-4 flex items-center text-sm">
                    {feature.included ? (
                      <CheckCircle2 className="text-green-500 shrink-0" />
                    ) : (
                      <XCircle className="text-red-500 shrink-0" />
                    )}
                    <span
                      className={`ml-2 ${
                        !feature.included ? "text-neutral-500 line-through" : ""
                      }`}
                    >
                      {feature.name}
                    </span>
                  </li>
                ))}
              </ul>

              <a
                href="#"
                className="mt-8 inline-flex justify-center items-center text-center w-full h-12 px-5 tracking-tight text-lg hover:bg-orange-900 border border-orange-900 rounded-lg transition"
              >
                Subscribe
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// ✅ Add PropTypes validation
Pricing.propTypes = {
  tight: PropTypes.bool,
};

export default Pricing;