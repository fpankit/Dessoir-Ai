import { useEffect, useRef, useState } from "react";
import { ArrowRight, Send, Sparkles, X } from "lucide-react";
import { createId, getIntegration, nowIso } from "./dashboardData";

const MASCOT_IMAGE = "/mascot/dessoir-dragon-guide.webp";
const MASCOT_AVATAR = "/mascot/dessoir-dragon-guide-avatar.webp";
const BUBBLE_TEXT = "Hi, how may I help you?";

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function count(value) {
  return Number(value || 0).toLocaleString("en-US");
}

function plural(value, one, many) {
  return Number(value) === 1 ? one : many;
}

function buildIntro() {
  return {
    id: "mascot-intro",
    role: "assistant",
    text: "Hi, how may I help you? I can help you find your way around this workspace and get things set up.",
    createdAt: nowIso()
  };
}

function buildSuggestions(workspace) {
  const suggestions = ["What's in my workspace?", "How do I add a company?"];
  suggestions.push(
    (workspace?.agents?.length || 0) > 0 ? "How do I manage my agents?" : "How do I create an agent?"
  );
  return suggestions;
}

function workspaceSummary(workspace) {
  const agents = workspace?.agents?.length || 0;
  const connected = (workspace?.integrations || []).filter((item) => item.connected).length;
  const pages = workspace?.usage?.pagesIndexed || 0;
  const credits = Math.max(
    0,
    (workspace?.usage?.creditsLimit || 0) - (workspace?.usage?.creditsUsed || 0)
  );
  return `${workspace?.workspaceName || "Your workspace"} has ${count(agents)} ${plural(agents, "agent", "agents")}, ${count(pages)} indexed ${plural(pages, "page", "pages")}, ${count(connected)} connected ${plural(connected, "integration", "integrations")}, and ${count(credits)} credits left.`;
}

function answerWorkspaceQuestion(raw, workspace) {
  const q = String(raw || "").toLowerCase().trim();
  const agents = workspace?.agents || [];
  const connected = (workspace?.integrations || []).filter((item) => item.connected);
  const enabledAutomations = (workspace?.automations || []).filter((item) => item.enabled);
  const usage = workspace?.usage || {};
  const credits = Math.max(0, (usage.creditsLimit || 0) - (usage.creditsUsed || 0));
  const pages = usage.pagesIndexed || 0;

  if (!q) {
    return "Ask me anything about your workspace.";
  }

  if (/\b(hi|hello|hey|good morning|good afternoon|good evening)\b/.test(q)) {
    return "Hi! I can help you navigate this workspace, add a company, manage agents, connect tools, and find your usage and settings.";
  }

  if (/\b(what can you|how can you|what do you do|guide)\b/.test(q) || q === "help") {
    return "I cover this workspace only: adding a company, creating and managing agents, the knowledge base, connections, automations, conversations, analytics, and settings. Ask me where to find something or how to set it up.";
  }

  if (
    /\b(what does|what is|what are|who is|tell me about|about)\b/.test(q) &&
    /\b(company|business|product|products|service|services|support)\b/.test(q) &&
    !/\b(workspace|agent|knowledge|connection|integration|automation|conversation|setting|plan|billing|credit|usage)\b/.test(q)
  ) {
    return "I only cover how your workspace works. For company content, open the agent's conversation or the Knowledge base.";
  }

  if (
    /\b(workspace|status|summary|overview|what'?s in|what is in|how many|what do i have)\b/.test(q) &&
    !/\b(add|create|connect|agents?|knowledge|connections?|integrations?|automations?|conversations?|messages?|settings?|rename|names?|sign|accounts?|plans?|billing|credits?|usage|clear|delete|remove|change|edit|update|start|setup|onboard)\b/.test(q)
  ) {
    return `${workspaceSummary(workspace)} Ask me where to find anything.`;
  }

  if (/\b(agent|agents|bot|bots)\b/.test(q)) {
    if (agents.length) {
      const names = agents
        .slice(0, 3)
        .map((agent) => agent.config?.name || "Untitled agent")
        .join(", ");
      return `You have ${count(agents.length)} ${plural(agents.length, "agent", "agents")}: ${names}. Open AI agents to edit roles and tones, or Conversations to test one.`;
    }
    return "You do not have an agent yet. Start in Research & crawl by adding a company website, then create an agent from the crawled company profile.";
  }

  if (/\b(knowledge|index|indexed|pages|re-?crawl|refresh)\b/.test(q)) {
    return `You have ${count(pages)} indexed ${plural(pages, "page", "pages")}. Open Knowledge base to review the indexed company profile, or Research & crawl to add or refresh a website.`;
  }

  if (/\b(connection|connections|connected|integration|integrations|connect|slack|stripe|zendesk|shopify|hubspot)\b/.test(q)) {
    if (connected.length) {
      const names = connected
        .slice(0, 4)
        .map((item) => getIntegration(item.id)?.name || item.id)
        .join(", ");
      return `You have ${count(connected.length)} connected ${plural(connected.length, "integration", "integrations")}: ${names}. Open Connections to manage or add more tools.`;
    }
    return "No integrations are connected yet. Open Connections to link tools like Slack, Stripe, Zendesk, or Shopify.";
  }

  if (/\b(automation|automations|workflow|workflows|schedule)\b/.test(q)) {
    const total = (workspace?.automations || []).length;
    return `${count(enabledAutomations.length)} of ${count(total)} automations are enabled. Open Automations to pause, enable, or run a workflow now.`;
  }

  if (/\b(conversation|conversations|chat|chats|message|messages)\b/.test(q)) {
    const messages = usage.messages || 0;
    return `You have ${count(usage.conversations || 0)} recorded ${plural(usage.conversations, "conversation", "conversations")} and ${count(messages)} ${plural(messages, "message", "messages")}. Open Conversations to review chats, switch agents, or clear a thread.`;
  }

  if (/\b(analytics|usage|credit|credits|billing|plan|payment|price|pricing|cost|spend)\b/.test(q)) {
    return `You have ${count(credits)} credits left. Open Analytics for credits used, pages analyzed, conversations, and recent activity. Plan and account details live in Settings.`;
  }

  if (/\b(remove|delete)\b.*\b(company|website)\b/.test(q)) {
    return "Open AI agents to remove the agent tied to that company. You can also clear testing data from Settings.";
  }

  if (/\b(setting|settings|rename|workspace name|sign out|log out|account|clear|delete|remove|change|edit|update)\b/.test(q)) {
    return "Open Settings to rename the workspace, review account access, clear testing data, or sign out. It also shows the trial plan and testing status.";
  }

  if (/\b(start|get started|setup|set up|onboard)\b/.test(q)) {
    return "Start with Research & crawl: add a company website and run a crawl. Then create an agent in AI agents, connect a tool in Connections, and test it from Conversations.";
  }

  if (/\b(add|create|crawl|scrape|research|website|url)\b/.test(q)) {
    return "Open Research & crawl from the sidebar, enter the company website, and run the crawl. Dessoir will index the site and create a company profile you can turn into an agent.";
  }

  return "I only cover how your workspace works: setup, agents, knowledge, connections, automations, conversations, analytics, and settings. Ask me where to find something or how to set it up.";
}

export default function Mascot({ workspace, onNavigate }) {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [waving, setWaving] = useState(false);
  const [bubbleActive, setBubbleActive] = useState(false);
  const [typedBubble, setTypedBubble] = useState("");
  const [messages, setMessages] = useState(() => [buildIntro()]);
  const logRef = useRef(null);
  const inputRef = useRef(null);
  const sendingRef = useRef(false);

  const suggestions = buildSuggestions(workspace);

  useEffect(() => {
    const start = window.setTimeout(() => setWaving(true), 700);
    const stop = window.setTimeout(() => setWaving(false), 6200);
    return () => {
      window.clearTimeout(start);
      window.clearTimeout(stop);
    };
  }, []);

  useEffect(() => {
    if (!open) return undefined;
    const focus = window.setTimeout(() => inputRef.current?.focus(), 90);
    const onKeyDown = (event) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKeyDown);
    return () => {
      window.clearTimeout(focus);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const log = logRef.current;
    if (log) log.scrollTop = log.scrollHeight;
  }, [messages, sending, open]);

  useEffect(() => {
    if (!bubbleActive || open) {
      setTypedBubble("");
      return undefined;
    }

    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) {
      setTypedBubble(BUBBLE_TEXT);
      return undefined;
    }

    setTypedBubble("");
    let index = 0;
    let interval;
    const delay = window.setTimeout(() => {
      interval = window.setInterval(() => {
        index += 1;
        setTypedBubble(BUBBLE_TEXT.slice(0, index));
        if (index >= BUBBLE_TEXT.length) window.clearInterval(interval);
      }, 26);
    }, 120);

    return () => {
      window.clearTimeout(delay);
      window.clearInterval(interval);
    };
  }, [bubbleActive, open]);

  const sendQuery = async (raw) => {
    const text = String(raw || "").trim();
    if (!text || sendingRef.current) return;

    const userMessage = {
      id: createId("mascot-message"),
      role: "user",
      text: text.slice(0, 600),
      createdAt: nowIso()
    };

    sendingRef.current = true;
    setSending(true);
    setInput("");
    setMessages((current) => [...current, userMessage]);

    await wait(320);
    const reply = answerWorkspaceQuestion(text, workspace);

    setMessages((current) => [
      ...current,
      {
        id: createId("mascot-message"),
        role: "assistant",
        text: reply.slice(0, 1400),
        createdAt: nowIso()
      }
    ]);
    sendingRef.current = false;
    setSending(false);
  };

  const submit = (event) => {
    event.preventDefault();
    sendQuery(input);
  };

  const openPanel = () => {
    setOpen(true);
    setWaving(true);
    window.setTimeout(() => setWaving(false), 2600);
  };

  const goTo = (view) => {
    setOpen(false);
    onNavigate(view);
  };

  const bubbleTyping = bubbleActive && !open && typedBubble.length < BUBBLE_TEXT.length;

  return (
    <div
      className={`dash-mascot ${open ? "is-open" : ""} ${waving ? "is-waving" : ""}`}
      onMouseLeave={() => setBubbleActive(false)}
      onFocus={() => setBubbleActive(true)}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setBubbleActive(false);
      }}
    >
      {!open ? (
        <button
          type="button"
          className="dash-mascot-bubble"
          onClick={openPanel}
          onMouseEnter={() => setBubbleActive(true)}
          aria-label="Hi, how may I help you? Ask me about your workspace"
        >
          <span className="dash-mascot-bubble-eyebrow">
            <Sparkles size={10} aria-hidden="true" />
            Dessoir guide
          </span>
          <strong>
            {typedBubble}
            {bubbleTyping ? <span className="dash-mascot-bubble-caret" aria-hidden="true" /> : null}
          </strong>
          <small>Ask me about your workspace</small>
          <span className="dash-mascot-bubble-tail" aria-hidden="true" />
        </button>
      ) : null}

      {open ? (
        <section className="dash-mascot-panel" aria-label="Dessoir guide chat">
          <header className="dash-mascot-panel-head">
            <span className="dash-mascot-panel-avatar">
              <img src={MASCOT_AVATAR} alt="" />
            </span>
            <span className="dash-mascot-panel-id">
              <strong>Dessoir guide</strong>
              <small>
                <i aria-hidden="true" />
                Workspace guide
              </small>
            </span>
            <button
              type="button"
              className="dash-mascot-close"
              onClick={() => setOpen(false)}
              aria-label="Close Dessoir guide"
            >
              <X size={15} />
            </button>
          </header>

          <div className="dash-mascot-log" ref={logRef} aria-live="polite">
            {messages.map((message) => (
              <div className={`dash-mascot-msg dash-mascot-msg-${message.role}`} key={message.id}>
                {message.role === "assistant" ? (
                  <span className="dash-mascot-msg-avatar">
                    <img src={MASCOT_AVATAR} alt="" />
                  </span>
                ) : null}
                <p>{message.text}</p>
              </div>
            ))}
            {sending ? (
              <div className="dash-mascot-msg dash-mascot-msg-assistant">
                <span className="dash-mascot-msg-avatar">
                  <img src={MASCOT_AVATAR} alt="" />
                </span>
                <span className="dash-mascot-typing" aria-label="Dessoir guide is thinking">
                  <span />
                  <span />
                  <span />
                </span>
              </div>
            ) : null}
          </div>

          {messages.length <= 1 && !sending ? (
            <div className="dash-mascot-suggestions">
              {suggestions.map((suggestion) => (
                <button type="button" key={suggestion} onClick={() => sendQuery(suggestion)}>
                  {suggestion}
                </button>
              ))}
            </div>
          ) : null}

          <form className="dash-mascot-form" onSubmit={submit}>
            <label htmlFor="dash-mascot-input">Ask a question</label>
            <div className="dash-mascot-input">
              <input
                id="dash-mascot-input"
                ref={inputRef}
                value={input}
                onChange={(event) => setInput(event.target.value)}
                placeholder="Ask about your workspace"
                maxLength={600}
                autoComplete="off"
              />
              <button type="submit" disabled={!input.trim() || sending} aria-label="Send question">
                <Send size={14} />
              </button>
            </div>
          </form>

          <footer className="dash-mascot-foot">
            <span>
              <Sparkles size={11} aria-hidden="true" />
              Workspace guide
            </span>
            <button type="button" onClick={() => goTo("overview")}>
              Open dashboard
              <ArrowRight size={11} />
            </button>
          </footer>
        </section>
      ) : null}

      <button
        type="button"
        className="dash-mascot-figure"
        onClick={() => (open ? setOpen(false) : openPanel())}
        onMouseEnter={() => setBubbleActive(true)}
        aria-label={open ? "Close Dessoir guide" : "Chat with Dessoir guide"}
        aria-expanded={open}
      >
        <span className="dash-mascot-stage">
          <span className="dash-mascot-bob">
            <img src={MASCOT_IMAGE} alt="" className="dash-mascot-dragon" draggable="false" />
          </span>
        </span>
      </button>
    </div>
  );
}
