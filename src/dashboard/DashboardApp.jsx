import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useClerk, useUser } from "@clerk/react";
import {
  AlertCircle,
  ArrowRight,
  BarChart3,
  Bell,
  BookOpen,
  Bot,
  Check,
  ChevronRight,
  ChevronsUpDown,
  Cloud,
  CloudOff,
  Gift,
  Globe2,
  House,
  Loader2,
  LogOut,
  Menu,
  MessageSquare,
  Plug,
  Rocket,
  Search,
  Settings,
  ShieldCheck,
  Workflow,
  X
} from "lucide-react";
import { BrandLockup } from "../components/Brand";
import { buildSampleBrief, normalizeBrief } from "../data/sampleBriefs";
import { answerFromKnowledgeBase, sendAgentMessage } from "../services/chatApi";
import { pingN8nStatus } from "../services/scraperApi";
import {
  clearDashboardWorkspace,
  loadDashboardWorkspace,
  saveDashboardWorkspace
} from "../services/dashboardApi";
import {
  INTEGRATIONS,
  MAX_AGENTS,
  addActivity,
  budgetWorkspaceForSync,
  clearLocalWorkspace,
  createAgentFromBrief,
  createId,
  defaultWorkspace,
  formatNumber,
  formatRelative,
  getIntegration,
  initials,
  loadLocalChat,
  loadLocalWorkspace,
  normalizeAgent,
  normalizeWorkspace,
  nowIso,
  saveLocalChat,
  saveLocalWorkspace,
  updateUsage
} from "./dashboardData";
import {
  AgentsView,
  AnalyticsView,
  AutomationsView,
  ConversationsView,
  IntegrationsView,
  KnowledgeView,
  OverviewView,
  ResearchView,
  SettingsView
} from "./views";

const NAV_SECTIONS = [
  {
    label: "",
    items: [{ id: "overview", label: "Overview", icon: House }]
  },
  {
    label: "Build",
    items: [
      { id: "research", label: "Research & crawl", icon: Globe2 },
      { id: "agents", label: "AI agents", icon: Bot, countKey: "agents" },
      { id: "knowledge", label: "Knowledge base", icon: BookOpen }
    ]
  },
  {
    label: "Deploy",
    items: [
      { id: "integrations", label: "Connections", icon: Plug, countKey: "connections" },
      { id: "automations", label: "Automations", icon: Workflow }
    ]
  },
  {
    label: "Data",
    items: [{ id: "conversations", label: "Conversations", icon: MessageSquare, countKey: "messages" }]
  },
  {
    label: "Monitor",
    items: [{ id: "analytics", label: "Analytics", icon: BarChart3 }]
  },
  {
    label: "Account",
    items: [{ id: "settings", label: "Settings", icon: Settings }]
  }
];

const FLAT_NAV = NAV_SECTIONS.flatMap((section) => section.items);
const VIEW_IDS = FLAT_NAV.map((item) => item.id);

const VIEW_COMPONENTS = {
  overview: OverviewView,
  research: ResearchView,
  agents: AgentsView,
  knowledge: KnowledgeView,
  conversations: ConversationsView,
  integrations: IntegrationsView,
  analytics: AnalyticsView,
  automations: AutomationsView,
  settings: SettingsView
};

const SYNC_COPY = {
  loading: { label: "Loading", icon: Loader2 },
  saving: { label: "Saving", icon: Loader2 },
  synced: { label: "Synced", icon: Cloud },
  local: { label: "Saved locally", icon: CloudOff },
  failed: { label: "Sync failed", icon: CloudOff },
  "too-large": { label: "Local only", icon: CloudOff }
};

function readViewFromHash() {
  const value = window.location.hash.replace(/^#\/?/, "");
  return VIEW_IDS.includes(value) ? value : "overview";
}

function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

function timeDelay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const DEMO_DOMAIN = "stripe.com";
const DEMO_PAGES = 128;

function isPristineWorkspace(workspace) {
  return Boolean(
    workspace &&
      !workspace.updatedAt &&
      !workspace.agents.length &&
      !workspace.activity.length
  );
}

function buildDemoWorkspace(current) {
  const base = normalizeWorkspace(current || defaultWorkspace());
  const raw = buildSampleBrief(DEMO_DOMAIN);
  const brief = normalizeBrief(raw, `https://${DEMO_DOMAIN}`) || raw;
  const timestamp = nowIso();
  const agent = normalizeAgent({
    ...createAgentFromBrief({ ...brief, pages_fetched: DEMO_PAGES, scraped_at: timestamp }),
    updatedAt: timestamp
  });
  let next = {
    ...base,
    agents: [agent],
    activeAgentId: agent.id,
    integrations: [
      ...base.integrations.filter((item) => !["stripe", "slack"].includes(item.id)),
      { id: "stripe", connected: true, connectedAt: timestamp },
      { id: "slack", connected: true, connectedAt: timestamp }
    ]
  };
  next = updateUsage(next, {
    scrapes: base.usage.scrapes + 1,
    pagesIndexed: base.usage.pagesIndexed + DEMO_PAGES,
    creditsUsed: base.usage.creditsUsed + 1
  });
  next = addActivity(
    next,
    "Sample workspace loaded",
    `${agent.company.company_name || "Company"} is ready with ${DEMO_PAGES} pages analyzed.`,
    "research"
  );
  return normalizeWorkspace({ ...next, updatedAt: timestamp });
}

function DashboardGate({ signedOut }) {
  return (
    <div className="dash-gate">
      <div className="dash-gate-card">
        <BrandLockup subtitle="Workspace" />
        <div className="dash-gate-state">
          {signedOut ? (
            <ShieldCheck size={16} aria-hidden="true" />
          ) : (
            <Loader2 size={16} className="dash-spin" aria-hidden="true" />
          )}
          <span>{signedOut ? "Taking you to sign in." : "Loading your workspace."}</span>
        </div>
      </div>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="dash-app dash-app-loading" aria-busy="true" aria-label="Loading dashboard">
      <aside className="dash-sidebar">
        <div className="dash-sidebar-brand">
          <BrandLockup href="/dashboard.html" />
        </div>
        <div className="dash-skeleton dash-skeleton-workspace" />
        <div className="dash-skeleton-group">
          <div className="dash-skeleton dash-skeleton-nav" />
          <div className="dash-skeleton dash-skeleton-nav" />
          <div className="dash-skeleton dash-skeleton-nav" />
          <div className="dash-skeleton dash-skeleton-nav" />
        </div>
      </aside>
      <div className="dash-main">
        <div className="dash-topbar">
          <div className="dash-skeleton dash-skeleton-search" />
          <div className="dash-skeleton dash-skeleton-avatar" />
        </div>
        <div className="dash-content">
          <div className="dash-skeleton dash-skeleton-title" />
          <div className="dash-skeleton-grid">
            <div className="dash-skeleton dash-skeleton-card" />
            <div className="dash-skeleton dash-skeleton-card" />
            <div className="dash-skeleton dash-skeleton-card" />
          </div>
        </div>
      </div>
    </div>
  );
}

function SearchPalette({ open, onClose, query, onQueryChange, results, onSelect }) {
  const inputRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const timer = window.setTimeout(() => inputRef.current?.focus(), 30);
    const onKeyDown = (event) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => {
      window.clearTimeout(timer);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="dash-overlay" role="presentation" onMouseDown={onClose}>
      <section
        className="dash-command"
        role="dialog"
        aria-modal="true"
        aria-label="Search workspace"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="dash-command-input">
          <Search size={18} aria-hidden="true" />
          <input
            ref={inputRef}
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
            placeholder="Search agents, pages, and integrations"
            aria-label="Search workspace"
          />
          <button type="button" className="dash-key" onClick={onClose}>
            Esc
          </button>
        </div>
        <div className="dash-command-results">
          {results.length ? (
            results.map((result) => (
              <button
                key={result.key}
                type="button"
                className="dash-command-result"
                onClick={() => {
                  onSelect(result);
                  onClose();
                }}
              >
                <span className="dash-command-icon">{result.icon}</span>
                <span className="dash-command-copy">
                  <strong>{result.label}</strong>
                  <small>{result.meta}</small>
                </span>
                <ChevronRight size={15} aria-hidden="true" />
              </button>
            ))
          ) : (
            <p className="dash-command-empty">No matching workspace items.</p>
          )}
        </div>
      </section>
    </div>
  );
}

function NotificationsPanel({ open, activity, onClose, onNavigate }) {
  const panelRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const onMouseDown = (event) => {
      if (!panelRef.current?.contains(event.target)) onClose();
    };
    const onKeyDown = (event) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("mousedown", onMouseDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onMouseDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="dash-popover dash-notifications" ref={panelRef} role="dialog" aria-label="Recent activity">
      <div className="dash-popover-head">
        <strong>Recent activity</strong>
        <button type="button" className="dash-icon-button" onClick={onClose} aria-label="Close notifications">
          <X size={15} />
        </button>
      </div>
      {activity.length ? (
        <div className="dash-notification-list">
          {activity.slice(0, 5).map((item) => (
            <div className="dash-notification" key={item.id}>
              <span className="dash-notification-dot" aria-hidden="true" />
              <div>
                <strong>{item.title}</strong>
                {item.detail ? <p>{item.detail}</p> : null}
                <time>{formatRelative(item.createdAt)}</time>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="dash-popover-empty">Activity from research, agents, and connections will appear here.</p>
      )}
      <button
        type="button"
        className="dash-popover-link"
        onClick={() => {
          onNavigate("analytics");
          onClose();
        }}
      >
        View all activity
        <ArrowRight size={14} aria-hidden="true" />
      </button>
    </div>
  );
}

export default function DashboardApp() {
  const { isLoaded, isSignedIn, user } = useUser();
  const { signOut } = useClerk();
  const userId = user?.id || "";
  const [workspace, setWorkspace] = useState(null);
  const [chat, setChat] = useState({});
  const [view, setView] = useState(readViewFromHash);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notificationsSeen, setNotificationsSeen] = useState(false);
  const [syncState, setSyncState] = useState("loading");
  const [serviceOnline, setServiceOnline] = useState(null);
  const [toast, setToast] = useState(null);
  const [researchSeed, setResearchSeed] = useState(null);
  const [sendingAgentId, setSendingAgentId] = useState("");
  const [confirmState, setConfirmState] = useState(null);

  const workspaceRef = useRef(null);
  const chatRef = useRef({});
  const hydratedRef = useRef(false);
  const dirtyRef = useRef(false);
  const sendingRef = useRef(false);
  const saveTimerRef = useRef(null);
  const toastTimerRef = useRef(null);
  const initialWebsiteRef = useRef(
    typeof window === "undefined" ? "" : new URLSearchParams(window.location.search).get("website") || ""
  );

  const showToast = useCallback((message, tone = "default") => {
    window.clearTimeout(toastTimerRef.current);
    setToast({ message, tone, id: Date.now() });
    toastTimerRef.current = window.setTimeout(() => setToast(null), 4200);
  }, []);

  useEffect(() => {
    workspaceRef.current = workspace;
  }, [workspace]);

  useEffect(() => {
    chatRef.current = chat;
  }, [chat]);

  useEffect(() => {
    if (!userId || !workspace) return;
    saveLocalWorkspace(userId, workspace);
  }, [userId, workspace]);

  useEffect(() => {
    if (!userId) return;
    saveLocalChat(userId, chat);
  }, [userId, chat]);

  useEffect(() => {
    if (!userId) return undefined;
    let active = true;
    hydratedRef.current = false;
    const local = loadLocalWorkspace(userId);
    setChat(loadLocalChat(userId));
    setWorkspace(local);
    setSyncState("loading");

    loadDashboardWorkspace().then((result) => {
      if (!active) return;
      let next = local;
      let shouldPush = false;
      if (result.ok && result.workspace) {
        const remote = normalizeWorkspace(result.workspace);
        const localTime = local.updatedAt ? new Date(local.updatedAt).getTime() : 0;
        const remoteTime = remote.updatedAt ? new Date(remote.updatedAt).getTime() : 0;
        if (remoteTime >= localTime) {
          next = remote;
        } else {
          shouldPush = true;
        }
      } else if (result.ok && local.updatedAt) {
        shouldPush = true;
      }
      const seeded = isPristineWorkspace(next);
      if (seeded) {
        next = buildDemoWorkspace(next);
        shouldPush = true;
        dirtyRef.current = true;
        showToast("Demo workspace loaded.", "success");
      }
      setWorkspace(next);
      saveLocalWorkspace(userId, next);
      hydratedRef.current = true;
      if (!result.ok) {
        setSyncState("local");
      } else if (shouldPush) {
        dirtyRef.current = true;
        setSyncState("saving");
      } else {
        setSyncState("synced");
      }
    });

    return () => {
      active = false;
    };
  }, [showToast, userId]);

  useEffect(() => {
    if (!userId) return undefined;
    const onHashChange = () => setView(readViewFromHash());
    window.addEventListener("hashchange", onHashChange);
    if (!window.location.hash) {
      window.history.replaceState(null, "", "#overview");
    }
    return () => window.removeEventListener("hashchange", onHashChange);
  }, [userId]);

  useEffect(() => {
    let active = true;
    const check = () => {
      pingN8nStatus().then((online) => {
        if (active) setServiceOnline(online);
      });
    };
    check();
    const interval = window.setInterval(check, 60000);
    return () => {
      active = false;
      window.clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    if (!isLoaded || isSignedIn) return;
    window.location.replace("/auth.html?mode=signin");
  }, [isLoaded, isSignedIn]);

  useEffect(() => {
    if (!isSignedIn) return undefined;
    const onKeyDown = (event) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isSignedIn]);

  useEffect(() => {
    return () => window.clearTimeout(toastTimerRef.current);
  }, []);

  const performSave = useCallback(
    async (candidate) => {
      if (!candidate) return;
      const budgeted = budgetWorkspaceForSync(candidate);
      if (!budgeted) {
        setSyncState("too-large");
        return;
      }
      setSyncState("saving");
      const result = await saveDashboardWorkspace(budgeted.workspace);
      if (result.ok) {
        setSyncState("synced");
      } else {
        setSyncState(result.status === 413 ? "too-large" : "local");
      }
    },
    []
  );

  useEffect(() => {
    if (!hydratedRef.current || !dirtyRef.current || !workspace) return undefined;
    const timer = window.setTimeout(() => {
      saveTimerRef.current = null;
      dirtyRef.current = false;
      performSave(workspaceRef.current);
    }, 900);
    saveTimerRef.current = timer;
    return () => window.clearTimeout(timer);
  }, [workspace, performSave]);

  const mutateWorkspace = useCallback((updater) => {
    setWorkspace((current) => {
      const base = current || defaultWorkspace();
      const next = normalizeWorkspace(updater(base));
      return { ...next, updatedAt: nowIso() };
    });
    dirtyRef.current = true;
  }, []);

  const syncNow = useCallback(async () => {
    if (!workspaceRef.current) return;
    dirtyRef.current = false;
    await performSave(workspaceRef.current);
  }, [performSave]);

  const navigate = useCallback((id) => {
    if (!VIEW_IDS.includes(id)) return;
    setView(id);
    setMobileNavOpen(false);
    if (window.location.hash !== `#${id}`) {
      window.location.hash = id;
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const startResearch = useCallback(
    (url = "") => {
      setResearchSeed({ url, key: Date.now() });
      navigate("research");
    },
    [navigate]
  );

  useEffect(() => {
    if (!workspace || !initialWebsiteRef.current) return;
    const website = initialWebsiteRef.current;
    initialWebsiteRef.current = "";
    setResearchSeed({ url: website, key: Date.now() });
    navigate("research");
  }, [navigate, workspace]);

  const handleAgentCreated = useCallback(
    (agent, brief, options = {}) => {
      const current = workspaceRef.current;
      if (!current) return false;
      if (current.agents.length >= MAX_AGENTS) {
        showToast(`Test mode supports up to ${MAX_AGENTS} agents. Remove one before adding another.`, "error");
        return false;
      }
      const timestamp = nowIso();
      const nextAgent = normalizeAgent({ ...agent, updatedAt: timestamp });
      const pages = Math.max(Number(brief?.pages_fetched) || 0, options.sample ? 128 : 1);
      let next = {
        ...current,
        agents: [...current.agents, nextAgent],
        activeAgentId: nextAgent.id
      };
      if (options.sample) {
        next.integrations = [
          ...current.integrations.filter((item) => !["stripe", "slack"].includes(item.id)),
          { id: "stripe", connected: true, connectedAt: timestamp },
          { id: "slack", connected: true, connectedAt: timestamp }
        ];
      }
      next = updateUsage(next, {
        scrapes: current.usage.scrapes + 1,
        pagesIndexed: current.usage.pagesIndexed + pages,
        creditsUsed: current.usage.creditsUsed + 1
      });
      next = addActivity(
        next,
        options.sample ? "Sample workspace loaded" : "Company research completed",
        `${nextAgent.company.company_name || "Company"} is ready with ${pages} page${pages === 1 ? "" : "s"} analyzed.`,
        "research"
      );
      dirtyRef.current = true;
      setWorkspace(normalizeWorkspace({ ...next, updatedAt: timestamp }));
      showToast(options.sample ? "Sample workspace loaded." : "Company research is ready.", "success");
      return true;
    },
    [showToast]
  );

  const loadSampleWorkspace = useCallback(() => {
    const raw = buildSampleBrief("stripe.com");
    const brief = normalizeBrief(raw, "https://stripe.com") || raw;
    const agent = createAgentFromBrief(brief);
    if (handleAgentCreated(agent, brief, { sample: true })) {
      navigate("overview");
    }
  }, [handleAgentCreated, navigate]);

  const handleSaveAgent = useCallback(
    (agentId, patch) => {
      mutateWorkspace((current) => {
        const agents = current.agents.map((agent) => {
          if (agent.id !== agentId) return agent;
          return normalizeAgent({
            ...agent,
            config: { ...agent.config, ...patch },
            updatedAt: nowIso()
          });
        });
        return addActivity(
          { ...current, agents },
          "Agent updated",
          `${patch.name || "Agent"} settings were saved.`,
          "agent"
        );
      });
      showToast("Agent settings saved.", "success");
    },
    [mutateWorkspace, showToast]
  );

  const handleDeleteAgent = useCallback(
    (agentId) => {
      const agent = workspaceRef.current?.agents.find((item) => item.id === agentId);
      mutateWorkspace((current) => {
        const agents = current.agents.filter((item) => item.id !== agentId);
        return addActivity(
          {
            ...current,
            agents,
            activeAgentId: current.activeAgentId === agentId ? agents[0]?.id || "" : current.activeAgentId
          },
          "Agent removed",
          `${agent?.config?.name || "The agent"} was removed from the workspace.`,
          "agent"
        );
      });
      setChat((current) => {
        const next = { ...current };
        delete next[agentId];
        return next;
      });
      setConfirmState(null);
      showToast("Agent removed.");
    },
    [mutateWorkspace, showToast]
  );

  const handleSetActiveAgent = useCallback(
    (agentId) => {
      mutateWorkspace((current) => ({ ...current, activeAgentId: agentId }));
    },
    [mutateWorkspace]
  );

  const handleToggleIntegration = useCallback(
    (integrationId) => {
      const integration = getIntegration(integrationId);
      const existing = workspaceRef.current?.integrations.find((item) => item.id === integrationId);
      const connected = !existing?.connected;
      mutateWorkspace((current) => {
        const next = current.integrations.filter((item) => item.id !== integrationId);
        next.push({
          id: integrationId,
          connected,
          connectedAt: connected ? nowIso() : null
        });
        return addActivity(
          { ...current, integrations: next },
          connected ? `${integration?.name || "Integration"} connected` : `${integration?.name || "Integration"} disconnected`,
          connected ? "Connection saved in test mode." : "The connection was removed from this workspace.",
          "integration"
        );
      });
      showToast(`${integration?.name || "Integration"} ${connected ? "connected" : "disconnected"} in test mode.`);
    },
    [mutateWorkspace, showToast]
  );

  const handleToggleChannel = useCallback(
    (channelId) => {
      const agent = workspaceRef.current?.agents.find((item) => item.id === workspaceRef.current.activeAgentId);
      if (!agent) {
        showToast("Create an agent before enabling customer channels.", "error");
        return;
      }
      mutateWorkspace((current) => {
        const agents = current.agents.map((item) => {
          if (item.id !== current.activeAgentId) return item;
          const channels = item.config.channels.includes(channelId)
            ? item.config.channels.filter((id) => id !== channelId)
            : [...item.config.channels, channelId];
          return normalizeAgent({
            ...item,
            config: { ...item.config, channels },
            updatedAt: nowIso()
          });
        });
        return { ...current, agents };
      });
    },
    [mutateWorkspace, showToast]
  );

  const handleToggleAutomation = useCallback(
    (automationId) => {
      mutateWorkspace((current) => ({
        ...current,
        automations: current.automations.map((item) =>
          item.id === automationId ? { ...item, enabled: !item.enabled } : item
        )
      }));
    },
    [mutateWorkspace]
  );

  const handleRunAutomation = useCallback(
    (automationId) => {
      if (automationId === "knowledge-refresh") {
        const agent = workspaceRef.current?.agents.find((item) => item.id === workspaceRef.current.activeAgentId);
        startResearch(agent?.company?.website_url || "");
        showToast("Knowledge refresh opened.");
        return;
      }
      showToast("Automation triggered in test mode.");
    },
    [showToast, startResearch]
  );

  const handleSaveWorkspaceName = useCallback(
    (name) => {
      const clean = String(name || "").trim();
      if (!clean) {
        showToast("Add a workspace name.", "error");
        return;
      }
      mutateWorkspace((current) => ({ ...current, workspaceName: clean }));
      showToast("Workspace settings saved.", "success");
    },
    [mutateWorkspace, showToast]
  );

  const handleClearWorkspace = useCallback(async () => {
    setConfirmState(null);
    const empty = { ...defaultWorkspace(), updatedAt: nowIso() };
    clearLocalWorkspace(userId);
    setChat({});
    saveLocalChat(userId, {});
    setWorkspace(empty);
    dirtyRef.current = true;
    setSyncState("saving");
    const result = await clearDashboardWorkspace();
    window.clearTimeout(saveTimerRef.current);
    saveTimerRef.current = null;
    if (result.ok) {
      dirtyRef.current = false;
      setSyncState("synced");
    } else {
      setSyncState("local");
    }
    showToast(
      result.ok ? "Workspace data cleared." : "Workspace cleared on this device. Server sync is unavailable.",
      result.ok ? "success" : "error"
    );
  }, [showToast, userId]);

  const handleSendMessage = useCallback(
    async (text) => {
      const message = String(text || "").trim();
      const current = workspaceRef.current;
      const agent = current?.agents.find((item) => item.id === current.activeAgentId) || current?.agents[0];
      if (!message || !agent || sendingRef.current) return;

      sendingRef.current = true;
      setSendingAgentId(agent.id);
      const previous = chatRef.current[agent.id] || [];
      const userMessage = {
        id: createId("message"),
        role: "user",
        text: message.slice(0, 4000),
        createdAt: nowIso()
      };
      setChat((existing) => ({
        ...existing,
        [agent.id]: [...(existing[agent.id] || []), userMessage].slice(-40)
      }));
      mutateWorkspace((existing) => {
        const updated = updateUsage(existing, {
          messages: existing.usage.messages + 1,
          conversations: previous.length ? existing.usage.conversations : existing.usage.conversations + 1,
          creditsUsed: existing.usage.creditsUsed + 1
        });
        return updated;
      });

      let reply = "";
      try {
        const online = await pingN8nStatus();
        if (!online) {
          await timeDelay(360);
          reply = answerFromKnowledgeBase(message, agent.company);
        } else {
          reply = await sendAgentMessage(message, agent.company, previous.slice(-6));
        }
      } catch {
        reply = answerFromKnowledgeBase(message, agent.company);
      }

      const safeReply =
        reply ||
        answerFromKnowledgeBase(message, agent.company) ||
        "I do not have enough verified information to answer that yet.";
      const assistantMessage = {
        id: createId("message"),
        role: "assistant",
        text: safeReply.slice(0, 4000),
        createdAt: nowIso()
      };
      setChat((existing) => ({
        ...existing,
        [agent.id]: [...(existing[agent.id] || []), assistantMessage].slice(-40)
      }));
      setSendingAgentId("");
      sendingRef.current = false;
    },
    [mutateWorkspace]
  );

  const handleClearChat = useCallback(
    (agentId) => {
      setChat((current) => {
        const next = { ...current };
        delete next[agentId];
        return next;
      });
      showToast("Conversation cleared.");
    },
    [showToast]
  );

  const handleSignOut = useCallback(async () => {
    await signOut({ redirectUrl: "/" });
  }, [signOut]);

  const activeAgent = useMemo(() => {
    if (!workspace) return null;
    return (
      workspace.agents.find((agent) => agent.id === workspace.activeAgentId) ||
      workspace.agents[0] ||
      null
    );
  }, [workspace]);

  const activeMessages = activeAgent ? chat[activeAgent.id] || [] : [];
  const messageCount = useMemo(
    () => Object.values(chat).reduce((total, messages) => total + messages.length, 0),
    [chat]
  );
  const connectedCount = workspace?.integrations.filter((item) => item.connected).length || 0;
  const remainingCredits = workspace
    ? Math.max(0, workspace.usage.creditsLimit - workspace.usage.creditsUsed)
    : 0;
  const activity = workspace?.activity || [];
  const syncInfo = SYNC_COPY[syncState] || SYNC_COPY.local;
  const SyncIcon = syncInfo.icon;
  const firstName = user?.firstName || user?.fullName?.split(" ")[0] || user?.username || "there";

  const searchResults = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    const navResults = FLAT_NAV.map((item) => ({
      key: `nav-${item.id}`,
      label: item.label,
      meta: "Go to page",
      icon: <item.icon size={17} aria-hidden="true" />,
      action: () => navigate(item.id)
    }));
    const agentResults = (workspace?.agents || []).map((agent) => ({
      key: `agent-${agent.id}`,
      label: agent.config.name,
      meta: `${agent.company.company_name || "Company"} agent`,
      icon: <Bot size={17} aria-hidden="true" />,
      action: () => {
        handleSetActiveAgent(agent.id);
        navigate("conversations");
      }
    }));
    const integrationResults = INTEGRATIONS.map((item) => ({
      key: `integration-${item.id}`,
      label: item.name,
      meta: `${item.category} integration`,
      icon: <Plug size={17} aria-hidden="true" />,
      action: () => navigate("integrations")
    }));
    return [...navResults, ...agentResults, ...integrationResults]
      .filter((item) => !query || `${item.label} ${item.meta}`.toLowerCase().includes(query))
      .slice(0, 9);
  }, [handleSetActiveAgent, navigate, searchQuery, workspace?.agents]);

  if (!isLoaded || !isSignedIn || !user) {
    return <DashboardGate signedOut={isLoaded && !isSignedIn} />;
  }

  if (!workspace) {
    return <DashboardSkeleton />;
  }

  const navCounts = {
    agents: workspace.agents.length,
    messages: messageCount,
    connections: connectedCount
  };
  const setupSteps = [
    workspace.agents.length > 0,
    workspace.agents.some((agent) => agent.company?.pages_fetched > 0),
    connectedCount > 0,
    workspace.automations.some((automation) => automation.enabled),
    messageCount > 0
  ];
  const setupCount = setupSteps.filter(Boolean).length;
  const setupPercent = Math.round((setupCount / setupSteps.length) * 100);
  const setupNextView = !setupSteps[0]
    ? "research"
    : !setupSteps[2]
      ? "integrations"
      : !setupSteps[4]
        ? "conversations"
        : "overview";
  const workspaceInitial = (workspace.workspaceName || "Dessoir").trim().charAt(0).toUpperCase();
  const trialPercent = Math.min(
    100,
    Math.round(((workspace.usage.creditsLimit - remainingCredits) / workspace.usage.creditsLimit) * 100)
  );
  const ActiveView = VIEW_COMPONENTS[view] || OverviewView;
  const viewProps = {
    workspace,
    activeAgent,
    activeMessages,
    activity,
    chat,
    connectedCount,
    firstName,
    greeting: greeting(),
    messageCount,
    onAgentCreated: handleAgentCreated,
    onClearChat: handleClearChat,
    onClearWorkspace: () => setConfirmState({ kind: "clear" }),
    onDeleteAgent: (agentId) => setConfirmState({ kind: "agent", agentId }),
    onLoadSample: loadSampleWorkspace,
    onNavigate: navigate,
    onRunAutomation: handleRunAutomation,
    onSaveAgent: handleSaveAgent,
    onSaveWorkspaceName: handleSaveWorkspaceName,
    onSendMessage: handleSendMessage,
    onSetActiveAgent: handleSetActiveAgent,
    onSignOut: handleSignOut,
    onStartResearch: startResearch,
    onToggleAutomation: handleToggleAutomation,
    onToggleChannel: handleToggleChannel,
    onToggleIntegration: handleToggleIntegration,
    remainingCredits,
    researchSeed,
    sendingAgentId,
    serviceOnline,
    showToast,
    user
  };

  return (
    <div className={`dash-app ${mobileNavOpen ? "dash-nav-open" : ""}`}>
      <a className="dash-skip" href="#dash-main">
        Skip to content
      </a>

      {mobileNavOpen ? (
        <button
          type="button"
          className="dash-nav-scrim"
          aria-label="Close navigation"
          onClick={() => setMobileNavOpen(false)}
        />
      ) : null}

      <aside className="dash-sidebar" aria-label="Workspace navigation">
        <div className="dash-sidebar-brand">
          <BrandLockup href="/dashboard.html" />
          <button
            type="button"
            className="dash-icon-button dash-sidebar-close"
            aria-label="Close navigation"
            onClick={() => setMobileNavOpen(false)}
          >
            <X size={18} />
          </button>
        </div>

        <button type="button" className="dash-workspace" onClick={() => navigate("settings")}>
          <span className="dash-workspace-mark" aria-hidden="true">{workspaceInitial}</span>
          <span className="dash-workspace-copy">
            <small>Workspace</small>
            <strong>{workspace.workspaceName}</strong>
          </span>
          <ChevronsUpDown size={15} aria-hidden="true" />
        </button>

        <nav className="dash-nav">
          {NAV_SECTIONS.map((section) => (
            <div className="dash-nav-section" key={section.label || "primary"}>
              {section.label ? <p className="dash-nav-label">{section.label}</p> : null}
              {section.items.map((item) => {
                const count = item.countKey ? navCounts[item.countKey] : 0;
                const isActive = view === item.id;
                return (
                  <a
                    key={item.id}
                    href={`#${item.id}`}
                    className={`dash-nav-link ${isActive ? "is-active" : ""}`}
                    aria-current={isActive ? "page" : undefined}
                    onClick={(event) => {
                      event.preventDefault();
                      navigate(item.id);
                    }}
                  >
                    <item.icon size={18} strokeWidth={1.8} aria-hidden="true" />
                    <span>{item.label}</span>
                    {count ? <small>{count}</small> : null}
                  </a>
                );
              })}
            </div>
          ))}
        </nav>

        <button
          type="button"
          className="dash-getting-started"
          onClick={() => navigate(setupNextView)}
          aria-label={`Getting started, ${setupCount} of ${setupSteps.length} steps complete`}
        >
          <span className="dash-getting-icon" aria-hidden="true">
            <Rocket size={17} />
          </span>
          <span className="dash-getting-copy">
            <span className="dash-getting-head">
              <strong>Getting started</strong>
              <small>{setupCount}/{setupSteps.length}</small>
            </span>
            <span className="dash-getting-sub">
              {setupCount === setupSteps.length ? "Workspace is ready" : "Finish setting up your workspace"}
            </span>
            <span className="dash-getting-progress" aria-hidden="true">
              <span style={{ width: `${setupPercent}%` }} />
            </span>
          </span>
          <ChevronRight size={15} aria-hidden="true" />
        </button>

        <button type="button" className="dash-trial" onClick={() => navigate("settings")}>
          <span className="dash-trial-head">
            <span>
              <Gift size={15} aria-hidden="true" />
              Free trial
            </span>
            <ChevronRight size={15} aria-hidden="true" />
          </span>
          <span className="dash-trial-copy">No payment verification while you test the workspace.</span>
          <span className="dash-progress">
            <span style={{ width: `${trialPercent}%` }} />
          </span>
          <small>{formatNumber(remainingCredits)} of {formatNumber(workspace.usage.creditsLimit)} credits left</small>
        </button>

        <div className="dash-user">
          <span className="dash-user-avatar">
            {initials(user.fullName || user.firstName || "Dessoir")}
            <span className="dash-user-presence" aria-hidden="true" />
          </span>
          <span className="dash-user-copy">
            <strong>{user.fullName || user.firstName || "Account"}</strong>
            <small>{user.primaryEmailAddress?.emailAddress || "Test workspace"}</small>
          </span>
          <button type="button" className="dash-icon-button" aria-label="Sign out" onClick={handleSignOut}>
            <LogOut size={16} />
          </button>
        </div>
      </aside>

      <div className="dash-main">
        <header className="dash-topbar">
          <button
            type="button"
            className="dash-icon-button dash-mobile-menu"
            aria-label="Open navigation"
            onClick={() => setMobileNavOpen(true)}
          >
            <Menu size={19} />
          </button>

          <div className="dash-breadcrumb">
            <span>Workspace</span>
            <ChevronRight size={13} aria-hidden="true" />
            <strong>{FLAT_NAV.find((item) => item.id === view)?.label || "Overview"}</strong>
          </div>

          <button type="button" className="dash-search-trigger" onClick={() => setSearchOpen(true)}>
            <Search size={16} aria-hidden="true" />
            <span>Search workspace</span>
            <kbd>Ctrl K</kbd>
          </button>

          <div className="dash-topbar-actions">
            <button
              type="button"
              className={`dash-sync dash-sync-${syncState}`}
              onClick={syncNow}
              title="Sync workspace with the backend"
            >
              <SyncIcon size={14} className={syncState === "saving" || syncState === "loading" ? "dash-spin" : ""} aria-hidden="true" />
              <span>{syncInfo.label}</span>
            </button>

            <button
              type="button"
              className="dash-credit-pill"
              onClick={() => navigate("settings")}
              title="Testing access is enabled"
            >
              <span className="dash-credit-dot" aria-hidden="true" />
              {formatNumber(remainingCredits)} credits
            </button>

            <div className="dash-topbar-popover">
              <button
                type="button"
                className="dash-icon-button dash-notification-button"
                aria-label="Recent activity"
                aria-expanded={notificationsOpen}
                onClick={() => {
                  setNotificationsOpen((open) => !open);
                  setNotificationsSeen(true);
                }}
              >
                <Bell size={18} />
                {!notificationsSeen && activity.length ? (
                  <span className="dash-notification-badge" aria-hidden="true" />
                ) : null}
              </button>
              <NotificationsPanel
                open={notificationsOpen}
                activity={activity}
                onClose={() => setNotificationsOpen(false)}
                onNavigate={navigate}
              />
            </div>

            <button type="button" className="dash-avatar-button" onClick={() => navigate("settings")} aria-label="Open account settings">
              {initials(user.fullName || user.firstName || "Dessoir")}
            </button>
          </div>
        </header>

        <main className="dash-content" id="dash-main">
          <ActiveView {...viewProps} />
        </main>
      </div>

      <SearchPalette
        open={searchOpen}
        onClose={() => setSearchOpen(false)}
        query={searchQuery}
        onQueryChange={setSearchQuery}
        results={searchResults}
        onSelect={(result) => result.action()}
      />

      {toast ? (
        <div className={`dash-toast dash-toast-${toast.tone}`} role="status">
          {toast.tone === "error" ? <AlertCircle size={16} /> : <Check size={16} />}
          <span>{toast.message}</span>
          <button type="button" className="dash-icon-button" onClick={() => setToast(null)} aria-label="Dismiss notification">
            <X size={14} />
          </button>
        </div>
      ) : null}

      {confirmState ? (
        <div className="dash-overlay" role="presentation" onMouseDown={() => setConfirmState(null)}>
          <section
            className="dash-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="dash-confirm-title"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <span className="dash-dialog-icon">
              <AlertCircle size={19} aria-hidden="true" />
            </span>
            <h2 id="dash-confirm-title">
              {confirmState.kind === "clear" ? "Clear workspace data?" : "Remove this agent?"}
            </h2>
            <p>
              {confirmState.kind === "clear"
                ? "This removes company research, agents, connections, and conversation history from this workspace."
                : "The agent, its knowledge profile, and local conversation history will be removed."}
            </p>
            <div className="dash-dialog-actions">
              <button type="button" className="dash-btn" onClick={() => setConfirmState(null)}>
                Cancel
              </button>
              <button
                type="button"
                className="dash-btn dash-btn-danger"
                onClick={() => {
                  if (confirmState.kind === "clear") handleClearWorkspace();
                  if (confirmState.kind === "agent") handleDeleteAgent(confirmState.agentId);
                }}
              >
                {confirmState.kind === "clear" ? "Clear workspace" : "Remove agent"}
              </button>
            </div>
          </section>
        </div>
      ) : null}
    </div>
  );
}
