import calendlyLogo from "../assets/logos/calendly.svg";
import chatbaseLogo from "../assets/logos/chatbase.png";
import emailLogo from "../assets/logos/email.svg";
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
import { asList, asText, cleanDomain, normalizeUrl } from "../data/sampleBriefs";

export const WORKSPACE_VERSION = 1;
export const STORE_PREFIX = "dessoir.dashboard.workspace.v1";
export const CHAT_PREFIX = "dessoir.dashboard.chat.v1";
export const MAX_AGENTS = 2;
export const TRIAL_CREDITS = 10000;
export const MAX_SYNC_BYTES = 7200;

export const INTEGRATIONS = [
  {
    id: "salesforce",
    name: "Salesforce",
    category: "CRM",
    description: "Sync customer records, leads, and support context.",
    logo: salesforceLogo
  },
  {
    id: "hubspot",
    name: "HubSpot",
    category: "CRM",
    description: "Create contacts and keep deal activity up to date.",
    logo: hubspotLogo
  },
  {
    id: "zoho",
    name: "Zoho CRM",
    category: "CRM",
    description: "Push qualified conversations into your CRM pipeline.",
    logo: zohoLogo
  },
  {
    id: "odoo",
    name: "Odoo",
    category: "CRM",
    description: "Connect customer records and service workflows.",
    logo: odooLogo
  },
  {
    id: "zendesk",
    name: "Zendesk",
    category: "Support",
    description: "Escalate unresolved questions into support tickets.",
    logo: zendeskLogo
  },
  {
    id: "intercom",
    name: "Intercom",
    category: "Support",
    description: "Hand off conversations with full customer context.",
    logo: intercomLogo
  },
  {
    id: "freshdesk",
    name: "Freshdesk",
    category: "Support",
    description: "Create tickets and route urgent requests to your team.",
    logo: freshdeskLogo
  },
  {
    id: "gorgias",
    name: "Gorgias",
    category: "Support",
    description: "Resolve commerce support requests in one place.",
    logo: gorgiasLogo
  },
  {
    id: "helpscout",
    name: "Help Scout",
    category: "Support",
    description: "Send conversations to the right support inbox.",
    logo: helpscoutLogo
  },
  {
    id: "chatbase",
    name: "Chatbase",
    category: "Support",
    description: "Compare answers and keep your knowledge base aligned.",
    logo: chatbaseLogo
  },
  {
    id: "shopify",
    name: "Shopify",
    category: "Commerce",
    description: "Look up orders, products, and customer details.",
    logo: shopifyLogo
  },
  {
    id: "stripe",
    name: "Stripe",
    category: "Payments",
    description: "Surface subscription and payment context securely.",
    logo: stripeLogo
  },
  {
    id: "slack",
    name: "Slack",
    category: "Messaging",
    description: "Notify your team when a conversation needs a human.",
    logo: slackLogo
  },
  {
    id: "whatsapp",
    name: "WhatsApp",
    category: "Messaging",
    description: "Meet customers in the channel they already use.",
    logo: whatsappLogo
  },
  {
    id: "instagram",
    name: "Instagram",
    category: "Messaging",
    description: "Respond to direct messages with brand-safe answers.",
    logo: instagramLogo
  },
  {
    id: "messenger",
    name: "Messenger",
    category: "Messaging",
    description: "Connect Facebook conversations to your agent.",
    logo: messengerLogo
  },
  {
    id: "twilio",
    name: "Twilio",
    category: "Messaging",
    description: "Add SMS and voice alerts to your handoff flow.",
    logo: twilioLogo
  },
  {
    id: "sunshine",
    name: "Sunshine Conversations",
    category: "Messaging",
    description: "Unify messaging channels behind one customer record.",
    logo: sunshineLogo
  },
  {
    id: "calendly",
    name: "Calendly",
    category: "Scheduling",
    description: "Let the agent offer a meeting when a lead is ready.",
    logo: calendlyLogo
  },
  {
    id: "email",
    name: "Email",
    category: "Messaging",
    description: "Send follow-ups and route conversations to an inbox.",
    logo: emailLogo
  }
];

export const INTEGRATION_CATEGORIES = [
  "All",
  "Support",
  "CRM",
  "Commerce",
  "Payments",
  "Messaging",
  "Scheduling"
];

export const CHANNEL_OPTIONS = [
  {
    id: "website",
    name: "Website chat",
    description: "Embedded widget for your site",
    mark: "WEB"
  },
  {
    id: "email",
    name: "Email",
    description: "Follow up from your support inbox",
    logo: emailLogo
  },
  {
    id: "whatsapp",
    name: "WhatsApp",
    description: "Answer customers in messaging",
    logo: whatsappLogo
  },
  {
    id: "slack",
    name: "Slack",
    description: "Bring your team into the thread",
    logo: slackLogo
  }
];

export const AGENT_ROLES = [
  "Customer support",
  "Sales assistant",
  "Product guide",
  "Booking assistant"
];

export const AGENT_TONES = ["Professional", "Friendly", "Concise", "Consultative"];

export const AGENT_CAPABILITIES = [
  { id: "knowledge-base", label: "Answer from knowledge base" },
  { id: "lead-capture", label: "Capture qualified leads" },
  { id: "human-handoff", label: "Escalate to a human" },
  { id: "meeting-booking", label: "Offer meeting times" }
];

export const AUTOMATIONS = [
  {
    id: "knowledge-refresh",
    name: "Knowledge refresh",
    description: "Re-scan the website and refresh the company profile.",
    schedule: "Every Monday at 08:00",
    defaultEnabled: true
  },
  {
    id: "lead-capture",
    name: "Lead capture",
    description: "Create a CRM contact when a visitor shares buying intent.",
    schedule: "When a lead is qualified",
    defaultEnabled: false
  },
  {
    id: "human-handoff",
    name: "Human handoff",
    description: "Notify Slack when the agent cannot resolve a request.",
    schedule: "When escalation is needed",
    defaultEnabled: true
  },
  {
    id: "weekly-digest",
    name: "Weekly digest",
    description: "Email a summary of conversations, gaps, and top questions.",
    schedule: "Every Friday at 16:00",
    defaultEnabled: false
  }
];

export function createId(prefix) {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return `${prefix}_${crypto.randomUUID().replace(/-/g, "").slice(0, 12)}`;
  }
  return `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
}

export function nowIso() {
  return new Date().toISOString();
}

export function defaultWorkspace() {
  return {
    version: WORKSPACE_VERSION,
    workspaceName: "Dessoir Workspace",
    activeAgentId: "",
    agents: [],
    integrations: [],
    automations: AUTOMATIONS.map((item) => ({
      id: item.id,
      enabled: item.defaultEnabled
    })),
    usage: {
      creditsUsed: 0,
      creditsLimit: TRIAL_CREDITS,
      scrapes: 0,
      pagesIndexed: 0,
      conversations: 0,
      messages: 0
    },
    activity: [],
    updatedAt: null
  };
}

function safeUrl(value) {
  const normalized = normalizeUrl(value);
  return normalized.ok ? normalized.url : "";
}

function truncate(value, max) {
  const text = String(value == null ? "" : value).replace(/\s+/g, " ").trim();
  if (text.length <= max) return text;
  const sliced = text.slice(0, max);
  const cut = sliced.lastIndexOf(" ");
  return `${sliced.slice(0, cut > max * 0.6 ? cut : max).trim()}...`;
}

function isoOrNull(value) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function numberInRange(value, min, max, fallback) {
  const number = Number(value);
  if (!Number.isFinite(number)) return fallback;
  return Math.max(min, Math.min(max, Math.round(number)));
}

export function compactBrief(raw) {
  const value = raw && typeof raw === "object" ? raw : {};
  const websiteUrl = safeUrl(value.website_url || value.url);
  const domain = cleanDomain(websiteUrl || value.website_url || value.url || "");
  const products = asList(value.key_products_or_services)
    .map((item) => truncate(item, 120))
    .filter(Boolean)
    .slice(0, 6);
  const tags = asList(value.key_tags)
    .map((item) => truncate(item, 40))
    .filter(Boolean)
    .slice(0, 8);

  return {
    company_name: truncate(value.company_name, 120),
    website_url: websiteUrl,
    domain,
    one_liner: truncate(value.one_liner, 240),
    what_the_company_does: truncate(value.what_the_company_does, 1200),
    primary_target_audience: truncate(value.primary_target_audience, 300),
    key_products_or_services: products,
    industry: truncate(value.industry, 100),
    key_tags: tags,
    location_info: truncate(value.location_info, 400),
    pricing_info: truncate(value.pricing_info, 500),
    faq_info: truncate(value.faq_info, 700),
    website_context: String(value.website_context || "")
      .replace(/\u0000/g, "")
      .slice(0, 1800)
      .trim(),
    page_title: truncate(value.page_title, 160),
    meta_description: truncate(value.meta_description, 300),
    confidence_score: numberInRange(value.confidence_score, 0, 100, 0),
    pages_fetched: numberInRange(value.pages_fetched, 0, 100000, 0),
    scraped_at: isoOrNull(value.scraped_at) || nowIso()
  };
}

export function buildPersona(company, role) {
  const name = company?.company_name || "this company";
  const description = company?.what_the_company_does || company?.one_liner || "";
  const audience = company?.primary_target_audience || "";
  return [
    `You are the ${role || "customer support"} agent for ${name}.`,
    description ? `Company context: ${description}` : "",
    audience ? `Primary audience: ${audience}` : "",
    "Answer only from the approved knowledge base. Be direct, helpful, and transparent when information is missing.",
    "Never invent pricing, policies, availability, or account details. Escalate uncertain or account-specific requests to a human teammate."
  ]
    .filter(Boolean)
    .join("\n\n");
}

export function createAgentFromBrief(rawBrief) {
  const company = compactBrief(rawBrief);
  const role = "Customer support";
  const timestamp = nowIso();
  return {
    id: createId("agent"),
    status: "active",
    createdAt: timestamp,
    updatedAt: timestamp,
    company,
    config: {
      name: `${company.company_name || "Company"} Support`,
      role,
      tone: "Professional",
      language: "English",
      persona: buildPersona(company, role),
      tools: ["knowledge-base", "human-handoff"],
      channels: ["website", "email"]
    }
  };
}

export function normalizeAgent(raw) {
  if (!raw || typeof raw !== "object") return null;
  const company = compactBrief(raw.company);
  const config = raw.config && typeof raw.config === "object" ? raw.config : {};
  const id = /^[a-zA-Z0-9_-]{3,80}$/.test(String(raw.id || ""))
    ? String(raw.id)
    : createId("agent");
  const status = ["active", "paused", "draft"].includes(raw.status)
    ? raw.status
    : "active";
  const channels = asList(config.channels)
    .map((item) => String(item).trim())
    .filter((item) => /^[a-zA-Z0-9_-]{1,40}$/.test(item))
    .slice(0, 6);
  const tools = asList(config.tools)
    .map((item) => String(item).trim())
    .filter((item) => /^[a-zA-Z0-9_-]{1,40}$/.test(item))
    .slice(0, 8);

  return {
    id,
    status,
    createdAt: isoOrNull(raw.createdAt) || nowIso(),
    updatedAt: isoOrNull(raw.updatedAt) || nowIso(),
    company,
    config: {
      name: truncate(config.name || `${company.company_name || "Company"} Support`, 120),
      role: truncate(config.role || "Customer support", 100),
      tone: truncate(config.tone || "Professional", 60),
      language: truncate(config.language || "English", 60),
      persona: String(config.persona || buildPersona(company, config.role || "Customer support"))
        .replace(/\u0000/g, "")
        .slice(0, 1200)
        .trim(),
      tools,
      channels
    }
  };
}

export function normalizeWorkspace(raw) {
  const base = defaultWorkspace();
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return base;

  const agents = Array.isArray(raw.agents)
    ? raw.agents.map(normalizeAgent).filter(Boolean).slice(0, MAX_AGENTS)
    : [];
  const activeAgentId = agents.some((agent) => agent.id === raw.activeAgentId)
    ? raw.activeAgentId
    : agents[0]?.id || "";
  const integrations = Array.isArray(raw.integrations)
    ? raw.integrations
        .map((item) => {
          const id = String(item?.id || "").trim();
          if (!/^[a-zA-Z0-9_-]{1,40}$/.test(id)) return null;
          return {
            id,
            connected: Boolean(item.connected),
            connectedAt: item.connected ? isoOrNull(item.connectedAt) || nowIso() : null
          };
        })
        .filter(Boolean)
        .slice(0, 24)
    : [];
  const automations = Array.isArray(raw.automations)
    ? raw.automations
        .map((item) => {
          const id = String(item?.id || "").trim();
          if (!/^[a-zA-Z0-9_-]{1,40}$/.test(id)) return null;
          return { id, enabled: Boolean(item.enabled) };
        })
        .filter(Boolean)
        .slice(0, 12)
    : base.automations;
  const usage = raw.usage && typeof raw.usage === "object" ? raw.usage : {};
  const activity = Array.isArray(raw.activity)
    ? raw.activity
        .map((item) => ({
          id: String(item?.id || createId("activity")),
          type: truncate(item?.type || "update", 40),
          title: truncate(item?.title, 120),
          detail: truncate(item?.detail, 240),
          createdAt: isoOrNull(item?.createdAt) || nowIso()
        }))
        .filter((item) => item.title)
        .slice(0, 8)
    : [];

  return {
    version: WORKSPACE_VERSION,
    workspaceName: truncate(raw.workspaceName || base.workspaceName, 80) || base.workspaceName,
    activeAgentId,
    agents,
    integrations,
    automations,
    usage: {
      creditsUsed: numberInRange(usage.creditsUsed, 0, 1000000, 0),
      creditsLimit: numberInRange(usage.creditsLimit, 1, 1000000, TRIAL_CREDITS),
      scrapes: numberInRange(usage.scrapes, 0, 100000, 0),
      pagesIndexed: numberInRange(usage.pagesIndexed, 0, 1000000, 0),
      conversations: numberInRange(usage.conversations, 0, 1000000, 0),
      messages: numberInRange(usage.messages, 0, 1000000, 0)
    },
    activity,
    updatedAt: isoOrNull(raw.updatedAt)
  };
}

export function budgetWorkspaceForSync(workspace) {
  const copy = JSON.parse(JSON.stringify(normalizeWorkspace(workspace)));
  copy.updatedAt = copy.updatedAt || nowIso();
  copy.activity = copy.activity.slice(0, 6);
  copy.agents = copy.agents.slice(0, MAX_AGENTS);

  const currentSize = () => JSON.stringify(copy).length;
  if (currentSize() > MAX_SYNC_BYTES) {
    copy.agents.forEach((agent) => {
      agent.company.website_context = "";
    });
  }
  if (currentSize() > MAX_SYNC_BYTES) {
    copy.activity = [];
  }
  if (currentSize() > MAX_SYNC_BYTES && copy.agents.length > 1) {
    copy.agents = copy.agents.filter((agent) => agent.id === copy.activeAgentId);
    if (!copy.agents.length) copy.agents = JSON.parse(JSON.stringify(normalizeWorkspace(workspace))).agents.slice(0, 1);
  }
  if (currentSize() > MAX_SYNC_BYTES) {
    copy.agents = copy.agents.map((agent) => ({
      ...agent,
      company: {
        ...agent.company,
        what_the_company_does: truncate(agent.company.what_the_company_does, 420),
        pricing_info: truncate(agent.company.pricing_info, 220),
        faq_info: truncate(agent.company.faq_info, 260)
      }
    }));
  }

  const serialized = JSON.stringify(copy);
  if (serialized.length > MAX_SYNC_BYTES) return null;
  return { workspace: copy, bytes: serialized.length };
}

export function loadLocalWorkspace(userId) {
  if (!userId) return defaultWorkspace();
  try {
    const raw = window.localStorage.getItem(`${STORE_PREFIX}:${userId}`);
    return raw ? normalizeWorkspace(JSON.parse(raw)) : defaultWorkspace();
  } catch {
    return defaultWorkspace();
  }
}

export function saveLocalWorkspace(userId, workspace) {
  if (!userId) return;
  try {
    window.localStorage.setItem(`${STORE_PREFIX}:${userId}`, JSON.stringify(workspace));
  } catch {
    return;
  }
}

export function clearLocalWorkspace(userId) {
  if (!userId) return;
  try {
    window.localStorage.removeItem(`${STORE_PREFIX}:${userId}`);
    window.localStorage.removeItem(`${CHAT_PREFIX}:${userId}`);
  } catch {
    return;
  }
}

export function loadLocalChat(userId) {
  if (!userId) return {};
  try {
    const raw = window.localStorage.getItem(`${CHAT_PREFIX}:${userId}`);
    const parsed = raw ? JSON.parse(raw) : {};
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return {};
    const result = {};
    for (const [agentId, messages] of Object.entries(parsed)) {
      if (!Array.isArray(messages)) continue;
      result[agentId] = messages
        .map((message) => ({
          id: String(message?.id || createId("message")),
          role: message?.role === "assistant" ? "assistant" : "user",
          text: String(message?.text || "").slice(0, 4000),
          createdAt: isoOrNull(message?.createdAt) || nowIso()
        }))
        .filter((message) => message.text)
        .slice(-40);
    }
    return result;
  } catch {
    return {};
  }
}

export function saveLocalChat(userId, chat) {
  if (!userId) return;
  try {
    window.localStorage.setItem(`${CHAT_PREFIX}:${userId}`, JSON.stringify(chat));
  } catch {
    return;
  }
}

export function getIntegration(id) {
  return INTEGRATIONS.find((item) => item.id === id) || null;
}

export function isIntegrationConnected(workspace, id) {
  return Boolean(workspace?.integrations?.find((item) => item.id === id)?.connected);
}

export function agentInitials(agent) {
  const source = agent?.company?.company_name || agent?.config?.name || "Agent";
  return source
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
    .toUpperCase();
}

export function initials(name) {
  const source = String(name || "Dessoir").trim();
  return source
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
    .toUpperCase();
}

export function formatNumber(value) {
  const number = Number(value);
  return new Intl.NumberFormat("en-US").format(Number.isFinite(number) ? number : 0);
}

export function formatRelative(value) {
  if (!value) return "Not yet";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Not yet";
  const seconds = Math.round((Date.now() - date.getTime()) / 1000);
  if (seconds < 45) return "Just now";
  if (seconds < 90) return "1 min ago";
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} hr ago`;
  const days = Math.round(hours / 24);
  if (days < 7) return `${days} day${days === 1 ? "" : "s"} ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function formatDate(value, options = {}) {
  if (!value) return "Not available";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Not available";
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    ...options
  });
}

export function domainLabel(url) {
  const domain = cleanDomain(url);
  return domain || "No website";
}

export function addActivity(workspace, title, detail, type = "update") {
  const activity = {
    id: createId("activity"),
    type,
    title,
    detail,
    createdAt: nowIso()
  };
  return {
    ...workspace,
    activity: [activity, ...workspace.activity].slice(0, 8)
  };
}

export function updateUsage(workspace, patch) {
  return {
    ...workspace,
    usage: { ...workspace.usage, ...patch }
  };
}
