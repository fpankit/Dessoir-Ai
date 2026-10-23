import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { UserButton, useUser, useAuth } from "@clerk/react";
import {
  ArrowRight,
  Bot,
  Building2,
  Check,
  ChevronRight,
  Clock,
  Copy,
  Database,
  ExternalLink,
  FileText,
  Globe,
  Loader2,
  Maximize2,
  MessageSquare,
  RefreshCw,
  Search,
  Send,
  ShieldCheck,
  Sparkles,
  Users,
  Workflow,
  X
} from "lucide-react";
import { WORKFLOW_ID, WORKFLOW_URL, executeScrapeRequest, pingN8nStatus } from "../services/scraperApi";
import { sendAgentMessage } from "../services/chatApi";
import {
  cleanDomain,
  displayAddress,
  normalizeUrl,
  titleCase
} from "../data/sampleBriefs";

const PIPELINE_STEPS = [
  {
    id: "fetch",
    title: "Fetching website",
    detail: "Sending a request to the public page"
  },
  {
    id: "extract",
    title: "Extracting content",
    detail: "Cleaning HTML and key metadata"
  },
  {
    id: "brief",
    title: "Building the brief",
    detail: "Synthesizing products, audience, and tags"
  },
  {
    id: "agent",
    title: "Preparing the agent",
    detail: "Syncing knowledge base and chat session"
  }
];

const SUGGESTED_TARGETS = ["stripe.com", "linear.app", "notion.so"];

const CHAT_STARTERS = [
  "What does your company do?",
  "What are your core products?",
  "Who is your target audience?",
  "How do I get started?"
];

function BrandMark({ size = 26, inverted = false }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-hidden="true">
      <rect width="32" height="32" rx="1.5" fill={inverted ? "#F7F5F0" : "#0A0A0A"} />
      <path
        d="M9.1 8.7h13.8v11.1h-7.4l-4.3 3.3v-3.3H9.1V8.7Z"
        fill={inverted ? "#0A0A0A" : "#FFFFFF"}
      />
      <path
        d="M17 12.4h1.4a3.6 3.6 0 0 1 0 7.2H17v-7.2Z"
        stroke={inverted ? "#F7F5F0" : "#0A0A0A"}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function formatTime(date = new Date()) {
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function formatStamp(date = new Date()) {
  return date.toLocaleString([], {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
}

function readSession() {
  try {
    const raw = window.localStorage.getItem("dessoir.session");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function ConsoleHeader({ n8nState }) {
  const { user } = useUser();
  const { isSignedIn } = useAuth();
  const session = useMemo(() => readSession(), []);
  const label =
    user?.fullName ||
    user?.firstName ||
    user?.primaryEmailAddress?.emailAddress?.split("@")[0] ||
    session?.name?.trim() ||
    session?.email?.split("@")[0] ||
    "Workspace";

  return (
    <header className="sx-topbar">
      <div className="sx-topbar-inner">
        <a className="sx-brand" href="/">
          <BrandMark size={24} />
          <span className="sx-brand-text">
            <strong>Dessoir Ai</strong>
            <span>Research console</span>
          </span>
        </a>

        <div className="sx-topbar-right">
          <span className="sx-pipeline-status" data-state={n8nState} title="n8n workflow runner">
            <span className="sx-dot" />
            {n8nState === "online" ? "n8n online" : n8nState === "offline" ? "n8n offline" : "checking runner"}
          </span>

          <span className="sx-workflow-chip" title={WORKFLOW_URL}>
            <Workflow size={13} />
            {WORKFLOW_ID}
          </span>

          {isSignedIn ? (
            <div style={{ display: "inline-flex", alignItems: "center", gap: "8px" }}>
              <span className="sx-user">
                <span className="sx-user-avatar">{titleCase(label).slice(0, 1)}</span>
                <span className="sx-user-name">{label}</span>
              </span>
              <UserButton afterSignOutUrl="/" />
            </div>
          ) : (
            <a className="sx-topbar-link" href="/auth.html?mode=signin">
              Sign in
            </a>
          )}

          <a className="sx-topbar-link" href="/">
            Back to site
          </a>
        </div>
      </div>
    </header>
  );
}

function SearchBar({ value, onChange, onSubmit, running }) {
  return (
    <form
      className="sx-search-card"
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit();
      }}
    >
      <Globe className="sx-search-icon" size={18} strokeWidth={1.8} />
      <input
        className="sx-search-input"
        type="text"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="stripe.com"
        aria-label="Company website"
        spellCheck="false"
        autoComplete="url"
        disabled={running}
      />
      <button className="sx-submit" type="submit" disabled={running}>
        {running ? (
          <>
            <Loader2 className="sx-spin" size={15} />
            Researching
          </>
        ) : (
          <>
            Research
            <ArrowRight size={15} />
          </>
        )}
      </button>
    </form>
  );
}

function Notice({ notice, onDismiss }) {
  if (!notice) return null;

  return (
    <div className="sx-notice" data-tone={notice.tone} role="status">
      <span className="sx-notice-icon">
        {notice.tone === "error" ? <X size={14} /> : <ShieldCheck size={14} />}
      </span>
      <span className="sx-notice-body">
        <strong>{notice.title}</strong>
        {notice.detail ? <span>{notice.detail}</span> : null}
      </span>
      {onDismiss ? (
        <button className="sx-notice-close" type="button" onClick={onDismiss} aria-label="Dismiss">
          <X size={14} />
        </button>
      ) : null}
    </div>
  );
}

function PipelineRail({ activeIndex, status }) {
  return (
    <aside className="sx-rail">
      <div className="sx-rail-label">Live pipeline</div>
      <ol className="sx-steps">
        {PIPELINE_STEPS.map((step, index) => {
          const state =
            status === "done" ? "done" : index < activeIndex ? "done" : index === activeIndex ? "active" : "pending";

          return (
            <li className="sx-step" key={step.id} data-state={state}>
              <span className="sx-step-marker">
                {state === "done" ? <Check size={12} /> : state === "active" ? <Loader2 className="sx-spin" size={12} /> : null}
              </span>
              <span className="sx-step-copy">
                <span className="sx-step-title">
                  {index + 1}. {step.title}
                </span>
                <span className="sx-step-detail">{step.detail}</span>
              </span>
            </li>
          );
        })}
      </ol>
      <div className="sx-rail-foot">
        <span className="sx-rail-foot-dot" />
        Runs locally on n8n
      </div>
    </aside>
  );
}

function ResearchSkeleton({ domain, activeStep = 0 }) {
  return (
    <section className="sx-running">
      <header className="sx-running-head">
        <span className="sx-running-orb">
          <span className="sx-running-orb-core" />
        </span>
        <span className="sx-running-heading">
          <span className="sx-eyebrow">Company research agent</span>
          <span className="sx-running-title">
            Reading <strong>{domain}</strong>
          </span>
        </span>
        <span className="sx-running-meta">
          <span className="sx-dot sx-dot-live" />
          Workflow {WORKFLOW_ID} active
        </span>
      </header>

      <div className="sx-running-body">
        <PipelineRail activeIndex={activeStep} status="running" />

        <div className="sx-skeleton">
          <div className="sx-skeleton-row">
            <span className="sx-skeleton-mark" />
            <span className="sx-skeleton-lines">
              <span className="sx-line sx-line-lg" />
              <span className="sx-line sx-line-md" />
            </span>
          </div>
          <span className="sx-line sx-line-full" />
          <span className="sx-line sx-line-long" />
          <span className="sx-line sx-line-mid" />
          <div className="sx-skeleton-stats">
            <span className="sx-skeleton-stat" />
            <span className="sx-skeleton-stat" />
            <span className="sx-skeleton-stat" />
            <span className="sx-skeleton-stat" />
          </div>
          <span className="sx-line sx-line-full" />
          <span className="sx-line sx-line-short" />
        </div>
      </div>
    </section>
  );
}

function ResearchError({ domain, error, onRetry, onNewSearch }) {
  return (
    <section className="sx-error" role="alert">
      <span className="sx-error-icon">
        <X size={18} />
      </span>
      <h2 className="sx-error-title">
        {domain ? `Could not research ${domain}` : "Could not research this website"}
      </h2>
      <p className="sx-error-copy">
        {error?.detail ||
          "The live pipeline did not return a usable company brief. No sample data was generated."}
      </p>
      <div className="sx-error-actions">
        <button className="sx-error-primary" type="button" onClick={onRetry}>
          <RefreshCw size={14} />
          Try again
        </button>
        <button className="sx-error-secondary" type="button" onClick={onNewSearch}>
          New search
        </button>
      </div>
    </section>
  );
}

function EmptyState({ onPick }) {
  return (
    <section className="sx-empty">
      <span className="sx-empty-icon">
        <Search size={20} strokeWidth={1.7} />
      </span>
      <h2 className="sx-empty-title">Research any company website</h2>
      <p className="sx-empty-copy">
        We fetch the public site, extract the product and audience signals, and sync the result into a customer
        agent that can answer questions about the company.
      </p>
      <div className="sx-empty-chips">
        {SUGGESTED_TARGETS.map((target) => (
          <button key={target} type="button" className="sx-chip" onClick={() => onPick(target)}>
            {target}
            <ChevronRight size={13} />
          </button>
        ))}
      </div>
      <ul className="sx-empty-points">
        <li>
          <FileText size={14} /> Structured company dossier
        </li>
        <li>
          <Bot size={14} /> Grounded chat agent
        </li>
        <li>
          <Database size={14} /> Knowledge base on your data
        </li>
      </ul>
    </section>
  );
}

function Dossier({ brief, mode, generatedAt, onNewSearch, onOpenChat, onCopy, copied }) {
  const domain = displayAddress(brief.website_url);
  const initial = titleCase(brief.company_name).slice(0, 1);
  const agent = brief.retell_ai || {};
  const score = Number(brief.confidence_score) || 0;
  const sources = [`${domain} homepage & metadata`, "Public product and pricing pages", "Extracted navigation copy"];

  return (
    <article className="sx-report">
      <header className="sx-report-hero" data-watermark={titleCase(brief.company_name).slice(0, 1)}>
        <div className="sx-report-topline">
          <span className="sx-report-label">
            <span className="sx-report-label-dot" />
            Company dossier
          </span>
          <span className="sx-badge" data-tone={mode}>
            {mode === "sample" ? "Sample preview" : "Live extraction"}
          </span>

          <div className="sx-report-actions">
            <button className="sx-action" type="button" onClick={onCopy}>
              {copied ? <Check size={13} /> : <Copy size={13} />}
              {copied ? "Copied" : "Copy brief"}
            </button>
            <button className="sx-action" type="button" onClick={onNewSearch}>
              <RefreshCw size={13} />
              New search
            </button>
            <a className="sx-action" href={WORKFLOW_URL} target="_blank" rel="noreferrer">
              <Workflow size={13} />
              Open in n8n
            </a>
          </div>
        </div>

        <div className="sx-company-head">
          <div className="sx-company-lockup">
            <span className="sx-company-mark">{initial}</span>
            <div className="sx-company-heading">
              <span className="sx-company-meta">{brief.industry}</span>
              <h1 className="sx-company-name">{brief.company_name}</h1>
              <a className="sx-company-site" href={brief.website_url} target="_blank" rel="noreferrer">
                {domain}
                <ExternalLink size={12} />
              </a>
            </div>
          </div>

          <div className="sx-score">
            <span className="sx-score-label">Extraction score</span>
            <span className="sx-score-value">
              {score}
              <small>/100</small>
            </span>
            <span className="sx-score-bar">
              <i style={{ width: `${score}%` }} />
            </span>
          </div>
        </div>

        <p className="sx-tagline">“{brief.one_liner}”</p>
      </header>

      <section className="sx-agent-banner">
        <div className="sx-agent-info">
          <span className="sx-agent-avatar">
            {initial}
            <span className="sx-agent-beacon" />
          </span>
          <div className="sx-agent-copy">
            <h3>
              {brief.company_name} Customer Agent
              <span className="sx-badge sx-badge-dark">AI Agent</span>
            </h3>
            <p>
              Customer agent running locally with scraped knowledge from {domain}. Chat is available now.
            </p>
          </div>
        </div>

        <div className="sx-agent-actions">
          <button className="sx-btn sx-btn-light" type="button" onClick={onOpenChat}>
            <MessageSquare size={15} />
            Chat with Agent
          </button>
          <a className="sx-btn sx-btn-ghost" href={agent.chat_interface_url} target="_blank" rel="noreferrer">
            <ExternalLink size={15} />
            n8n Chat UI
          </a>
        </div>
      </section>

      <div className="sx-stats">
        <div className="sx-stat">
          <span className="sx-stat-label">
            <Building2 size={12} />
            Industry
          </span>
          <span className="sx-stat-value">{brief.industry}</span>
        </div>
        <div className="sx-stat">
          <span className="sx-stat-label">
            <Users size={12} />
            Primary audience
          </span>
          <span className="sx-stat-value">{brief.primary_target_audience}</span>
        </div>
        <div className="sx-stat">
          <span className="sx-stat-label">
            <Globe size={12} />
            Source
          </span>
          <span className="sx-stat-value">{domain}</span>
        </div>
        <div className="sx-stat">
          <span className="sx-stat-label">
            <Sparkles size={12} />
            Extraction
          </span>
          <span className="sx-stat-value">{mode === "sample" ? "Sample preview" : "Live extraction"}</span>
        </div>
      </div>

      <div className="sx-report-body">
        <div className="sx-report-main">
          <section className="sx-block">
            <span className="sx-block-label">Executive summary</span>
            <p className="sx-overview">{brief.what_the_company_does}</p>
          </section>

          <section className="sx-block">
            <span className="sx-block-label">Who it serves</span>
            <p className="sx-overview">{brief.primary_target_audience}</p>
          </section>

          <section className="sx-block">
            <span className="sx-block-label">Core offerings &amp; products</span>
            {brief.key_products_or_services.length ? (
              <ol className="sx-offerings">
                {brief.key_products_or_services.map((item, index) => (
                  <li className="sx-offering" key={item}>
                    <span className="sx-offering-index">{String(index + 1).padStart(2, "0")}</span>
                    <span className="sx-offering-name">{item}</span>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="sx-overview">No product or service list was extracted from the website.</p>
            )}
          </section>

          <section className="sx-block">
            <span className="sx-block-label">Classification &amp; tags</span>
            <div className="sx-tags">
              {brief.key_tags.map((tag) => (
                <span className="sx-tag" key={tag}>
                  {tag}
                </span>
              ))}
            </div>
          </section>
        </div>

        <aside className="sx-report-aside">
          <section className="sx-aside-block">
            <span className="sx-block-label">Company metadata</span>
            <dl className="sx-facts">
              <div className="sx-fact">
                <dt>Official URL</dt>
                <dd>
                  <a href={brief.website_url} target="_blank" rel="noreferrer">
                    {domain}
                  </a>
                </dd>
              </div>
              <div className="sx-fact">
                <dt>Customer agent</dt>
                <dd className="sx-fact-live">
                  <span className="sx-dot sx-dot-live" />
                  {agent.is_live ? "Ready" : "Local mode"}
                </dd>
              </div>
              <div className="sx-fact">
                <dt>n8n workflow</dt>
                <dd>
                  <a href={WORKFLOW_URL} target="_blank" rel="noreferrer">
                    {WORKFLOW_ID}
                  </a>
                </dd>
              </div>
              <div className="sx-fact">
                <dt>Generated</dt>
                <dd>{formatStamp(generatedAt)}</dd>
              </div>
              <div className="sx-fact">
                <dt>Mode</dt>
                <dd>{mode === "sample" ? "Sample preview" : "Live extraction"}</dd>
              </div>
            </dl>
          </section>

          <section className="sx-aside-block">
            <span className="sx-block-label">Data sources</span>
            <ul className="sx-sources">
              {sources.map((source) => (
                <li className="sx-source" key={source}>
                  <span>{source}</span>
                  <ExternalLink size={12} />
                </li>
              ))}
            </ul>
          </section>

          <section className="sx-aside-block">
            <span className="sx-block-label">About this brief</span>
            <p className="sx-aside-copy">
              {mode === "sample"
                ? "Sample content for interface preview. Scraped data synced to the customer agent."
                : "Live extraction from the target website, synced to the customer agent knowledge base."}
            </p>
          </section>
        </aside>
      </div>

      <footer className="sx-report-footer">
        <span>
          {mode === "sample"
            ? "Sample preview — agent ready"
            : "Live extraction — agent ready"}
        </span>
        <span>{formatStamp(generatedAt)}</span>
      </footer>
    </article>
  );
}

function AgentChatPanel({ open, onClose, brief }) {
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState("");
  const [typing, setTyping] = useState(false);
  const [showStarters, setShowStarters] = useState(true);
  const bodyRef = useRef(null);

  const agent = brief?.retell_ai || {};
  const domain = brief ? displayAddress(brief.website_url) : "";
  const initial = brief ? titleCase(brief.company_name).slice(0, 1) : "?";

  useEffect(() => {
    if (!open || !brief) return;
    setMessages([
      {
        id: "seed",
        role: "agent",
        text: agent.begin_message || `Hello! I am the customer agent for ${brief.company_name}.`,
        time: formatTime()
      }
    ]);
    setShowStarters(true);
  }, [open, brief, agent.begin_message]);

  useEffect(() => {
    if (!bodyRef.current) return;
    bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
  }, [messages, typing]);

  const submit = useCallback(
    async (text) => {
      const message = String(text || "").trim();
      if (!message || typing) return;

      setDraft("");
      setShowStarters(false);
      setMessages((current) => [
        ...current,
        { id: `u-${Date.now()}`, role: "user", text: message, time: formatTime() }
      ]);
      setTyping(true);

      const reply = await sendAgentMessage(message, brief, messages);

      setTyping(false);
      setMessages((current) => [
        ...current,
        { id: `a-${Date.now()}`, role: "agent", text: reply, time: formatTime() }
      ]);
    },
    [brief, messages, typing]
  );

  if (!brief) return null;

  return (
    <aside className="sx-chat" data-open={open ? "true" : "false"} aria-hidden={open ? "false" : "true"}>
      <header className="sx-chat-header">
        <span className="sx-chat-avatar">
          {initial}
          <span className="sx-chat-avatar-dot" />
        </span>
        <span className="sx-chat-identity">
          <span className="sx-chat-name">
            {brief.company_name} Agent
            <span className="sx-badge sx-badge-dark">AI Agent</span>
          </span>
          <span className="sx-chat-sub">
            {domain} · Customer representative
          </span>
        </span>
        <span className="sx-chat-controls">
          <a
            className="sx-chat-btn"
            href={agent.chat_interface_url}
            target="_blank"
            rel="noreferrer"
            title="Open in n8n chat interface"
          >
            <Maximize2 size={15} />
          </a>
          <button className="sx-chat-btn" type="button" onClick={onClose} title="Close chat">
            <X size={15} />
          </button>
        </span>
      </header>

      <div className="sx-chat-body" ref={bodyRef}>
        <div className="sx-chat-tag">
          <ShieldCheck size={12} />
          Grounded on the scraped website content
        </div>

        {messages.map((message) => (
          <div className={`sx-bubble sx-bubble-${message.role}`} key={message.id}>
            <p>{message.text}</p>
            <span className="sx-bubble-meta">{message.time}</span>
          </div>
        ))}

        {typing ? (
          <div className="sx-typing">
            <span />
            <span />
            <span />
          </div>
        ) : null}

        {showStarters ? (
          <div className="sx-starters">
            {CHAT_STARTERS.map((starter) => (
              <button key={starter} type="button" className="sx-starter" onClick={() => submit(starter)}>
                {starter}
              </button>
            ))}
          </div>
        ) : null}
      </div>

      <footer className="sx-chat-footer">
        <form
          className="sx-chat-form"
          onSubmit={(event) => {
            event.preventDefault();
            submit(draft);
          }}
        >
          <input
            className="sx-chat-input"
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder={`Ask ${brief.company_name} about products, pricing, audience…`}
            aria-label="Message the agent"
          />
          <button className="sx-chat-send" type="submit" disabled={!draft.trim() || typing}>
            <Send size={15} />
          </button>
        </form>
        <div className="sx-chat-note">
          Grounded on {domain} data ·{" "}
          <a href={agent.chat_interface_url} target="_blank" rel="noreferrer">
            Open in n8n Chat Interface
          </a>
        </div>
      </footer>
    </aside>
  );
}

export default function ScraperApp() {
  const { isLoaded, isSignedIn } = useAuth();

  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      window.location.replace("/auth.html?mode=signin");
    }
  }, [isLoaded, isSignedIn]);

  if (!isLoaded) {
    return (
      <div className="sx-gate" role="status">
        <Loader2 size={22} className="sx-gate-spinner" />
        Checking your session…
      </div>
    );
  }

  if (!isSignedIn) {
    return (
      <div className="sx-gate" role="status">
        <ShieldCheck size={22} />
        Sign in required. Redirecting…
      </div>
    );
  }

  return <ScraperConsole />;
}

function ScraperConsole() {
  const [target, setTarget] = useState("");
  const [status, setStatus] = useState("idle");
  const [activeStep, setActiveStep] = useState(0);
  const [brief, setBrief] = useState(null);
  const [mode, setMode] = useState("live");
  const [notice, setNotice] = useState(null);
  const [error, setError] = useState(null);
  const [n8nState, setN8nState] = useState("checking");
  const [chatOpen, setChatOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [generatedAt, setGeneratedAt] = useState(() => new Date());
  const resultsRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    pingN8nStatus().then((online) => {
      if (!cancelled) setN8nState(online ? "online" : "offline");
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (status !== "running") return undefined;
    const timer = window.setInterval(() => {
      setActiveStep((current) => Math.min(current + 1, PIPELINE_STEPS.length - 1));
    }, 2600);
    return () => window.clearInterval(timer);
  }, [status]);

  useEffect(() => {
    if (status !== "done" || !resultsRef.current) return;
    resultsRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [status]);

  const runResearch = useCallback(async (rawValue) => {
    const normalized = normalizeUrl(rawValue);
    if (!normalized.ok) {
      setNotice({ tone: "error", title: normalized.error });
      return;
    }

    const domain = cleanDomain(normalized.url);
    setTarget(domain);
    setNotice(null);
    setError(null);
    setStatus("running");
    setActiveStep(0);
    setChatOpen(false);

    const result = await executeScrapeRequest(normalized.url);

    if (result.ok) {
      setBrief(result.brief);
      setMode(result.brief.scrape_status === "sample" ? "sample" : "live");
      setGeneratedAt(new Date());
      setStatus("done");
      setActiveStep(PIPELINE_STEPS.length);
      return;
    }

    setBrief(null);
    setMode("live");
    setError({
      detail:
        result.detail ||
        (result.kind === "offline"
          ? "The research pipeline is offline. Start n8n on localhost:5678, activate the workflow, and try again."
          : result.kind === "inactive"
            ? "The n8n workflow is not active. Activate the company-summary workflow and try again."
            : result.kind === "invalid"
              ? "The workflow responded, but the response did not contain a usable company brief. No sample data was generated."
              : `The workflow could not scrape ${domain}. Check that the website is reachable and try again.`)
    });
    setStatus("error");
    setActiveStep(0);
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const requested = params.get("url") || (params.get("demo") === "1" ? "stripe.com" : "");
    if (!requested) return;
    setTarget(requested);
    runResearch(requested);
  }, [runResearch]);

  const handleCopy = useCallback(async () => {
    if (!brief) return;
    try {
      await navigator.clipboard.writeText(JSON.stringify(brief, null, 2));
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setNotice({ tone: "error", title: "Clipboard access was blocked by the browser." });
    }
  }, [brief]);

  const handleNewSearch = useCallback(() => {
    setStatus("idle");
    setBrief(null);
    setNotice(null);
    setError(null);
    setChatOpen(false);
    setTarget("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const handlePick = useCallback(
    (value) => {
      setTarget(value);
      runResearch(value);
    },
    [runResearch]
  );

  return (
    <div className="sx-app">
      <ConsoleHeader n8nState={n8nState} />

      <main className="sx-main">
        <section className="sx-search">
          <SearchBar
            value={target}
            onChange={setTarget}
            onSubmit={() => runResearch(target)}
            running={status === "running"}
          />

          <div className="sx-search-meta">
            <span className="sx-search-hint">
              <Sparkles size={13} />
              Scrapes the public site and syncs a grounded customer agent
            </span>
            <span className="sx-search-links">
              {SUGGESTED_TARGETS.map((item) => (
                <button key={item} type="button" onClick={() => handlePick(item)}>
                  {item}
                </button>
              ))}
            </span>
          </div>

          <Notice notice={notice} onDismiss={() => setNotice(null)} />
        </section>

        <div ref={resultsRef} className="sx-results">
          {status === "idle" ? <EmptyState onPick={handlePick} /> : null}

          {status === "running" ? (
            <ResearchSkeleton domain={cleanDomain(target) || "the target site"} activeStep={activeStep} />
          ) : null}

          {status === "error" ? (
            <ResearchError
              domain={cleanDomain(target)}
              error={error}
              onRetry={() => runResearch(target)}
              onNewSearch={handleNewSearch}
            />
          ) : null}

          {status === "done" && brief ? (
            <Dossier
              brief={brief}
              mode={mode}
              generatedAt={generatedAt}
              onNewSearch={handleNewSearch}
              onOpenChat={() => setChatOpen(true)}
              onCopy={handleCopy}
              copied={copied}
            />
          ) : null}
        </div>
      </main>

      <footer className="sx-footer">
        <span>
          <BrandMark size={16} inverted />
          Dessoir Ai · Research console
        </span>
        <span className="sx-footer-links">
          <span>
            <Clock size={12} /> Session synced locally
          </span>
          <a href={WORKFLOW_URL} target="_blank" rel="noreferrer">
            Workflow {WORKFLOW_ID}
          </a>
          <a href="/">Back to site</a>
        </span>
      </footer>

      <button
        className="sx-chat-launcher"
        type="button"
        onClick={() => setChatOpen((open) => !open)}
        disabled={!brief}
      >
        <MessageSquare size={16} />
        Chat with agent
        <span className="sx-chat-launcher-dot" />
      </button>

      <AgentChatPanel open={chatOpen} onClose={() => setChatOpen(false)} brief={brief} />
    </div>
  );
}
