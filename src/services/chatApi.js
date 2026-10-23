import { API_BASE } from "./scraperApi";
import { authHeaders } from "./authToken";

const CHAT_ENDPOINTS = [
  { label: "Production Webhook", endpoint: `${API_BASE}/customer-agent-chat` },
  { label: "Test Webhook", endpoint: `${API_BASE}/test/customer-agent-chat` }
];

const CHAT_TIMEOUT_MS = 45000;
const INAPPROPRIATE =
  /\b(sex|sexy|porn|nude|nsfw|fuck|bitch|penis|vagina|boobs|asshole|bastard|blowjob|dick|pussy|whore|slut|erotic|hooker)\b/i;
const LEGACY_SIGNATURE =
  /\b(network bulls|networkbulls|gurgaon|gurugram|SCO-?9|7840018889|CCNA|CCNP|CCIE)\b/i;
const ACCOUNT_SUBJECT =
  /\b(payment|payments|paid|unpaid|invoice|receipt|transaction|portal|refund|refunded|billing|charged|charge|deducted)\b/i;
const ACCOUNT_TROUBLE =
  /\b(still|not|isn'?t|didn'?t|doesn'?t|shows?|showing|pending|failed|went through|deducted|twice|unpaid|problem|issue|can'?t|cannot|help)\b/i;
const PRICING_QUESTION =
  /\b(plan|plans|pricing|price|prices|cost|costs|subscription|quote|how much)\b/i;

function isAccountIssue(text) {
  const value = String(text || "");
  return ACCOUNT_SUBJECT.test(value) && ACCOUNT_TROUBLE.test(value) && !PRICING_QUESTION.test(value);
}

function accountEscalation(brief) {
  const name = clean(brief?.company_name) || "our support team";
  const siteUrl = clean(brief?.website_url);
  const details = siteUrl ? ` You can also reach the team through ${siteUrl}.` : "";
  return `I'm sorry your payment isn't reflecting in your account yet. I can't verify billing records from here, so I'll connect you with a ${name} support representative who can check it. Please share your enrollment or order number and the email used at checkout.${details}`;
}

export function isQueryInappropriate(query) {
  return INAPPROPRIATE.test(String(query || ""));
}

function clean(value) {
  return String(value == null ? "" : value).replace(/\s+/g, " ").trim();
}

function normalizeHistory(history) {
  if (!Array.isArray(history)) return [];
  return history
    .map((item) => {
      const role = item?.role === "agent" ? "assistant" : item?.role;
      const content = clean(item?.text || item?.content || "");
      return role === "user" || role === "assistant" ? { role, content } : null;
    })
    .filter((item) => item && item.content)
    .slice(-6);
}

function trimTo(value, max) {
  const text = clean(value);
  if (text.length <= max) return text;
  const cut = text.slice(0, max);
  return `${cut.slice(0, Math.max(0, cut.lastIndexOf(" "))).trim()}...`;
}

function firstSentence(value) {
  const match = clean(value).match(/^(.{15,220}?[.!?])(?:\s|$)/);
  return match ? match[1] : trimTo(value, 220);
}

function usable(value) {
  return Boolean(value && !/^not found in scraped pages\.?$/i.test(clean(value)));
}

function relevantExcerpt(query, brief) {
  const context = clean(brief?.website_context);
  if (!context) return "";

  const stopWords = new Set([
    "the", "and", "for", "with", "about", "from", "this", "that", "your", "you", "are", "can",
    "what", "how", "does", "company", "website", "please", "tell", "have", "has", "our", "their",
    "they", "will", "would", "could", "should", "there", "here", "when", "where", "which", "who",
    "why", "into", "over", "under", "more", "most", "some", "any", "all", "not", "but", "its"
  ]);
  const words = clean(query)
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((word) => word.length >= 4 && !stopWords.has(word));
  if (!words.length) return "";

  const chunks = context
    .split(/\n+|[.!?]\s+/)
    .map(clean)
    .filter((chunk) => chunk.length >= 30)
    .filter(
      (chunk) =>
        !/^(COMPANY TARGET|PAGE TITLE|META DESCRIPTION|SCRAPE COVERAGE|LOCATION \/ ADDRESS|PRICING \/ FEES|FAQ \/ POLICIES|HEADINGS \/ OFFERINGS|KEY EXCERPTS)/i.test(
          chunk
        )
    );

  let best = { score: 0, text: "" };
  for (const chunk of chunks) {
    const lower = chunk.toLowerCase();
    const score = words.reduce((total, word) => total + (lower.includes(word) ? 1 : 0), 0);
    if (score > best.score) best = { score, text: chunk };
  }
  return best.score >= 2 ? trimTo(best.text, 300) : "";
}

function isLegacyLeak(text, brief) {
  if (!LEGACY_SIGNATURE.test(String(text || ""))) return false;
  const source = [
    brief?.company_name,
    brief?.website_url,
    brief?.what_the_company_does,
    brief?.website_context,
    brief?.location_info,
    ...(brief?.key_products_or_services || [])
  ].join(" ");
  return !LEGACY_SIGNATURE.test(source);
}

function groundedReply(query, brief = {}) {
  const q = String(query || "").toLowerCase().trim();
  const name = clean(brief.company_name) || "this company";
  const siteUrl = clean(brief.website_url);
  const domain =
    siteUrl.replace(/^https?:\/\//i, "").replace(/\/+$/, "") || "the company website";
  const products = Array.isArray(brief.key_products_or_services)
    ? brief.key_products_or_services.map(clean).filter(Boolean)
    : [];
  const summary = clean(brief.what_the_company_does);
  const audience = clean(brief.primary_target_audience);
  const oneLiner = clean(brief.one_liner);
  const location = usable(brief.location_info) ? clean(brief.location_info) : "";
  const pricing = usable(brief.pricing_info) ? clean(brief.pricing_info) : "";
  const faq = usable(brief.faq_info) ? clean(brief.faq_info) : "";
  const excerpt = relevantExcerpt(q, brief);
  const contactHint = siteUrl
    ? `You can find current contact details on the contact page at ${siteUrl}.`
    : "You can find current contact details on the company website.";

  if (isQueryInappropriate(q)) {
    return `I can only help with questions about ${name}. Please ask about our products, services, pricing, or support.`;
  }

  if (/\b(where|location|address|place|city|state|campus|branch|office|located|directions|reach us)\b/i.test(q)) {
    return location
      ? `Here is the location information from the scraped website: ${trimTo(location, 360)}`
      : `I do not have a verified address in the scraped content for ${name}. ${contactHint}`;
  }

  if (/\b(pricing|price|prices|plans|cost|costs|fee|fees|subscription|billing|quote|how much|charge)\b/i.test(q)) {
    return pricing
      ? `Here is the pricing information from the scraped website: ${trimTo(pricing, 360)}`
      : `I could not find pricing in the scraped pages for ${name}. ${
          siteUrl ? `Check ${siteUrl} or contact the team for a current quote.` : "Please check the website or contact the team for a current quote."
        }`;
  }

  if (/\b(integration|integrations|api|apis|developer|developers|sdk|webhook)\b/i.test(q)) {
    return excerpt || `I could not find developer or integration details in the scraped pages for ${name}. ${contactHint}`;
  }

  if (/\b(faq|faqs|support|help|guarantee|uptime|sla|security|compliance|policy|policies|refund|shipping|delivery)\b/i.test(q)) {
    if (faq) return `The website's FAQ or policy content says: ${trimTo(faq, 360)}`;
    if (excerpt) return `Here is a relevant excerpt from the website: ${excerpt}`;
    return `I could not find a support or policy answer in the scraped pages. ${contactHint}`;
  }

  if (/\b(product|products|service|services|offer|offerings|features|solutions)\b/i.test(q)) {
    return products.length
      ? `${name}'s key offerings from the website include: ${products.slice(0, 6).join(", ")}.`
      : `I could not find a product or service list in the scraped pages for ${name}. ${
          siteUrl ? `Visit ${siteUrl} to see current offerings.` : "Please check the website for current offerings."
        }`;
  }

  if (/\b(audience|who is|who can|who are|target|eligible|for who|market)\b/i.test(q)) {
    return audience && !/^not specified/i.test(audience)
      ? `The website describes the target audience as: ${audience}`
      : excerpt || `I could not find an explicit audience description in the scraped pages. ${
          siteUrl ? `Visit ${siteUrl} to learn more.` : ""
        }`.trim();
  }

  if (/\b(contact|email|phone|call|whatsapp|reach)\b/i.test(q)) {
    return location
      ? `Contact or location details from the website: ${trimTo(location, 300)}${siteUrl ? ` More details are available at ${siteUrl}.` : ""}`
      : `For current contact details, visit ${siteUrl || "the company website"}.`;
  }

  if (/\b(hello|hi|hey|good morning|good afternoon|good evening)\b/i.test(q)) {
    return `Hello! I'm the AI customer agent for ${name}. I can answer questions using the content scraped from ${domain}. What would you like to know?`;
  }

  if (/\b(tagline|elevator|one liner|about|summar|overview|what do you do)\b/i.test(q)) {
    const about = summary || oneLiner || firstSentence(oneLiner);
    return about
      ? `${name}: ${trimTo(about, 320)}`
      : excerpt || `I do not have a verified summary for ${name} in the scraped content. ${
          siteUrl ? `Visit ${siteUrl} to learn more.` : ""
        }`.trim();
  }

  if (excerpt) {
    return `Here is a relevant excerpt from ${name}'s website: ${excerpt}`;
  }

  if (summary) {
    return `${name}: ${trimTo(summary, 320)}${
      products.length ? ` Key offerings include ${products.slice(0, 4).join(", ")}.` : ""
    }`;
  }

  return `I do not have enough scraped information to answer that. ${
    siteUrl ? `Visit ${siteUrl} or ask about products, pricing, location, or support.` : "Please ask about products, pricing, location, or support."
  }`;
}

export async function sendAgentMessage(text, brief, history = []) {
  const message = String(text || "").trim();
  if (!message) {
    return "";
  }

  const conversation = normalizeHistory(history).filter(
    (item) => item.role !== "user" || item.content !== message
  );

  if (isQueryInappropriate(message)) {
    await new Promise((resolve) => setTimeout(resolve, 260));
    return `I can only help with questions about ${brief?.company_name || "this company"}. Please ask about our products, services, pricing, or support.`;
  }

  if (isAccountIssue(message)) {
    await new Promise((resolve) => setTimeout(resolve, 620));
    return accountEscalation(brief);
  }

  for (const item of CHAT_ENDPOINTS) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), CHAT_TIMEOUT_MS);

    try {
      const response = await fetch(item.endpoint, {
        method: "POST",
        headers: await authHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify({
          message,
          company_name: brief?.company_name,
          website_url: brief?.website_url,
          one_liner: brief?.one_liner,
          what_the_company_does: brief?.what_the_company_does,
          primary_target_audience: brief?.primary_target_audience,
          key_products_or_services: brief?.key_products_or_services,
          industry: brief?.industry,
          key_tags: brief?.key_tags,
          location_info: brief?.location_info,
          pricing_info: brief?.pricing_info,
          faq_info: brief?.faq_info,
          website_context: brief?.website_context,
          page_title: brief?.page_title,
          meta_description: brief?.meta_description,
          history: conversation
        }),
        signal: controller.signal
      });

      if (!response.ok) {
        continue;
      }

      const data = await response.json();
      const candidate = data.reply || data.output || data.message || data.text;

      if (
        candidate &&
        typeof candidate === "string" &&
        candidate.trim().length > 2 &&
        !isLegacyLeak(candidate, brief)
      ) {
        return candidate.trim();
      }
    } catch {
      // Try the next endpoint, then fall back to the grounded engine.
    } finally {
      clearTimeout(timeout);
    }
  }

  await new Promise((resolve) => setTimeout(resolve, 420));
  return groundedReply(message, brief || {});
}
