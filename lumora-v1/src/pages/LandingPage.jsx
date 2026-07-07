import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, useInView, AnimatePresence } from "framer-motion";
import {
  Rocket,
  Lightbulb,
  MessageSquare,
  ScanEye,
  LayoutTemplate,
  Palette,
  BarChart3,
  Mail,
  User,
  LayoutDashboard,
  Menu,
  X,
  ArrowRight,
  Star,
  Globe,
  Users,
  Sparkles,
  Check,
  ChevronDown,
  Send,
  Zap,
  Brain,
  FileText,
  TrendingUp,
  ClipboardList,
  Wand2,
  ArrowDown,
  Bot,
} from "lucide-react";

import {
  FaTwitter,
  FaLinkedin,
  FaGithub,
  FaInstagram,
} from "react-icons/fa";

const COLORS = {
  bg: "#090909",
  card: "#171717",
  cardAlt: "#1D1D1D",
  primary: "#C46A32",
  secondary: "#D4AF37",
  white: "#F5F5F5",
  textSecondary: "#A1A1AA",
  border: "rgba(255,255,255,0.07)",
};

const NAV_LINKS = ["Features", "Products", "Pricing", "About", "Contact"];

const TRUSTED_STATS = [
  { icon: Users, value: "1000+", label: "Founders" },
  { icon: Globe, value: "50+", label: "Countries" },
  { icon: Lightbulb, value: "100K+", label: "Ideas Generated" },
  { icon: Star, value: "4.9", label: "Average Rating" },
];

const STAT_CARDS = [
  { icon: Rocket, target: 3200, suffix: "+", label: "Total Startups", color: COLORS.primary },
  { icon: Lightbulb, target: 108500, suffix: "+", label: "Ideas Created", color: COLORS.secondary },
  { icon: MessageSquare, target: 452000, suffix: "+", label: "AI Conversations", color: COLORS.primary },
  { icon: ScanEye, target: 18700, suffix: "+", label: "Vision AI Analyses", color: COLORS.secondary },
];

const PRODUCTS = [
  { icon: LayoutDashboard, title: "Dashboard", desc: "A unified command center to monitor every startup metric in real time." },
  { icon: Rocket, title: "My Startups", desc: "Organize and manage every venture you're building, all in one place." },
  { icon: Lightbulb, title: "Idea Vault", desc: "Capture, refine and store your best startup ideas before they slip away." },
  { icon: LayoutTemplate, title: "Business Canvas", desc: "Turn raw ideas into structured, investor-ready business models." },
  { icon: Palette, title: "Brand Studio", desc: "Generate logos, palettes and brand identities powered by AI." },
  { icon: Bot, title: "AI Founder", desc: "Your always-on co-founder for strategy, planning and execution." },
  { icon: ScanEye, title: "Vision AI", desc: "Analyze market signals and competitors with computer vision insights." },
  { icon: BarChart3, title: "Analytics", desc: "Track growth, productivity and performance with intelligent dashboards." },
  { icon: Mail, title: "Email Center", desc: "Automate founder outreach, updates and investor communication." },
  { icon: User, title: "Profile", desc: "Your founder identity, achievements and startup journey in one hub." },
];

const HOW_IT_WORKS = [
  { icon: Rocket, title: "Create Startup", desc: "Spin up a new venture workspace in seconds." },
  { icon: Lightbulb, title: "Save Ideas", desc: "Capture every idea inside your personal Idea Vault." },
  { icon: Palette, title: "Develop Brand", desc: "Craft a premium identity using Brand Studio." },
  { icon: Bot, title: "Use AI Founder", desc: "Get strategic guidance from your AI co-founder." },
  { icon: ScanEye, title: "Analyze with Vision AI", desc: "Validate your market with intelligent analysis." },
  { icon: Zap, title: "Launch Startup", desc: "Go live with confidence, backed by data." },
];

const COMPARISON_TOOLS = ["ChatGPT", "Canva", "Notion", "Excel", "Google Docs"];

const FEATURES = [
  { icon: Brain, title: "AI Founder", desc: "A dedicated AI co-founder that plans, strategizes and executes alongside you." },
  { icon: ScanEye, title: "Vision AI", desc: "Deep market and competitor analysis powered by computer vision." },
  { icon: LayoutTemplate, title: "Business Canvas", desc: "Build investor-ready business models in minutes, not weeks." },
  { icon: Palette, title: "Brand Studio", desc: "Generate stunning brand identities without hiring a designer." },
  { icon: BarChart3, title: "Analytics", desc: "Understand growth and productivity with real-time dashboards." },
  { icon: Mail, title: "Email Automation", desc: "Automate founder communication and investor updates effortlessly." },
  { icon: ClipboardList, title: "Founder Workspace", desc: "One connected workspace for every part of your startup journey." },
];

const PRICING_PLANS = [
  {
    name: "Starter",
    price: "Free",
    period: "",
    desc: "For founders just getting started.",
    features: ["1 Active Startup", "Idea Vault Access", "Basic AI Founder", "Community Support"],
    popular: false,
  },
  {
    name: "Pro",
    price: "$29",
    period: "/month",
    desc: "For founders ready to scale fast.",
    features: [
      "Unlimited Startups",
      "Full AI Founder Access",
      "Vision AI Analysis",
      "Brand Studio Pro",
      "Advanced Analytics",
      "Priority Support",
    ],
    popular: true,
  },
  {
    name: "Enterprise",
    price: "Custom",
    period: "",
    desc: "For accelerators, studios and teams.",
    features: [
      "Everything in Pro",
      "Team Collaboration",
      "Dedicated Success Manager",
      "Custom Integrations",
      "SLA & Onboarding",
    ],
    popular: false,
  },
];

const FAQS = [
  {
    q: "What exactly is LUMORA?",
    a: "LUMORA is an AI Founder Operating System that brings ideation, branding, business planning, AI assistance and analytics into a single intelligent platform for startup founders.",
  },
  {
    q: "Do I need technical skills to use LUMORA?",
    a: "Not at all. LUMORA is designed for founders of every background — the AI Founder and guided workflows handle the heavy lifting for you.",
  },
  {
    q: "Can I use LUMORA for multiple startups?",
    a: "Yes, Pro and Enterprise plans support unlimited startups, each with its own workspace, ideas, brand assets and analytics.",
  },
  {
    q: "Is my data secure on LUMORA?",
    a: "Absolutely. Your startup data is encrypted and isolated per workspace, with enterprise-grade security across the platform.",
  },
  {
    q: "Can I cancel my subscription anytime?",
    a: "Yes, you can upgrade, downgrade or cancel your subscription at any time directly from your account settings.",
  },
];

const FOOTER_LINKS = {
  Products: ["Dashboard", "AI Founder", "Vision AI", "Brand Studio", "Analytics"],
  Resources: ["Documentation", "Founder Guides", "Blog", "Community"],
  Contact: ["support@lumora.ai", "+1 (415) 555-0192", "San Francisco, CA"],
};

function useCountUp(target, inView, duration = 1800) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (!inView) return;
    let start = null;
    let raf;
    const step = (ts) => {
      if (!start) start = ts;
      const progress = Math.min((ts - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.floor(eased * target));
      if (progress < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [inView, target, duration]);
  return value;
}

function formatNumber(n) {
  return n.toLocaleString("en-US");
}

function AnimatedCounter({ target, suffix }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  const value = useCountUp(target, inView);
  return (
    <span ref={ref}>
      {formatNumber(value)}
      {suffix}
    </span>
  );
}

export default function LandingPage() {
  const navigate = useNavigate();
  const goToLogin = () => navigate("/auth", { state: { mode: "login" } });
  const goToRegister = () => navigate("/auth", { state: { mode: "register" } });

  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [openFaq, setOpenFaq] = useState(0);
  const [formData, setFormData] = useState({ name: "", email: "", message: "" });
  const [formSent, setFormSent] = useState(false);
  const [isMobile, setIsMobile] = useState(
    typeof window !== "undefined" ? window.innerWidth <= 768 : false
  );
  const [isTablet, setIsTablet] = useState(
    typeof window !== "undefined" ? window.innerWidth <= 1080 : false
  );

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    const onResize = () => {
      setIsMobile(window.innerWidth <= 768);
      setIsTablet(window.innerWidth <= 1080);
    };
    window.addEventListener("scroll", onScroll);
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  const handleFormChange = (field) => (e) =>
    setFormData((f) => ({ ...f, [field]: e.target.value }));

  const handleFormSubmit = (e) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.message) return;
    setFormSent(true);
    setTimeout(() => {
      setFormSent(false);
      setFormData({ name: "", email: "", message: "" });
    }, 3000);
  };

  const fadeUp = {
    hidden: { opacity: 0, y: 28 },
    visible: (i = 0) => ({
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] },
    }),
  };

  const scrollTo = (id) => {
    setMenuOpen(false);
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div
      style={{
        background: COLORS.bg,
        color: COLORS.white,
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        overflowX: "hidden",
        width: "100%",
        minHeight: "100vh",
        position: "relative",
      }}
    >
      <style>{`
        * { box-sizing: border-box; }
        html { scroll-behavior: smooth; }
        ::-webkit-scrollbar { width: 8px; }
        ::-webkit-scrollbar-thumb { background: #2a2a2a; border-radius: 10px; }
        ::-webkit-scrollbar-track { background: transparent; }
        input::placeholder, textarea::placeholder { color: #6b6b70; }
        @keyframes lumora-float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-14px); }
        }
        @keyframes lumora-glow {
          0%, 100% { opacity: 0.5; }
          50% { opacity: 0.9; }
        }
        @keyframes lumora-spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>

      {/* NAVBAR */}
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 100,
          display: "flex",
          justifyContent: "center",
          padding: isMobile ? "12px 16px" : "18px 40px",
          background: scrolled ? "rgba(9,9,9,0.65)" : "transparent",
          backdropFilter: scrolled ? "blur(18px)" : "none",
          borderBottom: scrolled ? `1px solid ${COLORS.border}` : "1px solid transparent",
          transition: "all 0.4s ease",
        }}
      >
        <div
          style={{
            width: "100%",
            maxWidth: 1280,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div
              style={{
                width: 34,
                height: 34,
                borderRadius: 10,
                background: `linear-gradient(135deg, ${COLORS.primary}, ${COLORS.secondary})`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: 800,
                fontSize: 14,
                color: "#0A0A0A",
              }}
            >
              L
            </div>
            <span style={{ fontWeight: 700, fontSize: 16.5, letterSpacing: 0.4 }}>LUMORA</span>
          </div>

          {!isMobile && !isTablet && (
            <div style={{ display: "flex", gap: 34 }}>
              {NAV_LINKS.map((link) => (
                <span
                  key={link}
                  onClick={() => scrollTo(link.toLowerCase())}
                  style={{
                    fontSize: 13.8,
                    fontWeight: 500,
                    color: COLORS.textSecondary,
                    cursor: "pointer",
                    transition: "color 0.25s ease",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = COLORS.white)}
                  onMouseLeave={(e) => (e.currentTarget.style.color = COLORS.textSecondary)}
                >
                  {link}
                </span>
              ))}
            </div>
          )}

          {!isMobile && !isTablet ? (
            <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
              <span
                onClick={goToLogin}
                style={{ fontSize: 13.8, fontWeight: 500, color: COLORS.textSecondary, cursor: "pointer" }}
              >
                Login
              </span>
              <motion.button
                onClick={goToRegister}
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.97 }}
                style={{
                  background: `linear-gradient(135deg, ${COLORS.primary}, ${COLORS.secondary})`,
                  border: "none",
                  color: "#0A0A0A",
                  fontWeight: 700,
                  fontSize: 13.5,
                  padding: "10px 20px",
                  borderRadius: 10,
                  cursor: "pointer",
                }}
              >
                Get Started
              </motion.button>
            </div>
          ) : (
            <div
              onClick={() => setMenuOpen((o) => !o)}
              style={{
                width: 38,
                height: 38,
                borderRadius: 10,
                background: COLORS.card,
                border: `1px solid ${COLORS.border}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
              }}
            >
              {menuOpen ? <X size={18} /> : <Menu size={18} />}
            </div>
          )}
        </div>
      </div>

      <AnimatePresence>
        {menuOpen && (isMobile || isTablet) && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            style={{
              position: "fixed",
              top: 66,
              left: 16,
              right: 16,
              zIndex: 99,
              background: "rgba(15,15,15,0.97)",
              backdropFilter: "blur(20px)",
              border: `1px solid ${COLORS.border}`,
              borderRadius: 16,
              padding: 18,
              display: "flex",
              flexDirection: "column",
              gap: 6,
            }}
          >
            {NAV_LINKS.map((link) => (
              <div
                key={link}
                onClick={() => scrollTo(link.toLowerCase())}
                style={{ padding: "10px 8px", fontSize: 14.5, color: COLORS.white, cursor: "pointer" }}
              >
                {link}
              </div>
            ))}
            <div style={{ display: "flex", gap: 10, marginTop: 10 }}>
              <button
                onClick={goToLogin}
                style={{
                  flex: 1,
                  padding: "11px",
                  borderRadius: 10,
                  border: `1px solid ${COLORS.border}`,
                  background: "transparent",
                  color: COLORS.white,
                  fontWeight: 600,
                  fontSize: 13.5,
                  cursor: "pointer",
                }}
              >
                Login
              </button>
              <button
                onClick={goToRegister}
                style={{
                  flex: 1,
                  padding: "11px",
                  borderRadius: 10,
                  border: "none",
                  background: `linear-gradient(135deg, ${COLORS.primary}, ${COLORS.secondary})`,
                  color: "#0A0A0A",
                  fontWeight: 700,
                  fontSize: 13.5,
                  cursor: "pointer",
                }}
              >
                Get Started
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* HERO */}
      <section
        style={{
          position: "relative",
          padding: isMobile ? "130px 20px 70px" : "170px 40px 110px",
          display: "flex",
          flexDirection: isTablet ? "column" : "row",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 50,
          maxWidth: 1280,
          margin: "0 auto",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: "-10%",
            left: "50%",
            transform: "translateX(-50%)",
            width: 700,
            height: 700,
            borderRadius: "50%",
            background: `radial-gradient(circle, rgba(196,106,50,0.16), transparent 70%)`,
            filter: "blur(40px)",
            zIndex: 0,
            animation: "lumora-glow 5s ease-in-out infinite",
          }}
        />

        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeUp}
          style={{ flex: 1, zIndex: 1, textAlign: isTablet ? "center" : "left" }}
        >
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              background: "rgba(196,106,50,0.1)",
              border: `1px solid rgba(196,106,50,0.3)`,
              padding: "7px 14px",
              borderRadius: 30,
              fontSize: 12.5,
              fontWeight: 600,
              color: COLORS.secondary,
              marginBottom: 24,
            }}
          >
            <Sparkles size={13} />
            AI Founder Operating System
          </div>

          <h1
            style={{
              fontSize: isMobile ? 40 : isTablet ? 52 : 64,
              fontWeight: 800,
              lineHeight: 1.08,
              letterSpacing: -1.5,
              margin: 0,
            }}
          >
            Build Brands.
            <br />
            <span
              style={{
                background: `linear-gradient(135deg, ${COLORS.primary}, ${COLORS.secondary})`,
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              Launch Faster.
            </span>
          </h1>

          <p
            style={{
              fontSize: isMobile ? 15 : 17.5,
              color: COLORS.textSecondary,
              marginTop: 22,
              maxWidth: 520,
              lineHeight: 1.65,
              marginLeft: isTablet ? "auto" : 0,
              marginRight: isTablet ? "auto" : 0,
            }}
          >
            Transform startup ideas into successful businesses using AI. One
            intelligent platform to ideate, brand, plan and launch.
          </p>

          <div
            style={{
              display: "flex",
              gap: 14,
              marginTop: 36,
              flexWrap: "wrap",
              justifyContent: isTablet ? "center" : "flex-start",
            }}
          >
            <motion.button
              onClick={goToRegister}
              whileHover={{ scale: 1.045, boxShadow: "0 10px 30px rgba(196,106,50,0.35)" }}
              whileTap={{ scale: 0.97 }}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                background: `linear-gradient(135deg, ${COLORS.primary}, ${COLORS.secondary})`,
                border: "none",
                color: "#0A0A0A",
                fontWeight: 700,
                fontSize: 14.5,
                padding: "15px 28px",
                borderRadius: 12,
                cursor: "pointer",
              }}
            >
              Get Started <ArrowRight size={16} />
            </motion.button>
            <motion.button
              onClick={() => navigate("/dashboard")}
              whileHover={{ scale: 1.045, borderColor: COLORS.primary }}
              whileTap={{ scale: 0.97 }}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                background: "transparent",
                border: `1px solid ${COLORS.border}`,
                color: COLORS.white,
                fontWeight: 600,
                fontSize: 14.5,
                padding: "15px 26px",
                borderRadius: 12,
                cursor: "pointer",
              }}
            >
              Explore Dashboard
            </motion.button>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.92 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          style={{
            flex: 1,
            position: "relative",
            zIndex: 1,
            display: "flex",
            justifyContent: "center",
            width: "100%",
            maxWidth: isTablet ? 480 : "none",
          }}
        >
          <div
            style={{
              width: "100%",
              maxWidth: 480,
              borderRadius: 22,
              background: COLORS.card,
              border: `1px solid ${COLORS.border}`,
              padding: 22,
              boxShadow: "0 30px 80px rgba(0,0,0,0.5)",
              position: "relative",
            }}
          >
            <div style={{ display: "flex", gap: 6, marginBottom: 18 }}>
              <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#F87171" }} />
              <div style={{ width: 10, height: 10, borderRadius: "50%", background: COLORS.secondary }} />
              <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#4ADE80" }} />
            </div>
            <div style={{ fontSize: 12.5, color: COLORS.textSecondary, marginBottom: 14 }}>
              Startup Growth Overview
            </div>
            <div
              style={{
                height: 130,
                borderRadius: 14,
                background: `linear-gradient(135deg, rgba(196,106,50,0.18), rgba(212,175,55,0.06))`,
                border: `1px solid ${COLORS.border}`,
                marginBottom: 16,
                display: "flex",
                alignItems: "flex-end",
                padding: 14,
                gap: 8,
              }}
            >
              {[38, 55, 42, 68, 60, 82, 70].map((h, i) => (
                <div
                  key={i}
                  style={{
                    flex: 1,
                    height: `${h}%`,
                    borderRadius: 6,
                    background: `linear-gradient(180deg, ${COLORS.secondary}, ${COLORS.primary})`,
                  }}
                />
              ))}
            </div>
            <div style={{ display: "flex", gap: 12 }}>
              <div
                style={{
                  flex: 1,
                  background: COLORS.cardAlt,
                  borderRadius: 12,
                  padding: 12,
                }}
              >
                <div style={{ fontSize: 11.5, color: COLORS.textSecondary }}>Active Startups</div>
                <div style={{ fontSize: 20, fontWeight: 700, marginTop: 4 }}>128</div>
              </div>
              <div
                style={{
                  flex: 1,
                  background: COLORS.cardAlt,
                  borderRadius: 12,
                  padding: 12,
                }}
              >
                <div style={{ fontSize: 11.5, color: COLORS.textSecondary }}>Growth Rate</div>
                <div style={{ fontSize: 20, fontWeight: 700, marginTop: 4, color: COLORS.secondary }}>
                  +34%
                </div>
              </div>
            </div>

            <motion.div
              style={{
                position: "absolute",
                top: -22,
                right: -22,
                background: COLORS.card,
                border: `1px solid rgba(212,175,55,0.4)`,
                borderRadius: 14,
                padding: "12px 16px",
                display: "flex",
                alignItems: "center",
                gap: 10,
                boxShadow: "0 15px 40px rgba(0,0,0,0.4)",
                animation: "lumora-float 4s ease-in-out infinite",
              }}
            >
              <Wand2 size={16} color={COLORS.secondary} />
              <div>
                <div style={{ fontSize: 11, color: COLORS.textSecondary }}>AI Founder</div>
                <div style={{ fontSize: 12.5, fontWeight: 600 }}>Idea validated ✓</div>
              </div>
            </motion.div>

            <motion.div
              style={{
                position: "absolute",
                bottom: -20,
                left: -24,
                background: COLORS.card,
                border: `1px solid rgba(196,106,50,0.4)`,
                borderRadius: 14,
                padding: "12px 16px",
                display: "flex",
                alignItems: "center",
                gap: 10,
                boxShadow: "0 15px 40px rgba(0,0,0,0.4)",
                animation: "lumora-float 4.6s ease-in-out infinite 0.6s",
              }}
            >
              <TrendingUp size={16} color={COLORS.primary} />
              <div>
                <div style={{ fontSize: 11, color: COLORS.textSecondary }}>Analytics</div>
                <div style={{ fontSize: 12.5, fontWeight: 600 }}>Growth +12.4%</div>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </section>

      {/* TRUSTED BY */}
      <section
        style={{
          padding: isMobile ? "40px 20px" : "40px 40px 60px",
          maxWidth: 1280,
          margin: "0 auto",
        }}
      >
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-60px" }}
          variants={fadeUp}
          style={{
            display: "grid",
            gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(4, 1fr)",
            gap: 16,
            borderTop: `1px solid ${COLORS.border}`,
            borderBottom: `1px solid ${COLORS.border}`,
            padding: "32px 0",
          }}
        >
          {TRUSTED_STATS.map((s, i) => {
            const Icon = s.icon;
            return (
              <div
                key={i}
                style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8, textAlign: "center" }}
              >
                <Icon size={20} color={COLORS.secondary} />
                <div style={{ fontSize: isMobile ? 20 : 26, fontWeight: 800 }}>{s.value}</div>
                <div style={{ fontSize: 12.5, color: COLORS.textSecondary }}>{s.label}</div>
              </div>
            );
          })}
        </motion.div>
      </section>

      {/* STATISTICS */}
      <section style={{ padding: isMobile ? "20px 20px 70px" : "20px 40px 100px", maxWidth: 1280, margin: "0 auto" }}>
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
          variants={fadeUp}
          style={{ textAlign: "center", marginBottom: 44 }}
        >
          <h2 style={{ fontSize: isMobile ? 26 : 36, fontWeight: 800, letterSpacing: -0.6 }}>
            Powering Founders Worldwide
          </h2>
          <p style={{ color: COLORS.textSecondary, marginTop: 10, fontSize: 15 }}>
            Real numbers from real startups building on LUMORA.
          </p>
        </motion.div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(4, 1fr)",
            gap: 18,
          }}
        >
          {STAT_CARDS.map((s, i) => {
            const Icon = s.icon;
            return (
              <motion.div
                key={i}
                custom={i}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-60px" }}
                variants={fadeUp}
                whileHover={{ y: -6, boxShadow: `0 15px 40px rgba(196,106,50,0.15)` }}
                style={{
                  background: COLORS.card,
                  border: `1px solid ${COLORS.border}`,
                  borderRadius: 18,
                  padding: 24,
                  transition: "all 0.3s ease",
                }}
              >
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 12,
                    background: `${s.color}1A`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    marginBottom: 18,
                  }}
                >
                  <Icon size={20} color={s.color} />
                </div>
                <div style={{ fontSize: isMobile ? 22 : 27, fontWeight: 800 }}>
                  <AnimatedCounter target={s.target} suffix={s.suffix} />
                </div>
                <div style={{ fontSize: 13, color: COLORS.textSecondary, marginTop: 6 }}>
                  {s.label}
                </div>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* PRODUCTS */}
      <section id="products" style={{ padding: isMobile ? "20px 20px 70px" : "20px 40px 100px", maxWidth: 1280, margin: "0 auto" }}>
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
          variants={fadeUp}
          style={{ textAlign: "center", marginBottom: 44 }}
        >
          <h2 style={{ fontSize: isMobile ? 26 : 36, fontWeight: 800, letterSpacing: -0.6 }}>
            Everything a Founder Needs
          </h2>
          <p style={{ color: COLORS.textSecondary, marginTop: 10, fontSize: 15 }}>
            Ten powerful products, built into one seamless platform.
          </p>
        </motion.div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: isMobile ? "1fr" : isTablet ? "1fr 1fr" : "repeat(3, 1fr)",
            gap: 18,
          }}
        >
          {PRODUCTS.map((p, i) => {
            const Icon = p.icon;
            return (
              <motion.div
                key={p.title}
                custom={i % 3}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-60px" }}
                variants={fadeUp}
                whileHover={{ y: -6, borderColor: "rgba(196,106,50,0.4)" }}
                style={{
                  background: COLORS.card,
                  border: `1px solid ${COLORS.border}`,
                  borderRadius: 18,
                  padding: 26,
                  display: "flex",
                  flexDirection: "column",
                  gap: 14,
                  transition: "all 0.3s ease",
                }}
              >
                <div
                  style={{
                    width: 42,
                    height: 42,
                    borderRadius: 12,
                    background: "rgba(196,106,50,0.12)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Icon size={19} color={COLORS.primary} />
                </div>
                <div style={{ fontSize: 16.5, fontWeight: 700 }}>{p.title}</div>
                <div style={{ fontSize: 13.5, color: COLORS.textSecondary, lineHeight: 1.6, flex: 1 }}>
                  {p.desc}
                </div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    fontSize: 13,
                    fontWeight: 600,
                    color: COLORS.secondary,
                    cursor: "pointer",
                  }}
                >
                  Explore <ArrowRight size={14} />
                </div>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* HOW LUMORA WORKS */}
      <section style={{ padding: isMobile ? "20px 20px 70px" : "20px 40px 100px", maxWidth: 1100, margin: "0 auto" }}>
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
          variants={fadeUp}
          style={{ textAlign: "center", marginBottom: 50 }}
        >
          <h2 style={{ fontSize: isMobile ? 26 : 36, fontWeight: 800, letterSpacing: -0.6 }}>
            How LUMORA Works
          </h2>
          <p style={{ color: COLORS.textSecondary, marginTop: 10, fontSize: 15 }}>
            From first idea to public launch, in six guided steps.
          </p>
        </motion.div>

        <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
          {HOW_IT_WORKS.map((step, i) => {
            const Icon = step.icon;
            const isLast = i === HOW_IT_WORKS.length - 1;
            return (
              <div key={step.title} style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                <motion.div
                  custom={i}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true, margin: "-60px" }}
                  variants={fadeUp}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 22,
                    width: "100%",
                    maxWidth: 640,
                    background: COLORS.card,
                    border: `1px solid ${COLORS.border}`,
                    borderRadius: 18,
                    padding: "20px 26px",
                  }}
                >
                  <div
                    style={{
                      width: 48,
                      height: 48,
                      borderRadius: 14,
                      flexShrink: 0,
                      background: `linear-gradient(135deg, ${COLORS.primary}, ${COLORS.secondary})`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontWeight: 800,
                      color: "#0A0A0A",
                    }}
                  >
                    <Icon size={20} />
                  </div>
                  <div>
                    <div style={{ fontSize: 11.5, color: COLORS.secondary, fontWeight: 700, letterSpacing: 0.5 }}>
                      STEP {i + 1}
                    </div>
                    <div style={{ fontSize: 16.5, fontWeight: 700, marginTop: 3 }}>{step.title}</div>
                    <div style={{ fontSize: 13, color: COLORS.textSecondary, marginTop: 3 }}>{step.desc}</div>
                  </div>
                </motion.div>
                {!isLast && (
                  <div style={{ padding: "8px 0" }}>
                    <ArrowDown size={18} color={COLORS.primary} />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* WHY CHOOSE LUMORA */}
      <section id="about" style={{ padding: isMobile ? "20px 20px 70px" : "20px 40px 100px", maxWidth: 1100, margin: "0 auto" }}>
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
          variants={fadeUp}
          style={{ textAlign: "center", marginBottom: 44 }}
        >
          <h2 style={{ fontSize: isMobile ? 26 : 36, fontWeight: 800, letterSpacing: -0.6 }}>
            Why Choose LUMORA
          </h2>
          <p style={{ color: COLORS.textSecondary, marginTop: 10, fontSize: 15 }}>
            Stop juggling tools. Start building in one connected platform.
          </p>
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-60px" }}
          variants={fadeUp}
          style={{
            display: "flex",
            flexDirection: isTablet ? "column" : "row",
            gap: 24,
            alignItems: "stretch",
          }}
        >
          <div
            style={{
              flex: 1,
              background: COLORS.card,
              border: `1px solid ${COLORS.border}`,
              borderRadius: 20,
              padding: 30,
            }}
          >
            <div style={{ fontSize: 13, fontWeight: 700, color: COLORS.textSecondary, letterSpacing: 0.6, marginBottom: 18 }}>
              THE TRADITIONAL WAY
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {COMPARISON_TOOLS.map((tool) => (
                <div
                  key={tool}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: "11px 14px",
                    borderRadius: 10,
                    background: COLORS.cardAlt,
                    fontSize: 13.5,
                    color: COLORS.textSecondary,
                  }}
                >
                  <X size={14} color="#F87171" />
                  {tool}
                </div>
              ))}
            </div>
            <div style={{ fontSize: 12.5, color: COLORS.textSecondary, marginTop: 16 }}>
              Scattered tools. Wasted time. Disconnected workflow.
            </div>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: isTablet ? "6px 0" : "0 6px",
              transform: isTablet ? "rotate(90deg)" : "none",
            }}
          >
            <ArrowRight size={22} color={COLORS.secondary} />
          </div>

          <div
            style={{
              flex: 1,
              background: `linear-gradient(160deg, ${COLORS.card}, #1B140C)`,
              border: `1px solid rgba(212,175,55,0.35)`,
              borderRadius: 20,
              padding: 30,
              boxShadow: "0 20px 50px rgba(196,106,50,0.1)",
            }}
          >
            <div style={{ fontSize: 13, fontWeight: 700, color: COLORS.secondary, letterSpacing: 0.6, marginBottom: 18 }}>
              THE LUMORA WAY
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {["Idea → Brand → Plan → Launch", "AI Founder built-in", "Vision AI market analysis", "One workspace, zero chaos"].map(
                (item) => (
                  <div
                    key={item}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      padding: "11px 14px",
                      borderRadius: 10,
                      background: "rgba(212,175,55,0.08)",
                      fontSize: 13.5,
                      color: COLORS.white,
                    }}
                  >
                    <Check size={14} color={COLORS.secondary} />
                    {item}
                  </div>
                )
              )}
            </div>
            <div style={{ fontSize: 12.5, color: COLORS.secondary, marginTop: 16, fontWeight: 600 }}>
              Everything in one platform.
            </div>
          </div>
        </motion.div>
      </section>

      {/* FEATURE HIGHLIGHTS */}
      <section id="features" style={{ padding: isMobile ? "20px 20px 70px" : "20px 40px 100px", maxWidth: 1280, margin: "0 auto" }}>
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
          variants={fadeUp}
          style={{ textAlign: "center", marginBottom: 44 }}
        >
          <h2 style={{ fontSize: isMobile ? 26 : 36, fontWeight: 800, letterSpacing: -0.6 }}>
            Feature Highlights
          </h2>
          <p style={{ color: COLORS.textSecondary, marginTop: 10, fontSize: 15 }}>
            The core engines behind every successful LUMORA startup.
          </p>
        </motion.div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: isMobile ? "1fr" : isTablet ? "1fr 1fr" : "repeat(4, 1fr)",
            gap: 18,
          }}
        >
          {FEATURES.map((f, i) => {
            const Icon = f.icon;
            return (
              <motion.div
                key={f.title}
                custom={i % 4}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-60px" }}
                variants={fadeUp}
                whileHover={{ y: -6 }}
                style={{
                  background: COLORS.card,
                  border: `1px solid ${COLORS.border}`,
                  borderRadius: 18,
                  padding: 24,
                  transition: "all 0.3s ease",
                }}
              >
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 11,
                    background: "rgba(212,175,55,0.12)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    marginBottom: 16,
                  }}
                >
                  <Icon size={18} color={COLORS.secondary} />
                </div>
                <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 8 }}>{f.title}</div>
                <div style={{ fontSize: 13, color: COLORS.textSecondary, lineHeight: 1.6 }}>{f.desc}</div>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* PRICING */}
      <section id="pricing" style={{ padding: isMobile ? "20px 20px 70px" : "20px 40px 100px", maxWidth: 1200, margin: "0 auto" }}>
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
          variants={fadeUp}
          style={{ textAlign: "center", marginBottom: 44 }}
        >
          <h2 style={{ fontSize: isMobile ? 26 : 36, fontWeight: 800, letterSpacing: -0.6 }}>
            Simple, Transparent Pricing
          </h2>
          <p style={{ color: COLORS.textSecondary, marginTop: 10, fontSize: 15 }}>
            Start free. Upgrade as your startup grows.
          </p>
        </motion.div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: isMobile ? "1fr" : "repeat(3, 1fr)",
            gap: 22,
            alignItems: "stretch",
          }}
        >
          {PRICING_PLANS.map((plan, i) => (
            <motion.div
              key={plan.name}
              custom={i}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-60px" }}
              variants={fadeUp}
              whileHover={{ y: -8 }}
              style={{
                position: "relative",
                background: plan.popular
                  ? `linear-gradient(160deg, ${COLORS.card}, #1B140C)`
                  : COLORS.card,
                border: plan.popular ? `1.5px solid ${COLORS.secondary}` : `1px solid ${COLORS.border}`,
                borderRadius: 22,
                padding: 30,
                display: "flex",
                flexDirection: "column",
                gap: 20,
                boxShadow: plan.popular ? "0 25px 60px rgba(212,175,55,0.15)" : "none",
                transition: "all 0.35s ease",
              }}
            >
              {plan.popular && (
                <div
                  style={{
                    position: "absolute",
                    top: -14,
                    left: "50%",
                    transform: "translateX(-50%)",
                    background: `linear-gradient(135deg, ${COLORS.primary}, ${COLORS.secondary})`,
                    color: "#0A0A0A",
                    fontSize: 11.5,
                    fontWeight: 700,
                    padding: "6px 16px",
                    borderRadius: 20,
                  }}
                >
                  MOST POPULAR
                </div>
              )}
              <div>
                <div style={{ fontSize: 18, fontWeight: 700 }}>{plan.name}</div>
                <div style={{ fontSize: 13, color: COLORS.textSecondary, marginTop: 4 }}>{plan.desc}</div>
              </div>
              <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
                <span style={{ fontSize: 38, fontWeight: 800 }}>{plan.price}</span>
                <span style={{ fontSize: 14, color: COLORS.textSecondary }}>{plan.period}</span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 12, flex: 1 }}>
                {plan.features.map((feat) => (
                  <div key={feat} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13.5 }}>
                    <Check size={15} color={COLORS.secondary} />
                    {feat}
                  </div>
                ))}
              </div>
              <motion.button
                onClick={plan.price === "Custom" ? () => scrollTo("contact") : goToRegister}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                style={{
                  background: plan.popular
                    ? `linear-gradient(135deg, ${COLORS.primary}, ${COLORS.secondary})`
                    : "transparent",
                  border: plan.popular ? "none" : `1px solid ${COLORS.border}`,
                  color: plan.popular ? "#0A0A0A" : COLORS.white,
                  fontWeight: 700,
                  fontSize: 14,
                  padding: "13px",
                  borderRadius: 12,
                  cursor: "pointer",
                  width: "100%",
                }}
              >
                {plan.price === "Custom" ? "Contact Sales" : "Get Started"}
              </motion.button>
            </motion.div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section style={{ padding: isMobile ? "20px 20px 70px" : "20px 40px 100px", maxWidth: 860, margin: "0 auto" }}>
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
          variants={fadeUp}
          style={{ textAlign: "center", marginBottom: 40 }}
        >
          <h2 style={{ fontSize: isMobile ? 26 : 36, fontWeight: 800, letterSpacing: -0.6 }}>
            Frequently Asked Questions
          </h2>
        </motion.div>

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {FAQS.map((faq, i) => {
            const isOpen = openFaq === i;
            return (
              <motion.div
                key={faq.q}
                custom={i}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-40px" }}
                variants={fadeUp}
                style={{
                  background: COLORS.card,
                  border: `1px solid ${COLORS.border}`,
                  borderRadius: 16,
                  overflow: "hidden",
                }}
              >
                <div
                  onClick={() => setOpenFaq(isOpen ? -1 : i)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "18px 22px",
                    cursor: "pointer",
                  }}
                >
                  <span style={{ fontSize: 14.5, fontWeight: 600 }}>{faq.q}</span>
                  <motion.div animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.3 }}>
                    <ChevronDown size={17} color={COLORS.textSecondary} />
                  </motion.div>
                </div>
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: "easeInOut" }}
                      style={{ overflow: "hidden" }}
                    >
                      <div
                        style={{
                          padding: "0 22px 20px",
                          fontSize: 13.5,
                          color: COLORS.textSecondary,
                          lineHeight: 1.65,
                        }}
                      >
                        {faq.a}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* CTA */}
      <section style={{ padding: isMobile ? "20px 20px 80px" : "20px 40px 110px", maxWidth: 1100, margin: "0 auto" }}>
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
          variants={fadeUp}
          style={{
            position: "relative",
            background: `linear-gradient(135deg, rgba(196,106,50,0.18), rgba(212,175,55,0.08))`,
            border: `1px solid rgba(212,175,55,0.3)`,
            borderRadius: 28,
            padding: isMobile ? "50px 26px" : "70px 60px",
            textAlign: "center",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              position: "absolute",
              top: "-30%",
              right: "-10%",
              width: 300,
              height: 300,
              borderRadius: "50%",
              background: `radial-gradient(circle, rgba(212,175,55,0.25), transparent 70%)`,
              filter: "blur(30px)",
            }}
          />
          <h2 style={{ fontSize: isMobile ? 28 : 42, fontWeight: 800, letterSpacing: -0.8, position: "relative" }}>
            Ready to Build Your Startup?
          </h2>
          <p style={{ color: COLORS.textSecondary, marginTop: 14, fontSize: 15.5, position: "relative" }}>
            Join thousands of founders building faster with LUMORA.
          </p>
          <motion.button
            onClick={goToRegister}
            whileHover={{ scale: 1.05, boxShadow: "0 15px 40px rgba(196,106,50,0.4)" }}
            whileTap={{ scale: 0.97 }}
            style={{
              marginTop: 30,
              background: `linear-gradient(135deg, ${COLORS.primary}, ${COLORS.secondary})`,
              border: "none",
              color: "#0A0A0A",
              fontWeight: 700,
              fontSize: 15.5,
              padding: "17px 36px",
              borderRadius: 14,
              cursor: "pointer",
              position: "relative",
            }}
          >
            Start Building Today
          </motion.button>
        </motion.div>
      </section>

      {/* CONTACT */}
      <section id="contact" style={{ padding: isMobile ? "20px 20px 90px" : "20px 40px 120px", maxWidth: 760, margin: "0 auto" }}>
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
          variants={fadeUp}
          style={{ textAlign: "center", marginBottom: 36 }}
        >
          <h2 style={{ fontSize: isMobile ? 26 : 36, fontWeight: 800, letterSpacing: -0.6 }}>Get In Touch</h2>
          <p style={{ color: COLORS.textSecondary, marginTop: 10, fontSize: 15 }}>
            Have a question? Our team would love to hear from you.
          </p>
        </motion.div>

        <motion.form
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-60px" }}
          variants={fadeUp}
          onSubmit={handleFormSubmit}
          style={{
            background: COLORS.card,
            border: `1px solid ${COLORS.border}`,
            borderRadius: 20,
            padding: isMobile ? 24 : 34,
            display: "flex",
            flexDirection: "column",
            gap: 18,
          }}
        >
          <div style={{ display: "flex", flexDirection: isMobile ? "column" : "row", gap: 16 }}>
            <input
              value={formData.name}
              onChange={handleFormChange("name")}
              placeholder="Your Name"
              required
              style={{
                flex: 1,
                background: COLORS.cardAlt,
                border: `1px solid ${COLORS.border}`,
                borderRadius: 12,
                padding: "13px 16px",
                color: COLORS.white,
                fontSize: 13.5,
                outline: "none",
              }}
            />
            <input
              value={formData.email}
              onChange={handleFormChange("email")}
              placeholder="Your Email"
              type="email"
              required
              style={{
                flex: 1,
                background: COLORS.cardAlt,
                border: `1px solid ${COLORS.border}`,
                borderRadius: 12,
                padding: "13px 16px",
                color: COLORS.white,
                fontSize: 13.5,
                outline: "none",
              }}
            />
          </div>
          <textarea
            value={formData.message}
            onChange={handleFormChange("message")}
            placeholder="Your Message"
            required
            rows={5}
            style={{
              background: COLORS.cardAlt,
              border: `1px solid ${COLORS.border}`,
              borderRadius: 12,
              padding: "13px 16px",
              color: COLORS.white,
              fontSize: 13.5,
              outline: "none",
              resize: "vertical",
              fontFamily: "inherit",
            }}
          />
          <motion.button
            type="submit"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              background: `linear-gradient(135deg, ${COLORS.primary}, ${COLORS.secondary})`,
              border: "none",
              color: "#0A0A0A",
              fontWeight: 700,
              fontSize: 14.5,
              padding: "15px",
              borderRadius: 12,
              cursor: "pointer",
            }}
          >
            {formSent ? (
              <>
                <Check size={16} /> Message Sent
              </>
            ) : (
              <>
                <Send size={16} /> Send Message
              </>
            )}
          </motion.button>
        </motion.form>
      </section>

      {/* FOOTER */}
      <footer
        style={{
          borderTop: `1px solid ${COLORS.border}`,
          padding: isMobile ? "50px 20px 30px" : "60px 40px 34px",
        }}
      >
        <div
          style={{
            maxWidth: 1280,
            margin: "0 auto",
            display: "grid",
            gridTemplateColumns: isMobile ? "1fr" : isTablet ? "1fr 1fr" : "1.4fr 1fr 1fr 1fr",
            gap: 36,
          }}
        >
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
              <div
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: 10,
                  background: `linear-gradient(135deg, ${COLORS.primary}, ${COLORS.secondary})`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: 800,
                  fontSize: 14,
                  color: "#0A0A0A",
                }}
              >
                L
              </div>
              <span style={{ fontWeight: 700, fontSize: 16.5 }}>LUMORA</span>
            </div>
            <p style={{ fontSize: 13, color: COLORS.textSecondary, lineHeight: 1.65, maxWidth: 280 }}>
              The AI Founder Operating System helping entrepreneurs build,
              manage and launch startups faster than ever.
            </p>
            <div style={{ display: "flex", gap: 12, marginTop: 20 }}>
              {[FaTwitter, FaLinkedin, FaGithub, FaInstagram].map((Icon, i) => (
                <div
                  key={i}
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: 10,
                    background: COLORS.card,
                    border: `1px solid ${COLORS.border}`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                  }}
                >
                  <Icon size={15} color={COLORS.textSecondary} />
                </div>
              ))}
            </div>
          </div>

          {Object.entries(FOOTER_LINKS).map(([title, items]) => (
            <div key={title}>
              <div style={{ fontSize: 13.5, fontWeight: 700, marginBottom: 16 }}>{title}</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {items.map((item) => (
                  <span key={item} style={{ fontSize: 13, color: COLORS.textSecondary, cursor: "pointer" }}>
                    {item}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div
          style={{
            maxWidth: 1280,
            margin: "40px auto 0",
            paddingTop: 24,
            borderTop: `1px solid ${COLORS.border}`,
            display: "flex",
            flexDirection: isMobile ? "column" : "row",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 12,
            fontSize: 12.5,
            color: COLORS.textSecondary,
          }}
        >
          <span>© 2026 LUMORA. All rights reserved.</span>
          <span>Build Brands. Launch Faster.</span>
        </div>
      </footer>
    </div>
  );
}