import React from "react";
import ReactDOM from "react-dom/client";
import AuthPage from "./auth/AuthPage";
import ClerkRoot from "./ClerkRoot";
import "./styles.css";
import "./components/brand.css";
import "./auth.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ClerkRoot>
      <AuthPage />
    </ClerkRoot>
  </React.StrictMode>
);
