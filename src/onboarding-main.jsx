import React from "react";
import ReactDOM from "react-dom/client";
import OnboardingApp from "./onboarding/OnboardingApp";
import ClerkRoot from "./ClerkRoot";
import "./styles.css";
import "./components/brand.css";
import "./onboarding/onboarding.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ClerkRoot>
      <OnboardingApp />
    </ClerkRoot>
  </React.StrictMode>
);
