import React from "react";
import ReactDOM from "react-dom/client";
import DashboardApp from "./dashboard/DashboardApp";
import ClerkRoot from "./ClerkRoot";
import "./styles.css";
import "./components/brand.css";
import "./dashboard/dashboard.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ClerkRoot>
      <DashboardApp />
    </ClerkRoot>
  </React.StrictMode>
);
