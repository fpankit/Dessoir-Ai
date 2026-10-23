import { createRef, useCallback, useEffect, useRef, useState } from "react";
import { UserButton, SignIn, SignUp, useUser, useAuth } from "@clerk/react";
import { AnimatedBeam } from "./components/AnimatedBeam";
import {
  ArrowLeftRight,
  ArrowRight,
  ArrowUp,
  ArrowUpRight,
  BarChart3,
  Bot,
  Brain,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CircleArrowUp,
  CornerDownLeft,
  CreditCard,
  Eye,
  EyeOff,
  FileCheck,
  FileSearch,
  FileText,
  Gauge,
  Globe,
  Handshake,
  Hash,
  Headset,
  KeyRound,
  Loader2,
  Menu,
  MessageCircle,
  MessagesSquare,
  Mic,
  Paperclip,
  Phone,
  Plug,
  Plus,
  RotateCcw,
  ScrollText,
  Send,
  ShieldCheck,
  Sparkles,
  Tag,
  Ticket,
  Truck,
  UserCog,
  UserPlus,
  UserRound,
  Users,
  X as XIcon,
  Zap
} from "lucide-react";

const navItems = [
  { label: "Features", href: "#agents", number: "01" },
  { label: "Solutions", href: "#lifecycle", number: "02" },
  { label: "Playbooks", href: "#workflow", number: "03" },
  { label: "Case Studies", href: "#quote", number: "04" },
  { label: "Pricing", href: "/pricing.html", number: "05" },
  { label: "Demo", href: "#cta", number: "06" }
];

const solutionRoles = [
  {
    icon: UserRound,
    number: "01",
    title: "Founders",
    description: "Book your first demos without hiring a sales team."
  },
  {
    icon: ShieldCheck,
    number: "02",
    title: "Sales Reps",
    description: "Give every rep a pipeline of high-intent leads."
  },
  {
    icon: Users,
    number: "03",
    title: "Sales Leaders",
    description: "Skip the list building. Start with warm prospects."
  }
];

const customerStories = [
  {
    brand: "Wispr",
    className: "mega-logo-wispr",
    stat: "60%",
    caption: "of weekly demos from Gojberry"
  },
  {
    brand: "mindflow",
    className: "mega-logo-mindflow",
    stat: "35%",
    caption: "reply rate on intent-driven campaigns"
  }
];

function resolveHref(href, page) {
  if (page === "pricing" && href.startsWith("#")) {
    return `/${href}`;
  }
  return href;
}

function authHref(mode) {
  return `/auth.html?mode=${mode}`;
}

const pricingPlans = [
  {
    name: "Hobby",
    accent: "#2c41b3",
    monthly: 36,
    yearly: 29,
    save: 84,
    description: "The ideal entry point to Dessoir Ai.",
    credits: "700 message credits/month",
    cta: "Start 7-day trial",
    features: [
      { icon: Sparkles, label: "Access to advanced models" },
      { icon: Users, label: "2 members" },
      { icon: Plug, label: "Basic Integrations" },
      { icon: BarChart3, label: "Basic analytics" },
      { icon: Paperclip, label: "Allow file attachments in chat" }
    ]
  },
  {
    name: "Standard",
    accent: "#c11574",
    monthly: 135,
    yearly: 108,
    save: 324,
    description: "For small teams launching their first agent.",
    credits: "4,000 message credits/month",
    cta: "Start 7-day trial",
    inherits: "Hobby",
    features: [
      { icon: Users, label: "3 members" },
      { icon: Plug, label: "Advanced integrations" },
      { icon: MessagesSquare, label: "Dessoir Ai helpdesk inbox" },
      { icon: Phone, label: "Voice" },
      { icon: Hash, label: "API access" }
    ]
  },
  {
    name: "Pro",
    accent: "#f0a500",
    popular: true,
    monthly: 450,
    yearly: 360,
    save: 1080,
    description: "For teams with a growing customer base.",
    credits: "15,000 message credits/month",
    cta: "Start 7-day trial",
    inherits: "Standard",
    features: [
      { icon: Users, label: "5 members" },
      { icon: BarChart3, label: "Advanced analytics" },
      { icon: Sparkles, label: "Sources suggestions" },
      { icon: Ticket, label: "Tickets as a source" }
    ]
  },
  {
    name: "Enterprise",
    accent: "#7fb2e5",
    custom: true,
    description: "For companies deploying AI agents at scale.",
    credits: "Custom usage with flexible billing",
    cta: "Book a demo",
    inherits: "Pro",
    features: [
      { icon: Sparkles, label: "Dessoir Ai Enterprise agent" },
      { icon: FileText, label: "Enterprise Backstage and reporting" },
      { icon: CreditCard, label: "Flexible billing options" },
      { icon: Gauge, label: "Higher limits" },
      { icon: KeyRound, label: "SSO" },
      { icon: ShieldCheck, label: "HIPAA-eligible" },
      { icon: ScrollText, label: "Audit logs" },
      { icon: UserCog, label: "Custom roles & permissions" },
      { icon: Tag, label: "White-labeling" },
      { icon: FileCheck, label: "SLAs" },
      { icon: Handshake, label: "Success manager (CSM)" },
      { icon: Headset, label: "Priority support" }
    ]
  }
];

const procedures = [
  {
    label: "Order return & refund",
    icon: RotateCcw,
    tint: "#FEE2E2",
    color: "#EF4444"
  },
  {
    label: "Order status lookup",
    icon: FileSearch,
    tint: "#DBEAFE",
    color: "#3B82F6"
  },
  {
    label: "Upgrade plan",
    icon: CircleArrowUp,
    tint: "#DCFCE7",
    color: "#16A34A"
  },
  {
    label: "Cancel subscription",
    icon: XIcon,
    tint: "#E0F2FE",
    color: "#0284C7"
  },
  {
    label: "Product exchange",
    icon: ArrowLeftRight,
    tint: "#FCE7F3",
    color: "#DB2777"
  }
];

const agents = [

  {
    slug: "support",
    name: "Customer Support agent",
    description:
      "Resolve complex support queries accurately across live chat, email, phone, Slack, and more.",
    userMessage: "I need help with my order",
    agentMessage:
      "Of course, I found your order for the Canvas Tote. Is that the one you need help with?",
    cubeIcon: "headset",
    iconColor: "#FFFFFF",
    scene: "#A3158D",
    colors: {
      top: "#B71CA7",
      left: "#8E1B8C",
      right: "#F97316",
      glow: "rgba(246, 51, 154, 0.24)"
    }
  },
  {
    slug: "sales",
    name: "Sales agent",
    description:
      "Engage prospects, answer product questions, and guide conversations toward revenue.",
    userMessage: "I would like to book a demo",
    agentMessage:
      "Perfect, here are some available times, pick a slot that suits you.",
    cubeIcon: "dollar",
    iconColor: "#FFFFFF",
    scene: "#1D4ED8",
    colors: {
      top: "#1D4ED8",
      left: "#1E3A8A",
      right: "#5AA7FF",
      glow: "rgba(59, 130, 246, 0.24)"
    }
  },
  {
    slug: "product",
    name: "Product guidance agent",
    description:
      "Help customers find info and understand your products with a clear, on-brand voice.",
    userMessage: "I have dry skin, which moisturizer works for me?",
    agentMessage:
      "The Deep Moisture Cream. It’s our richest formula and top seller.",
    cubeIcon: "flower",
    iconColor: "#FFFFFF",
    scene: "#EFA10A",
    colors: {
      top: "#FBBF24",
      left: "#F59E0B",
      right: "#D0006F",
      glow: "rgba(245, 158, 11, 0.22)"
    }
  }
];

const workflowSteps = [
  {
    slug: "build",
    label: "Build",
    title: "Build an agent that knows your business.",
    description:
      "Connect your data sources, define your agent’s role, and set guardrails. No code required—ready in minutes.",
    meta: "No code required",
    note: "Connect your help center, policies, and product data in a few clicks."
  },
  {
    slug: "test",
    label: "Test",
    title: "Test every answer before customers see it.",
    description:
      "Run real customer scenarios before going live. Validate accuracy, brand consistency, and edge case handling across every channel.",
    meta: "24 live scenarios",
    note: "Review every scenario, catch edge cases, and fix them before launch."
  },
  {
    slug: "deploy",
    label: "Deploy",
    title: "Go live everywhere, all at once.",
    description:
      "Publish your agent across chat, WhatsApp, email, Slack, and more with a single click. Goes live instantly.",
    meta: "One-click publishing",
    note: "One agent, one source of truth, across every customer channel."
  },
  {
    slug: "optimize",
    label: "Optimize",
    title: "Get better with every conversation.",
    description:
      "Track resolution rates, review escalations, and refine instructions. Your agent improves with every conversation.",
    meta: "Continuous learning",
    note: "See what is working, spot every gap, and apply improvements instantly."
  }
];

const integrationChannels = [
  { id: "web", label: "Website", logo: "/logos/chrome.svg", curvature: -55 },
  { id: "email", label: "Email", logo: "/logos/gmail.svg", curvature: -55 },
  { id: "slack", label: "Slack", logo: "/logos/slack.svg", curvature: 0 },
  { id: "whatsapp", label: "WhatsApp", logo: "/logos/whatsapp.svg", curvature: 0 },
  { id: "voice", label: "Voice", logo: "/logos/twilio.svg", curvature: 55 },
  { id: "app", label: "In-app", logo: "/logos/intercom.svg", curvature: 55 }
];

const setupPhases = [
  {
    id: "connect",
    label: "Connect",
    index: "01",
    crystal: "/crystal-connect.webp",
    title: "Enter your website",
    description:
      "Dessoir Ai reads your website and instantly understands what you sell, who you target, and how to pitch you.",
    note: "No manual set up needed."
  },
  {
    id: "prospect",
    label: "Prospect",
    index: "02",
    crystal: "/crystal-prospect.webp",
    title: "Your agent finds your buyers",
    description:
      "It detects buying signals, scores your best prospects, and starts contacting them across email and socials, automatically.",
    note: "Outbound that used to require a full team now runs with AI."
  },
  {
    id: "convert",
    label: "Convert",
    index: "03",
    crystal: "/crystal-convert.webp",
    title: "Demos land in your calendar",
    description:
      "You wake up to qualified leads already interested. Replies are already drafted. And your pipeline keeps growing in the background every single day.",
    note: "This is what sales was always supposed to feel like."
  }
];

const outreachCards = [
  {
    id: "learning",
    icon: Brain,
    label: "Learning",
    title: "It gets better every week.",
    description:
      "It learns from your business, what converts, what doesn't, which messages land, which don't. Every week it adjusts. Every adjustment compounds.",
    tags: [
      { label: "Refines ICP", tone: "yellow" },
      { label: "Learns", tone: "peach" },
      { label: "Adapts", tone: "mint" },
      { label: "Compounds", tone: "yellow" }
    ]
  },
  {
    id: "control",
    icon: Bot,
    label: "Control",
    title: "Full auto or approve before it sends",
    description:
      "Run fully autonomous or review messages before they go out. Your agent adapts to however your team wants to work, no rigid workflows.",
    tags: []
  },
  {
    id: "replies",
    icon: MessageCircle,
    label: "Replies",
    title: "Every reply, pre-written and ready",
    description:
      "When a prospect responds, a tailored reply lands in your inbox, already written, ready to send in one click. You stay in control of every conversation that matters.",
    tags: []
  },
  {
    id: "lead-generation",
    icon: UserRound,
    label: "Lead Generation",
    title: "Finds & prioritizes your best prospects",
    description:
      "Detects buying signals, builds lookalike audiences from your best customers, scores every prospect, and contacts the highest-intent ones first.",
    tags: [
      { label: "Intent signals", tone: "yellow" },
      { label: "Lookalike", tone: "peach" },
      { label: "Lead scoring", tone: "mint" },
      { label: "ICP filtering", tone: "yellow" }
    ]
  },
  {
    id: "outreach",
    icon: Send,
    label: "Outreach",
    title: "Human-quality messages at scale.",
    description:
      "Email and LinkedIn campaigns powered by real buying signals. Every message is built around the prospect's context, their company, activity, intent signals, and timing. Get relevant conversations with the right people at the right moment.",
    tags: [
      { label: "Email", tone: "yellow" },
      { label: "Socials", tone: "peach" },
      { label: "AI copywriting", tone: "mint" },
      { label: "Auto follow-ups", tone: "yellow" }
    ]
  }
];


function DessoirAiMark({ size = 26, inverted = false }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      aria-hidden="true"
    >
      <rect
        width="32"
        height="32"
        rx="1.5"
        fill={inverted ? "#F7F5F0" : "#0A0A0A"}
      />
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

function TrustpilotMark({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="12" fill="#F04B35" />
      <path
        d="m12 5.2 2.15 4.38 4.83.7-3.49 3.4.82 4.81L12 16.22l-4.31 2.27.82-4.81-3.49-3.4 4.83-.7L12 5.2Z"
        fill="#FFFFFF"
      />
    </svg>
  );
}

function Stars() {
  return (
    <span className="stars" aria-hidden="true">
      {[0, 1, 2, 3].map((star) => (
        <svg width="15" height="15" viewBox="0 0 24 24" key={star}>
          <path
            d="M12 2.6 14.83 8.34l6.33.92-4.58 4.46 1.08 6.3L12 17.05l-5.66 2.97 1.08-6.3L2.84 9.26l6.33-.92L12 2.6Z"
            fill="currentColor"
          />
        </svg>
      ))}
      <svg width="15" height="15" viewBox="0 0 24 24">
        <defs>
          <linearGradient id="trustpilot-half" x1="0" x2="1" y1="0" y2="0">
            <stop offset="50%" stopColor="currentColor" />
            <stop offset="50%" stopColor="transparent" />
          </linearGradient>
        </defs>
        <path
          d="M12 2.6 14.83 8.34l6.33.92-4.58 4.46 1.08 6.3L12 17.05l-5.66 2.97 1.08-6.3L2.84 9.26l6.33-.92L12 2.6Z"
          fill="url(#trustpilot-half)"
          stroke="currentColor"
          strokeWidth="1.1"
        />
      </svg>
    </span>
  );
}

function DiamondPattern({ id, className = "", color = "rgba(255,255,255,0.13)" }) {
  return (
    <svg
      className={`diamond-pattern ${className}`}
      width="100%"
      height="100%"
      aria-hidden="true"
    >
      <defs>
        <pattern
          id={id}
          width="150"
          height="150"
          patternUnits="userSpaceOnUse"
          patternTransform="rotate(45)"
        >
          <rect
            width="150"
            height="150"
            fill="none"
            stroke={color}
            strokeWidth="1"
          />
        </pattern>
        <pattern
          id={`${id}-wide`}
          width="300"
          height="300"
          patternUnits="userSpaceOnUse"
          patternTransform="rotate(45)"
        >
          <rect
            width="300"
            height="300"
            fill="none"
            stroke={color}
            strokeOpacity="0.45"
            strokeWidth="1"
          />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill={`url(#${id})`} />
      <rect width="100%" height="100%" fill={`url(#${id}-wide)`} />
    </svg>
  );
}

function Reveal({ children, className = "", delay = 0, as: Tag = "div" }) {
  return (
    <Tag
      className={`reveal ${className}`}
      data-reveal
      style={{ "--reveal-delay": delay }}
    >
      {children}
    </Tag>
  );
}

function useReveal() {
  useEffect(() => {
    const items = Array.from(document.querySelectorAll("[data-reveal]"));
    if (!("IntersectionObserver" in window)) {
      items.forEach((item) => item.classList.add("is-visible"));
      return undefined;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.08 }
    );

    items.forEach((item) => observer.observe(item));
    return () => observer.disconnect();
  }, []);
}

function useInView(threshold = 0.25, rootMargin = "0px 0px -6% 0px") {
  const ref = useRef(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return undefined;
    if (!("IntersectionObserver" in window)) {
      setInView(true);
      return undefined;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        setInView(entry.isIntersecting);
      },
      { threshold, rootMargin }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [threshold, rootMargin]);

  return [ref, inView];
}

function useTypewriter(text, active, delay = 500, speed = 24) {
  const [value, setValue] = useState("");

  useEffect(() => {
    if (!active) {
      setValue("");
      return undefined;
    }

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      setValue(text);
      return undefined;
    }

    let index = 0;
    let interval;
    const timeout = window.setTimeout(() => {
      interval = window.setInterval(() => {
        index += 1;
        setValue(text.slice(0, index));
        if (index >= text.length) window.clearInterval(interval);
      }, speed);
    }, delay);

    return () => {
      window.clearTimeout(timeout);
      window.clearInterval(interval);
    };
  }, [text, active, delay, speed]);

  return value;
}

function useCountUp(from, to, active, duration = 1600, delay = 0) {
  const [value, setValue] = useState(from);

  useEffect(() => {
    if (!active) {
      setValue(from);
      return undefined;
    }

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setValue(to);
      return undefined;
    }

    let frame;
    let timeout;
    let start = 0;
    const tick = (now) => {
      if (!start) start = now;
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(from + (to - from) * eased);
      if (progress < 1) frame = window.requestAnimationFrame(tick);
    };

    timeout = window.setTimeout(() => {
      frame = window.requestAnimationFrame(tick);
    }, delay);

    return () => {
      window.clearTimeout(timeout);
      window.cancelAnimationFrame(frame);
    };
  }, [from, to, active, duration, delay]);

  return value;
}

function NavFlipLabel({ label, number }) {
  return (
    <span className="nav-flip">
      <span className="nav-flip-face nav-flip-front">
        {label}
        <span className="nav-index" aria-hidden="true">
          {number}
        </span>
      </span>
      <span className="nav-flip-face nav-flip-back" aria-hidden="true">
        {label}
        <span className="nav-index">{number}</span>
      </span>
    </span>
  );
}

function Header({ menuOpen, setMenuOpen, page = "home" }) {
  const { isSignedIn } = useAuth();
  const menuRef = useRef(null);
  const toggleRef = useRef(null);
  const solutionsRef = useRef(null);
  const solutionsTriggerRef = useRef(null);
  const solutionsCloseTimer = useRef(null);
  const suppressSolutionsFocus = useRef(false);
  const [solutionsOpen, setSolutionsOpen] = useState(false);

  const clearSolutionsClose = () => {
    if (solutionsCloseTimer.current) {
      window.clearTimeout(solutionsCloseTimer.current);
      solutionsCloseTimer.current = null;
    }
  };

  const openSolutions = () => {
    clearSolutionsClose();
    setSolutionsOpen(true);
  };

  const handleSolutionsFocus = () => {
    if (suppressSolutionsFocus.current) {
      suppressSolutionsFocus.current = false;
      return;
    }
    openSolutions();
  };

  const closeSolutionsSoon = () => {
    clearSolutionsClose();
    solutionsCloseTimer.current = window.setTimeout(() => {
      setSolutionsOpen(false);
    }, 170);
  };

  const handleSolutionsBlur = (event) => {
    if (solutionsRef.current?.contains(event.relatedTarget)) return;
    clearSolutionsClose();
    setSolutionsOpen(false);
  };

  useEffect(() => () => clearSolutionsClose(), []);

  useEffect(() => {
    if (!solutionsOpen) return undefined;

    const onKeyDown = (event) => {
      if (event.key !== "Escape") return;
      const focusInside = solutionsRef.current?.contains(document.activeElement);
      const triggerFocused = document.activeElement === solutionsTriggerRef.current;
      if (focusInside && !triggerFocused) {
        suppressSolutionsFocus.current = true;
        solutionsTriggerRef.current?.focus();
      }
      setSolutionsOpen(false);
    };

    const onPointerDown = (event) => {
      if (!solutionsRef.current?.contains(event.target)) {
        setSolutionsOpen(false);
      }
    };

    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("pointerdown", onPointerDown);

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("pointerdown", onPointerDown);
    };
  }, [solutionsOpen]);

  useEffect(() => {
    if (!menuOpen) return undefined;

    const onKeyDown = (event) => {
      if (event.key !== "Tab") return;
      const menu = menuRef.current;
      const toggle = toggleRef.current;
      if (!menu || !toggle) return;

      const items = [
        toggle,
        ...menu.querySelectorAll("a[href], button:not([disabled])")
      ].filter((element) => element.offsetParent !== null);

      if (!items.length) return;
      const first = items[0];
      const last = items[items.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      } else if (!items.includes(document.activeElement)) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [menuOpen]);

  return (
    <header className="site-header">
      <div className="header-inner">
        <a
          className="brand"
          href={page === "pricing" ? "/" : "#top"}
          aria-label="Dessoir Ai home"
          onClick={() => setMenuOpen(false)}
        >
          <DessoirAiMark size={27} />
          <span>Dessoir Ai</span>
        </a>

        <nav className="main-nav" aria-label="Primary navigation">
          {navItems.map((item) => {
            if (item.label === "Solutions") {
              return (
                <div
                  ref={solutionsRef}
                  className={`nav-dropdown${solutionsOpen ? " is-open" : ""}`}
                  key={item.label}
                  onMouseEnter={openSolutions}
                  onMouseLeave={closeSolutionsSoon}
                  onFocus={handleSolutionsFocus}
                  onBlur={handleSolutionsBlur}
                >
                  <a
                    ref={solutionsTriggerRef}
                    className="nav-link nav-link-solutions"
                    href={resolveHref(item.href, page)}
                    aria-haspopup="true"
                    aria-expanded={solutionsOpen}
                    aria-controls="solutions-mega"
                    onClick={() => setSolutionsOpen(false)}
                  >
                    <NavFlipLabel label={item.label} number={item.number} />
                  </a>

                  <div
                    className={`mega-menu${solutionsOpen ? " is-open" : ""}`}
                    id="solutions-mega"
                    role="region"
                    aria-label="Solutions"
                    onMouseEnter={openSolutions}
                    onMouseLeave={closeSolutionsSoon}
                    onClick={() => setSolutionsOpen(false)}
                  >
                    <div className="mega-panel">
                      <div className="mega-main">
                        <section
                          className="mega-column mega-roles"
                          aria-labelledby="solutions-roles-title"
                        >
                          <div className="mega-head">
                            <h2 className="mega-title" id="solutions-roles-title">
                              Solutions by role
                            </h2>
                          </div>
                          <div className="mega-role-grid">
                            {solutionRoles.map((role) => {
                              const RoleIcon = role.icon;
                              return (
                                <a
                                  className="mega-role-card"
                                  href={resolveHref("#lifecycle", page)}
                                  key={role.title}
                                >
                                  <span className="mega-role-top">
                                    <span className="mega-role-icon" aria-hidden="true">
                                      <RoleIcon size={16} strokeWidth={1.8} />
                                    </span>
                                    <span className="mega-role-index">{role.number}</span>
                                  </span>
                                  <span className="mega-role-title">{role.title}</span>
                                  <span className="mega-role-copy">{role.description}</span>
                                </a>
                              );
                            })}
                          </div>
                        </section>

                        <aside
                          className="mega-column mega-stories"
                          aria-labelledby="solutions-stories-title"
                        >
                          <div className="mega-head">
                            <h2 className="mega-title" id="solutions-stories-title">
                              Customer stories
                            </h2>
                            <a
                              className="mega-all-link"
                              href={resolveHref("#quote", page)}
                            >
                              All Stories
                            </a>
                          </div>
                          {customerStories.map((story) => (
                            <a
                              className="mega-story"
                              href={resolveHref("#quote", page)}
                              key={story.brand}
                            >
                              <span className="mega-story-head">
                                <span className={`mega-story-brand ${story.className}`}>
                                  <span className="mega-story-mark" aria-hidden="true">
                                    {story.brand === "Wispr" ? (
                                      "W"
                                    ) : (
                                      <Sparkles size={11} strokeWidth={2.2} />
                                    )}
                                  </span>
                                  {story.brand}
                                </span>
                                <ArrowUpRight size={14} strokeWidth={1.8} aria-hidden="true" />
                              </span>
                              <span className="mega-story-stat">{story.stat}</span>
                              <span className="mega-story-caption">{story.caption}</span>
                            </a>
                          ))}
                        </aside>
                      </div>

                      <div className="mega-foot">
                        <span className="mega-foot-copy">
                          Not sure which one fits?{" "}
                          <a href={resolveHref("#cta", page)}>
                            Book a demo
                            <ArrowUpRight size={12} strokeWidth={2} aria-hidden="true" />
                          </a>
                        </span>
                        <span className="mega-foot-trust">
                          Trusted by 2000+ sales and GTM Teams
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            }

            return (
              <a
                className="nav-link"
                href={resolveHref(item.href, page)}
                key={item.label}
                aria-current={
                  page === "pricing" && item.label === "Pricing" ? "page" : undefined
                }
              >
                <NavFlipLabel label={item.label} number={item.number} />
              </a>
            );
          })}
        </nav>

        <div className="header-actions">
          {!isSignedIn ? (
            <>
              <a
                className="login-link"
                href={authHref("signin")}
                onClick={() => setMenuOpen(false)}
              >
                Login
              </a>
              <a
                className="header-cta"
                href={authHref("signup")}
                onClick={() => setMenuOpen(false)}
              >
                <span className="header-cta-slider" aria-hidden="true">
                  <span className="header-cta-arrow" />
                </span>
                <span className="header-cta-label">Start for free</span>
              </a>
            </>
          ) : (
            <>
              <a
                className="login-link"
                href="/scraper.html"
                style={{ fontWeight: 600 }}
                onClick={() => setMenuOpen(false)}
              >
                Console
              </a>
              <UserButton afterSignOutUrl="/" />
            </>
          )}
          <button
            ref={toggleRef}
            type="button"
            className="menu-toggle"
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
            aria-controls="mobile-menu"
            onClick={() => setMenuOpen((open) => !open)}
          >
            {menuOpen ? <XIcon size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      <div
        ref={menuRef}
        className={`mobile-menu${menuOpen ? " is-open" : ""}`}
        id="mobile-menu"
        aria-hidden={!menuOpen}
      >
        <nav className="mobile-nav" aria-label="Mobile navigation">
          {navItems.map((item) => (
            <a
              className="mobile-nav-link"
              href={resolveHref(item.href, page)}
              key={item.label}
              tabIndex={menuOpen ? 0 : -1}
              aria-current={
                page === "pricing" && item.label === "Pricing" ? "page" : undefined
              }
              onClick={() => setMenuOpen(false)}
            >
              <span>
                {item.label}
                <span className="mobile-nav-index" aria-hidden="true">
                  {item.number}
                </span>
              </span>
              <ArrowUpRight size={16} strokeWidth={1.8} aria-hidden="true" />
            </a>
          ))}
        </nav>
        <div className="mobile-menu-actions">
          {!isSignedIn ? (
            <>
              <a
                className="button button-outline"
                href={authHref("signin")}
                onClick={() => setMenuOpen(false)}
              >
                Login
              </a>
              <a
                className="button button-dark"
                href={authHref("signup")}
                onClick={() => setMenuOpen(false)}
              >
                Start for free
                <ArrowUpRight size={16} strokeWidth={2} aria-hidden="true" />
              </a>
            </>
          ) : (
            <>
              <a
                className="button button-dark"
                href="/scraper.html"
                onClick={() => setMenuOpen(false)}
              >
                Go to Console
                <ArrowUpRight size={16} strokeWidth={2} aria-hidden="true" />
              </a>
              <div style={{ marginTop: 10, display: "flex", alignItems: "center", gap: 10 }}>
                <UserButton afterSignOutUrl="/" />
                <span style={{ fontSize: 13, color: "var(--muted)" }}>Account</span>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

const heroSources = [
  { name: "Acme_Product_Guide.pdf", meta: "4 KB", kind: "file" },
  { name: "Acme_Onboarding_Checklist.pd", meta: "3 KB", kind: "file" },
  { name: "https://www.acme.co", meta: "12 KB", kind: "url" },
  { name: "https://www.acme.co/pricing", meta: "5 KB", kind: "url" }
];

const heroAddedSource = {
  name: "Acme_Refund_Policy.pdf",
  meta: "6 KB",
  kind: "file"
};

const heroUpgradePrompt = "I want to upgrade my plan to Premium";
const heroUpgradeReply =
  "Sure! I've just updated your subscription. You're now on the Premium Plan.";
const heroBookingPrompt = "Can I book a meeting with Sales?";
const heroBookingReply = "Sure, pick a time that works for you.";
const heroBookingDays = [
  { date: "25", day: "Sun" },
  { date: "26", day: "Mon" },
  { date: "27", day: "Tue" },
  { date: "28", day: "Wed" }
];
const heroBookingTimes = [
  "3:00 PM",
  "3:30 PM",
  "4:00 PM",
  "5:00 PM",
  "6:00 PM",
  "6:15 PM"
];
const heroIntegrations = [
  "stripe",
  "cal",
  "linear",
  "slack",
  "quickbooks",
  "openai",
  "zendesk",
  "salesforce",
  "shopify",
  "zoho",
  "hubspot",
  "intercom"
];

function DemoCursor({ className = "", visible = true, clicking = false, style }) {
  return (
    <span
      className={`demo-cursor${className ? ` ${className}` : ""}${
        visible ? " is-visible" : ""
      }${clicking ? " is-clicking" : ""}`}
      style={style}
      aria-hidden="true"
    >
      <svg width="24" height="27" viewBox="0 0 22 25" fill="none">
        <path
          d="M3.2 1.8v18.4l4.9-4.8 3 6.9 3.2-1.4-3-6.8 6.8.5L3.2 1.8Z"
          fill="#141414"
          stroke="#FFFFFF"
          strokeWidth="1.7"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
}

function DemoOrb({ size = 26, spinning = false }) {
  return (
    <svg
      className={`demo-orb${spinning ? " is-spinning" : ""}`}
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      aria-hidden="true"
    >
      <circle cx="16" cy="16" r="15.5" fill="#FFFFFF" />
      <circle
        cx="16"
        cy="16"
        r="12.9"
        fill="none"
        stroke="#111111"
        strokeWidth="1.2"
        strokeDasharray="1.1 2.2"
        opacity="0.8"
      />
      <g className="demo-orb-dots">
        {Array.from({ length: 8 }, (_, index) => {
          const angle = (index / 8) * Math.PI * 2;
          return (
            <circle
              key={index}
              cx={16 + Math.cos(angle) * 8.4}
              cy={16 + Math.sin(angle) * 8.4}
              r={index % 2 === 0 ? 1.35 : 1.05}
              fill="#111111"
            />
          );
        })}
      </g>
      <circle cx="16" cy="16" r="3.6" fill="#111111" />
    </svg>
  );
}

function DemoComposer({ value, typing, placeholder = "Ask a question..." }) {
  return (
    <div className="demo-composer">
      <Paperclip size={13} strokeWidth={1.9} className="demo-composer-clip" />
      <span
        className={`demo-composer-input${value ? "" : " is-placeholder"}`}
      >
        {value || placeholder}
        {typing && value ? <span className="demo-caret" /> : null}
      </span>
      <Mic size={13} strokeWidth={1.9} className="demo-composer-mic" />
      <span className="demo-voice" aria-hidden="true">
        <span />
        <span />
        <span />
        <span />
        <span />
      </span>
    </div>
  );
}

function IntegrationLogo({ id }) {
  if (id === "stripe") {
    return <span className="int-word int-stripe">S</span>;
  }

  if (id === "cal") {
    return <span className="int-word int-cal">Cal</span>;
  }

  if (id === "linear") {
    return (
      <svg viewBox="0 0 24 24" className="int-svg">
        <circle cx="12" cy="12" r="9.4" fill="#5E6AD2" />
        <path
          d="M4.8 14.1 14.1 4.8M6.9 17.1 17.1 6.9M10.1 19.2 19.2 10.1"
          stroke="#FFFFFF"
          strokeWidth="1.15"
          strokeLinecap="round"
          opacity="0.88"
        />
      </svg>
    );
  }

  if (id === "slack") {
    return <img src="/logos/slack.svg" alt="" />;
  }

  if (id === "quickbooks") {
    return <span className="int-qb">qb</span>;
  }

  if (id === "openai") {
    return (
      <svg viewBox="0 0 24 24" className="int-svg">
        <circle
          cx="12"
          cy="12"
          r="8.1"
          fill="none"
          stroke="#E5484D"
          strokeWidth="1.9"
        />
        <circle
          cx="12"
          cy="12"
          r="4.6"
          fill="none"
          stroke="#E5484D"
          strokeWidth="1.4"
          strokeDasharray="2 2.6"
        />
        <circle cx="12" cy="12" r="1.5" fill="#E5484D" />
      </svg>
    );
  }

  if (id === "zendesk") {
    return <span className="int-word int-zendesk">Z</span>;
  }

  if (id === "salesforce") {
    return (
      <svg viewBox="0 0 24 24" className="int-svg">
        <path
          d="M6.4 18.2a3.5 3.5 0 0 1-.4-7 4.6 4.6 0 0 1 8.8-.9 3.7 3.7 0 0 1 5.3 3.4 3.4 3.4 0 0 1-1.1 4.5H6.4Z"
          fill="#00A1E0"
        />
      </svg>
    );
  }

  if (id === "shopify") {
    return (
      <svg viewBox="0 0 24 24" className="int-svg">
        <path
          d="M6.4 7.7h11.2l.9 12.4H5.5L6.4 7.7Z"
          fill="#95BF47"
        />
        <path
          d="M9 7.6V6.4a3 3 0 0 1 6 0v1.2"
          fill="none"
          stroke="#5E8E3E"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
        <path
          d="M12.6 11.6c-1.2-.3-2.2.1-2.2 1s2.1.8 2.1 1.9-1.3 1.4-2.5.9"
          fill="none"
          stroke="#FFFFFF"
          strokeWidth="1.2"
          strokeLinecap="round"
        />
      </svg>
    );
  }

  if (id === "zoho") {
    return (
      <svg viewBox="0 0 24 24" className="int-svg">
        <rect x="4" y="10" width="4" height="9" rx="2" fill="#E42527" />
        <rect x="8" y="6" width="4" height="11" rx="2" fill="#089949" />
        <rect x="12" y="8" width="4" height="9" rx="2" fill="#226DB4" />
        <rect x="16" y="11" width="4" height="6" rx="2" fill="#F9B21D" />
      </svg>
    );
  }

  if (id === "hubspot") {
    return (
      <svg viewBox="0 0 24 24" className="int-svg">
        <circle
          cx="12"
          cy="12"
          r="3.8"
          fill="none"
          stroke="#FF7A59"
          strokeWidth="2"
        />
        <path
          d="M12 2.4v5.8M12 15.8v5.8M2.4 12h5.8M15.8 12h5.8M5.2 5.2l3.7 3.7M15.1 15.1l3.7 3.7M18.8 5.2l-3.7 3.7M8.9 15.1l-3.7 3.7"
          stroke="#FF7A59"
          strokeWidth="1.35"
          strokeLinecap="round"
        />
      </svg>
    );
  }

  return <img src="/logos/intercom.svg" alt="" />;
}

function HeroDemo({ onToneChange, onBackgroundSwipe }) {
  const [scene, setScene] = useState("sources");
  const [outgoingScene, setOutgoingScene] = useState(null);
  const [sceneFading, setSceneFading] = useState(false);
  const [tone, setTone] = useState("blue");
  const [sourceStage, setSourceStage] = useState("idle");
  const [sourcePressed, setSourcePressed] = useState(false);
  const [enabled, setEnabled] = useState(procedures.map(() => false));
  const [procedureCursor, setProcedureCursor] = useState(-1);
  const [procedurePressed, setProcedurePressed] = useState(false);
  const [upgradeInput, setUpgradeInput] = useState("");
  const [upgradeStage, setUpgradeStage] = useState("idle");
  const [bookingInput, setBookingInput] = useState("");
  const [bookingStage, setBookingStage] = useState("typing");
  const [bookingCursor, setBookingCursor] = useState(false);
  const [bookingPressed, setBookingPressed] = useState(false);
  const [selectedTime, setSelectedTime] = useState("");
  const [demoVisible, setDemoVisible] = useState(true);
  const demoRef = useRef(null);

  useEffect(() => {
    onToneChange(tone);
  }, [onToneChange, tone]);

  useEffect(() => {
    const node = demoRef.current;
    if (!node || !("IntersectionObserver" in window)) return undefined;

    const observer = new IntersectionObserver(
      ([entry]) => setDemoVisible(entry.isIntersecting),
      { threshold: 0 }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!demoVisible) return undefined;

    let disposed = false;
    const timers = new Set();

    const speed = 1.5;

    const sleep = (ms) =>
      new Promise((resolve) => {
        const timer = setTimeout(() => {
          timers.delete(timer);
          resolve();
        }, Math.round(ms / speed));
        timers.add(timer);
      });

    const prefersReducedMotion =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (prefersReducedMotion) {
      onBackgroundSwipe(false);
      setScene("booking");
      setSceneFading(false);
      setTone("magenta");
      setBookingStage("done");
      setSelectedTime("3:30 PM");
      return () => {
        disposed = true;
      };
    }

    const click = async (setter) => {
      if (disposed) return;
      setter(true);
      await sleep(140);
      if (disposed) return;
      setter(false);
      await sleep(150);
    };

    const type = async (text, setter, baseSpeed = 42) => {
      for (let index = 1; index <= text.length; index += 1) {
        if (disposed) return;
        setter(text.slice(0, index));
        await sleep(
          baseSpeed + (index % 4) * 7 + (text[index - 1] === " " ? 22 : 0)
        );
      }
    };

    const reset = () => {
      setScene("sources");
      setOutgoingScene(null);
      setSceneFading(false);
      setTone("blue");
      onBackgroundSwipe(false);
      setSourceStage("idle");
      setSourcePressed(false);
      setEnabled(procedures.map(() => false));
      setProcedureCursor(-1);
      setProcedurePressed(false);
      setUpgradeInput("");
      setUpgradeStage("idle");
      setBookingInput("");
      setBookingStage("typing");
      setBookingCursor(false);
      setBookingPressed(false);
      setSelectedTime("");
    };

    const changeScene = async (next, settle = 0) => {
      if (disposed) return;
      setSceneFading(true);
      await sleep(460);
      if (disposed) return;
      setScene(next);
      setSceneFading(false);
      if (settle) await sleep(settle);
    };

    const changeSceneSwipe = async (from, next, settle = 0) => {
      if (disposed) return;
      onBackgroundSwipe(true);
      setOutgoingScene(from);
      setScene(next);
      await sleep(1050);
      if (disposed) return;
      setOutgoingScene(null);
      if (settle) await sleep(settle);
    };

    const run = async () => {
      while (!disposed) {
        reset();
        await sleep(1250);

        await sleep(450);
        await click(setSourcePressed);
        if (disposed) return;
        setSourceStage("adding");
        await sleep(720);
        if (disposed) return;
        setSourceStage("added");
        await sleep(1150);
        if (disposed) return;
        setSourceStage("settled");
        await sleep(1400);
        if (disposed) return;

        await changeScene("procedures", 780);

        for (let index = 0; index < procedures.length; index += 1) {
          if (disposed) return;
          setProcedureCursor(index);
          await sleep(300);
          await click(setProcedurePressed);
          if (disposed) return;
          setEnabled((current) =>
            current.map((value, itemIndex) =>
              itemIndex === index ? true : value
            )
          );
          await sleep(110);
        }

        setProcedureCursor(-1);
        setUpgradeStage("reveal");
        await sleep(700);
        if (disposed) return;

        setUpgradeStage("chat");
        await sleep(620);
        if (disposed) return;

        setUpgradeStage("typing");
        await sleep(180);
        if (disposed) return;

        await type(heroUpgradePrompt, setUpgradeInput, 46);
        await sleep(520);
        if (disposed) return;
        setUpgradeInput("");
        setUpgradeStage("sent");
        await sleep(520);
        setUpgradeStage("loading");
        await sleep(2650);
        if (disposed) return;
        setUpgradeStage("done");
        await sleep(1600);
        if (disposed) return;

        setTone("magenta");
        await changeSceneSwipe("procedures", "booking", 850);

        await type(heroBookingPrompt, setBookingInput, 44);
        await sleep(470);
        if (disposed) return;
        setBookingInput("");
        setBookingStage("sent");
        await sleep(520);
        setBookingStage("loading");
        await sleep(2500);
        if (disposed) return;
        setBookingStage("done");
        await sleep(1050);

        setBookingCursor(true);
        await sleep(900);
        await click(setBookingPressed);
        if (disposed) return;
        setSelectedTime("3:30 PM");
        await sleep(1650);
        setBookingCursor(false);
        await sleep(1450);
        if (disposed) return;

        onBackgroundSwipe(false);
        setTone("green");
        await sleep(280);
        await changeScene("integrations", 4300);
        if (disposed) return;

        setTone("blue");
        await sleep(280);
        await changeScene("sources", 700);
      }
    };

    run();

    return () => {
      disposed = true;
      timers.forEach((timer) => clearTimeout(timer));
      timers.clear();
    };
  }, [onToneChange, onBackgroundSwipe, demoVisible]);

  const activeCount = enabled.filter(Boolean).length;
  const isSourceCursorVisible =
    sourceStage === "idle" || sourceStage === "adding";
  const showUpgradeChat =
    upgradeStage === "chat" ||
    upgradeStage === "typing" ||
    upgradeStage === "sent" ||
    upgradeStage === "loading" ||
    upgradeStage === "done";
  const showUpgradeBubble =
    upgradeStage === "sent" ||
    upgradeStage === "loading" ||
    upgradeStage === "done";
  const sceneClassName = (name) =>
    `hero-demo-scene${scene === name ? " is-active" : ""}${
      outgoingScene === name ? " is-leaving" : ""
    }`;

  return (
    <div
      className={`hero-demo${sceneFading ? " is-fading" : ""}${
        outgoingScene ? " is-swiping" : ""
      }`}
      ref={demoRef}
      aria-hidden="true"
    >
      <div className={sceneClassName("sources")}>
        <div className="demo-card demo-sources">
          <h2 className="demo-card-title">Data sources</h2>

          <div className="demo-source-list">
            {heroSources.map((source) => (
              <div className="demo-source-row" key={source.name}>
                <span className="demo-source-copy">
                  <strong>{source.name}</strong>
                  <small>{source.meta}</small>
                </span>
                <span className="demo-source-kind">
                  {source.kind === "file" ? (
                    <FileText size={10} strokeWidth={1.9} />
                  ) : (
                    <Globe size={10} strokeWidth={1.9} />
                  )}
                  {source.kind === "file" ? "File" : "URL"}
                </span>
              </div>
            ))}

            {sourceStage === "adding" ? (
              <div className="demo-source-row demo-source-row-loading">
                <span className="demo-source-shimmer" />
              </div>
            ) : null}

            {sourceStage === "added" || sourceStage === "settled" ? (
              <div className="demo-source-row is-new">
                <span className="demo-source-copy">
                  <strong>{heroAddedSource.name}</strong>
                  <small>{heroAddedSource.meta}</small>
                </span>
                <span
                  className={`demo-source-kind${
                    sourceStage === "added" ? " is-added" : ""
                  }`}
                >
                  {sourceStage === "added" ? (
                    <Check size={10} strokeWidth={2.4} />
                  ) : (
                    <FileText size={10} strokeWidth={1.9} />
                  )}
                  {sourceStage === "added" ? "Added" : "File"}
                </span>
              </div>
            ) : null}
          </div>

          <span
            className={`demo-add-source${
              sourcePressed ? " is-pressed" : ""
            }`}
          >
            {sourceStage === "adding" ? (
              <span className="demo-spinner" />
            ) : (
              <Plus size={12} strokeWidth={2.2} />
            )}
            {sourceStage === "adding" ? "Adding source..." : "Add source"}

            <DemoCursor
              className="is-source"
              visible={isSourceCursorVisible}
              clicking={sourcePressed}
            />
          </span>
        </div>
      </div>

      <div className={sceneClassName("procedures")}>
        <div className="demo-upgrade-flow">
          <div className="demo-upgrade-card-slot">
            <div
              className={`demo-card demo-procedures demo-upgrade-procedures${
                showUpgradeChat ? " is-leaving" : ""
              }`}
            >
              <div className="procedures-head">
                <h2>Procedures</h2>
                <span className="procedures-status">
                  <span className="status-dot" aria-hidden="true" />
                  {activeCount} active
                </span>
              </div>

              <ul className="procedure-list">
                {procedures.map((procedure, index) => {
                  const Icon = procedure.icon;
                  return (
                    <li className="procedure-row" key={procedure.label}>
                      <span
                        className="procedure-icon"
                        style={{
                          background: procedure.tint,
                          color: procedure.color
                        }}
                      >
                        <Icon size={15} strokeWidth={2} />
                      </span>
                      <span className="procedure-label">
                        {procedure.label}
                      </span>
                      <span
                        className={`toggle${enabled[index] ? " is-on" : ""}`}
                        aria-hidden="true"
                      >
                        <span className="toggle-knob" />
                      </span>
                    </li>
                  );
                })}
              </ul>

              <DemoCursor
                className="is-procedure"
                visible={procedureCursor >= 0}
                clicking={procedurePressed}
                style={{ "--procedure-row": Math.max(procedureCursor, 0) }}
              />
            </div>

            {showUpgradeChat ? (
              <div className="demo-card demo-chat demo-upgrade-chat">
                <div className="demo-thread">
                  {showUpgradeBubble ? (
                    <div className="demo-bubble-user demo-upgrade-bubble">
                      {heroUpgradePrompt}
                    </div>
                  ) : null}

                  {upgradeStage === "done" ? (
                    <div className="demo-response">
                      <p className="demo-agent-copy">{heroUpgradeReply}</p>

                      <div className="demo-success">
                        <span className="demo-success-check">
                          <Check size={12} strokeWidth={2.8} />
                        </span>
                        <span className="demo-success-copy">
                          <strong>Plan successfully updated</strong>
                          <small>
                            Free
                            <ArrowRight size={10} strokeWidth={1.8} />
                            Premium
                          </small>
                        </span>
                      </div>

                      <div className="demo-agent">
                        <DemoOrb size={15} />
                        AI Agent
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>
            ) : null}
          </div>

          <div
            className={`demo-upgrade-composer${
              upgradeStage !== "idle" ? " is-visible" : ""
            }`}
          >
            <DemoComposer
              value={upgradeInput}
              typing={upgradeStage === "typing"}
            />
          </div>

          <div
            className={`demo-loader-slot demo-upgrade-loader${
              upgradeStage === "loading" ? " is-active" : ""
            }`}
          >
            <div className="demo-loader">
              <DemoOrb size={30} spinning />
              Upgrading plan<span className="demo-loader-dots">...</span>
            </div>
          </div>
        </div>
      </div>

      <div className={sceneClassName("booking")}>
        <div className="demo-chat-shell">
          <div className="demo-card demo-chat">
            <div className="demo-thread">
              {bookingStage !== "typing" ? (
                <div className="demo-bubble-user">{heroBookingPrompt}</div>
              ) : null}

              {bookingStage === "done" ? (
                <div className="demo-response">
                  <p className="demo-agent-copy">{heroBookingReply}</p>

                  <div className="demo-calendar">
                    <div className="demo-calendar-days">
                      <span className="demo-cal-arrow">
                        <ChevronLeft size={12} strokeWidth={2} />
                      </span>

                      {heroBookingDays.map((day) => (
                        <span className="demo-calendar-day" key={day.day}>
                          <strong>{day.date}</strong>
                          <small>{day.day}</small>
                        </span>
                      ))}

                      <span className="demo-cal-arrow">
                        <ChevronRight size={12} strokeWidth={2} />
                      </span>
                    </div>

                    <div className="demo-calendar-times">
                      {heroBookingTimes.map((time) => (
                        <span
                          className={`demo-calendar-time${
                            selectedTime === time ? " is-selected" : ""
                          }${bookingPressed && time === "3:30 PM" ? " is-pressed" : ""}`}
                          key={time}
                        >
                          {time}

                          {time === "3:30 PM" ? (
                            <DemoCursor
                              className="is-booking"
                              visible={bookingCursor}
                              clicking={bookingPressed}
                            />
                          ) : null}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="demo-agent">
                    <DemoOrb size={15} />
                    AI Agent
                  </div>
                </div>
              ) : null}
            </div>

            <DemoComposer
              value={bookingInput}
              typing={bookingStage === "typing"}
            />
          </div>

          <div
            className={`demo-loader-slot${
              bookingStage === "loading" ? " is-active" : ""
            }`}
          >
            <div className="demo-loader">
              <DemoOrb size={30} spinning />
              Running procedure
              <span className="demo-loader-dots">...</span>
            </div>
          </div>

          <DemoCursor
            className="is-booking-wait"
            visible={
              scene === "booking" &&
              (bookingStage === "sent" || bookingStage === "loading")
            }
          />
        </div>
      </div>

      <div className={sceneClassName("integrations")}>
        <div className="demo-card demo-integrations">
          <h2>Integrate with the tools you already use</h2>

          <div className="demo-integration-grid">
            {heroIntegrations.map((integration, index) => (
              <span
                className="demo-integration-tile"
                style={{ "--tile-index": index }}
                key={integration}
              >
                <IntegrationLogo id={integration} />
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function Hero() {
  const [tone, setTone] = useState("blue");
  const [backgroundSwipe, setBackgroundSwipe] = useState(false);

  return (
    <section className="hero" id="top" aria-labelledby="hero-title">
      <div className="hero-copy">
        <div className="hero-rating">
          <TrustpilotMark />
          <Stars />
          <strong>4.8</strong>
          <span className="hero-rating-copy">The leading AI agent for CX</span>
        </div>

        <h1 className="hero-title" id="hero-title">
          <span>Conversational</span>
          <span className="title-serif">agents for customer</span>
          <span>experience</span>
        </h1>

        <p className="hero-lede">
          AI agents that meet customers at every stage of their journey, across
          chat, email, and voice, to resolve issues end to end and increase
          revenue.
        </p>

        <div className="hero-actions">
          <a className="button button-dark" href={authHref("signup")}>
            Start free trial
            <ArrowUpRight size={16} strokeWidth={2.1} aria-hidden="true" />
          </a>
          <a className="button button-outline" href="#agents">
            Get a demo
          </a>
        </div>

        <p className="hero-footnote">
          <Check size={13} strokeWidth={2.4} aria-hidden="true" />
          Live in minutes. No credit card required.
        </p>
      </div>

      <div
        className={`hero-panel tone-${tone}`}
        id="hero-panel"
        aria-label="Animated product preview"
      >
        <DiamondPattern
          id="hero-diamonds"
          color="rgba(255,255,255,0.24)"
        />

        {backgroundSwipe ? (
          <div className="hero-panel-swipe" aria-hidden="true">
            <div className="hero-panel-swipe-track">
              <div className="hero-panel-swipe-slide is-blue">
                <DiamondPattern
                  id="hero-swipe-blue"
                  color="rgba(255,255,255,0.24)"
                />
              </div>
              <div className="hero-panel-swipe-slide is-magenta">
                <DiamondPattern
                  id="hero-swipe-magenta"
                  color="rgba(255,255,255,0.24)"
                />
              </div>
            </div>
          </div>
        ) : null}

        <span className="hero-panel-orb" aria-hidden="true" />
        <p className="sr-only">
          Preview of Dessoir AI adding a data source, activating procedures,
          upgrading a plan, booking a meeting, and connecting integrations.
        </p>
        <HeroDemo
          onToneChange={setTone}
          onBackgroundSwipe={setBackgroundSwipe}
        />
      </div>
    </section>
  );
}


function AgentGrid({ id }) {
  return (
    <svg className="agent-grid" width="100%" height="100%" aria-hidden="true">
      <defs>
        <pattern
          id={`agent-grid-${id}`}
          width="160"
          height="140"
          patternUnits="userSpaceOnUse"
        >
          <path
            className="agent-grid-line"
            d="M80 0 160 40 80 80 0 40ZM0 100 80 140 160 100"
            fill="none"
            strokeWidth="1"
          />
          <path
            className="agent-grid-dash"
            d="M0 40V100M80 80V140M160 40V100"
            fill="none"
            strokeWidth="1"
            strokeDasharray="3 5"
          />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill={`url(#agent-grid-${id})`} />
    </svg>
  );
}

function CubeGlyph({ kind, color }) {
  if (kind === "headset") {
    return (
      <g
        transform="translate(78 39)"
        fill="none"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M4 12v-1a8 8 0 0 1 16 0v1" />
        <path d="M4 12h2.2a1.8 1.8 0 0 1 1.8 1.8v2.4a1.8 1.8 0 0 1-1.8 1.8H6a2 2 0 0 1-2-2v-4Z" />
        <path d="M20 12h-2.2a1.8 1.8 0 0 0-1.8 1.8v2.4a1.8 1.8 0 0 0 1.8 1.8h.2a2 2 0 0 0 2-2v-4Z" />
        <path d="M20 16v1a3 3 0 0 1-3 3h-3" />
      </g>
    );
  }

  if (kind === "dollar") {
    return (
      <g
        transform="translate(78 39)"
        fill="none"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="12" cy="12" r="8.4" />
        <path d="M12 6.8v10.4M14.7 9.1c-.4-.8-1.4-1.3-2.6-1.3-1.5 0-2.6.8-2.6 1.9 0 1.2 1 1.7 2.7 2.1 1.8.4 2.8.9 2.8 2.1 0 1.2-1.2 2-2.9 2-1.4 0-2.5-.5-3-1.4" />
      </g>
    );
  }

  return (
    <g transform="translate(79 40)" fill={color}>
      <circle cx="12" cy="7.2" r="3.1" opacity=".92" />
      <circle cx="16.5" cy="10.5" r="3.1" opacity=".92" />
      <circle cx="14.8" cy="15.8" r="3.1" opacity=".92" />
      <circle cx="9.2" cy="15.8" r="3.1" opacity=".92" />
      <circle cx="7.5" cy="10.5" r="3.1" opacity=".92" />
      <circle cx="12" cy="12" r="2.2" fill="rgba(255,255,255,0.58)" />
    </g>
  );
}

function AgentCube({ id, colors, icon, iconColor }) {
  return (
    <svg
      className="agent-cube"
      viewBox="0 0 180 196"
      fill="none"
      role="img"
      aria-label="An AI agent cube"
    >
      <defs>
        <linearGradient id={`cube-top-${id}`} x1="34" y1="18" x2="140" y2="106">
          <stop stopColor={colors.top} />
          <stop offset="1" stopColor={colors.right} />
        </linearGradient>
        <linearGradient id={`cube-left-${id}`} x1="20" y1="54" x2="92" y2="174">
          <stop stopColor={colors.left} />
          <stop offset="1" stopColor={colors.top} />
        </linearGradient>
        <filter id={`cube-shadow-${id}`} x="-40%" y="-40%" width="180%" height="200%">
          <feDropShadow dx="0" dy="14" stdDeviation="12" floodColor="#18181B" floodOpacity=".18" />
        </filter>
      </defs>
      <ellipse cx="90" cy="172" rx="50" ry="10" fill="rgba(24,24,27,0.08)" />
      <g filter={`url(#cube-shadow-${id})`}>
        <path d="M90 8 166 52 90 96 14 52Z" fill={`url(#cube-top-${id})`} />
        <path d="M14 52 90 96V180L14 136Z" fill={`url(#cube-left-${id})`} />
        <path d="M166 52 90 96V180L166 136Z" fill={colors.right} />
        <path
          d="M90 8 166 52 90 96 14 52Z"
          stroke="rgba(255,255,255,0.3)"
          strokeWidth="1"
        />
      </g>
      <CubeGlyph kind={icon} color={iconColor} />
    </svg>
  );
}

function AgentCard({ agent }) {
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const active = hovered || focused;
  const typed = useTypewriter(agent.agentMessage, active, 180, 18);
  const isTyping = active && typed.length < agent.agentMessage.length;

  return (
    <article
      className={`agent-card${active ? " is-active" : ""}`}
      style={{ "--agent-scene": agent.scene }}
      tabIndex={0}
      aria-labelledby={`agent-${agent.slug}-title`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocus={() => setFocused(true)}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) {
          setFocused(false);
        }
      }}
    >
      <div className="agent-visual">
        <AgentGrid id={agent.slug} />
        <span
          className="agent-glow"
          style={{ background: agent.colors.glow }}
          aria-hidden="true"
        />
        <div className="cube-holder">
          <AgentCube
            id={agent.slug}
            colors={agent.colors}
            icon={agent.cubeIcon}
            iconColor={agent.iconColor}
          />
        </div>

        <div className="agent-chat" aria-hidden="true">
          <p className="chat-bubble chat-bubble-user">{agent.userMessage}</p>
          <div className="chat-bubble chat-bubble-agent">
            <span className="chat-message">
              {typed}
              {isTyping ? <span className="chat-caret is-typing" /> : null}
            </span>
            <span className="chat-agent-label">
              <Sparkles size={12} strokeWidth={1.8} aria-hidden="true" />
              AI Agent
            </span>
          </div>
        </div>
      </div>

      <div className="agent-body">
        <h3 id={`agent-${agent.slug}-title`}>{agent.name}</h3>
        <p>{agent.description}</p>
      </div>
    </article>
  );
}

function AgentsSection() {
  return (
    <section className="agents-section" id="agents" aria-labelledby="agents-title">
      <Reveal className="section-heading">
        <span className="section-kicker">Agents</span>
        <h2 id="agents-title">
          One agent for every customer
          <br />
          interaction, <span>runs support, sales,</span>
          <br />
          <span>and product guidance 24/7</span>
        </h2>
      </Reveal>

      <div className="agent-grid-cards">
        {agents.map((agent, index) => (
          <Reveal key={agent.slug} delay={index + 1}>
            <AgentCard agent={agent} />
          </Reveal>
        ))}
      </div>
    </section>
  );
}

const badgeFinders = [
  [0, 0],
  [14, 0],
  [0, 14]
];

function buildBadgeQrPath() {
  const path = [];

  for (let y = 0; y < 21; y += 1) {
    for (let x = 0; x < 21; x += 1) {
      const finder = badgeFinders.find(
        ([originX, originY]) =>
          x >= originX && x < originX + 7 && y >= originY && y < originY + 7
      );
      const quiet = badgeFinders.some(
        ([originX, originY]) =>
          x >= originX - 1 && x <= originX + 7 && y >= originY - 1 && y <= originY + 7
      );
      const alignment = x >= 16 && x <= 18 && y >= 16 && y <= 18;
      let filled = false;

      if (finder) {
        const localX = x - finder[0];
        const localY = y - finder[1];
        filled =
          localX === 0 ||
          localX === 6 ||
          localY === 0 ||
          localY === 6 ||
          (localX >= 2 && localX <= 4 && localY >= 2 && localY <= 4);
      } else if (alignment) {
        filled = !(x === 17 && y === 17);
      } else if (!quiet && (x === 6 || y === 6)) {
        filled = (x + y) % 2 === 0;
      } else if (!quiet) {
        const noise = (x * 37 + y * 73 + x * y * 13 + (x ^ y) * 7 + 11) % 17;
        filled = noise % 3 !== 0;
      }

      if (filled) {
        path.push(`M${x} ${y}h1v1h-1z`);
      }
    }
  }

  return path.join("");
}

const badgeQrPath = buildBadgeQrPath();

function BadgeQr() {
  return (
    <svg viewBox="0 0 21 21" shapeRendering="crispEdges" aria-hidden="true">
      <path d={badgeQrPath} fill="currentColor" />
    </svg>
  );
}

function BadgeMark() {
  const stars = [];

  for (let row = 0; row < 4; row += 1) {
    for (let column = 0; column < 3; column += 1) {
      stars.push([column * 15 + (row % 2 === 0 ? 0 : 7.5), row * 11]);
    }
  }

  return (
    <svg viewBox="0 0 52 47" aria-hidden="true">
      <defs>
        <linearGradient id="badge-star-fill" x1="8%" y1="0%" x2="92%" y2="100%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="34%" stopColor="#b9bac0" />
          <stop offset="62%" stopColor="#f4f4f6" />
          <stop offset="100%" stopColor="#777981" />
        </linearGradient>
      </defs>
      {stars.map(([x, y]) => (
        <path
          key={`${x}-${y}`}
          d="M7 0c1.3 3.7 3.3 5.7 7 7-3.7 1.3-5.7 3.3-7 7-1.3-3.7-3.3-5.7-7-7 3.7-1.3 5.7-3.3 7-7Z"
          transform={`translate(${x} ${y})`}
          fill="url(#badge-star-fill)"
        />
      ))}
    </svg>
  );
}

function BadgeStudioMark() {
  return (
    <svg viewBox="0 0 34 14" fill="none" aria-hidden="true">
      <path d="M1 10c4-7 7-7 11 0s7 7 11 0 7-7 10 0" stroke="currentColor" strokeWidth="1.1" />
      <path d="M1 7c4-7 7-7 11 0s7 7 11 0 7-7 10 0" stroke="currentColor" strokeWidth="1.1" opacity="0.68" />
      <path d="M1 4c4-7 7-7 11 0s7 7 11 0 7-7 10 0" stroke="currentColor" strokeWidth="1.1" opacity="0.38" />
    </svg>
  );
}

function QuoteSection() {
  return (
    <section className="quote-section" id="quote" aria-labelledby="quote-title">
      <Reveal className="quote-copy">
        <span className="section-kicker">Founder and Builder perspective</span>
        <blockquote id="quote-title">
          “Dessoir Ai is a strong signal of how customer support will evolve. It
          is an early adopter of the agentic approach, which will become
          increasingly effective, trusted, and prominent.”
        </blockquote>
        <div className="quote-author">
          <span className="quote-avatar" aria-hidden="true">
            A
          </span>
          <div>
            <strong>Ankit</strong>
            <span>Founder and Builder</span>
          </div>
        </div>
      </Reveal>

      <Reveal className="quote-flip" delay={1}>
        <div
          className="quote-flip-inner"
          tabIndex={0}
          role="group"
          aria-roledescription="flip card"
          aria-label="24/7 always-on customer coverage. Hover or focus to reveal the Dessoir AI all-access badge for Ankit, Founder and Builder."
        >
          <div className="quote-visual quote-face quote-face-front" aria-hidden="true">
            <DiamondPattern id="quote-diamonds" />
            <div className="quote-visual-top">
              <span className="quote-pill">The agentic shift</span>
              <span className="quote-mark">“</span>
            </div>
            <div className="quote-stat">
              <strong>24/7</strong>
              <span>always-on customer coverage</span>
            </div>
            <div className="quote-foot">
              <span className="live-dot" />
              Built for the next era of CX
            </div>
          </div>

          <div className="quote-badge quote-face quote-face-back" aria-hidden="true">
            <span className="badge-lanyard" />
            <div className="badge-brandline">
              <BadgeMark />
              <span>™</span>
            </div>
            <p className="badge-access">All-access</p>
            <div className="badge-details">
              <div className="badge-detail">
                <span>Address</span>
                <p>
                  1928 Pike Pl.
                  <br />
                  Seattle WA 98101
                </p>
              </div>
              <div className="badge-detail">
                <span>Web</span>
                <p>
                  Dessoir.ai
                  <br />
                  Agents.dessoir.ai
                </p>
              </div>
            </div>
            <div className="badge-rule" />
            <p className="badge-handle">Dessoir AI</p>
            <p className="badge-name">Ankit</p>
            <p className="badge-role">Founder and Builder</p>
            <div className="badge-bottom">
              <div className="badge-qr">
                <BadgeQr />
              </div>
              <div className="badge-reference">
                <span>Reference ID</span>
                <strong>20381930</strong>
                <p>
                  Dessoir AI
                  <br />
                  Studio company
                </p>
                <div className="badge-origin">
                  <BadgeStudioMark />
                  <span>
                    Dessoir
            <br className="launch-break" />
                    AI Studio
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Reveal>
    </section>
  );
}

const builderInstructions =
  "You are a friendly support agent. Resolve issues clearly, use the right actions, and hand off when needed.";

const builderModels = [
  { name: "Claude Sonnet 4.6", badge: "AI" },
  { name: "GPT-5.2", badge: "GPT" },
  { name: "Gemini 3 Pro", badge: "G" }
];

const builderOrderNumber = "DS-4821";
const builderUserPrompt = "Where is my order?";
const builderDeliveryDate = new Date();
builderDeliveryDate.setDate(builderDeliveryDate.getDate() + 2);
const builderDeliveryLabel = builderDeliveryDate.toLocaleDateString("en-US", {
  weekday: "short",
  month: "short",
  day: "numeric"
});
const builderOrderReply = `Good news! Order #${builderOrderNumber} is on the way.\nEstimated delivery: ${builderDeliveryLabel}, between 2:00 and 4:00 PM.`;

function BuilderVisual({ active }) {
  const [typedText, setTypedText] = useState("");
  const [modelIndex, setModelIndex] = useState(0);
  const [modelOpen, setModelOpen] = useState(false);
  const [cursorMode, setCursorMode] = useState("rest");
  const [clicking, setClicking] = useState(false);
  const [previewPressed, setPreviewPressed] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [editorFading, setEditorFading] = useState(false);
  const [zoomTarget, setZoomTarget] = useState("none");
  const [chatInput, setChatInput] = useState("");
  const [userMessage, setUserMessage] = useState("");
  const [agentTyping, setAgentTyping] = useState(false);
  const [agentText, setAgentText] = useState("");
  const [agentOrder, setAgentOrder] = useState(false);

  useEffect(() => {
    if (!active) {
      setTypedText("");
      setModelIndex(0);
      setModelOpen(false);
      setCursorMode("rest");
      setClicking(false);
      setPreviewPressed(false);
      setPreviewOpen(false);
      setEditorFading(false);
      setZoomTarget("none");
      setChatInput("");
      setUserMessage("");
      setAgentTyping(false);
      setAgentText("");
      setAgentOrder(false);
      return undefined;
    }

    let disposed = false;
    const timers = new Set();
    const speed = 1.5;

    const sleep = (ms) =>
      new Promise((resolve) => {
        const timer = setTimeout(() => {
          timers.delete(timer);
          resolve();
        }, Math.round(ms / speed));
        timers.add(timer);
      });

    const type = async (text, setter, baseSpeed = 22, variance = 5) => {
      for (let index = 1; index <= text.length; index += 1) {
        if (disposed) return;
        setter(text.slice(0, index));
        const character = text[index - 1];
        await sleep(
          baseSpeed +
            (index % 4) * variance +
            (character === " " ? 10 : 0) +
            (character === "." || character === "," ? 35 : 0)
        );
      }
    };

    const click = async () => {
      if (disposed) return;
      setClicking(true);
      await sleep(170);
      if (disposed) return;
      setClicking(false);
      await sleep(120);
    };

    const run = async () => {
      while (!disposed) {
        setTypedText("");
        setModelIndex(0);
        setModelOpen(false);
        setCursorMode("rest");
        setPreviewPressed(false);
        setPreviewOpen(false);
        setChatInput("");
        setUserMessage("");
        setAgentTyping(false);
        setAgentText("");
        setAgentOrder(false);
        setEditorFading(false);
        setZoomTarget("none");
        await sleep(650);
        if (disposed) return;

        setCursorMode("typing");
        setZoomTarget("instructions");
        await sleep(850);

        await type(builderInstructions, setTypedText, 20, 5);
        setZoomTarget("none");
        await sleep(800);
        if (disposed) return;

        setCursorMode("model");
        await sleep(650);
        await click();
        if (disposed) return;

        setModelOpen(true);
        setCursorMode("model-menu");
        await sleep(800);
        await click();
        if (disposed) return;

        setModelIndex(1);
        setModelOpen(false);
        setCursorMode("model");
        await sleep(700);
        if (disposed) return;

        setCursorMode("preview");
        await sleep(650);
        await click();
        if (disposed) return;

        setPreviewPressed(true);
        await sleep(230);
        if (disposed) return;
        setPreviewPressed(false);
        await sleep(260);
        if (disposed) return;

        setPreviewOpen(true);
        setZoomTarget("phone");
        await sleep(850);

        await type(builderUserPrompt, setChatInput, 38, 4);

        await sleep(380);
        if (disposed) return;
        setUserMessage(builderUserPrompt);
        setChatInput("");
        setAgentTyping(true);
        await sleep(900);
        if (disposed) return;
        setAgentTyping(false);

        await type(builderOrderReply, setAgentText, 10, 3);

        setAgentOrder(true);
        setZoomTarget("none");
        await sleep(4000);
        if (disposed) return;

        setPreviewOpen(false);
        setEditorFading(true);
        await sleep(800);
        if (disposed) return;
        setUserMessage("");
        setAgentText("");
        setAgentOrder(false);
      }
    };

    run();

    return () => {
      disposed = true;
      timers.forEach((timer) => clearTimeout(timer));
      timers.clear();
    };
  }, [active]);

  const currentModel = builderModels[modelIndex];

  return (
    <div
      className={`stage stage-builder${active ? " is-active" : ""}${
        previewOpen ? " is-previewing" : ""
      }${zoomTarget === "instructions" ? " is-zoomed-editor" : ""}${
        zoomTarget === "phone" ? " is-zoomed-phone" : ""
      }`}
    >
      <DiamondPattern id="builder-diamonds" color="rgba(255,255,255,0.16)" />
      <div className={`builder-window${editorFading ? " is-resetting" : ""}`}>
        <div className="window-head">
          <span>Agent builder</span>
          <span className="window-state">
            <span aria-hidden="true" />
            Draft
          </span>
        </div>
        <div
          className={`builder-block builder-instructions${
            cursorMode === "typing" ? " is-typing" : ""
          }`}
        >
          <span className="mini-label">Instructions</span>
          <p>
            {typedText}
            <span className="inline-typing" aria-hidden="true" />
          </p>
        </div>
        <div className="builder-split">
          <div className="builder-block">
            <span className="mini-label">Branding</span>
            <div className="branding-row">
              <span>Accent color</span>
              <span className="color-swatch" />
            </div>
          </div>
          <div className={`builder-block builder-model${modelOpen ? " is-open" : ""}`}>
            <span className="mini-label">Model</span>
            <div className="model-row">
              <span className="model-icon">{currentModel.badge}</span>
              {currentModel.name}
              <ChevronDown size={12} aria-hidden="true" />
            </div>
            {modelOpen ? (
              <div className="model-menu" aria-hidden="true">
                {builderModels.map((candidate, index) => (
                  <div
                    className={`model-option${index === modelIndex ? " is-selected" : ""}`}
                    key={candidate.name}
                  >
                    <span className="model-icon">{candidate.badge}</span>
                    {candidate.name}
                    {index === modelIndex ? <Check size={10} aria-hidden="true" /> : null}
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        </div>
        <div className="builder-block builder-procedure">
          <span className="mini-label">Procedure</span>
          <ol>
            <li>Greet the customer and ask how you can help.</li>
            <li>Look up the order and confirm the item.</li>
            <li>Use lookup_order for the latest status.</li>
          </ol>
        </div>
        <div className="builder-preview-row">
          <span
            className={`builder-preview${previewPressed ? " is-pressed" : ""}`}
            aria-hidden="true"
          >
            Preview
          </span>
        </div>

        <div
          className={`builder-cursor is-${cursorMode}${clicking ? " is-clicking" : ""}`}
          aria-hidden="true"
        >
          <svg width="30" height="34" viewBox="0 0 22 25" fill="none">
            <path
              d="M3.2 1.8v18.4l4.9-4.8 3 6.9 3.2-1.4-3-6.8 6.8.5L3.2 1.8Z"
              fill="#18181B"
              stroke="#FFFFFF"
              strokeWidth="1.6"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      </div>

      <div className="builder-phone" aria-hidden="true">
        <div className="phone-screen">
          <span className="phone-island" />
          <div className="phone-status">
            <span>9:41</span>
            <svg width="31" height="8" viewBox="0 0 31 8" fill="none">
              <rect x="0" y="5" width="2" height="3" rx="0.5" fill="#18181B" />
              <rect x="3" y="3.5" width="2" height="4.5" rx="0.5" fill="#18181B" />
              <rect x="6" y="2" width="2" height="6" rx="0.5" fill="#18181B" />
              <rect x="9" y="0.5" width="2" height="7.5" rx="0.5" fill="#18181B" />
              <path
                d="M16.8 2.3a5.4 5.4 0 0 1 3.7 1.5l-1 1a4 4 0 0 0-5.4 0l-1-1a5.4 5.4 0 0 1 3.7-1.5Zm0 2.8c.7 0 1.4.3 1.9.8l-1.9 2-1.9-2c.5-.5 1.2-.8 1.9-.8Z"
                fill="#18181B"
              />
              <rect
                x="23.5"
                y="1.5"
                width="6.6"
                height="5"
                rx="1.3"
                stroke="#18181B"
                strokeWidth="0.8"
              />
              <rect x="24.3" y="2.3" width="4.4" height="3.4" rx="0.7" fill="#18181B" />
              <rect x="30.5" y="3" width="0.8" height="2" rx="0.4" fill="#18181B" />
            </svg>
          </div>
          <div className="phone-chat-head">
            <span className="phone-avatar">
              <DessoirAiMark size={21} />
            </span>
            <span className="phone-chat-name">
              <strong>Dessoir Ai</strong>
              <small>
                <i />
                Online
              </small>
            </span>
            <span className="phone-chat-menu">•••</span>
          </div>
          <div className="phone-thread">
            <span className="phone-date">Today</span>
            {userMessage ? <div className="phone-bubble is-user">{userMessage}</div> : null}
            {agentTyping ? (
              <div className="phone-bubble is-agent is-typing">
                <span />
                <span />
                <span />
              </div>
            ) : null}
            {agentText ? <div className="phone-bubble is-agent">{agentText}</div> : null}
            {agentOrder ? (
              <div className="phone-order">
                <span className="phone-order-icon">
                  <Truck size={15} strokeWidth={2} />
                </span>
                <span className="phone-order-copy">
                  <strong>Order #{builderOrderNumber}</strong>
                  <small>On the way · Arrives {builderDeliveryLabel}</small>
                </span>
              </div>
            ) : null}
          </div>
          <div className="phone-composer">
            <span className={`phone-composer-text${chatInput ? "" : " is-placeholder"}`}>
              {chatInput || "Message"}
              {chatInput ? <span className="phone-caret" /> : null}
            </span>
            <span className={`phone-send${chatInput ? " is-ready" : ""}`}>
              <ArrowUp size={14} strokeWidth={2.4} />
            </span>
          </div>
          <span className="phone-home-bar" />
        </div>
      </div>

      <div className="float-card builder-actions">
        <span className="float-icon">
          <Zap size={14} strokeWidth={2.2} />
        </span>
        <span>
          <strong>3 actions connected</strong>
          Invoices, orders, and plans
        </span>
        <CheckCircle2 size={16} className="float-check" aria-hidden="true" />
      </div>
    </div>
  );
}

function TesterVisual({ active }) {
  const tests = [
    { label: "Returns & refunds", value: "96%", width: "96%" },
    { label: "Order tracking", value: "92%", width: "92%" },
    { label: "Billing questions", value: "87%", width: "87%" }
  ];

  return (
    <div className={`stage stage-tester${active ? " is-active" : ""}`}>
      <DiamondPattern id="tester-diamonds" color="rgba(255,255,255,0.18)" />
      <div className="test-window">
        <div className="window-head">
          <span>Test run</span>
          <span className="window-state window-state-blue">
            <span aria-hidden="true" />
            24 scenarios
          </span>
        </div>
        <div className="test-score-row">
          <div>
            <span className="mini-label">Pass rate</span>
            <strong>96.4%</strong>
          </div>
          <span className="score-delta">+12.8%</span>
        </div>
        <div className="test-list">
          {tests.map((test, index) => (
            <div className="test-row" key={test.label}>
              <div className="test-row-head">
                <span>{test.label}</span>
                <strong>{test.value}</strong>
              </div>
              <span className="test-track">
                <span
                  className="test-fill"
                  style={{
                    "--test-width": test.width,
                    "--test-delay": `${index * 120}ms`
                  }}
                />
              </span>
            </div>
          ))}
        </div>
        <div className="test-foot">
          <span>
            <CheckCircle2 size={14} aria-hidden="true" />
            Brand voice
          </span>
          <span>
            <CheckCircle2 size={14} aria-hidden="true" />
            Edge cases
          </span>
          <span>
            <CheckCircle2 size={14} aria-hidden="true" />
            Guardrails
          </span>
        </div>
      </div>

      <div className="float-card test-float">
        <span className="float-icon float-icon-green">
          <Check size={15} strokeWidth={2.6} />
        </span>
        <span>
          <strong>All checks passed</strong>
          Ready to deploy
        </span>
      </div>

      <div className="scenario-chip">
        <span className="scenario-dot" aria-hidden="true" />
        Scenario 08
        <span>Refund eligibility</span>
      </div>
    </div>
  );
}

function DeployVisual({ active }) {
  const stageRef = useRef(null);
  const hubRef = useRef(null);
  const channelRefs = useRef(null);

  if (!channelRefs.current) {
    channelRefs.current = Object.fromEntries(
      integrationChannels.map((channel) => [channel.id, createRef()])
    );
  }

  return (
    <div
      className={`stage stage-deploy${active ? " is-active" : ""}`}
      ref={stageRef}
    >
      <DiamondPattern id="deploy-diamonds" color="rgba(255,255,255,0.16)" />

      <div className="deploy-hub" ref={hubRef}>
        <DessoirAiMark size={38} />
        <span>
          <strong>Agent</strong>
          Ready to launch
        </span>
      </div>

      {integrationChannels.map((channel) => (
        <span
          className={`channel-node channel-${channel.id}`}
          key={channel.id}
        >
          <span className="channel-chip" ref={channelRefs.current[channel.id]}>
            <img
              className="channel-logo"
              src={channel.logo}
              alt=""
              width="22"
              height="22"
              aria-hidden="true"
            />
          </span>
          <span className="channel-label">{channel.label}</span>
        </span>
      ))}

      <div className="float-card deploy-live">
        <span className="live-dot" aria-hidden="true" />
        <span>
          <strong>Live in 1 click</strong>
          All channels synced
        </span>
      </div>

      {integrationChannels.map((channel, index) => (
        <AnimatedBeam
          key={`beam-${channel.id}`}
          containerRef={stageRef}
          fromRef={channelRefs.current[channel.id]}
          toRef={hubRef}
          curvature={channel.curvature}
          reverse
          delay={0.25 + index * 0.3}
          duration={4.5}
          pathColor="#ffffff"
          pathWidth={1.4}
          pathOpacity={0.3}
          gradientStartColor="#ffffff"
          gradientStopColor="#ffd9ec"
          active={active}
        />
      ))}
    </div>
  );
}

function OptimizerRate({ active }) {
  const resolutionRate = useCountUp(50, 92.4, active, 2000, 350);

  return (
    <div>
      <span className="mini-label">Resolution rate</span>
      <strong>{resolutionRate.toFixed(1)}%</strong>
    </div>
  );
}

function OptimizerVisual({ active }) {
  const chartPath =
    "M0 62C18 60 30 74 48 82C66 90 82 94 100 92C122 90 134 68 156 62C176 56 194 68 214 56C236 42 250 46 270 32C292 20 310 28 328 16C340 9 350 13 360 10";

  return (
    <div className={`stage stage-optimizer${active ? " is-active" : ""}`}>
      <DiamondPattern id="optimizer-diamonds" color="rgba(255,255,255,0.2)" />
      <div className="optimizer-window">
        <div className="window-head">
          <span>Performance</span>
          <span className="window-state window-state-light">Last 30 days</span>
        </div>
        <div className="optimizer-headline">
          <OptimizerRate active={active} />
          <span className="optimizer-delta">
            <ArrowUpRight size={13} strokeWidth={2.3} aria-hidden="true" />
            18.2%
          </span>
        </div>
        <div className="chart-wrap">
          <svg viewBox="0 0 360 124" fill="none" aria-hidden="true">
            <defs>
              <linearGradient id="chart-stroke" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0" stopColor="#EF4444" />
                <stop offset=".32" stopColor="#EF4444" />
                <stop offset=".54" stopColor="#22C55E" />
                <stop offset="1" stopColor="#22C55E" />
              </linearGradient>
              <linearGradient id="chart-fill" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0" stopColor="#EF4444" stopOpacity=".16" />
                <stop offset=".45" stopColor="#EF4444" stopOpacity=".04" />
                <stop offset=".55" stopColor="#22C55E" stopOpacity=".08" />
                <stop offset="1" stopColor="#22C55E" stopOpacity=".22" />
              </linearGradient>
              <linearGradient id="chart-fade" x1="0" y1="0" x2="0" y2="1">
                <stop stopColor="#ffffff" />
                <stop offset=".7" stopColor="#ffffff" stopOpacity=".35" />
                <stop offset="1" stopColor="#ffffff" stopOpacity="0" />
              </linearGradient>
              <mask id="chart-fade-mask">
                <rect width="360" height="124" fill="url(#chart-fade)" />
              </mask>
            </defs>
            <path
              className="chart-area"
              d={`${chartPath}L360 124L0 124Z`}
              fill="url(#chart-fill)"
              mask="url(#chart-fade-mask)"
            />
            <path
              className="chart-line"
              d={chartPath}
              pathLength="1"
              stroke="url(#chart-stroke)"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
            <circle
              className="chart-endpoint"
              cx="360"
              cy="10"
              r="4"
              fill="#22C55E"
              stroke="#fff"
              strokeWidth="2"
            />
          </svg>
          <div className="chart-axis">
            <span>Week 1</span>
            <span>Week 2</span>
            <span>Week 3</span>
            <span>Week 4</span>
          </div>
        </div>
        <div className="optimizer-stats">
          <span>
            <strong>68%</strong>
            resolved autonomously
          </span>
          <span>
            <strong>2.1m</strong>
            conversations handled
          </span>
        </div>
      </div>

      <div className="float-card optimizer-insight">
        <span className="float-icon">
          <Sparkles size={15} strokeWidth={2.1} />
        </span>
        <span>
          <strong>12 new procedures suggested</strong>
          Based on this week’s conversations
        </span>
        <ArrowRight size={15} aria-hidden="true" />
      </div>

      <div className="optimizer-meter" aria-hidden="true">
        <BarChart3 size={16} />
        <span>
          <span />
        </span>
      </div>
    </div>
  );
}

function WorkflowVisual({ slug, active }) {
  if (slug === "build") return <BuilderVisual active={active} />;
  if (slug === "test") return <TesterVisual active={active} />;
  if (slug === "deploy") return <DeployVisual active={active} />;
  return <OptimizerVisual active={active} />;
}

function WorkflowCard({ step, index }) {
  const isOptimizer = step.slug === "optimize";
  const [ref, inView] = useInView(
    isOptimizer ? 0 : 0.28,
    isOptimizer ? "0px 0px -65% 0px" : "0px 0px -6% 0px"
  );

  return (
    <article
      className={`workflow-card workflow-card-${step.slug}`}
      ref={ref}
      style={{ "--sticky-offset": `${96 + index * 10}px` }}
    >
      <div className="workflow-copy">
        <div className="workflow-meta">
          <span className="workflow-number">0{index + 1}</span>
          <span className="workflow-divider" aria-hidden="true" />
          <span className="workflow-label">{step.label}</span>
          <span className="workflow-total">/ 04</span>
        </div>
        <h3>{step.title}</h3>
        <p>{step.description}</p>
        <div className="workflow-note-row">
          <span className="workflow-meta-pill">{step.meta}</span>
          <span className="workflow-note">{step.note}</span>
        </div>
      </div>

      <div className="workflow-visual">
        <WorkflowVisual slug={step.slug} active={inView} />
      </div>
    </article>
  );
}

function LifecycleSection() {
  return (
    <section className="lifecycle-section" id="lifecycle" aria-labelledby="lifecycle-title">
      <Reveal className="lifecycle-heading">
        <div>
          <span className="section-kicker">The agent lifecycle</span>
          <h2 id="lifecycle-title">Build once. Improve forever.</h2>
        </div>
        <p>
          From the first instruction to the millionth conversation, one
          platform keeps your agent accurate, on-brand, and getting better.
        </p>
      </Reveal>

      <div className="workflow-stack" id="workflow">
        {workflowSteps.map((step, index) => (
          <WorkflowCard step={step} index={index} key={step.slug} />
        ))}
      </div>
    </section>
  );
}

function useSetupScroll() {
  const bodyRef = useRef(null);
  const stepRefs = useRef([]);
  const [active, setActive] = useState(0);

  useEffect(() => {
    const body = bodyRef.current;
    if (!body) return undefined;

    let frame = null;

    const update = () => {
      frame = null;
      const viewportHeight = window.innerHeight;
      const middle = viewportHeight * 0.5;
      const rect = body.getBoundingClientRect();

      if (rect.top > viewportHeight || rect.bottom < 0) return;

      const progress = Math.min(
        1,
        Math.max(0, (middle - rect.top) / Math.max(rect.height, 1))
      );

      body.style.setProperty("--setup-progress", progress.toFixed(4));

      let next = 0;
      stepRefs.current.forEach((step, index) => {
        if (!step) return;
        if (step.getBoundingClientRect().top <= middle) next = index;
      });

      setActive((current) => (current === next ? current : next));
    };

    const schedule = () => {
      if (frame === null) frame = window.requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);

    return () => {
      if (frame !== null) window.cancelAnimationFrame(frame);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
    };
  }, []);

  return { bodyRef, stepRefs, active };
}

function SetupCrystalVisual({ phase, active }) {
  return (
    <div
      className={`setup-crystal setup-crystal-${phase.id}${active ? " is-active" : ""}`}
      aria-hidden="true"
    >
      <img src={phase.crystal} alt="" loading="lazy" decoding="async" />
    </div>
  );
}

function SetupSection() {
  const { bodyRef, stepRefs, active } = useSetupScroll();

  return (
    <section className="setup-section" id="cta" aria-labelledby="setup-title">
      <div className="setup-shell">
        <Reveal className="setup-head">
          <h2 id="setup-title">
            <span className="setup-accent">
              <span className="setup-bullet" aria-hidden="true" />
              3 minutes
            </span>{" "}
            to set up. First results today.
          </h2>
          <p>Enter your website. Your agent takes it from there.</p>
        </Reveal>

        <div className="setup-body" ref={bodyRef}>
          <div className="setup-rail">
            <nav className="setup-nav" aria-label="Setup phases">
              {setupPhases.map((phase, index) => (
                <a
                  className={`setup-nav-item${index === active ? " is-active" : ""}`}
                  href={`#setup-${phase.id}`}
                  aria-current={index === active ? "step" : undefined}
                  key={phase.id}
                >
                  {phase.label}
                </a>
              ))}
            </nav>
          </div>

          <div className="setup-timeline" aria-hidden="true">
            <span className="setup-timeline-fill" />
          </div>

          <div className="setup-steps">
            {setupPhases.map((phase, index) => (
              <article
                className={`setup-step${index === active ? " is-active" : ""}`}
                id={`setup-${phase.id}`}
                key={phase.id}
                ref={(node) => {
                  stepRefs.current[index] = node;
                }}
              >
                <div className="setup-step-copy">
                  <span className="setup-step-badge">
                    <CornerDownLeft size={13} strokeWidth={2} aria-hidden="true" />
                    {phase.index}
                  </span>
                  <h3>{phase.title}</h3>
                  <p>{phase.description}</p>
                  <span className="setup-step-rule" aria-hidden="true" />
                  <p className="setup-step-note">{phase.note}</p>
                  {index === setupPhases.length - 1 && (
                    <a className="button button-dark setup-action" href="#top">
                      Launch my agent for free
                      <ArrowUpRight size={16} strokeWidth={2.1} aria-hidden="true" />
                    </a>
                  )}
                </div>

                <div className="setup-step-visual">
                  <SetupCrystalVisual
                    phase={phase}
                    active={index === active}
                  />
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function OutreachCard({ card, revealed, flipped, onReveal, onToggle, decorative }) {
  const Icon = card.icon;

  const handleClick = (event) => {
    const pointerType = event.nativeEvent?.pointerType;

    if (pointerType && pointerType !== "mouse") {
      onToggle();
      return;
    }

    event.currentTarget.blur();
  };

  const handleKeyDown = (event) => {
    if (event.key !== "Enter" && event.key !== " ") return;
    event.preventDefault();
    onToggle();
  };

  return (
    <button
      type="button"
      className={`outreach-card${revealed || flipped ? " is-revealed" : ""}`}
      onPointerEnter={() => onReveal(card.id)}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      aria-pressed={flipped}
      aria-label={`${card.label}: ${card.title}`}
      aria-hidden={decorative ? "true" : undefined}
      tabIndex={decorative ? -1 : undefined}
    >
      <span className="outreach-card-inner">
        <span className="outreach-face outreach-face-front">
          <Icon className="outreach-watermark" strokeWidth={1.1} aria-hidden="true" />
          <span className="outreach-front-body">
            <span className="outreach-meta">
              <span className="outreach-dot" aria-hidden="true" />
              {card.label}
            </span>
            <span className="outreach-title">{card.title}</span>
          </span>
        </span>

        <span className="outreach-face outreach-face-back">
          <Icon className="outreach-watermark" strokeWidth={1.1} aria-hidden="true" />
          <span className="outreach-meta">
            <span className="outreach-dot" aria-hidden="true" />
            {card.label}
          </span>
          <span className="outreach-title">{card.title}</span>
          <span className="outreach-description">{card.description}</span>
          {card.tags.length > 0 ? (
            <span className="outreach-tags">
              {card.tags.map((tag) => (
                <span className={`outreach-tag is-${tag.tone}`} key={tag.label}>
                  {tag.label}
                </span>
              ))}
            </span>
          ) : null}
        </span>
      </span>
    </button>
  );
}

function OutreachSection() {
  const [flipped, setFlipped] = useState(() => new Set());
  const [revealed, setRevealed] = useState(null);

  const toggleCard = (id) => {
    setFlipped((current) => {
      const next = new Set(current);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  return (
    <section className="outreach-section" id="outreach" aria-labelledby="outreach-title">
      <div className="outreach-shell">
        <div className="outreach-head">
          <h2 id="outreach-title">
            <span className="outreach-bullet" aria-hidden="true" />
            Built to run your{" "}
            <span className="outreach-accent">entire outreach.</span>
          </h2>
          <p>
            Your agent handles everything from lead research to booked meetings, so
            your team shows up only to close.
          </p>
        </div>
      </div>

      <div className="outreach-stage">
        <div
          className="outreach-rail"
          onPointerLeave={() => setRevealed(null)}
        >
          <div className="outreach-track">
            {[0, 1].map((copy) => (
              <div className="outreach-group" key={copy}>
                {outreachCards.map((card) => (
                  <OutreachCard
                    card={card}
                    revealed={revealed === card.id}
                    flipped={flipped.has(card.id)}
                    decorative={copy === 1}
                    onReveal={setRevealed}
                    onToggle={() => toggleCard(card.id)}
                    key={`${copy}-${card.id}`}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>

        <div className="outreach-smoke" aria-hidden="true">
          <span />
          <span />
          <span />
          <span />
          <span />
        </div>
      </div>
    </section>
  );
}

function LaunchCta() {
  const [website, setWebsite] = useState("");

  const handleSubmit = (event) => {
    event.preventDefault();
    const site = website.trim();
    if (site) {
      try {
        window.localStorage.setItem("dessoir.website", site);
      } catch {
        // Storage can be blocked in private contexts.
      }
    }
    window.location.href = site
      ? `${authHref("signup")}&website=${encodeURIComponent(site)}`
      : authHref("signup");
  };

  return (
    <section className="launch-section" id="launch" aria-labelledby="launch-title">
      <div className="launch-panel">
        <svg
          className="launch-pattern"
          width="100%"
          height="100%"
          aria-hidden="true"
        >
          <defs>
            <pattern
              id="launch-triangles"
              width="176"
              height="152"
              patternUnits="userSpaceOnUse"
            >
              <polygon points="0,0 88,0 44,76" fill="#2c41b3" fillOpacity="1" />
              <polygon points="88,0 176,0 132,76" fill="#2c41b3" fillOpacity="0.42" />
              <polygon points="44,76 132,76 88,152" fill="#2c41b3" fillOpacity="0.68" />
              <polygon points="0,0 44,76 0,152" fill="#2c41b3" fillOpacity="0.28" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#launch-triangles)" />
        </svg>

        <span className="launch-rule launch-rule-left" aria-hidden="true" />
        <span className="launch-rule launch-rule-right" aria-hidden="true" />

        <div className="launch-copy">
          <h2 id="launch-title">
            Your next <span className="launch-accent">customers</span>{" "}
            <br className="launch-break" />
            are already out there.
          </h2>

          <p className="launch-sub">Let your agent find them.</p>

          <form className="launch-form" onSubmit={handleSubmit}>
            <label className="sr-only" htmlFor="launch-website">
              Your website
            </label>
            <input
              id="launch-website"
              className="launch-input"
              type="url"
              name="website"
              placeholder="https://yourwebsite.com"
              value={website}
              onChange={(event) => setWebsite(event.target.value)}
            />
            <button className="launch-submit" type="submit">
              Launch my agent for free
            </button>
          </form>

          <p className="launch-meta">
            Free Trial · Live in 5 minutes · Cancel anytime
          </p>
        </div>

        <span className="launch-corner launch-corner-tl" aria-hidden="true" />
        <span className="launch-corner launch-corner-tr" aria-hidden="true" />
        <span className="launch-corner launch-corner-bl" aria-hidden="true" />
        <span className="launch-corner launch-corner-br" aria-hidden="true" />
      </div>
    </section>
  );
}

function PricingPlan({ plan, yearly, page }) {
  return (
    <article
      className={`pricing-plan${plan.popular ? " is-popular" : ""}`}
      style={{ "--plan-accent": plan.accent }}
    >
      <div className="plan-summary">
        <div className="plan-name-row">
          <h2>{plan.name}</h2>
          {plan.popular ? <span className="plan-popular">Popular</span> : null}
        </div>

        <div className="plan-price">
          {plan.custom ? (
            <span className="plan-price-custom">Custom</span>
          ) : (
            <>
              <span className="plan-price-value">
                <span className="plan-currency">$</span>
                <span className="plan-amount">
                  {yearly ? plan.yearly : plan.monthly}
                </span>
              </span>
              <span className="plan-price-meta">
                <span>/month</span>
                {yearly ? <span>billed yearly</span> : null}
              </span>
            </>
          )}
        </div>

        {plan.custom ? (
          <span className="plan-save">Custom pricing</span>
        ) : yearly ? (
          <span className="plan-save">
            Save ${plan.save.toLocaleString("en-US")} yearly
          </span>
        ) : null}

        <p className="plan-description">{plan.description}</p>

        <p className="plan-credits">
          <MessagesSquare size={15} strokeWidth={1.8} aria-hidden="true" />
          {plan.credits}
        </p>

        <a
          className={`plan-button${plan.popular ? " is-dark" : ""}`}
          href={plan.custom ? resolveHref("#cta", page) : authHref("signup")}
        >
          {plan.cta}
        </a>
      </div>

      <div className="plan-features">
        {plan.inherits ? (
          <p className="plan-inherits">Everything in {plan.inherits}, plus</p>
        ) : null}
        <ul>
          {plan.features.map((feature) => {
            const Icon = feature.icon;
            return (
              <li className="plan-feature" key={feature.label}>
                <Icon size={14} strokeWidth={1.8} aria-hidden="true" />
                <span>{feature.label}</span>
              </li>
            );
          })}
        </ul>
      </div>
    </article>
  );
}

function PricingPage() {
  const [yearly, setYearly] = useState(() => {
    const billing = new URLSearchParams(window.location.search).get("billing");
    return billing !== "monthly";
  });

  return (
    <section className="pricing-page" aria-labelledby="pricing-title">
      <div className="pricing-page-inner">
        <div className="pricing-heading">
          <h1 id="pricing-title">Pricing</h1>
          <div className="pricing-toggle">
            <button
              type="button"
              role="switch"
              aria-checked={yearly}
              aria-label="Yearly billing"
              className={`billing-switch${yearly ? " is-on" : ""}`}
              onClick={() => setYearly((value) => !value)}
            >
              <span className="billing-knob" />
            </button>
            <span className="billing-label">
              <span className={yearly ? "" : "is-active"}>Monthly</span>
              <span className={yearly ? "is-active" : ""}>Yearly</span>
            </span>
            <span
              className={`billing-off${yearly ? "" : " is-placeholder"}`}
              aria-hidden={!yearly}
            >
              20% off
            </span>
          </div>
        </div>

        <div className="pricing-grid">
          {pricingPlans.map((plan) => (
            <PricingPlan
              plan={plan}
              yearly={yearly}
              page="pricing"
              key={plan.name}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

function Footer({ inert, page = "home" }) {
  return (
    <footer className="site-footer" inert={inert}>
      <div className="footer-top">
        <div className="footer-brand">
          <a
            className="brand"
            href={page === "pricing" ? "/" : "#top"}
            aria-label="Dessoir Ai home"
          >
            <DessoirAiMark size={25} />
            <span>Dessoir Ai</span>
          </a>
          <p>AI agents for customer experience, built to resolve.</p>
        </div>

        <div className="footer-links">
          <div>
            <span>Product</span>
            <a href={resolveHref("#agents", page)}>Agents</a>
            <a href={resolveHref("#lifecycle", page)}>Lifecycle</a>
            <a href="/pricing.html">Pricing</a>
          </div>
          <div>
            <span>Company</span>
            <a href={resolveHref("#quote", page)}>Customers</a>
            <a href={resolveHref("#cta", page)}>Enterprise</a>
            <a href={page === "pricing" ? "/" : "#top"}>Careers</a>
          </div>
          <div>
            <span>Resources</span>
            <a href={resolveHref("#agents", page)}>Documentation</a>
            <a href={resolveHref("#lifecycle", page)}>Guides</a>
            <a href={resolveHref("#cta", page)}>Contact</a>
          </div>
        </div>

        <a className="footer-demo" href={resolveHref("#cta", page)}>
          Get a demo
          <span>
            <ArrowUpRight size={15} strokeWidth={2.1} aria-hidden="true" />
          </span>
        </a>
      </div>

      <div className="footer-bottom">
        <span>© 2026 Dessoir Ai. All rights reserved.</span>
        <div>
          <a href={resolveHref("#top", page)}>Privacy</a>
          <a href={resolveHref("#top", page)}>Terms</a>
          <a href={resolveHref("#top", page)}>Security</a>
        </div>
        <span className="footer-status">
          <span className="live-dot" aria-hidden="true" />
          All systems operational
        </span>
      </div>
    </footer>
  );
}

function GoogleMark() {
  return (
    <svg width="17" height="17" viewBox="0 0 48 48" aria-hidden="true">
      <path
        fill="#EA4335"
        d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5Z"
      />
      <path
        fill="#4285F4"
        d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65Z"
      />
      <path
        fill="#FBBC05"
        d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19Z"
      />
      <path
        fill="#34A853"
        d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48Z"
      />
    </svg>
  );
}

function AuthPage() {
  const [searchParams] = useState(
    () => new URLSearchParams(window.location.search)
  );
  const isSignIn = searchParams.get("mode") === "signin";
  const switchHref = authHref(isSignIn ? "signup" : "signin");
  const { isLoaded, isSignedIn } = useUser();

  useEffect(() => {
    document.title = `${isSignIn ? "Sign in" : "Sign up"} | Dessoir Ai`;
  }, [isSignIn]);

  useEffect(() => {
    if (isLoaded && isSignedIn) {
      window.location.href = "/onboarding.html";
    }
  }, [isLoaded, isSignedIn]);

  return (
    <div className="auth-page">
      <section className="auth-main" aria-labelledby="auth-title">
        <div className="auth-topbar">
          <p>
            {isSignIn ? "New to Dessoir Ai?" : "Already have an account?"}{" "}
            <a href={switchHref}>
              {isSignIn ? "Create an account" : "Sign in here"}
            </a>
          </p>
        </div>

        <div className="auth-shell">
          <a className="auth-brand" href="/" aria-label="Dessoir Ai home">
            <DessoirAiMark size={40} />
            <span>Dessoir Ai</span>
          </a>

          <div className="auth-intro">
            <h1 id="auth-title">
              {isSignIn ? (
                "Welcome back"
              ) : (
                <>
                  Warm leads <span className="auth-arrow">→</span> Deals
                </>
              )}
            </h1>
            <p>
              {isSignIn
                ? "Sign in to pick up where you left off."
                : "As simple as it gets."}
            </p>
          </div>

          <div
            className="auth-clerk-box"
            style={{
              marginTop: "24px",
              display: "flex",
              justifyContent: "center",
              width: "100%"
            }}
          >
            {isSignIn ? (
              <SignIn
                routing="hash"
                fallbackRedirectUrl="/onboarding.html"
                signUpUrl="/auth.html?mode=signup"
              />
            ) : (
              <SignUp
                routing="hash"
                fallbackRedirectUrl="/onboarding.html"
                signInUrl="/auth.html?mode=signin"
              />
            )}
          </div>

          <div className="auth-meta" style={{ marginTop: "24px" }}>
            {isSignIn ? (
              <>
                <span className="auth-meta-item">
                  <Check size={12} strokeWidth={2.6} aria-hidden="true" />
                  Secure sign-in
                </span>
                <span className="auth-meta-item">
                  <ShieldCheck size={12} strokeWidth={2.2} aria-hidden="true" />
                  Your data stays private
                </span>
              </>
            ) : (
              <>
                <span className="auth-meta-item">
                  <Check size={12} strokeWidth={2.6} aria-hidden="true" />
                  Cancel anytime
                </span>
                <span className="auth-meta-item is-coral">
                  <Check size={12} strokeWidth={2.6} aria-hidden="true" />
                  7 Days Trial
                </span>
              </>
            )}
          </div>
        </div>
      </section>

      <aside className="auth-aside" aria-label="Message from our founder">
        <div className="auth-aside-inner">
          <figure className="auth-quote-card">
            <span className="auth-quote-mark" aria-hidden="true">
              “
            </span>
            <blockquote>
              We built Dessoir Ai so a great customer never waits. One agent
              that supports, sells and guides across every channel — resolving
              the full conversation instead of passing it on, and getting
              sharper with every one it handles.
            </blockquote>
            <figcaption>
              <span className="auth-quote-avatar" aria-hidden="true">
                A
              </span>
              <span>
                <strong>Ankit</strong>
                <small>Founder and Builder, Dessoir Ai</small>
              </span>
            </figcaption>
          </figure>
        </div>

        <span className="auth-bubble" aria-hidden="true">
          <DessoirAiMark size={22} inverted />
        </span>
      </aside>
    </div>
  );
}

export default function App({ page = "home" }) {
  const [menuOpen, setMenuOpen] = useState(false);

  useReveal();

  useEffect(() => {
    if (page === "auth") return undefined;
    document.title =
      page === "pricing"
        ? "Pricing | Dessoir Ai"
        : "AI Agents for Customer Experience & Support | Dessoir Ai";
    return undefined;
  }, [page]);

  useEffect(() => {
    if (!menuOpen) return undefined;

    const onKeyDown = (event) => {
      if (event.key !== "Escape") return;
      setMenuOpen(false);
      document.querySelector(".menu-toggle")?.focus();
    };

    document.body.classList.add("menu-open");
    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.classList.remove("menu-open");
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [menuOpen]);

  useEffect(() => {
    const desktop = window.matchMedia("(min-width: 1081px)");
    const onChange = (event) => {
      if (event.matches) setMenuOpen(false);
    };

    desktop.addEventListener("change", onChange);
    return () => desktop.removeEventListener("change", onChange);
  }, []);

  if (page === "auth") return <AuthPage />;

  return (
    <div className="page">
      <a className="skip-link" href="#main-content">
        Skip to content
      </a>
      <Header menuOpen={menuOpen} setMenuOpen={setMenuOpen} page={page} />
      <main
        className="page-frame"
        id="main-content"
        tabIndex={-1}
        inert={menuOpen ? "" : undefined}
      >
        {page === "pricing" ? (
          <PricingPage />
        ) : (
          <>
            <Hero />
            <AgentsSection />
            <QuoteSection />
            <LifecycleSection />
            <SetupSection />
            <OutreachSection />
            <LaunchCta />
          </>
        )}
      </main>
      <Footer inert={menuOpen ? "" : undefined} page={page} />
    </div>
  );
}

