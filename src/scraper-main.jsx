import React from "react";
import ReactDOM from "react-dom/client";
import ScraperApp from "./scraper/ScraperApp";
import ClerkRoot from "./ClerkRoot";
import "./styles.css";
import "./scraper.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ClerkRoot>
      <ScraperApp />
    </ClerkRoot>
  </React.StrictMode>
);
