export const SAMPLE_BRIEFS = {
  "stripe.com": {
    company_name: "Stripe",
    website_url: "https://stripe.com",
    one_liner: "Financial infrastructure for businesses across the internet.",
    what_the_company_does:
      "Stripe builds financial software and APIs that let businesses accept payments, send payouts, manage subscriptions, and automate global billing. It gives internet companies a single platform for moving money and managing financial workflows.",
    primary_target_audience:
      "Online businesses, SaaS platforms, marketplaces, developers, and global enterprises.",
    key_products_or_services: [
      "Global payment processing",
      "Billing and subscriptions",
      "Radar fraud prevention",
      "Connect marketplace payments",
      "Terminal in-person payments"
    ],
    industry: "FinTech / Financial Software",
    key_tags: ["Payments", "APIs", "FinTech", "Billing", "Infrastructure"],
    confidence_score: 95,
    scrape_status: "success"
  },
  "linear.app": {
    company_name: "Linear",
    website_url: "https://linear.app",
    one_liner: "A purpose-built tool for planning and building products.",
    what_the_company_does:
      "Linear is an issue tracking and project management system for software teams. It combines keyboard-first workflows, cycles, roadmaps, and triage in a fast interface designed to keep product development moving.",
    primary_target_audience: "Product teams, engineering organizations, startups, and software companies.",
    key_products_or_services: [
      "Issue tracking",
      "Project planning",
      "Product roadmaps",
      "Cycle planning",
      "Triage and backlog management"
    ],
    industry: "Software / Developer Tools",
    key_tags: ["Project management", "Developer tools", "Productivity", "SaaS"],
    confidence_score: 94,
    scrape_status: "success"
  },
  "notion.so": {
    company_name: "Notion",
    website_url: "https://notion.so",
    one_liner: "One workspace where teams write, plan, and organize.",
    what_the_company_does:
      "Notion is a connected workspace that combines documents, wikis, databases, project management, and AI-assisted tools. Teams use it to centralize knowledge and run projects inside flexible, customizable pages.",
    primary_target_audience: "Startups, small businesses, enterprise teams, and individuals.",
    key_products_or_services: [
      "Docs and wikis",
      "Databases",
      "Project management",
      "Notion AI",
      "Team collaboration"
    ],
    industry: "Productivity Software / Collaboration",
    key_tags: ["Workspace", "Collaboration", "Productivity", "Knowledge base", "SaaS"],
    confidence_score: 96,
    scrape_status: "success"
  }
};

export function asText(value) {
  if (Array.isArray(value)) {
    return value.map(asText).filter(Boolean).join(", ");
  }
  if (value === null || value === undefined) {
    return "";
  }
  return String(value).trim();
}

export function asList(value) {
  if (Array.isArray(value)) {
    return value.map(asText).filter(Boolean);
  }
  if (typeof value === "string") {
    return value
      .split(/\r?\n|;\s*/)
      .map((item) => item.trim())
      .filter(Boolean);
  }
  return [];
}

export function titleCase(value) {
  return String(value || "")
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export function cleanDomain(value) {
  try {
    const url = new URL(/^[a-z][a-z\d+.-]*:\/\//i.test(value) ? value : `https://${value}`);
    return url.hostname.replace(/^www\./i, "");
  } catch {
    return String(value || "")
      .replace(/^https?:\/\//i, "")
      .replace(/^www\./i, "")
      .replace(/\/.*$/, "");
  }
}

export function displayAddress(value) {
  return String(value || "")
    .replace(/^https?:\/\//i, "")
    .replace(/^www\./i, "")
    .replace(/\/$/, "");
}

export function normalizeUrl(rawValue) {
  const raw = String(rawValue || "").trim();
  if (!raw) {
    return { ok: false, error: "Enter a company website to begin." };
  }

  const candidate = /^[a-z][a-z\d+.-]*:\/\//i.test(raw) ? raw : `https://${raw}`;

  try {
    const parsed = new URL(candidate);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return { ok: false, error: "Use a website address that starts with http or https." };
    }
    if (!parsed.hostname) {
      return { ok: false, error: "Enter a complete website address, such as stripe.com." };
    }
    return { ok: true, url: parsed.href };
  } catch {
    return { ok: false, error: "That website address does not look valid." };
  }
}

function safeExternalUrl(rawValue) {
  const raw = String(rawValue || "").trim();
  if (!raw) return null;
  try {
    const parsed = new URL(raw);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return null;
    if (parsed.username || parsed.password) return null;
    return parsed.href;
  } catch {
    return null;
  }
}

export function buildAgentMeta(companyName, domain) {
  const slug = String(companyName || "company")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");

  return {
    status: "ready",
    is_live: false,
    agent_id: `agent_${slug}`,
    agent_name: `${companyName} Customer Agent`,
    begin_message: `Hello! I am the customer agent for ${companyName}. I have ingested our website data from ${domain}. How can I assist you with our services today?`,
    chat_interface_url: "http://localhost:5678/webhook/company-agent-chat/chat",
    chat_webhook_url: "http://localhost:5678/webhook/customer-agent-chat",
    web_call_url: null
  };
}

export function normalizeBrief(raw, targetUrl) {
  let value = raw;

  for (let index = 0; index < 5; index += 1) {
    if (Array.isArray(value) && value.length) {
      value = value[0];
      continue;
    }

    if (typeof value === "string") {
      try {
        value = JSON.parse(value);
        continue;
      } catch {
        return null;
      }
    }

    if (!value || typeof value !== "object") {
      return null;
    }

    if (value.error || value.scrape_status === "error" || value.success === false || value.ok === false) {
      return null;
    }

    if (
      value.company_name ||
      value.what_the_company_does ||
      value.one_liner ||
      value.state ||
      value.summary ||
      value.description
    ) {
      break;
    }

    const candidate =
      value.output ?? value.text ?? value.data ?? value.json ?? value.result ?? value.body ?? value.response;

    if (typeof candidate === "string") {
      try {
        const cleaned = candidate
          .replace(/^```(?:json)?\s*/i, "")
          .replace(/```\s*$/i, "")
          .trim();
        value = JSON.parse(cleaned);
        continue;
      } catch {
        value = { what_the_company_does: candidate };
        break;
      }
    }

    if (candidate && typeof candidate === "object") {
      value = candidate;
      continue;
    }

    const anyString = Object.values(value).find((item) => typeof item === "string" && item.length > 20);
    if (anyString) {
      value = { what_the_company_does: anyString };
      break;
    }

    return null;
  }

  if (!value || typeof value !== "object" || value.error || value.scrape_status === "error") {
    return null;
  }

  const websiteCandidate = asText(value.website_url || value.url);
  const website = normalizeUrl(websiteCandidate || targetUrl);
  const score = Number(value.confidence_score);
  const confidence = Number.isFinite(score) ? Math.max(0, Math.min(100, Math.round(score))) : 60;
  const domain = cleanDomain(website.ok ? website.url : targetUrl);

  let rawSummary = asText(value.what_the_company_does || value.summary || value.description);
  if (!rawSummary || rawSummary.length < 15) {
    rawSummary = `No summary was extracted from ${domain}.`;
  }

  let rawOneLiner = asText(value.one_liner || value.tagline);
  if (!rawOneLiner || rawOneLiner.length < 10) {
    rawOneLiner = `Website: ${domain}.`;
  }

  const companyName = asText(value.company_name) || titleCase(domain.split(".")[0]);
  const fallbackMeta = buildAgentMeta(companyName, domain);
  const rawRetell =
    value.retell_ai && typeof value.retell_ai === "object" && !Array.isArray(value.retell_ai)
      ? value.retell_ai
      : {};
  const retellMeta = {
    ...fallbackMeta,
    ...rawRetell,
    chat_interface_url: safeExternalUrl(rawRetell.chat_interface_url || fallbackMeta.chat_interface_url),
    chat_webhook_url: safeExternalUrl(rawRetell.chat_webhook_url || fallbackMeta.chat_webhook_url),
    web_call_url: safeExternalUrl(rawRetell.web_call_url)
  };
  const products = asList(value.key_products_or_services || value.products || value.services);
  const tags = asList(value.key_tags || value.tags || value.keywords);

  return {
    company_name: companyName,
    website_url: website.ok ? website.url : targetUrl,
    one_liner: rawOneLiner,
    what_the_company_does: rawSummary,
    primary_target_audience:
      asText(value.primary_target_audience || value.audience) || "Not specified in the scraped content.",
    key_products_or_services: products,
    industry: asText(value.industry || value.category) || "Not specified",
    key_tags: tags.length ? tags : [titleCase(domain.split(".")[0])],
    confidence_score: confidence,
    scrape_status: asText(value.scrape_status) || "success",
    page_title: asText(value.page_title || value.pageTitle),
    meta_description: asText(value.meta_description || value.metaDescription),
    location_info: asText(value.location_info || value.locationData || value.location),
    pricing_info: asText(value.pricing_info || value.pricingData || value.pricing),
    faq_info: asText(value.faq_info || value.faqData || value.faq),
    website_context: asText(value.website_context || value.extractedContext || value.context),
    retell_ai: retellMeta
  };
}

export function buildSampleBrief(domainInput) {
  const domain = cleanDomain(domainInput);
  const sample = SAMPLE_BRIEFS[domain];
  const companyName = sample?.company_name || titleCase(domain.split(".")[0]);
  const base = sample || {
    company_name: companyName,
    website_url: `https://${domain}`,
    one_liner: `A technology company operating at ${domain}.`,
    what_the_company_does: `${companyName} builds products and services for modern teams. This sample brief is generated locally for interface preview because the live scraping pipeline was unreachable.`,
    primary_target_audience: "Businesses, developers, and global customers.",
    key_products_or_services: ["Core Platform", "Solutions & Services", "Customer Support"],
    industry: "Technology & Software",
    key_tags: [companyName, "Technology", "Company research"],
    confidence_score: 88
  };

  return {
    ...base,
    website_url: base.website_url || `https://${domain}`,
    scrape_status: "sample",
    retell_ai: buildAgentMeta(base.company_name || companyName, domain)
  };
}
