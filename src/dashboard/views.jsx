import { useEffect, useMemo, useRef, useState } from "react";
import {
  AlertCircle,
  ArrowRight,
  ArrowUpRight,
  BarChart3,
  BookOpen,
  Bot,
  BrainCircuit,
  Building2,
  CalendarClock,
  Check,
  CheckCircle2,
  ChevronRight,
  Circle,
  Clock3,
  Cpu,
  ExternalLink,
  FileText,
  Globe2,
  Headset,
  Loader2,
  Mail,
  MessageSquare,
  MessagesSquare,
  Plug,
  Plus,
  RefreshCw,
  Send,
  Settings,
  ShieldCheck,
  Trash2,
  Users,
  X,
  Zap
} from "lucide-react";
import { BrandMark } from "../components/Brand";
import { displayAddress, normalizeUrl } from "../data/sampleBriefs";
import { executeScrapeRequest, pingN8nStatus } from "../services/scraperApi";
import {
  AGENT_CAPABILITIES,
  AGENT_ROLES,
  AGENT_TONES,
  AUTOMATIONS,
  CHANNEL_OPTIONS,
  INTEGRATIONS,
  INTEGRATION_CATEGORIES,
  MAX_AGENTS,
  TRIAL_CREDITS,
  createAgentFromBrief,
  domainLabel,
  formatNumber,
  formatRelative,
  initials,
  isIntegrationConnected
} from "./dashboardData";

const AVATAR_COLORS = ["#2c41b3", "#8e51ff", "#0f766e", "#b45309", "#be185d", "#1d4ed8"];
const AGENT_ICONS = [Bot, BrainCircuit, Cpu, Headset];
const AGENT_AVATAR_TONES = [
  { color: "#3157c8", background: "#edf2ff" },
  { color: "#7146c7", background: "#f1ecff" },
  { color: "#0f766e", background: "#e6f7f3" },
  { color: "#a35c0a", background: "#fff4df" }
];
const AGENT_ICON_SIZES = { sm: 15, md: 19, lg: 24 };

function avatarColor(value) {
  const text = String(value || "Dessoir");
  let hash = 0;
  for (let index = 0; index < text.length; index += 1) {
    hash = (hash * 31 + text.charCodeAt(index)) >>> 0;
  }
  return AVATAR_COLORS[hash % AVATAR_COLORS.length];
}

function PageHeader({ eyebrow, title, subtitle, actions }) {
  return (
    <header className="dash-page-head">
      <div>
        {eyebrow ? <p className="dash-eyebrow">{eyebrow}</p> : null}
        <h1>{title}</h1>
        {subtitle ? <p className="dash-page-subtitle">{subtitle}</p> : null}
      </div>
      {actions ? <div className="dash-page-actions">{actions}</div> : null}
    </header>
  );
}

function AgentAvatar({ agent, size = "md" }) {
  const label = agent?.company?.company_name || agent?.config?.name || "Agent";
  const key = `${agent?.id || ""}${label}`;
  let hash = 0;
  for (let index = 0; index < key.length; index += 1) {
    hash = (hash * 31 + key.charCodeAt(index)) >>> 0;
  }
  const tone = AGENT_AVATAR_TONES[hash % AGENT_AVATAR_TONES.length];
  const AgentIcon = AGENT_ICONS[hash % AGENT_ICONS.length];
  return (
    <span
      className={`dash-agent-avatar dash-agent-avatar-${size}`}
      style={{ backgroundColor: tone.background, color: tone.color }}
      aria-hidden="true"
    >
      <AgentIcon size={AGENT_ICON_SIZES[size] || AGENT_ICON_SIZES.md} strokeWidth={1.9} />
    </span>
  );
}

function StatusBadge({ status }) {
  const label = status === "active" ? "Active" : status === "paused" ? "Paused" : "Draft";
  return <span className={`dash-status dash-status-${status || "draft"}`}>{label}</span>;
}

function Progress({ value, tone = "blue", dark = false }) {
  return (
    <div className={`dash-progress dash-progress-${tone} ${dark ? "dash-progress-dark" : ""}`}>
      <span style={{ width: `${Math.max(0, Math.min(100, value))}%` }} />
    </div>
  );
}

function MetricCard({ icon: Icon, label, value, detail, accent = "neutral" }) {
  return (
    <article className={`dash-metric dash-metric-${accent}`}>
      <div className="dash-metric-head">
        <span className="dash-metric-icon">
          <Icon size={17} strokeWidth={1.8} aria-hidden="true" />
        </span>
        <span>{label}</span>
      </div>
      <strong>{value}</strong>
      {detail ? <small>{detail}</small> : null}
    </article>
  );
}

function EmptyState({ icon: Icon, title, copy, action, secondary }) {
  return (
    <div className="dash-empty">
      <span className="dash-empty-icon">
        <Icon size={21} strokeWidth={1.7} aria-hidden="true" />
      </span>
      <h3>{title}</h3>
      <p>{copy}</p>
      {(action || secondary) && (
        <div className="dash-empty-actions">
          {action}
          {secondary}
        </div>
      )}
    </div>
  );
}

function Field({ label, value, muted }) {
  return (
    <div className={`dash-field ${muted ? "is-muted" : ""}`}>
      <span>{label}</span>
      <p>{value || "Not found in the knowledge base"}</p>
    </div>
  );
}

function ResearchSteps({ phase, elapsed }) {
  const steps = [
    { id: "read", label: "Reading pages", detail: "Crawling the public site" },
    { id: "extract", label: "Extracting profile", detail: "Company, audience, offerings" },
    { id: "index", label: "Indexing knowledge", detail: "Pricing, policies, FAQ" },
    { id: "agent", label: "Preparing agent", detail: "Building the answer context" }
  ];
  return (
    <div className="dash-research-progress">
      <div className="dash-research-progress-head">
        <span className="dash-status dash-status-active">
          <Loader2 size={12} className="dash-spin" aria-hidden="true" />
          Research in progress
        </span>
        <span>{elapsed}s elapsed</span>
      </div>
      <div className="dash-research-steps">
        {steps.map((step, index) => {
          const activeIndex =
            phase === "running" ? Math.min(3, Math.floor(elapsed / 9)) : 0;
          const state = index < activeIndex ? "done" : index === activeIndex ? "active" : "waiting";
          return (
            <div className={`dash-research-step is-${state}`} key={step.id}>
              <span className="dash-research-step-mark">
                {state === "done" ? <Check size={13} /> : <span />}
              </span>
              <div>
                <strong>{step.label}</strong>
                <small>{step.detail}</small>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function OverviewView({
  workspace,
  activeAgent,
  firstName,
  greeting,
  messageCount,
  remainingCredits,
  connectedCount,
  activity,
  onNavigate,
  onStartResearch,
  onLoadSample,
  onSetActiveAgent,
  serviceOnline,
  showToast
}) {
  const [quickUrl, setQuickUrl] = useState("");

  const submitQuick = (event) => {
    event.preventDefault();
    if (!quickUrl.trim()) {
      onNavigate("research");
      return;
    }
    onStartResearch(quickUrl.trim());
  };

  const activeMessages = activeAgent
    ? workspace.usage.conversations
    : 0;

  return (
    <div className="dash-view dash-overview">
      <PageHeader
        eyebrow="Workspace overview"
        title={`${greeting}, ${firstName}.`}
        subtitle={
          activeAgent
            ? `Here is the latest for ${activeAgent.company.company_name || "your workspace"}.`
            : "Start with a website and turn it into a customer-ready agent."
        }
        actions={
          <>
            <button type="button" className="dash-btn" onClick={() => onNavigate("research")}>
              <Globe2 size={15} aria-hidden="true" />
              Research a company
            </button>
            <button
              type="button"
              className="dash-btn dash-btn-primary"
              onClick={() => onNavigate("research")}
            >
              <Bot size={15} aria-hidden="true" />
              New agent
            </button>
          </>
        }
      />

      <div className="dash-metrics">
        <MetricCard
          icon={Bot}
          label="AI agents"
          value={formatNumber(workspace.agents.length)}
          detail={workspace.agents.length === 1 ? "1 active workspace agent" : `${workspace.agents.length} of ${MAX_AGENTS} test agents`}
        />
        <MetricCard
          icon={FileText}
          label="Pages analyzed"
          value={formatNumber(workspace.usage.pagesIndexed)}
          detail="Across company research runs"
          accent="purple"
        />
        <MetricCard
          icon={MessagesSquare}
          label="Conversations"
          value={formatNumber(workspace.usage.conversations)}
          detail={`${formatNumber(messageCount)} messages in local history`}
          accent="green"
        />
        <MetricCard
          icon={Zap}
          label="Credits left"
          value={formatNumber(remainingCredits)}
          detail={`${formatNumber(TRIAL_CREDITS)} included in testing`}
          accent="amber"
        />
      </div>

      <form className="dash-quick-research" onSubmit={submitQuick}>
        <span className="dash-quick-icon">
          <Globe2 size={18} aria-hidden="true" />
        </span>
        <div className="dash-quick-copy">
          <label htmlFor="dash-quick-url">Add a company to your workspace</label>
          <input
            id="dash-quick-url"
            value={quickUrl}
            onChange={(event) => setQuickUrl(event.target.value)}
            placeholder="Enter a website, for example stripe.com"
            autoComplete="url"
          />
        </div>
        <button type="submit" className="dash-btn dash-btn-primary">
          Analyze website
          <ArrowRight size={15} aria-hidden="true" />
        </button>
      </form>

      <div className="dash-overview-layout">
        <div className="dash-overview-main">
          {activeAgent ? (
            <>
              <div className="dash-focus-grid">
                <section className="dash-card dash-company-card">
                  <div className="dash-card-head">
                    <div>
                      <p className="dash-eyebrow">Company knowledge</p>
                      <h2>{activeAgent.company.company_name || "Company profile"}</h2>
                    </div>
                    <span className="dash-soft-badge">
                      <CheckCircle2 size={13} aria-hidden="true" />
                      Indexed
                    </span>
                  </div>
                  <div className="dash-company-identity">
                    <span
                      className="dash-company-mark"
                      style={{ backgroundColor: avatarColor(activeAgent.company.company_name) }}
                      aria-hidden="true"
                    >
                      {initials(activeAgent.company.company_name)}
                    </span>
                    <div>
                      <a
                        href={activeAgent.company.website_url || "#"}
                        target="_blank"
                        rel="noreferrer"
                        className="dash-company-site"
                      >
                        {domainLabel(activeAgent.company.website_url)}
                        <ArrowUpRight size={13} aria-hidden="true" />
                      </a>
                      <p>{activeAgent.company.one_liner || "Company profile is ready."}</p>
                    </div>
                  </div>
                  <p className="dash-company-summary">
                    {activeAgent.company.what_the_company_does ||
                      "Add a company website to generate the profile."}
                  </p>
                  <div className="dash-chip-row">
                    {activeAgent.company.industry ? <span>{activeAgent.company.industry}</span> : null}
                    {(activeAgent.company.key_products_or_services || []).slice(0, 3).map((product) => (
                      <span key={product}>{product}</span>
                    ))}
                  </div>
                  <div className="dash-card-foot">
                    <span>
                      <Check size={13} aria-hidden="true" />
                      {formatNumber(activeAgent.company.pages_fetched)} pages
                    </span>
                    <span>{activeAgent.company.confidence_score || 0}% confidence</span>
                    <button type="button" className="dash-text-link" onClick={() => onNavigate("knowledge")}>
                      View knowledge
                      <ArrowRight size={13} aria-hidden="true" />
                    </button>
                  </div>
                </section>

                <section className="dash-card dash-agent-card">
                  <div className="dash-card-head">
                    <div>
                      <p className="dash-eyebrow">Active agent</p>
                      <h2>{activeAgent.config.name}</h2>
                    </div>
                    <StatusBadge status={activeAgent.status} />
                  </div>
                  <div className="dash-agent-identity">
                    <AgentAvatar agent={activeAgent} size="lg" />
                    <div>
                      <strong>{activeAgent.config.role}</strong>
                      <small>{activeAgent.config.tone} tone · {activeAgent.config.language}</small>
                    </div>
                  </div>
                  <div className="dash-agent-stats">
                    <span>
                      <MessageSquare size={14} aria-hidden="true" />
                      {formatNumber(activeMessages)} conversations
                    </span>
                    <span>
                      <Plug size={14} aria-hidden="true" />
                      {activeAgent.config.channels.length} channels
                    </span>
                  </div>
                  <div className="dash-channel-row">
                    {activeAgent.config.channels.map((channelId) => {
                      const channel = CHANNEL_OPTIONS.find((item) => item.id === channelId);
                      return channel ? (
                        <span className="dash-channel-pill" key={channelId}>
                          {channel.logo ? <img src={channel.logo} alt="" /> : <Globe2 size={12} aria-hidden="true" />}
                          {channel.name}
                        </span>
                      ) : null;
                    })}
                  </div>
                  <div className="dash-card-foot">
                    <button type="button" className="dash-btn dash-btn-small dash-btn-primary" onClick={() => onNavigate("conversations")}>
                      Open conversation
                      <ArrowRight size={13} aria-hidden="true" />
                    </button>
                    <button type="button" className="dash-text-link" onClick={() => onNavigate("agents")}>
                      Edit agent
                    </button>
                  </div>
                </section>
              </div>

              <section className="dash-card dash-agents-panel">
                <div className="dash-card-head">
                  <div>
                    <p className="dash-eyebrow">Workspace</p>
                    <h2>Your agents</h2>
                  </div>
                  <button type="button" className="dash-text-link" onClick={() => onNavigate("agents")}>
                    Manage agents
                    <ArrowRight size={13} aria-hidden="true" />
                  </button>
                </div>
                <div className="dash-table-wrap">
                  <table className="dash-table">
                    <thead>
                      <tr>
                        <th>Agent</th>
                        <th>Status</th>
                        <th>Channels</th>
                        <th>Knowledge</th>
                        <th>Updated</th>
                        <th aria-label="Actions" />
                      </tr>
                    </thead>
                    <tbody>
                      {workspace.agents.map((agent) => (
                        <tr key={agent.id} className={agent.id === activeAgent.id ? "is-current" : ""}>
                          <td>
                            <div className="dash-table-agent">
                              <AgentAvatar agent={agent} size="sm" />
                              <div>
                                <strong>{agent.config.name}</strong>
                                <small>{domainLabel(agent.company.website_url)}</small>
                              </div>
                            </div>
                          </td>
                          <td><StatusBadge status={agent.status} /></td>
                          <td>{agent.config.channels.length} enabled</td>
                          <td>{formatNumber(agent.company.pages_fetched)} pages</td>
                          <td>{formatRelative(agent.updatedAt)}</td>
                          <td>
                            <button
                              type="button"
                              className="dash-row-action"
                              onClick={() => {
                                onSetActiveAgent(agent.id);
                                onNavigate("conversations");
                              }}
                            >
                              Open
                              <ChevronRight size={14} aria-hidden="true" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            </>
          ) : (
            <section className="dash-card dash-start-card">
              <div className="dash-start-copy">
                <span className="dash-empty-icon">
                  <Building2 size={21} aria-hidden="true" />
                </span>
                <p className="dash-eyebrow">Start here</p>
                <h2>Turn your website into a customer agent.</h2>
                <p>
                  Dessoir scans your public pages, builds a company profile, and prepares an agent that can answer
                  customer questions with approved context.
                </p>
                <div className="dash-start-actions">
                  <button type="button" className="dash-btn dash-btn-primary" onClick={() => onNavigate("research")}>
                    Research a company
                    <ArrowRight size={15} aria-hidden="true" />
                  </button>
                  <button type="button" className="dash-btn" onClick={onLoadSample}>
                    Load sample workspace
                  </button>
                </div>
                <div className="dash-start-checks">
                  <span><Check size={13} /> Company profile</span>
                  <span><Check size={13} /> Knowledge base</span>
                  <span><Check size={13} /> Customer agent</span>
                </div>
              </div>
              <div className="dash-start-visual" aria-hidden="true">
                <div className="dash-start-visual-head">
                  <span />
                  <span />
                  <span />
                </div>
                <div className="dash-start-visual-body">
                  <span className="dash-start-visual-mark"><BrandMark size={25} /></span>
                  <div>
                    <span />
                    <span />
                  </div>
                </div>
                <div className="dash-start-visual-lines">
                  <span />
                  <span />
                  <span />
                  <span />
                </div>
              </div>
            </section>
          )}
        </div>

        <aside className="dash-overview-rail">
          <section className="dash-card dash-rail-card">
            <div className="dash-card-head">
              <div>
                <p className="dash-eyebrow">Usage</p>
                <h2>Trial workspace</h2>
              </div>
              <CreditCardIcon />
            </div>
            <div className="dash-usage-numbers">
              <strong>{formatNumber(remainingCredits)}</strong>
              <span>credits left</span>
            </div>
            <Progress
              value={((workspace.usage.creditsLimit - remainingCredits) / workspace.usage.creditsLimit) * 100}
            />
            <div className="dash-usage-lines">
              <span><span>Agents</span><strong>{workspace.agents.length}</strong></span>
              <span><span>Messages</span><strong>{formatNumber(workspace.usage.messages)}</strong></span>
              <span><span>Connections</span><strong>{connectedCount}</strong></span>
            </div>
            <button type="button" className="dash-text-link" onClick={() => onNavigate("settings")}>
              View testing details
              <ArrowRight size={13} aria-hidden="true" />
            </button>
          </section>

          <section className="dash-card dash-rail-card">
            <div className="dash-card-head">
              <div>
                <p className="dash-eyebrow">Recent activity</p>
                <h2>Workspace updates</h2>
              </div>
            </div>
            {activity.length ? (
              <div className="dash-activity-list">
                {activity.slice(0, 4).map((item) => (
                  <div className="dash-activity-item" key={item.id}>
                    <span className="dash-activity-mark" aria-hidden="true" />
                    <div>
                      <strong>{item.title}</strong>
                      {item.detail ? <p>{item.detail}</p> : null}
                      <time>{formatRelative(item.createdAt)}</time>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="dash-muted-copy">Research a company to start your workspace activity.</p>
            )}
            {activity.length ? (
              <button type="button" className="dash-text-link" onClick={() => onNavigate("analytics")}>
                See all activity
                <ArrowRight size={13} aria-hidden="true" />
              </button>
            ) : null}
          </section>

          <section className="dash-card dash-rail-card">
            <div className="dash-card-head">
              <div>
                <p className="dash-eyebrow">Service status</p>
                <h2>Research pipeline</h2>
              </div>
              <span className={`dash-service-dot ${serviceOnline ? "is-online" : "is-offline"}`} aria-hidden="true" />
            </div>
            <p className="dash-muted-copy">
              {serviceOnline
                ? "The research service is reachable. New company scans can run now."
                : serviceOnline === false
                  ? "The research service is offline. You can still preview a sample workspace."
                  : "Checking the research service."}
            </p>
            {serviceOnline === false ? (
              <button type="button" className="dash-text-link" onClick={onLoadSample}>
                Load sample workspace
                <ArrowRight size={13} aria-hidden="true" />
              </button>
            ) : null}
          </section>
        </aside>
      </div>
    </div>
  );
}

function CreditCardIcon() {
  return (
    <span className="dash-rail-icon">
      <Zap size={15} aria-hidden="true" />
    </span>
  );
}

export function ResearchView({
  workspace,
  activeAgent,
  researchSeed,
  serviceOnline,
  onAgentCreated,
  onLoadSample,
  onNavigate,
  showToast
}) {
  const [url, setUrl] = useState(activeAgent?.company?.website_url || "");
  const [phase, setPhase] = useState("idle");
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (researchSeed) setUrl(researchSeed.url || "");
  }, [researchSeed]);

  useEffect(() => {
    if (phase !== "running") return undefined;
    const timer = window.setInterval(() => setElapsed((value) => value + 1), 1000);
    return () => window.clearInterval(timer);
  }, [phase]);

  const runResearch = async (event) => {
    event.preventDefault();
    if (workspace.agents.length >= MAX_AGENTS) {
      showToast(`Test mode supports up to ${MAX_AGENTS} agents. Remove one before adding another.`, "error");
      return;
    }
    const normalized = normalizeUrl(url);
    if (!normalized.ok) {
      setError(normalized.error);
      setPhase("error");
      return;
    }

    setError("");
    setResult(null);
    setElapsed(0);
    setPhase("checking");
    const online = await pingN8nStatus();
    if (!online) {
      setError("The research service is offline. Start n8n and the API proxy, or load the sample workspace to preview the dashboard.");
      setPhase("error");
      return;
    }

    setPhase("running");
    const response = await executeScrapeRequest(normalized.url);
    if (!response.ok) {
      setError(response.detail || "The website could not be analyzed. Check the address and try again.");
      setPhase("error");
      return;
    }

    const added = onAgentCreated(createAgentFromBrief(response.brief), response.brief);
    if (added === false) {
      setError("This agent could not be added to the workspace.");
      setPhase("error");
      return;
    }
    setResult(response.brief);
    setPhase("success");
  };

  const retry = () => {
    setPhase("idle");
    setError("");
  };

  return (
    <div className="dash-view">
      <PageHeader
        eyebrow="Research & crawl"
        title="Build a company profile"
        subtitle="Scan public pages, extract the details that matter, and prepare an agent from approved content."
        actions={
          <button type="button" className="dash-btn" onClick={() => onNavigate("knowledge")} disabled={!activeAgent}>
            <BookOpen size={15} aria-hidden="true" />
            Open knowledge base
          </button>
        }
      />

      <div className="dash-research-layout">
        <div className="dash-research-main">
          <section className="dash-card dash-research-card">
            <div className="dash-card-head">
              <div>
                <p className="dash-eyebrow">New research run</p>
                <h2>Company website</h2>
              </div>
              <span className={`dash-service-pill ${serviceOnline ? "is-online" : "is-offline"}`}>
                <span aria-hidden="true" />
                {serviceOnline ? "Service online" : "Service offline"}
              </span>
            </div>
            <form onSubmit={runResearch} className="dash-research-form">
              <label htmlFor="research-url">Website address</label>
              <div className="dash-input-group">
                <Globe2 size={17} aria-hidden="true" />
                <input
                  id="research-url"
                  value={url}
                  onChange={(event) => setUrl(event.target.value)}
                  placeholder="https://example.com"
                  autoComplete="url"
                  disabled={phase === "running" || phase === "checking"}
                />
                <button
                  type="submit"
                  className="dash-btn dash-btn-primary"
                  disabled={phase === "running" || phase === "checking"}
                >
                  {phase === "running" || phase === "checking" ? (
                    <>
                      <Loader2 size={15} className="dash-spin" aria-hidden="true" />
                      Analyzing
                    </>
                  ) : (
                    <>
                      Analyze website
                      <ArrowRight size={15} aria-hidden="true" />
                    </>
                  )}
                </button>
              </div>
              <p className="dash-form-help">
                We read publicly accessible pages only. The agent answers from the extracted profile, not from live browsing.
              </p>
            </form>

            {phase === "running" ? <ResearchSteps phase={phase} elapsed={elapsed} /> : null}

            {phase === "error" ? (
              <div className="dash-alert" role="alert">
                <AlertCircle size={17} aria-hidden="true" />
                <div>
                  <strong>Research could not start</strong>
                  <p>{error}</p>
                  <div className="dash-alert-actions">
                    <button type="button" className="dash-text-link" onClick={retry}>
                      Try again
                    </button>
                    <button type="button" className="dash-text-link" onClick={onLoadSample}>
                      Load sample workspace
                    </button>
                  </div>
                </div>
              </div>
            ) : null}

            {phase === "success" && result ? (
              <div className="dash-research-success">
                <div className="dash-research-success-head">
                  <span className="dash-success-icon"><Check size={16} aria-hidden="true" /></span>
                  <div>
                    <strong>{result.company_name || "Company"} is ready</strong>
                    <p>{result.pages_fetched ? `${formatNumber(result.pages_fetched)} pages analyzed.` : "The company profile was saved."}</p>
                  </div>
                </div>
                <div className="dash-research-success-actions">
                  <button type="button" className="dash-btn dash-btn-primary" onClick={() => onNavigate("overview")}>
                    View workspace
                    <ArrowRight size={14} aria-hidden="true" />
                  </button>
                  <button type="button" className="dash-btn" onClick={() => onNavigate("knowledge")}>
                    Inspect knowledge
                  </button>
                </div>
              </div>
            ) : null}
          </section>

          {activeAgent ? (
            <section className="dash-card">
              <div className="dash-card-head">
                <div>
                  <p className="dash-eyebrow">Current profile</p>
                  <h2>{activeAgent.company.company_name}</h2>
                </div>
                <button
                  type="button"
                  className="dash-btn dash-btn-small"
                  onClick={() => setUrl(activeAgent.company.website_url || "")}
                >
                  <RefreshCw size={14} aria-hidden="true" />
                  Reuse website
                </button>
              </div>
              <div className="dash-profile-grid">
                <Field label="Website" value={displayAddress(activeAgent.company.website_url)} />
                <Field label="Industry" value={activeAgent.company.industry} />
                <Field label="Audience" value={activeAgent.company.primary_target_audience} />
                <Field label="Confidence" value={`${activeAgent.company.confidence_score || 0}%`} />
              </div>
              <div className="dash-profile-summary">
                <span>Company summary</span>
                <p>{activeAgent.company.what_the_company_does || "No summary was extracted."}</p>
              </div>
            </section>
          ) : null}
        </div>

        <aside className="dash-research-rail">
          <section className="dash-card dash-rail-card">
            <div className="dash-card-head">
              <div>
                <p className="dash-eyebrow">What happens next</p>
                <h2>From website to agent</h2>
              </div>
            </div>
            <ol className="dash-numbered-list">
              <li><span>01</span><div><strong>Crawl public pages</strong><p>We collect the pages customers are most likely to ask about.</p></div></li>
              <li><span>02</span><div><strong>Extract the profile</strong><p>Company summary, audience, offerings, pricing, and policies.</p></div></li>
              <li><span>03</span><div><strong>Prepare the agent</strong><p>Your agent starts with approved context and human handoff.</p></div></li>
            </ol>
          </section>
          <section className="dash-card dash-rail-card dash-rail-note">
            <ShieldCheck size={18} aria-hidden="true" />
            <div>
              <strong>Testing access</strong>
              <p>Payment verification is disabled in this workspace. You can create and test agents without a paid plan.</p>
            </div>
          </section>
          <section className="dash-card dash-rail-card">
            <div className="dash-card-head">
              <div>
                <p className="dash-eyebrow">Agent capacity</p>
                <h2>{workspace.agents.length} of {MAX_AGENTS} used</h2>
              </div>
            </div>
            <Progress value={(workspace.agents.length / MAX_AGENTS) * 100} tone="purple" />
            <p className="dash-muted-copy">
              Test workspaces can keep up to {MAX_AGENTS} company agents. Remove an agent to make room.
            </p>
            <button type="button" className="dash-text-link" onClick={() => onNavigate("agents")}>
              Manage agents
              <ArrowRight size={13} aria-hidden="true" />
            </button>
          </section>
        </aside>
      </div>
    </div>
  );
}

function AgentEditor({ agent, onClose, onSave }) {
  const [draft, setDraft] = useState({
    name: agent.config.name,
    role: agent.config.role,
    tone: agent.config.tone,
    language: agent.config.language,
    persona: agent.config.persona,
    channels: agent.config.channels,
    tools: agent.config.tools
  });

  const update = (key, value) => setDraft((current) => ({ ...current, [key]: value }));
  const toggleList = (key, value) => {
    setDraft((current) => {
      const list = current[key];
      return {
        ...current,
        [key]: list.includes(value) ? list.filter((item) => item !== value) : [...list, value]
      };
    });
  };

  const submit = (event) => {
    event.preventDefault();
    onSave(agent.id, {
      ...draft,
      name: draft.name.trim() || agent.config.name,
      persona: draft.persona.trim()
    });
    onClose();
  };

  return (
    <div className="dash-overlay" role="presentation" onMouseDown={onClose}>
      <section
        className="dash-dialog dash-dialog-wide"
        role="dialog"
        aria-modal="true"
        aria-labelledby="agent-editor-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="dash-dialog-head">
          <div>
            <p className="dash-eyebrow">Agent settings</p>
            <h2 id="agent-editor-title">{agent.config.name}</h2>
          </div>
          <button type="button" className="dash-icon-button" onClick={onClose} aria-label="Close agent settings">
            <X size={16} />
          </button>
        </div>
        <form onSubmit={submit} className="dash-editor-form">
          <div className="dash-form-grid">
            <label>
              <span>Agent name</span>
              <input value={draft.name} onChange={(event) => update("name", event.target.value)} maxLength={120} />
            </label>
            <label>
              <span>Role</span>
              <select value={draft.role} onChange={(event) => update("role", event.target.value)}>
                {AGENT_ROLES.map((role) => <option key={role}>{role}</option>)}
              </select>
            </label>
            <label>
              <span>Tone</span>
              <select value={draft.tone} onChange={(event) => update("tone", event.target.value)}>
                {AGENT_TONES.map((tone) => <option key={tone}>{tone}</option>)}
              </select>
            </label>
            <label>
              <span>Language</span>
              <input value={draft.language} onChange={(event) => update("language", event.target.value)} maxLength={60} />
            </label>
          </div>
          <label className="dash-form-block">
            <span>Instructions</span>
            <textarea
              value={draft.persona}
              onChange={(event) => update("persona", event.target.value)}
              rows={5}
              maxLength={1200}
            />
            <small>These instructions are saved with the agent and used for customer conversations.</small>
          </label>
          <fieldset className="dash-fieldset">
            <legend>Capabilities</legend>
            <div className="dash-check-grid">
              {AGENT_CAPABILITIES.map((capability) => (
                <label key={capability.id} className="dash-check">
                  <input
                    type="checkbox"
                    checked={draft.tools.includes(capability.id)}
                    onChange={() => toggleList("tools", capability.id)}
                  />
                  <span>{capability.label}</span>
                </label>
              ))}
            </div>
          </fieldset>
          <fieldset className="dash-fieldset">
            <legend>Channels</legend>
            <div className="dash-check-grid">
              {CHANNEL_OPTIONS.map((channel) => (
                <label key={channel.id} className="dash-check">
                  <input
                    type="checkbox"
                    checked={draft.channels.includes(channel.id)}
                    onChange={() => toggleList("channels", channel.id)}
                  />
                  <span>{channel.name}</span>
                </label>
              ))}
            </div>
          </fieldset>
          <div className="dash-dialog-actions">
            <button type="button" className="dash-btn" onClick={onClose}>Cancel</button>
            <button type="submit" className="dash-btn dash-btn-primary">Save agent</button>
          </div>
        </form>
      </section>
    </div>
  );
}

export function AgentsView({ workspace, activeAgent, onNavigate, onSetActiveAgent, onSaveAgent, onDeleteAgent }) {
  const [editing, setEditing] = useState(null);

  return (
    <div className="dash-view">
      <PageHeader
        eyebrow="AI agents"
        title="Customer agents"
        subtitle="Keep each company profile and its customer-facing agent in one place."
        actions={
          <>
            <button type="button" className="dash-btn" onClick={() => onNavigate("conversations")} disabled={!activeAgent}>
              <MessageSquare size={15} aria-hidden="true" />
              Open chat
            </button>
            <button
              type="button"
              className="dash-btn dash-btn-primary"
              onClick={() => onNavigate("research")}
              disabled={workspace.agents.length >= MAX_AGENTS}
              title={workspace.agents.length >= MAX_AGENTS ? "Remove an agent to add another." : undefined}
            >
              <Plus size={15} aria-hidden="true" />
              New agent
            </button>
          </>
        }
      />

      {workspace.agents.length ? (
        <div className="dash-agent-grid">
          {workspace.agents.map((agent) => (
            <article className={`dash-card dash-agent-profile ${agent.id === workspace.activeAgentId ? "is-active" : ""}`} key={agent.id}>
              <div className="dash-agent-profile-head">
                <AgentAvatar agent={agent} size="lg" />
                <div className="dash-agent-profile-name">
                  <div>
                    <h2>{agent.config.name}</h2>
                    <StatusBadge status={agent.status} />
                  </div>
                  <a href={agent.company.website_url || "#"} target="_blank" rel="noreferrer">
                    {domainLabel(agent.company.website_url)}
                    <ArrowUpRight size={12} aria-hidden="true" />
                  </a>
                </div>
                <button
                  type="button"
                  className="dash-icon-button"
                  onClick={() => setEditing(agent)}
                  aria-label={`Edit ${agent.config.name}`}
                >
                  <Settings size={16} />
                </button>
              </div>
              <p className="dash-agent-profile-summary">
                {agent.company.one_liner || agent.company.what_the_company_does || "Company profile ready."}
              </p>
              <div className="dash-agent-meta">
                <div><span>Role</span><strong>{agent.config.role}</strong></div>
                <div><span>Channels</span><strong>{agent.config.channels.length} enabled</strong></div>
                <div><span>Knowledge</span><strong>{formatNumber(agent.company.pages_fetched)} pages</strong></div>
                <div><span>Updated</span><strong>{formatRelative(agent.updatedAt)}</strong></div>
              </div>
              <div className="dash-channel-row">
                {agent.config.channels.slice(0, 4).map((channelId) => {
                  const channel = CHANNEL_OPTIONS.find((item) => item.id === channelId);
                  return channel ? (
                    <span className="dash-channel-pill" key={channelId}>
                      {channel.logo ? <img src={channel.logo} alt="" /> : <Globe2 size={12} aria-hidden="true" />}
                      {channel.name}
                    </span>
                  ) : null;
                })}
              </div>
              <div className="dash-agent-actions">
                {agent.id !== workspace.activeAgentId ? (
                  <button type="button" className="dash-btn dash-btn-small" onClick={() => onSetActiveAgent(agent.id)}>
                    Set active
                  </button>
                ) : (
                  <span className="dash-active-label"><CheckCircle2 size={14} /> Active agent</span>
                )}
                <button
                  type="button"
                  className="dash-btn dash-btn-small dash-btn-primary"
                  onClick={() => {
                    onSetActiveAgent(agent.id);
                    onNavigate("conversations");
                  }}
                >
                  Open chat
                  <ArrowRight size={13} aria-hidden="true" />
                </button>
                <button type="button" className="dash-icon-button dash-danger-button" onClick={() => onDeleteAgent(agent.id)} aria-label={`Remove ${agent.config.name}`}>
                  <Trash2 size={15} />
                </button>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={Bot}
          title="No agents yet"
          copy="Research a company website to create your first customer agent."
          action={
            <button type="button" className="dash-btn dash-btn-primary" onClick={() => onNavigate("research")}>
              Start research
              <ArrowRight size={14} aria-hidden="true" />
            </button>
          }
        />
      )}

      {editing ? (
        <AgentEditor
          agent={editing}
          onClose={() => setEditing(null)}
          onSave={onSaveAgent}
        />
      ) : null}
    </div>
  );
}

export function KnowledgeView({ workspace, activeAgent, onNavigate, onStartResearch }) {
  const fields = activeAgent
    ? [
        { label: "Company summary", value: activeAgent.company.what_the_company_does },
        { label: "Primary audience", value: activeAgent.company.primary_target_audience },
        {
          label: "Products & services",
          value: (activeAgent.company.key_products_or_services || []).join(", ")
        },
        { label: "Pricing", value: activeAgent.company.pricing_info },
        { label: "FAQ & policies", value: activeAgent.company.faq_info },
        { label: "Location", value: activeAgent.company.location_info }
      ]
    : [];
  const available = fields.filter((field) => field.value).length;

  return (
    <div className="dash-view">
      <PageHeader
        eyebrow="Knowledge base"
        title="Approved company context"
        subtitle="Review what the agent can use when it answers customer questions."
        actions={
          <button
            type="button"
            className="dash-btn"
            onClick={() => onStartResearch(activeAgent?.company?.website_url || "")}
            disabled={!activeAgent}
          >
            <RefreshCw size={15} aria-hidden="true" />
            Re-scan website
          </button>
        }
      />

      {activeAgent ? (
        <div className="dash-knowledge-layout">
          <div className="dash-knowledge-main">
            <section className="dash-card">
              <div className="dash-card-head">
                <div>
                  <p className="dash-eyebrow">Source</p>
                  <h2>{domainLabel(activeAgent.company.website_url)}</h2>
                </div>
                <span className="dash-soft-badge"><CheckCircle2 size={13} /> Indexed</span>
              </div>
              <div className="dash-table-wrap">
                <table className="dash-table">
                  <thead>
                    <tr>
                      <th>Source</th>
                      <th>Pages</th>
                      <th>Confidence</th>
                      <th>Last indexed</th>
                      <th aria-label="Actions" />
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>
                        <div className="dash-source-cell">
                          <span className="dash-source-icon"><Globe2 size={15} aria-hidden="true" /></span>
                          <div>
                            <strong>{activeAgent.company.company_name || "Company website"}</strong>
                            <small>{displayAddress(activeAgent.company.website_url)}</small>
                          </div>
                        </div>
                      </td>
                      <td>{formatNumber(activeAgent.company.pages_fetched)}</td>
                      <td>{activeAgent.company.confidence_score || 0}%</td>
                      <td>{formatRelative(activeAgent.company.scraped_at)}</td>
                      <td>
                        <a href={activeAgent.company.website_url || "#"} target="_blank" rel="noreferrer" className="dash-row-action">
                          Open
                          <ExternalLink size={13} aria-hidden="true" />
                        </a>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>

            <section className="dash-card">
              <div className="dash-card-head">
                <div>
                  <p className="dash-eyebrow">Extracted profile</p>
                  <h2>Company knowledge</h2>
                </div>
                <span className="dash-muted-copy">{available} of {fields.length} fields populated</span>
              </div>
              <div className="dash-knowledge-fields">
                {fields.map((field) => (
                  <Field key={field.label} label={field.label} value={field.value} muted={!field.value} />
                ))}
              </div>
            </section>

            <section className="dash-card">
              <div className="dash-card-head">
                <div>
                  <p className="dash-eyebrow">Page context</p>
                  <h2>What was crawled</h2>
                </div>
              </div>
              {activeAgent.company.website_context ? (
                <div className="dash-context-preview">
                  {activeAgent.company.website_context.slice(0, 1400)}
                </div>
              ) : (
                <p className="dash-muted-copy">The extracted page context is not available in this saved profile.</p>
              )}
            </section>
          </div>

          <aside className="dash-knowledge-rail">
            <section className="dash-card dash-rail-card">
              <div className="dash-card-head">
                <div>
                  <p className="dash-eyebrow">Coverage</p>
                  <h2>Profile confidence</h2>
                </div>
                <strong className="dash-rail-value">{activeAgent.company.confidence_score || 0}%</strong>
              </div>
              <Progress value={activeAgent.company.confidence_score || 0} tone="green" />
              <div className="dash-usage-lines">
                <span><span>Pages analyzed</span><strong>{formatNumber(activeAgent.company.pages_fetched)}</strong></span>
                <span><span>Last scan</span><strong>{formatRelative(activeAgent.company.scraped_at)}</strong></span>
                <span><span>Agent</span><strong>{activeAgent.config.name}</strong></span>
              </div>
            </section>

            <section className="dash-card dash-rail-card">
              <div className="dash-card-head">
                <div>
                  <p className="dash-eyebrow">Readiness</p>
                  <h2>Answer coverage</h2>
                </div>
              </div>
              <div className="dash-readiness-list">
                {fields.slice(0, 5).map((field) => (
                  <span className={field.value ? "is-ready" : ""} key={field.label}>
                    {field.value ? <CheckCircle2 size={14} /> : <Circle size={14} />}
                    {field.label}
                  </span>
                ))}
              </div>
              <button type="button" className="dash-text-link" onClick={() => onNavigate("conversations")}>
                Test an answer
                <ArrowRight size={13} aria-hidden="true" />
              </button>
            </section>

            <section className="dash-card dash-rail-card dash-rail-note">
              <BookOpen size={18} aria-hidden="true" />
              <div>
                <strong>Answers stay grounded</strong>
                <p>The agent uses this profile and tells customers when the website does not contain a verified answer.</p>
              </div>
            </section>
          </aside>
        </div>
      ) : (
        <EmptyState
          icon={BookOpen}
          title="No knowledge base yet"
          copy="Research a company website to build the profile your agent will answer from."
          action={
            <button type="button" className="dash-btn dash-btn-primary" onClick={() => onNavigate("research")}>
              Research a company
              <ArrowRight size={14} aria-hidden="true" />
            </button>
          }
        />
      )}
    </div>
  );
}

export function IntegrationsView({
  workspace,
  activeAgent,
  connectedCount,
  onToggleIntegration,
  onToggleChannel
}) {
  const [category, setCategory] = useState("All");
  const [query, setQuery] = useState("");
  const filtered = useMemo(() => {
    const search = query.trim().toLowerCase();
    return INTEGRATIONS.filter((integration) => {
      const matchesCategory = category === "All" || integration.category === category;
      const matchesQuery = !search || `${integration.name} ${integration.description}`.toLowerCase().includes(search);
      return matchesCategory && matchesQuery;
    });
  }, [category, query]);

  return (
    <div className="dash-view">
      <PageHeader
        eyebrow="Connections"
        title="Integrations & channels"
        subtitle="Connect the tools your team already uses. Connections are saved in test mode while you validate the workflow."
        actions={
          <span className="dash-connection-count">
            <Plug size={14} aria-hidden="true" />
            {connectedCount} connected
          </span>
        }
      />

      <section className="dash-card dash-integrations-panel">
        <div className="dash-integrations-toolbar">
          <div className="dash-tabs" role="tablist" aria-label="Integration categories">
            {INTEGRATION_CATEGORIES.map((item) => (
              <button
                key={item}
                type="button"
                role="tab"
                aria-selected={category === item}
                className={category === item ? "is-active" : ""}
                onClick={() => setCategory(item)}
              >
                {item}
              </button>
            ))}
          </div>
          <label className="dash-inline-search">
            <SearchIcon />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search integrations"
              aria-label="Search integrations"
            />
          </label>
        </div>

        <div className="dash-integration-grid">
          {filtered.map((integration) => {
            const connected = isIntegrationConnected(workspace, integration.id);
            return (
              <article className={`dash-integration-card ${connected ? "is-connected" : ""}`} key={integration.id}>
                <div className="dash-integration-head">
                  <span className="dash-logo-tile">
                    <img src={integration.logo} alt="" loading="lazy" />
                  </span>
                  <div>
                    <h3>{integration.name}</h3>
                    <span>{integration.category}</span>
                  </div>
                  {connected ? <span className="dash-connected-badge"><Check size={12} /> Connected</span> : null}
                </div>
                <p>{integration.description}</p>
                <button
                  type="button"
                  className={`dash-btn dash-btn-small ${connected ? "" : "dash-btn-primary"}`}
                  onClick={() => onToggleIntegration(integration.id)}
                >
                  {connected ? "Disconnect" : "Connect"}
                </button>
              </article>
            );
          })}
        </div>
        {!filtered.length ? <p className="dash-muted-copy">No integrations match this filter.</p> : null}
      </section>

      <section className="dash-card dash-channel-panel">
        <div className="dash-card-head">
          <div>
            <p className="dash-eyebrow">Customer channels</p>
            <h2>Where the agent can answer</h2>
          </div>
          <span className="dash-muted-copy">
            {activeAgent ? activeAgent.config.name : "Create an agent to enable channels"}
          </span>
        </div>
        <div className="dash-channel-grid">
          {CHANNEL_OPTIONS.map((channel) => {
            const enabled = activeAgent?.config.channels.includes(channel.id) || false;
            return (
              <button
                key={channel.id}
                type="button"
                className={`dash-channel-card ${enabled ? "is-enabled" : ""}`}
                onClick={() => onToggleChannel(channel.id)}
                disabled={!activeAgent}
                aria-pressed={enabled}
              >
                <span className="dash-logo-tile dash-logo-tile-small">
                  {channel.logo ? <img src={channel.logo} alt="" loading="lazy" /> : <Globe2 size={18} aria-hidden="true" />}
                </span>
                <span className="dash-channel-copy">
                  <strong>{channel.name}</strong>
                  <small>{channel.description}</small>
                </span>
                <span className={`dash-switch ${enabled ? "is-on" : ""}`} aria-hidden="true"><span /></span>
              </button>
            );
          })}
        </div>
        <p className="dash-form-help">
          Channel toggles are saved with the active agent. Live provider credentials can be connected after testing.
        </p>
      </section>

      <div className="dash-note-strip">
        <ShieldCheck size={17} aria-hidden="true" />
        <p>
          Connections are currently saved as workspace state for testing. No payment method or external OAuth approval is required.
        </p>
      </div>
    </div>
  );
}

function SearchIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-4-4" />
    </svg>
  );
}

export function ConversationsView({
  workspace,
  activeAgent,
  activeMessages,
  chat,
  sendingAgentId,
  onSendMessage,
  onClearChat,
  onSetActiveAgent,
  onNavigate
}) {
  const [draft, setDraft] = useState("");
  const scrollRef = useRef(null);
  const sending = activeAgent ? sendingAgentId === activeAgent.id : false;
  const suggestions = activeAgent
    ? [
        `What does ${activeAgent.company.company_name || "this company"} do?`,
        "How much does it cost?",
        "Where are you located?",
        "How do I contact support?"
      ]
    : [];

  useEffect(() => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [activeMessages.length, sending]);

  const submit = (event) => {
    event.preventDefault();
    if (!draft.trim() || sending) return;
    onSendMessage(draft);
    setDraft("");
  };

  if (!activeAgent) {
    return (
      <div className="dash-view">
        <PageHeader
          eyebrow="Conversations"
          title="Customer conversations"
          subtitle="Test how your agent answers before connecting a live channel."
        />
        <EmptyState
          icon={MessageSquare}
          title="No agent to talk to yet"
          copy="Create an agent from a company website, then test customer questions here."
          action={
            <button type="button" className="dash-btn dash-btn-primary" onClick={() => onNavigate("research")}>
              Create an agent
              <ArrowRight size={14} aria-hidden="true" />
            </button>
          }
        />
      </div>
    );
  }

  return (
    <div className="dash-view dash-conversations-view">
      <PageHeader
        eyebrow="Conversations"
        title="Customer conversations"
        subtitle="Test answers against the approved knowledge base before going live."
        actions={
          <button type="button" className="dash-btn" onClick={() => onClearChat(activeAgent.id)}>
            <Trash2 size={14} aria-hidden="true" />
            Clear conversation
          </button>
        }
      />

      <div className="dash-chat-layout">
        <aside className="dash-card dash-conversation-list" aria-label="Conversations">
          <div className="dash-card-head">
            <div>
              <p className="dash-eyebrow">Inbox</p>
              <h2>Agents</h2>
            </div>
            <span className="dash-count-badge">{workspace.agents.length}</span>
          </div>
          {workspace.agents.map((agent) => {
            const messages = chat[agent.id] || [];
            const last = messages[messages.length - 1];
            return (
              <button
                key={agent.id}
                type="button"
                className={`dash-conversation-item ${agent.id === activeAgent.id ? "is-active" : ""}`}
                onClick={() => onSetActiveAgent(agent.id)}
              >
                <AgentAvatar agent={agent} size="md" />
                <span className="dash-conversation-copy">
                  <strong>{agent.config.name}</strong>
                  <small>{last ? last.text : "No messages yet"}</small>
                  <time>{last ? formatRelative(last.createdAt) : "Ready to test"}</time>
                </span>
              </button>
            );
          })}
        </aside>

        <section className="dash-card dash-chat-panel">
          <header className="dash-chat-head">
            <div className="dash-chat-identity">
              <AgentAvatar agent={activeAgent} size="lg" />
              <div>
                <h2>{activeAgent.config.name}</h2>
                <span><span className="dash-online-dot" aria-hidden="true" /> Knowledge base ready</span>
              </div>
            </div>
            <div className="dash-chat-head-meta">
              <span>{activeAgent.config.channels.length} channels</span>
              <span>{domainLabel(activeAgent.company.website_url)}</span>
            </div>
          </header>

          <div className="dash-chat-messages" ref={scrollRef} aria-live="polite">
            {!activeMessages.length && !sending ? (
              <div className="dash-chat-empty">
                <span className="dash-chat-empty-mark"><BrandMark size={26} /></span>
                <h3>Test the {activeAgent.company.company_name || "company"} agent</h3>
                <p>Ask the kind of question a customer would ask. Answers use the saved company profile.</p>
                <div className="dash-suggestions">
                  {suggestions.map((suggestion) => (
                    <button
                      key={suggestion}
                      type="button"
                      className="dash-suggestion"
                      onClick={() => onSendMessage(suggestion)}
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              activeMessages.map((message) => (
                <div className={`dash-message dash-message-${message.role}`} key={message.id}>
                  {message.role === "assistant" ? (
                    <span className="dash-message-avatar"><Bot size={15} aria-hidden="true" /></span>
                  ) : null}
                  <div className="dash-message-body">
                    <p>{message.text}</p>
                    <time>{formatRelative(message.createdAt)}</time>
                  </div>
                </div>
              ))
            )}
            {sending ? (
              <div className="dash-message dash-message-assistant">
                <span className="dash-message-avatar"><Bot size={15} aria-hidden="true" /></span>
                <div className="dash-typing" aria-label="Agent is typing">
                  <span /><span /><span />
                </div>
              </div>
            ) : null}
          </div>

          <form className="dash-chat-composer" onSubmit={submit}>
            <label htmlFor="dash-chat-input">Message the agent</label>
            <div className="dash-chat-input-row">
              <input
                id="dash-chat-input"
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                placeholder={`Ask ${activeAgent.company.company_name || "the agent"} a question`}
                disabled={sending}
                autoComplete="off"
              />
              <button type="submit" className="dash-send-button" disabled={sending || !draft.trim()} aria-label="Send message">
                {sending ? <Loader2 size={16} className="dash-spin" /> : <Send size={16} />}
              </button>
            </div>
            <small>Replies are grounded in the saved knowledge base. Account-specific questions should be escalated.</small>
          </form>
        </section>
      </div>
    </div>
  );
}

export function AnalyticsView({ workspace, chat, activity, messageCount, remainingCredits }) {
  const days = useMemo(() => {
    const result = [];
    const now = new Date();
    for (let index = 6; index >= 0; index -= 1) {
      const date = new Date(now);
      date.setHours(0, 0, 0, 0);
      date.setDate(date.getDate() - index);
      const next = new Date(date);
      next.setDate(next.getDate() + 1);
      const count = Object.values(chat)
        .flat()
        .filter((message) => message.role === "user")
        .filter((message) => {
          const time = new Date(message.createdAt).getTime();
          return time >= date.getTime() && time < next.getTime();
        }).length;
      result.push({
        key: date.toISOString(),
        label: date.toLocaleDateString("en-US", { weekday: "short" }),
        count
      });
    }
    return result;
  }, [chat]);
  const max = Math.max(1, ...days.map((day) => day.count));

  return (
    <div className="dash-view">
      <PageHeader
        eyebrow="Analytics"
        title="Workspace performance"
        subtitle="Usage, conversation volume, and recent workspace activity."
        actions={
          <button type="button" className="dash-btn" onClick={() => window.print()}>
            <FileText size={15} aria-hidden="true" />
            Export view
          </button>
        }
      />
      <div className="dash-metrics">
        <MetricCard icon={Bot} label="Agents" value={formatNumber(workspace.agents.length)} detail="Active workspace agents" />
        <MetricCard icon={MessagesSquare} label="Messages" value={formatNumber(messageCount)} detail="Across local conversations" accent="purple" />
        <MetricCard icon={FileText} label="Pages analyzed" value={formatNumber(workspace.usage.pagesIndexed)} detail="Company research coverage" accent="green" />
        <MetricCard icon={Zap} label="Credits remaining" value={formatNumber(remainingCredits)} detail="Testing access enabled" accent="amber" />
      </div>

      <div className="dash-analytics-grid">
        <section className="dash-card">
          <div className="dash-card-head">
            <div>
              <p className="dash-eyebrow">Conversation volume</p>
              <h2>Last 7 days</h2>
            </div>
            <span className="dash-soft-badge"><BarChart3 size={13} /> Local history</span>
          </div>
          <div className="dash-chart" role="img" aria-label="Conversation volume over the last seven days">
            {days.map((day) => (
              <div className="dash-chart-column" key={day.key}>
                <span className="dash-chart-value">{day.count}</span>
                <span className="dash-chart-bar" style={{ height: `${Math.max(4, (day.count / max) * 100)}%` }} />
                <span className="dash-chart-label">{day.label}</span>
              </div>
            ))}
          </div>
          {!messageCount ? <p className="dash-chart-empty">Start a test conversation to populate this chart.</p> : null}
        </section>

        <section className="dash-card dash-rail-card">
          <div className="dash-card-head">
            <div>
              <p className="dash-eyebrow">Usage</p>
              <h2>Trial allowance</h2>
            </div>
            <Zap size={16} aria-hidden="true" />
          </div>
          <div className="dash-usage-numbers">
            <strong>{formatNumber(workspace.usage.creditsUsed)}</strong>
            <span>credits used</span>
          </div>
          <Progress value={(workspace.usage.creditsUsed / workspace.usage.creditsLimit) * 100} tone="purple" />
          <div className="dash-usage-lines">
            <span><span>Credits left</span><strong>{formatNumber(remainingCredits)}</strong></span>
            <span><span>Research runs</span><strong>{formatNumber(workspace.usage.scrapes)}</strong></span>
            <span><span>Conversations</span><strong>{formatNumber(workspace.usage.conversations)}</strong></span>
          </div>
          <p className="dash-form-help">No payment verification is required during testing.</p>
        </section>
      </div>

      <section className="dash-card">
        <div className="dash-card-head">
          <div>
            <p className="dash-eyebrow">Activity log</p>
            <h2>Recent workspace events</h2>
          </div>
        </div>
        {activity.length ? (
          <div className="dash-activity-table">
            {activity.map((item) => (
              <div className="dash-activity-row" key={item.id}>
                <span className="dash-activity-mark" aria-hidden="true" />
                <div>
                  <strong>{item.title}</strong>
                  <p>{item.detail}</p>
                </div>
                <time>{formatRelative(item.createdAt)}</time>
              </div>
            ))}
          </div>
        ) : (
          <p className="dash-muted-copy">No activity yet. Research a company to start building the log.</p>
        )}
      </section>
    </div>
  );
}

export function AutomationsView({ workspace, onToggleAutomation, onRunAutomation, onNavigate }) {
  return (
    <div className="dash-view">
      <PageHeader
        eyebrow="Automations"
        title="Keep the workspace current"
        subtitle="Schedule knowledge refreshes and route the moments that need a human."
        actions={
          <button type="button" className="dash-btn" onClick={() => onNavigate("integrations")}>
            <Plug size={15} aria-hidden="true" />
            Manage connections
          </button>
        }
      />
      <div className="dash-automation-grid">
        {AUTOMATIONS.map((automation) => {
          const enabled = workspace.automations.find((item) => item.id === automation.id)?.enabled ?? automation.defaultEnabled;
          return (
            <article className={`dash-card dash-automation-card ${enabled ? "is-enabled" : ""}`} key={automation.id}>
              <div className="dash-automation-head">
                <span className="dash-automation-icon">
                  {automation.id === "knowledge-refresh" ? <RefreshCw size={18} /> : null}
                  {automation.id === "lead-capture" ? <Users size={18} /> : null}
                  {automation.id === "human-handoff" ? <ShieldCheck size={18} /> : null}
                  {automation.id === "weekly-digest" ? <Mail size={18} /> : null}
                </span>
                <button
                  type="button"
                  className={`dash-switch ${enabled ? "is-on" : ""}`}
                  role="switch"
                  aria-checked={enabled}
                  aria-label={`${enabled ? "Disable" : "Enable"} ${automation.name}`}
                  onClick={() => onToggleAutomation(automation.id)}
                >
                  <span />
                </button>
              </div>
              <h2>{automation.name}</h2>
              <p>{automation.description}</p>
              <div className="dash-automation-foot">
                <span><Clock3 size={13} aria-hidden="true" /> {automation.schedule}</span>
                <button type="button" className="dash-text-link" onClick={() => onRunAutomation(automation.id)}>
                  Run now
                  <ArrowRight size={13} aria-hidden="true" />
                </button>
              </div>
            </article>
          );
        })}
      </div>
      <section className="dash-card dash-workflow-card">
        <div className="dash-card-head">
          <div>
            <p className="dash-eyebrow">Workflow</p>
            <h2>Research to resolution</h2>
          </div>
        </div>
        <div className="dash-workflow">
          <div><span>01</span><strong>Company research</strong><p>Website pages are crawled and verified.</p></div>
          <ChevronRight size={16} aria-hidden="true" />
          <div><span>02</span><strong>Knowledge refresh</strong><p>The profile stays current on schedule.</p></div>
          <ChevronRight size={16} aria-hidden="true" />
          <div><span>03</span><strong>Agent resolution</strong><p>Answers use approved context and hand off safely.</p></div>
        </div>
      </section>
      <div className="dash-note-strip">
        <CalendarClock size={17} aria-hidden="true" />
        <p>Automations run in test mode. Live schedules and connected actions will be enabled after provider credentials are added.</p>
      </div>
    </div>
  );
}

export function SettingsView({
  workspace,
  user,
  onSaveWorkspaceName,
  onClearWorkspace,
  onSignOut
}) {
  const [name, setName] = useState(workspace.workspaceName);
  useEffect(() => setName(workspace.workspaceName), [workspace.workspaceName]);

  return (
    <div className="dash-view">
      <PageHeader
        eyebrow="Settings"
        title="Workspace settings"
        subtitle="Manage the workspace name, account access, and testing data."
      />
      <div className="dash-settings-grid">
        <section className="dash-card">
          <div className="dash-card-head">
            <div>
              <p className="dash-eyebrow">General</p>
              <h2>Workspace profile</h2>
            </div>
          </div>
          <form
            className="dash-settings-form"
            onSubmit={(event) => {
              event.preventDefault();
              onSaveWorkspaceName(name);
            }}
          >
            <label>
              <span>Workspace name</span>
              <input value={name} onChange={(event) => setName(event.target.value)} maxLength={80} />
            </label>
            <div className="dash-form-grid">
              <label>
                <span>Workspace type</span>
                <input value="Trial workspace" readOnly />
              </label>
              <label>
                <span>Data storage</span>
                <input value="Backend sync enabled" readOnly />
              </label>
            </div>
            <div className="dash-form-actions">
              <button type="submit" className="dash-btn dash-btn-primary">Save changes</button>
            </div>
          </form>
        </section>

        <section className="dash-card">
          <div className="dash-card-head">
            <div>
              <p className="dash-eyebrow">Account</p>
              <h2>Sign-in and access</h2>
            </div>
            <ShieldCheck size={17} aria-hidden="true" />
          </div>
          <div className="dash-account-row">
            <span className="dash-user-avatar dash-user-avatar-large">{initials(user.fullName || user.firstName || "Dessoir")}</span>
            <div>
              <strong>{user.fullName || user.firstName || "Dessoir account"}</strong>
              <p>{user.primaryEmailAddress?.emailAddress || "Email managed by Clerk"}</p>
            </div>
          </div>
          <div className="dash-settings-list">
            <span><span>Authentication</span><strong>Secured by Clerk</strong></span>
            <span><span>Plan</span><strong>Trial access</strong></span>
            <span><span>Payment verification</span><strong>Disabled for testing</strong></span>
            <span><span>Workspace ID</span><strong className="dash-mono">{user.id}</strong></span>
          </div>
          <button type="button" className="dash-btn" onClick={onSignOut}>
            <LogOut size={14} aria-hidden="true" />
            Sign out
          </button>
        </section>

        <section className="dash-card">
          <div className="dash-card-head">
            <div>
              <p className="dash-eyebrow">Billing</p>
              <h2>Testing access</h2>
            </div>
            <CreditCardIcon />
          </div>
          <div className="dash-billing-state">
            <span className="dash-status dash-status-active"><Check size={12} /> Active</span>
            <p>Payment verification is intentionally disabled while you test the product.</p>
          </div>
          <div className="dash-usage-lines">
            <span><span>Credits used</span><strong>{formatNumber(workspace.usage.creditsUsed)}</strong></span>
            <span><span>Credits included</span><strong>{formatNumber(workspace.usage.creditsLimit)}</strong></span>
            <span><span>Agents</span><strong>{workspace.agents.length}</strong></span>
          </div>
        </section>

        <section className="dash-card dash-danger-zone">
          <div className="dash-card-head">
            <div>
              <p className="dash-eyebrow">Data</p>
              <h2>Workspace data</h2>
            </div>
          </div>
          <p>
            Clear company research, agent settings, connection state, and local conversation history. Your account stays signed in.
          </p>
          <button type="button" className="dash-btn dash-btn-danger" onClick={onClearWorkspace}>
            <Trash2 size={14} aria-hidden="true" />
            Clear workspace data
          </button>
        </section>
      </div>
    </div>
  );
}
