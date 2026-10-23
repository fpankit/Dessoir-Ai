import { useEffect, useMemo, useState } from "react";
import {
  ClerkDegraded,
  ClerkFailed,
  ClerkLoaded,
  ClerkLoading,
  SignIn,
  SignUp,
  useUser
} from "@clerk/react";
import { Check, ShieldCheck } from "lucide-react";
import calendlyLogo from "../assets/logos/calendly.svg";
import hubspotLogo from "../assets/logos/hubspot.svg";
import intercomLogo from "../assets/logos/intercom.svg";
import salesforceLogo from "../assets/logos/salesforce.svg";
import shopifyLogo from "../assets/logos/shopify.svg";
import slackLogo from "../assets/logos/slack.svg";
import stripeLogo from "../assets/logos/stripe.svg";
import zendeskLogo from "../assets/logos/zendesk.svg";
import { BrandLockup, FlowerMark } from "../components/Brand";

const integrations = [
  { label: "Salesforce", logo: salesforceLogo },
  { label: "HubSpot", logo: hubspotLogo },
  { label: "Zendesk", logo: zendeskLogo },
  { label: "Intercom", logo: intercomLogo },
  { label: "Slack", logo: slackLogo },
  { label: "Shopify", logo: shopifyLogo },
  { label: "Stripe", logo: stripeLogo },
  { label: "Calendly", logo: calendlyLogo }
];

const clerkAppearance = {
  variables: {
    colorPrimary: "#d9543a",
    colorText: "#1c1917",
    colorTextSecondary: "#78716c",
    colorBackground: "#ffffff",
    colorInputBackground: "#ffffff",
    colorInputText: "#1c1917",
    colorNeutral: "#1c1917",
    borderRadius: "7px",
    fontFamily: "Geist, Inter, ui-sans-serif, system-ui, sans-serif",
    fontSize: "14px"
  },
  layout: {
    socialButtonsPlacement: "bottom",
    socialButtonsVariant: "iconButton"
  },
  elements: {
    card: {
      boxShadow: "none",
      border: "0",
      padding: "0",
      background: "transparent",
      gap: "0"
    },
    header: { display: "none" },
    footer: { display: "none" },
    main: { gap: "16px" },
    socialButtons: { gap: "8px" },
    socialButtonsIconButton: {
      borderRadius: "7px",
      height: "42px",
      color: "#1c1917"
    },
    formFieldLabel: {
      color: "#57534e",
      fontSize: "12.5px",
      fontWeight: "500"
    },
    formButtonPrimary: {
      backgroundColor: "#d9543a",
      borderRadius: "7px",
      height: "42px",
      fontSize: "13.5px",
      fontWeight: "600",
      boxShadow: "inset 0 1px 0 rgba(255,255,255,.18)"
    },
    formFieldInput: {
      borderColor: "#e7dfd8",
      borderRadius: "7px",
      height: "42px"
    },
    dividerLine: { backgroundColor: "#eadfd7" },
    dividerText: { color: "#a8a29e", fontSize: "11.5px" }
  }
};

function AuthLoading({ slow }) {
  return (
    <div className="auth-fallback">
      <div className="auth-skeleton" aria-hidden="true">
        <div className="auth-skeleton-field-group">
          <span className="auth-skeleton-block auth-skeleton-label" />
          <span className="auth-skeleton-block auth-skeleton-field" />
        </div>
        <span className="auth-skeleton-block auth-skeleton-button" />
        <span className="auth-skeleton-block auth-skeleton-divider" />
        <div className="auth-skeleton-socials">
          <span className="auth-skeleton-block" />
          <span className="auth-skeleton-block" />
          <span className="auth-skeleton-block" />
        </div>
      </div>
      {slow ? (
        <p className="auth-load-notice" role="status">
          Secure sign-in is taking longer than usual. Check your connection, then{" "}
          <button type="button" onClick={() => window.location.reload()}>
            retry
          </button>
          .
        </p>
      ) : null}
    </div>
  );
}

function AuthLoadError() {
  return (
    <div className="auth-fallback auth-load-error" role="alert">
      <strong>Secure sign-in couldn&apos;t load.</strong>
      <p>Check your connection or disable any content blockers, then try again.</p>
      <button type="button" onClick={() => window.location.reload()}>
        Retry sign-in
      </button>
    </div>
  );
}

export default function AuthPage() {
  const params = useMemo(() => new URLSearchParams(window.location.search), []);
  const isSignIn = params.get("mode") === "signin";
  const website = params.get("website") || "";
  const websiteParam = website ? `&website=${encodeURIComponent(website)}` : "";
  const dashboardUrl = `/dashboard.html${website ? `?website=${encodeURIComponent(website)}` : ""}`;
  const switchHref = `/auth.html?mode=${isSignIn ? "signup" : "signin"}${websiteParam}`;
  const { isLoaded, isSignedIn } = useUser();
  const [slowLoad, setSlowLoad] = useState(false);

  useEffect(() => {
    document.title = `${isSignIn ? "Sign in" : "Create your account"} | Dessoir Ai`;
  }, [isSignIn]);

  useEffect(() => {
    if (isLoaded) {
      setSlowLoad(false);
      return undefined;
    }
    const timer = window.setTimeout(() => setSlowLoad(true), 7000);
    return () => window.clearTimeout(timer);
  }, [isLoaded]);

  useEffect(() => {
    if (isLoaded && isSignedIn) {
      window.location.href = dashboardUrl;
    }
  }, [isLoaded, isSignedIn, dashboardUrl]);

  const authForm = isSignIn ? (
    <SignIn
      routing="hash"
      appearance={clerkAppearance}
      fallbackRedirectUrl={dashboardUrl}
      signUpUrl={`/auth.html?mode=signup${websiteParam}`}
    />
  ) : (
    <SignUp
      routing="hash"
      appearance={clerkAppearance}
      fallbackRedirectUrl={dashboardUrl}
      signInUrl={`/auth.html?mode=signin${websiteParam}`}
    />
  );

  return (
    <div className="auth-screen">
      <main className="auth-panel">
        <header className="auth-top">
          <p className="auth-switch">
            <span className="auth-switch-copy">
              {isSignIn ? "Don't have an account?" : "Already have an account?"}
            </span>{" "}
            <a href={switchHref}>{isSignIn ? "Sign up here" : "Sign in here"}</a>
          </p>
        </header>

        <div className="auth-content">
          <BrandLockup className="auth-brand-lockup" />

          <div className="auth-intro">
            <h1 className="auth-title">
              {isSignIn ? "Sign in to your account" : "Create your account"}
            </h1>
            <p className="auth-subtitle">
              {isSignIn
                ? "Sign in to pick up your agent, knowledge base, and conversations."
                : "Scan your website, shape your agent, and try it with 5 free credits."}
            </p>
          </div>

          <div className="auth-clerk">
            <ClerkLoading>
              <AuthLoading slow={slowLoad} />
            </ClerkLoading>
            <ClerkFailed>
              <AuthLoadError />
            </ClerkFailed>
            <ClerkLoaded>{authForm}</ClerkLoaded>
            <ClerkDegraded>{authForm}</ClerkDegraded>
          </div>

          <div className="auth-benefits">
            {isSignIn ? (
              <>
                <span>
                  <ShieldCheck size={12} strokeWidth={2.2} aria-hidden="true" />
                  Secure sign-in
                </span>
                <span>
                  <Check size={12} strokeWidth={2.6} aria-hidden="true" />
                  Your data stays private
                </span>
              </>
            ) : (
              <>
                <span>
                  <Check size={12} strokeWidth={2.6} aria-hidden="true" />
                  5 free demo credits
                </span>
                <span>
                  <ShieldCheck size={12} strokeWidth={2.2} aria-hidden="true" />
                  Knowledge base from your site
                </span>
                <span>
                  <Check size={12} strokeWidth={2.6} aria-hidden="true" />
                  Cancel anytime
                </span>
              </>
            )}
          </div>
        </div>

        <footer className="auth-foot">
          <span>© 2026 Dessoir Ai.</span>
          <span className="auth-foot-links">
            <a href="/dashboard.html">Workspace</a>
            <span aria-hidden="true">·</span>
            <a href="/#top">Privacy</a>
            <span aria-hidden="true">·</span>
            <a href="/#top">Terms</a>
          </span>
        </footer>
      </main>

      <aside className="auth-aside" aria-label="Customer story and integrations">
        <span className="auth-aside-glow auth-aside-glow-a" aria-hidden="true" />
        <span className="auth-aside-glow auth-aside-glow-b" aria-hidden="true" />

        <div className="auth-aside-inner">
          <figure className="auth-quote-card">
            <span className="auth-quote-mark" aria-hidden="true">
              “
            </span>
            <blockquote>
              Dessoir Ai is a strong signal of how customer support will evolve. It
              is an early adopter of the agentic approach, which will become
              increasingly effective, trusted, and prominent.
            </blockquote>
            <figcaption>
              <span className="auth-quote-avatar" aria-hidden="true">
                A
              </span>
              <span className="auth-quote-author">
                <strong>Ankit</strong>
                <small>Founder and Builder, Dessoir Ai</small>
              </span>
            </figcaption>
          </figure>

          <div className="auth-trust">
            <p className="auth-trust-label">Works with the tools you already use</p>
            <ul className="auth-logo-grid">
              {integrations.map((integration) => (
                <li className="auth-logo-tile" key={integration.label}>
                  <img
                    className="auth-logo-mark"
                    src={integration.logo}
                    alt=""
                    aria-hidden="true"
                  />
                  <span className="auth-logo-name">{integration.label}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <a
          className="auth-bubble"
          href="/dashboard.html"
          aria-label="Open your workspace"
          title="Open your workspace"
        >
          <FlowerMark size={22} />
        </a>
      </aside>
    </div>
  );
}
