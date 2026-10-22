import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useUser } from "@clerk/react";
import {
  ArrowRight,
  ArrowUpRight,
  Check,
  ChevronDown,
  Database,
  Globe,
  Headset,
  LayoutPanelTop,
  Link2,
  Loader2,
  MessageCircle,
  RefreshCw,
  Send,
  ShieldCheck,
  Sparkles,
  ThumbsDown,
  ThumbsUp,
  Zap
} from "lucide-react";
import calLogo from "../assets/logos/cal.png";
import calendlyLogo from "../assets/logos/calendly.svg";
import chatbaseLogo from "../assets/logos/chatbase.png";
import emailLogo from "../assets/logos/email.svg";
import freshchatLogo from "../assets/logos/freshchat.svg";
import freshdeskLogo from "../assets/logos/freshdesk.svg";
import gorgiasLogo from "../assets/logos/gorgias.svg";
import helpscoutLogo from "../assets/logos/helpscout.svg";
import hubspotLogo from "../assets/logos/hubspot.svg";
import instagramLogo from "../assets/logos/instagram.svg";
import intercomLogo from "../assets/logos/intercom.svg";
import messengerLogo from "../assets/logos/messenger.svg";
import odooLogo from "../assets/logos/odoo.svg";
import salesforceLogo from "../assets/logos/salesforce.svg";
import shopifyLogo from "../assets/logos/shopify.svg";
import slackLogo from "../assets/logos/slack.svg";
import stripeLogo from "../assets/logos/stripe.svg";
import sunshineLogo from "../assets/logos/sunshine.svg";
import twilioLogo from "../assets/logos/twilio.svg";
import whatsappLogo from "../assets/logos/whatsapp.svg";
import zendeskLogo from "../assets/logos/zendesk.svg";
import zohoLogo from "../assets/logos/zoho.png";
import { BrandLockup, DiamondPattern, FlowerMark, ProgressDiamonds } from "../components/Brand";
import { executeScrapeRequest } from "../services/scraperApi";
import { sendAgentMessage } from "../services/chatApi";
import { cleanDomain, displayAddress, normalizeUrl } from "../data/sampleBriefs";

const STORE_KEY = "dessoir.onboarding.v2";
const LEGACY_STORE_KEY = "dessoir.onboarding.v1";
const WEBSITE_KEY = "dessoir.website.v2";
const LEGACY_WEBSITE_KEY = "dessoir.website";
const MAX_CREDITS = 5;

function onboardingKey(userId) {
  return `${STORE_KEY}:${userId}`;
}

function websiteKey(userId) {
  return `${WEBSITE_KEY}:${userId}`;
}

const ROLES = [
  { id: "support", label: "Customer support", persona: "You are a helpful customer support agent." },
  { id: "sales", label: "Sales agent", persona: "You are a friendly sales agent." },
  { id: "technical", label: "Technical support", persona: "You are a knowledgeable technical support agent." },
  { id: "orders", label: "Orders & billing", persona: "You are a helpful orders and billing support agent." },
  { id: "general", label: "General assistant", persona: "You are a helpful AI assistant." }
];

const PERSONALITY_TAIL =
  "Answer customer questions clearly and concisely. Stay polite and professional. Escalate billing or account issues to a human agent when unsure.";

const TOOL_GROUPS = [
  {
    label: "Actions",
    items: [
      { id: "stripe", label: "Stripe", logo: stripeLogo },
      { id: "shopify", label: "Shopify", logo: shopifyLogo },
      { id: "cal", label: "Cal", logo: calLogo },
      { id: "calendly", label: "Calendly", logo: calendlyLogo },
      { id: "slack", label: "Slack", logo: slackLogo },
      { id: "twilio", label: "Twilio", logo: twilioLogo }
    ]
  },
  {
    label: "Helpdesk tools",
    items: [
      { id: "chatbase", label: "Chatbase", logo: chatbaseLogo },
      { id: "zendesk", label: "Zendesk", logo: zendeskLogo },
      { id: "sunshine", label: "Sunshine", logo: sunshineLogo },
      { id: "salesforce", label: "Salesforce", logo: salesforceLogo },
      { id: "intercom", label: "Intercom", logo: intercomLogo },
      { id: "hubspot", label: "HubSpot", logo: hubspotLogo },
      { id: "freshdesk", label: "Freshdesk", logo: freshdeskLogo },
      { id: "freshchat", label: "Freshchat", logo: freshchatLogo },
      { id: "zoho", label: "Zoho Desk", logo: zohoLogo },
      { id: "helpscout", label: "Help Scout", logo: helpscoutLogo },
      { id: "gorgias", label: "Gorgias", logo: gorgiasLogo },
      { id: "odoo", label: "Odoo", logo: odooLogo }
    ]
  }
];

const CHANNELS = [
  { id: "chat-bubble", label: "Chat bubble", icon: MessageCircle },
  { id: "agent-page", label: "Agent page", icon: Sparkles },
  { id: "center-stage", label: "Center stage", icon: LayoutPanelTop },
  { id: "whatsapp", label: "WhatsApp", logo: whatsappLogo },
  { id: "messenger", label: "Messenger", logo: messengerLogo },
  { id: "instagram", label: "Instagram", logo: instagramLogo },
  { id: "shopify", label: "Shopify", logo: shopifyLogo },
  { id: "email", label: "Email", logo: emailLogo },
  { id: "slack", label: "Slack", logo: slackLogo },
  { id: "zendesk", label: "Zendesk", logo: zendeskLogo },
  { id: "salesforce", label: "Salesforce", logo: salesforceLogo },
  { id: "phone", label: "Phone", logo: twilioLogo }
];

const BUILD_STEPS = [
  "Scanning the public pages",
  "Extracting products, pricing, and policies",
  "Building the knowledge base",
  "Writing the agent instructions",
  "Starting the demo"
];

const STEP_PROGRESS = {
  site: 3,
  personality: 4,
  tools: 5,
  deploy: 6,
  building: 7,
  error: 6,
  demo: 8
};

const PLANS = [
  { id: "hobby", name: "Hobby", price: 36, credits: "700 credits / month", accent: "#2c41b3" },
  { id: "standard", name: "Standard", price: 135, credits: "4,000 credits / month", accent: "#c11574" },
  { id: "pro", name: "Pro", price: 450, credits: "15,000 credits / month", accent: "#f0a500", popular: true }
];

function defaultPersona(roleId) {
  const role = ROLES.find((item) => item.id === roleId) || ROLES[0];
  return `${role.persona} ${PERSONALITY_TAIL}`;
}

function readSaved(userId) {
  try {
    const raw = window.localStorage.getItem(onboardingKey(userId));
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || !parsed.built || !parsed.brief) return null;
    return parsed;
  } catch {
    return null;
  }
}

function writeSaved(userId, value) {
  try {
    window.localStorage.setItem(onboardingKey(userId), JSON.stringify(value));
  } catch {
    // Storage limits or private mode can block persistence.
  }
}

function readWebsitePrefill(userId) {
  try {
    const params = new URLSearchParams(window.location.search);
    const fromQuery = params.get("website");
    const stored = window.localStorage.getItem(websiteKey(userId));
    return fromQuery || stored || "";
  } catch {
    return "";
  }
}

function companyInitial(brief) {
  const name = String(brief?.company_name || cleanDomain(brief?.website_url || "A")).trim();
  return name.slice(0, 1).toUpperCase() || "A";
}

function formatRelativeTime(value) {
  const then = new Date(value).getTime();
  if (!Number.isFinite(then)) return "Just now";
  const diff = Math.max(0, Date.now() - then);
  if (diff < 60000) return "Just now";
  const minutes = Math.round(diff / 60000);
  if (minutes < 60) return `${minutes}m ago`;
  return new Date(value).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function buildSources(brief) {
  const base = String(brief?.website_url || "").replace(/\/+$/, "");
  if (!base) return [];
  const domain = displayAddress(base);
  return [
    { label: domain, href: base },
    { label: `${domain}/about`, href: `${base}/about` },
    { label: `${domain}/pricing`, href: `${base}/pricing` },
    { label: `${domain}/policy`, href: `${base}/policy` }
  ];
}

function reduceMotion() {
  try {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  } catch {
    return false;
  }
}

function useTypedText(text, { enabled = true, speed = 16, chunk = 2, startDelay = 240 } = {}) {
  const value = String(text || "");
  const [count, setCount] = useState(() => (enabled && !reduceMotion() ? 0 : value.length));

  useEffect(() => {
    if (!enabled || !value || reduceMotion()) {
      setCount(value.length);
      return undefined;
    }

    let shown = 0;
    let interval = 0;
    setCount(0);

    const start = window.setTimeout(() => {
      interval = window.setInterval(() => {
        shown = Math.min(value.length, shown + chunk);
        setCount(shown);
        if (shown >= value.length) window.clearInterval(interval);
      }, speed);
    }, startDelay);

    return () => {
      window.clearTimeout(start);
      window.clearInterval(interval);
    };
  }, [value, enabled, speed, chunk, startDelay]);

  return { visible: value.slice(0, count), done: count >= value.length };
}

function useTypedList(items, { enabled = true, speed = 16, lineGap = 150, startDelay = 420 } = {}) {
  const [counts, setCounts] = useState(() =>
    items.map((item) => (reduceMotion() ? item.length : 0))
  );

  useEffect(() => {
    if (reduceMotion() || !items.length) {
      setCounts(items.map((item) => item.length));
      return undefined;
    }

    if (!enabled) return undefined;

    let line = 0;
    let char = 0;
    let timer = 0;
    setCounts(items.map(() => 0));

    const tick = () => {
      if (line >= items.length) return;
      const value = items[line];

      if (char < value.length) {
        char += 1;
        const nextChar = char;
        setCounts((current) => {
          if (current[line] === nextChar) return current;
          const next = [...current];
          next[line] = nextChar;
          return next;
        });
        timer = window.setTimeout(tick, speed);
      } else {
        line += 1;
        char = 0;
        timer = window.setTimeout(tick, lineGap);
      }
    };

    timer = window.setTimeout(tick, startDelay);
    return () => window.clearTimeout(timer);
  }, [items, enabled, speed, lineGap, startDelay]);

  const done = items.every((item, index) => (counts[index] ?? 0) >= item.length);
  return { counts, done };
}

function demoQuestion(brief) {
  const corpus = `${brief?.company_name || ""} ${brief?.website_url || ""}`.toLowerCase();
  if (corpus.includes("networkbulls") || corpus.includes("network bulls") || corpus.includes("ccna")) {
    return "My CCNA course payment went through, but my Network Bulls student portal still shows unpaid.";
  }
  const product = brief?.key_products_or_services?.[0];
  if (product) {
    return `I'm interested in ${product}. How does it work and who is it for?`;
  }
  return `What does ${brief?.company_name || "your company"} do, and who is it for?`;
}

function starterQuestions(brief) {
  const offerings = brief?.key_products_or_services || [];
  return [
    offerings[0] ? `Tell me about ${offerings[0]}.` : "What do you offer?",
    "Who is this for?",
    "How do I get started?"
  ].slice(0, 3);
}

function ToolChip({ item, selected, onToggle }) {
  const Icon = item.icon;
  return (
    <button
      type="button"
      className="ob-chip"
      aria-pressed={selected}
      data-selected={selected ? "true" : "false"}
      onClick={() => onToggle(item.id)}
    >
      <span className={item.logo ? "ob-chip-icon is-logo" : "ob-chip-icon is-glyph"}>
        {item.logo ? (
          <img className="ob-chip-logo" src={item.logo} alt="" aria-hidden="true" />
        ) : (
          <Icon size={14} strokeWidth={2} aria-hidden="true" />
        )}
      </span>
      <span className="ob-chip-label">{item.label}</span>
      <span className="ob-chip-check" aria-hidden="true">
        {selected ? <Check size={12} strokeWidth={2.8} /> : null}
      </span>
    </button>
  );
}

function PatternBackdrop() {
  return (
    <div className="ob-backdrop" aria-hidden="true">
      <DiamondPattern id="ob-a" className="ob-pattern ob-pattern-a" />
      <DiamondPattern id="ob-b" className="ob-pattern ob-pattern-b" />
      <DiamondPattern id="ob-c" className="ob-pattern ob-pattern-c" />
    </div>
  );
}

function SiteStep({ site, setSite, error, onSubmit, onBack }) {
  return (
    <section className="ob-step ob-step-site" aria-labelledby="ob-site-title">
      <h1 className="ob-title" id="ob-site-title">
        What&apos;s your website?
      </h1>
      <p className="ob-subtitle">
        We&apos;ll scan it and build a knowledge base your agent can answer from.
      </p>

      <form className="ob-site-form" onSubmit={onSubmit}>
        <label className="ob-field-label" htmlFor="ob-site-url">
          Company website
        </label>
        <div className="ob-url-field" data-invalid={error ? "true" : "false"}>
          <Globe size={18} strokeWidth={1.8} aria-hidden="true" />
          <input
            id="ob-site-url"
            type="text"
            value={site}
            onChange={(event) => setSite(event.target.value)}
            placeholder="yourcompany.com"
            autoComplete="url"
            spellCheck="false"
            autoFocus
          />
        </div>
        {error ? <p className="ob-field-error">{error}</p> : null}

        <div className="ob-site-hints">
          <span>Try</span>
          {["networkbulls.com", "stripe.com", "notion.so"].map((example) => (
            <button key={example} type="button" onClick={() => setSite(example)}>
              {example}
            </button>
          ))}
        </div>

        <div className="ob-actions">
          <button className="ob-btn ob-btn-ghost" type="button" onClick={onBack}>
            Back
          </button>
          <button className="ob-btn ob-btn-primary" type="submit" disabled={!site.trim()}>
            Continue
          </button>
        </div>
      </form>
    </section>
  );
}

function PersonalityStep({ persona, setPersona, role, onRoleChange, onBack, onContinue }) {
  return (
    <section className="ob-step" aria-labelledby="ob-personality-title">
      <h1 className="ob-title" id="ob-personality-title">
        Customize your agent&apos;s
        <br />
        personality
      </h1>
      <p className="ob-label">What will your agent do?</p>

      <div className="ob-prompt-card">
        <textarea
          className="ob-prompt"
          value={persona}
          onChange={(event) => setPersona(event.target.value)}
          aria-label="Agent instructions"
          spellCheck="false"
        />
        <div className="ob-prompt-foot">
          <span className="ob-prompt-hint">Instructions are saved to your agent</span>
          <div className="ob-role">
            <Headset size={14} strokeWidth={1.9} aria-hidden="true" />
            <select value={role} onChange={(event) => onRoleChange(event.target.value)} aria-label="Agent role">
              {ROLES.map((item) => (
                <option value={item.id} key={item.id}>
                  {item.label}
                </option>
              ))}
            </select>
            <ChevronDown size={14} strokeWidth={2} aria-hidden="true" />
          </div>
        </div>
      </div>

      <div className="ob-actions">
        <button className="ob-btn ob-btn-ghost" type="button" onClick={onBack}>
          Back
        </button>
        <button
          className="ob-btn ob-btn-primary"
          type="button"
          onClick={onContinue}
          disabled={!persona.trim()}
        >
          Continue
        </button>
      </div>
    </section>
  );
}

function ToolsStep({ selected, onToggle, onBack, onContinue }) {
  return (
    <section className="ob-step" aria-labelledby="ob-tools-title">
      <h1 className="ob-title" id="ob-tools-title">
        Select the tools in your tech stack
      </h1>
      <p className="ob-subtitle">
        We&apos;ll note it down and walk you through how to integrate them later.
      </p>

      <div className="ob-groups">
        {TOOL_GROUPS.map((group) => (
          <div className="ob-group" key={group.label}>
            <h2 className="ob-group-label">{group.label}</h2>
            <div className="ob-chips">
              {group.items.map((item) => (
                <ToolChip
                  key={item.id}
                  item={item}
                  selected={selected.has(item.id)}
                  onToggle={onToggle}
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="ob-actions">
        <button className="ob-btn ob-btn-ghost" type="button" onClick={onBack}>
          Back
        </button>
        <button className="ob-btn ob-btn-primary" type="button" onClick={onContinue}>
          Continue
        </button>
      </div>
    </section>
  );
}

function DeployStep({ selected, onToggle, onBack, onContinue }) {
  return (
    <section className="ob-step" aria-labelledby="ob-deploy-title">
      <h1 className="ob-title" id="ob-deploy-title">
        Where will you be deploying your
        <br />
        AI agents?
      </h1>

      <div className="ob-chips ob-chips-deploy">
        {CHANNELS.map((item) => (
          <ToolChip
            key={item.id}
            item={item}
            selected={selected.has(item.id)}
            onToggle={onToggle}
          />
        ))}
      </div>

      <div className="ob-actions">
        <button className="ob-btn ob-btn-ghost" type="button" onClick={onBack}>
          Back
        </button>
        <button className="ob-btn ob-btn-primary" type="button" onClick={onContinue}>
          Continue
        </button>
      </div>
    </section>
  );
}

function BuildingStep({ site, status }) {
  const domain = cleanDomain(site) || "your website";
  const current = Math.min(status, BUILD_STEPS.length - 1);
  const percent = Math.round(((current + 1) / BUILD_STEPS.length) * 100);

  return (
    <section className="ob-building" aria-labelledby="ob-building-title" aria-live="polite">
      <span className="ob-flower-tile" aria-hidden="true">
        <FlowerMark size={30} className="ob-spin" />
      </span>

      <h1 className="ob-building-title" id="ob-building-title">
        Dessoir Ai will help you build a customer experience agent for{" "}
        <a className="ob-domain" href={`https://${domain}`} target="_blank" rel="noreferrer">
          <span className="ob-domain-mark">{domain.slice(0, 1).toUpperCase()}</span>
          {domain}
        </a>
        .
      </h1>

      <div className="ob-build-progress" role="status">
        <span className="ob-build-bar" aria-hidden="true">
          <i style={{ width: `${percent}%` }} />
        </span>
        <span className="ob-build-status">
          <Loader2 className="ob-spin" size={13} aria-hidden="true" />
          {BUILD_STEPS[current]}
        </span>
      </div>

      <p className="ob-building-note">Reading public pages. This usually takes 10–30 seconds.</p>
    </section>
  );
}

function ErrorStep({ site, error, onRetry, onBack }) {
  return (
    <section className="ob-error" role="alert" aria-labelledby="ob-error-title">
      <span className="ob-error-icon" aria-hidden="true">
        !
      </span>
      <h1 className="ob-title ob-error-title" id="ob-error-title">
        We couldn&apos;t build your agent
      </h1>
      <p className="ob-subtitle ob-error-copy">
        {error?.detail ||
          `The live pipeline could not scrape ${cleanDomain(site) || "this website"}. Check that n8n is running and the workflow is active.`}
      </p>
      <div className="ob-error-actions">
        <button className="ob-btn ob-btn-ghost" type="button" onClick={onBack}>
          Back to setup
        </button>
        <button className="ob-btn ob-btn-primary" type="button" onClick={onRetry}>
          <RefreshCw size={14} aria-hidden="true" />
          Try again
        </button>
      </div>
    </section>
  );
}

function SourceList({ brief, ready = true }) {
  const sources = useMemo(() => buildSources(brief), [brief]);
  const labels = useMemo(() => sources.map((source) => source.label), [sources]);
  const { counts, done } = useTypedList(labels, { enabled: ready });
  const activeIndex = counts.findIndex((count, index) => count < labels[index].length);

  return (
    <>
      <ul className="demo-sources">
        {sources.map((source, index) => {
          const label = labels[index];
          const typed = label.slice(0, Math.min(counts[index] ?? label.length, label.length));
          return (
            <li key={source.href} data-typing={activeIndex === index ? "true" : "false"}>
              <a href={source.href} target="_blank" rel="noreferrer">
                <Link2 size={13} strokeWidth={1.9} aria-hidden="true" />
                <span>
                  {typed}
                  {activeIndex === index ? (
                    <i className="demo-source-caret" aria-hidden="true" />
                  ) : null}
                </span>
              </a>
            </li>
          );
        })}
      </ul>
      <p className="demo-sources-count" data-ready={done ? "true" : "false"}>
        <Database size={12} aria-hidden="true" />
        {brief?.pages_fetched ? `${brief.pages_fetched} pages fetched` : "Homepage scanned"} ·{" "}
        {sources.length} indexed links
      </p>
    </>
  );
}

function Paywall({ brief, onRestart }) {
  const name = brief?.company_name || "your agent";
  return (
    <div className="demo-paywall" role="region" aria-label="Upgrade your plan">
      <span className="demo-paywall-eyebrow">
        <Zap size={12} aria-hidden="true" />
        5 of 5 credits used
      </span>
      <h3>Keep the conversation going</h3>
      <p>
        Your free demo of {name} is complete. Choose a plan to keep your agent answering
        customers.
      </p>

      <div className="demo-plan-list">
        {PLANS.map((plan) => (
          <a className="demo-plan" href="/pricing.html" key={plan.id}>
            <span className="demo-plan-name">
              {plan.name}
              {plan.popular ? <small>Popular</small> : null}
            </span>
            <span className="demo-plan-meta">{plan.credits}</span>
            <span className="demo-plan-price">
              ${plan.price}
              <small>/mo</small>
            </span>
          </a>
        ))}
      </div>

      <div className="demo-paywall-actions">
        <a className="ob-btn ob-btn-primary" href="/pricing.html">
          See pricing
          <ArrowRight size={14} aria-hidden="true" />
        </a>
        <button className="ob-btn ob-btn-ghost" type="button" onClick={onRestart}>
          Start over
        </button>
      </div>
    </div>
  );
}

function AgentMessage({ message, name, initial, feedback, onRate, animate, onReveal }) {
  const { visible, done } = useTypedText(message.text, { enabled: animate });
  const typingNow = Boolean(animate && !done);

  useEffect(() => {
    if (typingNow) onReveal?.();
  }, [visible, typingNow, onReveal]);

  return (
    <div className="demo-message is-agent">
      <span className="demo-avatar" aria-hidden="true">
        {initial}
      </span>
      <div className="demo-message-body">
        <span className="demo-agent-name">{name}</span>
        <p>
          {visible}
          {typingNow ? <span className="demo-caret" aria-hidden="true" /> : null}
        </p>
        {typingNow ? null : (
          <div className="demo-message-meta">
            <span>{formatRelativeTime(message.createdAt)}</span>
            <span className="demo-message-sep" aria-hidden="true">
              |
            </span>
            <button
              type="button"
              className="demo-feedback"
              data-active={feedback === "up" ? "true" : "false"}
              aria-label="Helpful response"
              aria-pressed={feedback === "up"}
              onClick={() => onRate(message.id, "up")}
            >
              <ThumbsUp size={12} aria-hidden="true" />
            </button>
            <button
              type="button"
              className="demo-feedback"
              data-active={feedback === "down" ? "true" : "false"}
              aria-label="Unhelpful response"
              aria-pressed={feedback === "down"}
              onClick={() => onRate(message.id, "down")}
            >
              <ThumbsDown size={12} aria-hidden="true" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function DemoStep({ brief, config, credits, messages, typing, draft, setDraft, onSend, onRestart }) {
  const bodyRef = useRef(null);
  const initialIdsRef = useRef(new Set(messages.map((message) => message.id)));
  const [feedback, setFeedback] = useState({});
  const [sideReady, setSideReady] = useState(false);
  const firstUserId = messages.find((message) => message.role === "user")?.id;
  const starters = useMemo(() => starterQuestions(brief), [brief]);
  const persona = config?.persona || defaultPersona("support");
  const tools = config?.tools || [];
  const channels = config?.channels || [];
  const initial = companyInitial(brief);
  const domain = displayAddress(brief?.website_url || "");
  const showStarters = credits > 0 && !typing && messages.filter((message) => message.role === "assistant").length <= 1;

  useEffect(() => {
    if (!bodyRef.current) return;
    bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
  }, [messages, typing, credits]);

  useEffect(() => {
    if (sideReady || !firstUserId) return undefined;
    if (reduceMotion()) {
      setSideReady(true);
      return undefined;
    }
    const timer = window.setTimeout(() => setSideReady(true), 2600);
    return () => window.clearTimeout(timer);
  }, [firstUserId, sideReady]);

  const rate = (id, value) => {
    setFeedback((current) => ({ ...current, [id]: current[id] === value ? null : value }));
  };

  const scrollToLatest = () => {
    const body = bodyRef.current;
    if (body) body.scrollTop = body.scrollHeight;
  };

  return (
    <div className="demo-stage">
      <aside
        className="demo-side"
        data-ready={sideReady ? "true" : "false"}
        aria-label="Agent configuration"
        inert={sideReady ? undefined : ""}
      >
        <section className="demo-panel">
          <span className="demo-panel-label">Model &amp; instructions</span>
          <div className="demo-model">
            <span className="demo-model-icon" aria-hidden="true">
              <FlowerMark size={18} />
            </span>
            <span className="demo-model-copy">
              <strong>Llama 3.2</strong>
              <small>Local model · grounded</small>
            </span>
            <span className="demo-model-dot" aria-hidden="true" />
          </div>
          <p className="demo-instructions">{persona}</p>
          {tools.length || channels.length ? (
            <div className="demo-tags">
              {tools.slice(0, 4).map((tool) => (
                <span key={tool}>{toolLabel(tool)}</span>
              ))}
              {channels.slice(0, 3).map((channel) => (
                <span className="is-channel" key={channel}>
                  {channelLabel(channel)}
                </span>
              ))}
            </div>
          ) : null}
        </section>

        <section className="demo-panel demo-panel-sources">
          <span className="demo-panel-label">Sources</span>
          <SourceList brief={brief} ready={sideReady} />
        </section>

        <p className="demo-kb">
          <ShieldCheck size={13} aria-hidden="true" />
          Knowledge base synced to your agent
        </p>
      </aside>

      <section className="demo-chat" aria-label={`Demo chat with ${brief?.company_name || "your agent"}`}>
        <div className="demo-chat-body" ref={bodyRef} aria-live="polite">
          <div className="demo-chat-intro">
            <span className="demo-chat-intro-dot" aria-hidden="true" />
            Live demo · grounded on {domain}
          </div>

          {messages.map((message) =>
            message.role === "user" ? (
              <div className="demo-message is-user" key={message.id}>
                <div className="demo-user-bubble">{message.text}</div>
              </div>
            ) : (
              <AgentMessage
                key={message.id}
                message={message}
                name={brief?.company_name || "Agent"}
                initial={initial}
                feedback={feedback[message.id]}
                onRate={rate}
                animate={!initialIdsRef.current.has(message.id)}
                onReveal={scrollToLatest}
              />
            )
          )}

          {typing ? (
            <div className="demo-message is-agent">
              <span className="demo-avatar" aria-hidden="true">
                {initial}
              </span>
              <div className="demo-message-body">
                <span className="demo-agent-name">{brief?.company_name || "Agent"}</span>
                <span className="demo-typing" aria-label="Agent is typing">
                  <i />
                  <i />
                  <i />
                </span>
              </div>
            </div>
          ) : null}

          {showStarters ? (
            <div className="demo-starters">
              <span>Try asking</span>
              <div>
                {starters.map((starter) => (
                  <button type="button" key={starter} onClick={() => onSend(starter)}>
                    {starter}
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          {credits === 0 ? <Paywall brief={brief} onRestart={onRestart} /> : null}
        </div>

        <form
          className="demo-composer"
          onSubmit={(event) => {
            event.preventDefault();
            onSend(draft);
          }}
        >
          <input
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder={
              credits === 0
                ? "You've used all 5 free credits"
                : `Ask ${brief?.company_name || "your agent"} anything…`
            }
            aria-label="Message your agent"
            disabled={credits === 0 || typing}
          />
          {credits === 0 ? (
            <a className="demo-composer-upgrade" href="/pricing.html">
              Upgrade
              <ArrowUpRight size={13} aria-hidden="true" />
            </a>
          ) : (
            <button
              className="demo-composer-send"
              type="submit"
              disabled={!draft.trim() || typing}
              aria-label="Send message"
            >
              <Send size={15} aria-hidden="true" />
            </button>
          )}
        </form>

        <div className="demo-chat-foot">
          <span>
            <span className="demo-live-dot" aria-hidden="true" />
            Agent online
          </span>
          <span>{displayAddress(brief?.website_url || "")}</span>
        </div>
      </section>
    </div>
  );
}

function toolLabel(id) {
  const all = TOOL_GROUPS.flatMap((group) => group.items);
  return all.find((item) => item.id === id)?.label || id;
}

function channelLabel(id) {
  return CHANNELS.find((item) => item.id === id)?.label || id;
}

function OnboardingExperience({ userId }) {
  const saved = useMemo(() => {
    try {
      return readSaved(userId);
    } catch {
      return null;
    }
  }, [userId]);
  const prefill = useMemo(() => readWebsitePrefill(userId), [userId]);

  const [step, setStep] = useState(() => {
    if (saved?.built) return "demo";
    return prefill ? "personality" : "site";
  });
  const [site, setSite] = useState(() => saved?.brief?.website_url || prefill);
  const [siteError, setSiteError] = useState("");
  const [role, setRole] = useState(() => saved?.config?.role || "support");
  const [persona, setPersona] = useState(() => saved?.config?.persona || defaultPersona("support"));
  const [selectedTools, setSelectedTools] = useState(() => new Set(saved?.config?.tools || []));
  const [selectedChannels, setSelectedChannels] = useState(() => new Set(saved?.config?.channels || []));
  const [buildStatus, setBuildStatus] = useState(0);
  const [buildError, setBuildError] = useState(null);
  const [brief, setBrief] = useState(saved?.brief || null);
  const [config, setConfig] = useState(saved?.config || null);
  const [credits, setCredits] = useState(() => (saved?.built ? Math.max(0, Number(saved.credits) || 0) : MAX_CREDITS));
  const [messages, setMessages] = useState(() => saved?.messages || []);
  const [typing, setTyping] = useState(false);
  const [draft, setDraft] = useState("");
  const hasSavedReply = Boolean(saved?.messages?.some((message) => message.role === "assistant"));
  const demoRunRef = useRef(hasSavedReply ? saved?.brief?.website_url || "restored" : "");

  useEffect(() => {
    document.title =
      step === "demo"
        ? `${brief?.company_name || "Your agent"} demo | Dessoir Ai`
        : step === "building"
          ? "Building your agent | Dessoir Ai"
          : "Set up your agent | Dessoir Ai";
  }, [step, brief]);

  useEffect(() => {
    if (step !== "building") return undefined;
    setBuildStatus(0);
    const timer = window.setInterval(() => {
      setBuildStatus((current) => Math.min(current + 1, BUILD_STEPS.length - 1));
    }, 2700);
    return () => window.clearInterval(timer);
  }, [step]);

  useEffect(() => {
    if (!brief || config === null || step !== "demo") return;
    writeSaved(userId, {
      built: true,
      brief,
      config,
      credits,
      messages,
      createdAt: saved?.createdAt || new Date().toISOString()
    });
  }, [brief, config, credits, messages, step, saved?.createdAt, userId]);

  useEffect(() => {
    if (step !== "demo" || !brief) return undefined;
    if (demoRunRef.current === brief.website_url) return undefined;

    const question = demoQuestion(brief);
    const createdAt = new Date().toISOString();
    let cancelled = false;

    const timer = window.setTimeout(() => {
      if (cancelled) return;
      demoRunRef.current = brief.website_url;
      setMessages([{ id: "demo-user", role: "user", text: question, createdAt }]);
      setTyping(true);

      sendAgentMessage(question, brief).then((reply) => {
        if (cancelled) return;
        setTyping(false);
        setMessages((current) => [
          ...current,
          {
            id: "demo-assistant",
            role: "assistant",
            text: reply || "I could not find that in the scraped content.",
            createdAt: new Date().toISOString()
          }
        ]);
      });
    }, 800);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [step, brief]);

  const handleSiteSubmit = (event) => {
    event.preventDefault();
    const normalized = normalizeUrl(site);
    if (!normalized.ok) {
      setSiteError(normalized.error);
      return;
    }
    setSiteError("");
    setSite(normalized.url);
    try {
      window.localStorage.setItem(websiteKey(userId), normalized.url);
    } catch {
      // Storage can be blocked in private contexts.
    }
    setStep("personality");
  };

  const changeRole = (nextRole) => {
    setRole(nextRole);
    setPersona((current) => (current === defaultPersona(role) ? defaultPersona(nextRole) : current));
  };

  const toggleTool = (id) => {
    setSelectedTools((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleChannel = (id) => {
    setSelectedChannels((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const runBuild = useCallback(async () => {
    const normalized = normalizeUrl(site);
    if (!normalized.ok) {
      setSiteError(normalized.error);
      setStep("site");
      return;
    }

    setStep("building");
    setBuildError(null);
    setBuildStatus(0);

    try {
      const [result] = await Promise.all([
        executeScrapeRequest(normalized.url),
        new Promise((resolve) => setTimeout(resolve, 3200))
      ]);

      if (!result.ok) {
        setBuildError({
          detail:
            result.detail ||
            (result.kind === "offline"
              ? "The research pipeline is offline. Start n8n on localhost:5678 and try again."
              : result.kind === "inactive"
                ? "The n8n workflow is not active. Activate the company-summary workflow and try again."
                : `The workflow could not scrape ${cleanDomain(normalized.url)}. Check that the website is reachable and try again.`)
        });
        setStep("error");
        return;
      }

      setBuildStatus(BUILD_STEPS.length);
      setBrief(result.brief);
      setConfig({
        persona: persona.trim() || defaultPersona(role),
        role,
        tools: [...selectedTools],
        channels: [...selectedChannels]
      });
      setCredits(MAX_CREDITS);
      setMessages([]);
      setTyping(false);
      demoRunRef.current = "";
      setSite(result.brief.website_url || normalized.url);

      await new Promise((resolve) => setTimeout(resolve, 650));
      setStep("demo");
    } catch (error) {
      setBuildError({
        detail: `The build request failed: ${error?.message || "unknown error"}. Check the n8n workflow and try again.`
      });
      setStep("error");
    }
  }, [site, persona, role, selectedTools, selectedChannels]);

  const handleSend = async (text) => {
    const message = String(text || "").trim();
    if (!message || typing || credits <= 0 || !brief) return;

    setDraft("");
    setTyping(true);
    const createdAt = new Date().toISOString();
    setMessages((current) => [
      ...current,
      { id: `user-${Date.now()}`, role: "user", text: message, createdAt }
    ]);
    setCredits((current) => Math.max(0, current - 1));

    let reply = "";
    try {
      reply = await sendAgentMessage(message, brief, messages);
    } catch {
      reply = `I couldn't reach the agent pipeline just now. Please try again or contact ${brief.company_name} directly.`;
    }

    setTyping(false);
    setMessages((current) => [
      ...current,
      {
        id: `assistant-${Date.now()}`,
        role: "assistant",
        text: reply || "I could not find that in the scraped content.",
        createdAt: new Date().toISOString()
      }
    ]);
  };

  const restart = () => {
    try {
      window.localStorage.removeItem(onboardingKey(userId));
      window.localStorage.removeItem(websiteKey(userId));
    } catch {
      // Ignore storage errors.
    }
    window.location.href = "/onboarding.html?restart=1";
  };

  const goBack = () => {
    if (step === "personality") setStep("site");
    else if (step === "tools") setStep("personality");
    else if (step === "deploy") setStep("tools");
    else if (step === "error") setStep("deploy");
    else window.location.href = "/auth.html?mode=signup";
  };

  const progress = STEP_PROGRESS[step] || 3;
  const domain = cleanDomain(site) || "your website";

  return (
    <div className="ob-page" data-screen={step === "demo" ? "demo" : "setup"}>
      {step === "building" || step === "demo" ? <PatternBackdrop /> : null}

      <div className="ob-shell">
        <header className="ob-topbar">
          <BrandLockup subtitle={step === "demo" ? "Live demo" : "Agent setup"} />
          <div className="ob-topbar-right">
            <ProgressDiamonds filled={progress} label={`Setup progress: step ${progress} of 8`} />
            {step === "demo" ? (
              <>
                <span className="ob-credit-pill" data-empty={credits === 0 ? "true" : "false"}>
                  <Zap size={12} aria-hidden="true" />
                  {credits} credit{credits === 1 ? "" : "s"} left
                </span>
                <button className="ob-new-agent" type="button" onClick={restart}>
                  New agent
                </button>
              </>
            ) : null}
          </div>
        </header>

        <main className="ob-stage">
          {step === "site" ? (
            <SiteStep
              site={site}
              setSite={(value) => {
                setSite(value);
                setSiteError("");
              }}
              error={siteError}
              onSubmit={handleSiteSubmit}
              onBack={() => {
                window.location.href = "/auth.html?mode=signup";
              }}
            />
          ) : null}

          {step === "personality" ? (
            <PersonalityStep
              persona={persona}
              setPersona={setPersona}
              role={role}
              onRoleChange={changeRole}
              onBack={goBack}
              onContinue={() => setStep("tools")}
            />
          ) : null}

          {step === "tools" ? (
            <ToolsStep
              selected={selectedTools}
              onToggle={toggleTool}
              onBack={goBack}
              onContinue={() => setStep("deploy")}
            />
          ) : null}

          {step === "deploy" ? (
            <DeployStep
              selected={selectedChannels}
              onToggle={toggleChannel}
              onBack={goBack}
              onContinue={runBuild}
            />
          ) : null}

          {step === "building" ? <BuildingStep site={site} status={buildStatus} /> : null}

          {step === "error" ? (
            <ErrorStep site={site} error={buildError} onRetry={runBuild} onBack={goBack} />
          ) : null}

          {step === "demo" && brief ? (
            <DemoStep
              brief={brief}
              config={config}
              credits={credits}
              messages={messages}
              typing={typing}
              draft={draft}
              setDraft={setDraft}
              onSend={handleSend}
              onRestart={restart}
            />
          ) : null}
        </main>

        <footer className="ob-footer">
          <span>© 2026 Dessoir Ai.</span>
          <span className="ob-footer-links">
            <a href="/pricing.html">Pricing</a>
            <span aria-hidden="true">|</span>
            <a href="/#top">Terms</a>
            <span aria-hidden="true">|</span>
            <a href="/#top">Privacy</a>
          </span>
        </footer>
      </div>
    </div>
  );
}

export default function OnboardingApp() {
  const { isLoaded, isSignedIn, user } = useUser();

  useEffect(() => {
    try {
      window.localStorage.removeItem(LEGACY_STORE_KEY);
      window.localStorage.removeItem(LEGACY_WEBSITE_KEY);
    } catch {
      // Ignore storage errors.
    }
  }, []);

  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      window.location.replace("/auth.html?mode=signin");
    }
  }, [isLoaded, isSignedIn]);

  if (!isLoaded || !isSignedIn || !user) {
    return (
      <div className="ob-page ob-gate">
        <div className="ob-gate-card">
          <BrandLockup subtitle="Agent setup" />
          <span className="ob-gate-state">
            <Loader2 size={14} className="ob-spin" aria-hidden="true" />
            {isLoaded ? "Taking you to sign in…" : "Loading your workspace…"}
          </span>
        </div>
      </div>
    );
  }

  return <OnboardingExperience key={user.id} userId={user.id} />;
}
