import React, { useEffect, useRef, useState } from "react";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import {
  Rocket, Lightbulb, Brain, Sparkles, TrendingUp, Plus, MessageCircle,
  ScanEye, CheckCircle2, Clock3, Target, ArrowUpRight, Mail, FileText,
  Layers, Wand2, ChevronRight, Circle,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/*  TOKENS                                                              */
/* ------------------------------------------------------------------ */
const C = {
  bg: "#090909",
  card: "#141414",
  cardAlt: "#171410",
  copper: "#C46A32",
  copperSoft: "rgba(196,106,50,0.14)",
  gold: "#D4AF37",
  goldSoft: "rgba(212,175,55,0.14)",
  text: "#F5F5F5",
  sub: "#A1A1AA",
  line: "rgba(245,245,245,0.07)",
  lineSoft: "rgba(245,245,245,0.04)",
};

const FONTS = `
@import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,300;9..144,400;9..144,500;9..144,600;9..144,700&family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');

* { box-sizing: border-box; }
.lumora-root {
  font-family: 'Inter', ui-sans-serif, system-ui, sans-serif;
  background: radial-gradient(ellipse 1200px 600px at 20% -10%, rgba(196,106,50,0.08), transparent 60%),
              radial-gradient(ellipse 900px 500px at 100% 0%, rgba(212,175,55,0.05), transparent 55%),
              #090909;
  color: #F5F5F5;
  min-height: 100vh;
}
.lumora-serif { font-family: 'Fraunces', serif; }
.lumora-mono { font-family: 'JetBrains Mono', monospace; }

@keyframes fadeUp {
  from { opacity: 0; transform: translateY(18px); }
  to   { opacity: 1; transform: translateY(0); }
}
.fade-up { opacity: 0; animation: fadeUp 0.7s cubic-bezier(0.16,1,0.3,1) forwards; }

@keyframes sparklePulse {
  0%, 100% { opacity: 0.55; transform: scale(1) rotate(0deg); }
  50% { opacity: 1; transform: scale(1.12) rotate(8deg); }
}
.sparkle-anim { animation: sparklePulse 2.8s ease-in-out infinite; }

@keyframes ringGlow {
  0%, 100% { box-shadow: 0 0 0px rgba(212,175,55,0); }
  50% { box-shadow: 0 0 26px rgba(212,175,55,0.14); }
}
.ring-glow { animation: ringGlow 4s ease-in-out infinite; }

.card-hover { transition: transform 0.45s cubic-bezier(0.16,1,0.3,1), border-color 0.45s ease, box-shadow 0.45s ease; }
.card-hover:hover { transform: translateY(-4px); border-color: rgba(212,175,55,0.28); box-shadow: 0 24px 48px -20px rgba(0,0,0,0.7); }

.qa-btn { transition: all 0.35s cubic-bezier(0.16,1,0.3,1); }
.qa-btn:hover { transform: translateY(-2px); border-color: rgba(212,175,55,0.35) !important; }

.bar-fill { transition: width 1.4s cubic-bezier(0.16,1,0.3,1); }

.scrollbar-none::-webkit-scrollbar { display: none; }

.tick-ring { transition: stroke-dashoffset 1.6s cubic-bezier(0.16,1,0.3,1); }
`;

/* ------------------------------------------------------------------ */
/*  MOCK DATA                                                           */
/* ------------------------------------------------------------------ */
const weeklyActivity = [
  { day: "Mon", startups: 4 },
  { day: "Tue", startups: 7 },
  { day: "Wed", startups: 5 },
  { day: "Thu", startups: 9 },
  { day: "Fri", startups: 12 },
  { day: "Sat", startups: 8 },
  { day: "Sun", startups: 11 },
];

const aiUsage = [
  { month: "Feb", requests: 1120 },
  { month: "Mar", requests: 1480 },
  { month: "Apr", requests: 1290 },
  { month: "May", requests: 1860 },
  { month: "Jun", requests: 2210 },
  { month: "Jul", requests: 2640 },
];

const categories = [
  { name: "Technology", value: 32 },
  { name: "AI", value: 28 },
  { name: "Healthcare", value: 18 },
  { name: "Finance", value: 13 },
  { name: "Education", value: 9 },
];
const PIE_COLORS = ["#C46A32", "#D4AF37", "#8B5E3C", "#6E6A62", "#9C7A54"];

const monthlyGrowth = [
  { month: "Feb", growth: 12 },
  { month: "Mar", growth: 19 },
  { month: "Apr", growth: 24 },
  { month: "May", growth: 31 },
  { month: "Jun", growth: 38 },
  { month: "Jul", growth: 47 },
];

const productivity = [
  { label: "Projects Completed", value: 78, icon: Layers },
  { label: "Ideas Saved", value: 64, icon: Lightbulb },
  { label: "Business Models Generated", value: 45, icon: FileText },
  { label: "Logo Analysis", value: 88, icon: ScanEye },
  { label: "Emails Sent", value: 52, icon: Mail },
];

const activity = [
  { title: "Created Startup", detail: "Nova Robotics", time: "12 min ago", icon: Rocket },
  { title: "Generated Brand Story", detail: "Aether Health", time: "1 hr ago", icon: Wand2 },
  { title: "Analyzed Logo", detail: "Quantis AI", time: "3 hr ago", icon: ScanEye },
  { title: "Used AI Mentor", detail: "Pitch strategy session", time: "Yesterday", icon: Brain },
  { title: "Sent Pitch Deck", detail: "Meridian Capital", time: "Yesterday", icon: Mail },
];

const weeklyGoals = [
  { label: "Launch 3 startups", value: 66 },
  { label: "Generate 40 ideas", value: 82 },
  { label: "5 mentor sessions", value: 40 },
];

const upcomingTasks = [
  { label: "Finalize Nova Robotics deck", due: "Today" },
  { label: "Review AI brand voice", due: "Tomorrow" },
  { label: "Book mentor session", due: "Wed" },
  { label: "Approve logo variant", due: "Fri" },
];

const recommendations = [
  "Refine your pitch deck narrative before Friday's investor call.",
  "Your AI category is trending — consider a second AI-focused startup.",
  "Brand consistency score dipped 4% — revisit your logo palette.",
];

/* ------------------------------------------------------------------ */
/*  PRIMITIVES                                                          */
/* ------------------------------------------------------------------ */
function useCountUp(target, duration = 1400, decimals = 0) {
  const [value, setValue] = useState(0);
  const startRef = useRef(null);
  useEffect(() => {
    let raf;
    const step = (ts) => {
      if (startRef.current === null) startRef.current = ts;
      const progress = Math.min((ts - startRef.current) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 4);
      setValue(target * eased);
      if (progress < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);
  return decimals > 0 ? value.toFixed(decimals) : Math.round(value);
}

function Card({ children, style, className = "", delay = 0 }) {
  return (
    <div
      className={`fade-up card-hover ${className}`}
      style={{
        background: C.card,
        border: `1px solid ${C.line}`,
        borderRadius: 20,
        animationDelay: `${delay}ms`,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

function SectionHeading({ eyebrow, title, action }) {
  return (
    <div className="flex items-end justify-between mb-5">
      <div>
        {eyebrow && (
          <div
            className="lumora-mono text-xs mb-1 tracking-widest uppercase"
            style={{ color: C.copper, letterSpacing: "0.14em" }}
          >
            {eyebrow}
          </div>
        )}
        <h2 className="lumora-serif text-xl" style={{ color: C.text, fontWeight: 500 }}>
          {title}
        </h2>
      </div>
      {action}
    </div>
  );
}

/* Ring gauge — the signature element, styled like a fine watch dial */
function ProgressRing({ value, size = 92, stroke = 7, label, sub, animate = true }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 120);
    return () => clearTimeout(t);
  }, []);
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (mounted ? value / 100 : 0) * circ;
  const ticks = Array.from({ length: 40 });

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="absolute inset-0 -rotate-90">
        {ticks.map((_, i) => {
          const angle = (i / ticks.length) * 360;
          const isMajor = i % 5 === 0;
          const rad = (angle * Math.PI) / 180;
          const rOuter = size / 2 - 1;
          const rInner = rOuter - (isMajor ? 5 : 2.5);
          const cx = size / 2;
          const cy = size / 2;
          return (
            <line
              key={i}
              x1={cx + rOuter * Math.cos(rad)}
              y1={cy + rOuter * Math.sin(rad)}
              x2={cx + rInner * Math.cos(rad)}
              y2={cy + rInner * Math.sin(rad)}
              stroke={isMajor ? "rgba(245,245,245,0.16)" : "rgba(245,245,245,0.07)"}
              strokeWidth={1}
            />
          );
        })}
        <circle cx={size / 2} cy={size / 2} r={r - 9} fill="none" stroke={C.lineSoft} strokeWidth={stroke} />
        <circle
          className="tick-ring"
          cx={size / 2}
          cy={size / 2}
          r={r - 9}
          fill="none"
          stroke="url(#ringGrad)"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={2 * Math.PI * (r - 9)}
          strokeDashoffset={2 * Math.PI * (r - 9) - (mounted ? value / 100 : 0) * 2 * Math.PI * (r - 9)}
        />
        <defs>
          <linearGradient id="ringGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={C.copper} />
            <stop offset="100%" stopColor={C.gold} />
          </linearGradient>
        </defs>
      </svg>
      <div className="flex flex-col items-center">
        <span className="lumora-serif" style={{ fontSize: size * 0.24, color: C.text, fontWeight: 500 }}>
          {value}%
        </span>
        {label && <span className="lumora-mono text-[9px] uppercase tracking-wider" style={{ color: C.sub }}>{label}</span>}
      </div>
    </div>
  );
}

function MetricCard({ icon: Icon, label, value, suffix = "", delta, delay, prefixSign = "" }) {
  const count = useCountUp(value);
  return (
    <Card delay={delay} className="p-6 relative overflow-hidden">
      <div
        className="absolute -right-6 -top-6 w-28 h-28 rounded-full"
        style={{ background: `radial-gradient(circle, ${C.copperSoft}, transparent 70%)` }}
      />
      <div className="flex items-center justify-between relative">
        <div
          className="w-11 h-11 rounded-xl flex items-center justify-center"
          style={{ background: C.copperSoft, border: `1px solid rgba(196,106,50,0.25)` }}
        >
          <Icon size={19} strokeWidth={1.6} color={C.copper} />
        </div>
        {delta && (
          <div className="flex items-center gap-1 text-xs" style={{ color: C.gold }}>
            <TrendingUp size={13} strokeWidth={2} />
            <span className="lumora-mono">{delta}</span>
          </div>
        )}
      </div>
      <div className="mt-6 relative">
        <div className="lumora-serif" style={{ fontSize: 32, color: C.text, fontWeight: 500, letterSpacing: "-0.01em" }}>
          {prefixSign}{count}{suffix}
        </div>
        <div className="text-sm mt-1" style={{ color: C.sub }}>{label}</div>
      </div>
    </Card>
  );
}

function ChartTooltip({ active, payload, label, unit = "" }) {
  if (!active || !payload || !payload.length) return null;
  return (
    <div
      className="px-3 py-2 rounded-lg lumora-mono text-xs"
      style={{ background: "#1c1a17", border: `1px solid ${C.line}`, color: C.text }}
    >
      <div style={{ color: C.sub }}>{label}</div>
      <div style={{ color: C.gold }}>{payload[0].value}{unit}</div>
    </div>
  );
}

function ProgressBar({ icon: Icon, label, value, delay }) {
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setWidth(value), 200 + delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return (
    <div className="fade-up" style={{ animationDelay: `${delay}ms` }}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2.5">
          <Icon size={15} strokeWidth={1.6} color={C.gold} />
          <span className="text-sm" style={{ color: C.text }}>{label}</span>
        </div>
        <span className="lumora-mono text-xs" style={{ color: C.sub }}>{value}%</span>
      </div>
      <div className="h-[6px] rounded-full w-full" style={{ background: C.lineSoft }}>
        <div
          className="bar-fill h-full rounded-full"
          style={{
            width: `${width}%`,
            background: `linear-gradient(90deg, ${C.copper}, ${C.gold})`,
          }}
        />
      </div>
    </div>
  );
}

function QuickAction({ icon: Icon, label, primary, delay }) {
  return (
    <button
      className="qa-btn fade-up flex items-center gap-2.5 px-5 py-3.5 rounded-2xl text-sm"
      style={{
        animationDelay: `${delay}ms`,
        background: primary ? `linear-gradient(135deg, ${C.copper}, #a8551f)` : "transparent",
        border: `1px solid ${primary ? "transparent" : C.line}`,
        color: primary ? "#fff" : C.text,
        fontWeight: 500,
      }}
    >
      <Icon size={16} strokeWidth={1.8} />
      {label}
    </button>
  );
}

/* ------------------------------------------------------------------ */
/*  MAIN                                                                */
/* ------------------------------------------------------------------ */
export default function Analytics() {
  return (
    <div className="lumora-root">
      <style>{FONTS}</style>

      <div className="max-w-[1440px] mx-auto px-6 md:px-10 py-10">
        {/* Header */}
        <div className="fade-up flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10">
          <div>
            <div className="flex items-center gap-2.5 mb-3">
              <div
                className="w-7 h-7 rounded-md flex items-center justify-center"
                style={{ background: `linear-gradient(135deg, ${C.copper}, ${C.gold})` }}
              >
                <span className="lumora-serif text-xs" style={{ color: "#0a0a0a", fontWeight: 700 }}>L</span>
              </div>
              <span className="lumora-mono text-xs uppercase tracking-widest" style={{ color: C.sub, letterSpacing: "0.18em" }}>
                Lumora
              </span>
            </div>
            <h1 className="lumora-serif" style={{ fontSize: 38, color: C.text, fontWeight: 500, letterSpacing: "-0.01em" }}>
              Analytics
            </h1>
            <p className="text-sm mt-2 max-w-md" style={{ color: C.sub }}>
              Monitor your startup growth, AI usage, and brand development from one intelligent dashboard.
            </p>
          </div>
          <div
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs lumora-mono self-start"
            style={{ border: `1px solid ${C.line}`, color: C.sub }}
          >
            <Circle size={7} fill={C.gold} color={C.gold} />
            Live · Updated just now
          </div>
        </div>

        {/* Top summary cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
          <MetricCard icon={Rocket} label="Total Startups" value={128} delta="+18%" delay={0} />
          <MetricCard icon={Lightbulb} label="Ideas Generated" value={342} delta="+25" delay={80} />
          <MetricCard icon={Brain} label="AI Requests (mo)" value={2640} delta="+19%" delay={160} />
          <Card delay={240} className="p-6 flex items-center justify-between">
            <div>
              <div className="text-sm mb-1" style={{ color: C.sub }}>Brand Completion</div>
              <div className="text-xs" style={{ color: C.gold }}>On track</div>
            </div>
            <ProgressRing value={82} size={84} label="Complete" />
          </Card>
        </div>

        {/* Quick actions */}
        <div className="flex flex-wrap gap-3 mb-10">
          <QuickAction icon={Plus} label="Create Startup" primary delay={280} />
          <QuickAction icon={Wand2} label="Generate New Brand" delay={320} />
          <QuickAction icon={MessageCircle} label="Ask AI Mentor" delay={360} />
          <QuickAction icon={ScanEye} label="Analyze Logo" delay={400} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left column */}
          <div className="lg:col-span-8 flex flex-col gap-6">

            {/* Analytics charts */}
            <div>
              <SectionHeading eyebrow="Insights" title="Analytics" />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <Card delay={0} className="p-6">
                  <div className="text-sm mb-4" style={{ color: C.text, fontWeight: 500 }}>Weekly Startup Activity</div>
                  <ResponsiveContainer width="100%" height={180}>
                    <AreaChart data={weeklyActivity}>
                      <defs>
                        <linearGradient id="areaFill" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor={C.copper} stopOpacity={0.5} />
                          <stop offset="100%" stopColor={C.copper} stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid stroke={C.lineSoft} vertical={false} />
                      <XAxis dataKey="day" tick={{ fill: C.sub, fontSize: 11 }} axisLine={false} tickLine={false} />
                      <YAxis hide />
                      <Tooltip content={<ChartTooltip />} cursor={{ stroke: C.line }} />
                      <Area type="monotone" dataKey="startups" stroke={C.copper} strokeWidth={2} fill="url(#areaFill)" animationDuration={1400} />
                    </AreaChart>
                  </ResponsiveContainer>
                </Card>

                <Card delay={60} className="p-6">
                  <div className="text-sm mb-4" style={{ color: C.text, fontWeight: 500 }}>AI Usage</div>
                  <ResponsiveContainer width="100%" height={180}>
                    <BarChart data={aiUsage}>
                      <CartesianGrid stroke={C.lineSoft} vertical={false} />
                      <XAxis dataKey="month" tick={{ fill: C.sub, fontSize: 11 }} axisLine={false} tickLine={false} />
                      <YAxis hide />
                      <Tooltip content={<ChartTooltip />} cursor={{ fill: "rgba(245,245,245,0.03)" }} />
                      <Bar dataKey="requests" fill={C.gold} radius={[6, 6, 0, 0]} animationDuration={1400} maxBarSize={26} />
                    </BarChart>
                  </ResponsiveContainer>
                </Card>

                <Card delay={120} className="p-6">
                  <div className="text-sm mb-4" style={{ color: C.text, fontWeight: 500 }}>Startup Categories</div>
                  <div className="flex items-center gap-4">
                    <ResponsiveContainer width="55%" height={160}>
                      <PieChart>
                        <Pie data={categories} dataKey="value" nameKey="name" innerRadius={42} outerRadius={64} paddingAngle={2} animationDuration={1400}>
                          {categories.map((c, i) => (
                            <Cell key={c.name} fill={PIE_COLORS[i % PIE_COLORS.length]} stroke={C.card} strokeWidth={2} />
                          ))}
                        </Pie>
                        <Tooltip content={<ChartTooltip unit="%" />} />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="flex flex-col gap-2">
                      {categories.map((c, i) => (
                        <div key={c.name} className="flex items-center gap-2 text-xs">
                          <span className="w-2 h-2 rounded-full" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                          <span style={{ color: C.sub }}>{c.name}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </Card>

                <Card delay={180} className="p-6">
                  <div className="text-sm mb-4" style={{ color: C.text, fontWeight: 500 }}>Monthly Growth</div>
                  <ResponsiveContainer width="100%" height={180}>
                    <LineChart data={monthlyGrowth}>
                      <CartesianGrid stroke={C.lineSoft} vertical={false} />
                      <XAxis dataKey="month" tick={{ fill: C.sub, fontSize: 11 }} axisLine={false} tickLine={false} />
                      <YAxis hide />
                      <Tooltip content={<ChartTooltip unit="%" />} cursor={{ stroke: C.line }} />
                      <Line type="monotone" dataKey="growth" stroke={C.gold} strokeWidth={2.5} dot={{ r: 3, fill: C.gold, strokeWidth: 0 }} animationDuration={1400} />
                    </LineChart>
                  </ResponsiveContainer>
                </Card>
              </div>
            </div>

            {/* Productivity */}
            <Card delay={0} className="p-7">
              <SectionHeading eyebrow="Output" title="Productivity" />
              <div className="flex flex-col gap-5">
                {productivity.map((p, i) => (
                  <ProgressBar key={p.label} icon={p.icon} label={p.label} value={p.value} delay={i * 90} />
                ))}
              </div>
            </Card>

            {/* AI Insights */}
            <Card
              delay={0}
              className="p-8 ring-glow relative overflow-hidden"
              style={{
                background: `linear-gradient(135deg, rgba(196,106,50,0.10), rgba(212,175,55,0.05) 60%, ${C.card})`,
                backdropFilter: "blur(6px)",
              }}
            >
              <div
                className="absolute -right-10 -bottom-10 w-52 h-52 rounded-full"
                style={{ background: `radial-gradient(circle, ${C.goldSoft}, transparent 70%)` }}
              />
              <div className="flex items-center gap-3 mb-6 relative">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center sparkle-anim"
                  style={{ background: C.goldSoft, border: `1px solid rgba(212,175,55,0.3)` }}
                >
                  <Sparkles size={18} color={C.gold} strokeWidth={1.7} />
                </div>
                <h2 className="lumora-serif text-xl" style={{ color: C.text, fontWeight: 500 }}>AI Insights</h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 relative">
                {[
                  "Your startup progress increased by 18% this week.",
                  "You generated 25 business ideas this month.",
                  "Your most active category is AI.",
                  "Your branding is 82% complete.",
                ].map((line, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-3 p-4 rounded-2xl"
                    style={{ background: "rgba(245,245,245,0.03)", border: `1px solid ${C.lineSoft}` }}
                  >
                    <ArrowUpRight size={15} color={C.copper} className="mt-0.5 shrink-0" />
                    <span className="text-sm" style={{ color: C.text }}>{line}</span>
                  </div>
                ))}
              </div>
            </Card>

            {/* Recent activity */}
            <Card delay={0} className="p-7">
              <SectionHeading eyebrow="Timeline" title="Recent Activity" />
              <div className="flex flex-col">
                {activity.map((a, i) => (
                  <div key={i} className="flex gap-4 relative pb-6 last:pb-0">
                    {i !== activity.length - 1 && (
                      <div className="absolute left-[19px] top-10 bottom-0 w-px" style={{ background: C.line }} />
                    )}
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 z-10"
                      style={{ background: C.cardAlt, border: `1px solid ${C.line}` }}
                    >
                      <a.icon size={16} color={C.gold} strokeWidth={1.6} />
                    </div>
                    <div className="flex-1 flex items-center justify-between">
                      <div>
                        <div className="text-sm" style={{ color: C.text, fontWeight: 500 }}>{a.title}</div>
                        <div className="text-xs mt-0.5" style={{ color: C.sub }}>{a.detail}</div>
                      </div>
                      <span className="lumora-mono text-xs shrink-0 pl-4" style={{ color: C.sub }}>{a.time}</span>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          {/* Right sidebar */}
          <div className="lg:col-span-4 flex flex-col gap-6">
            <Card delay={0} className="p-7 flex flex-col items-center text-center">
              <div className="text-sm mb-5 self-start" style={{ color: C.text, fontWeight: 500 }}>Brand Completion</div>
              <ProgressRing value={82} size={132} label="Complete" />
              <p className="text-xs mt-4" style={{ color: C.sub }}>
                Logo, voice, and story are aligned. Two assets left to finalize.
              </p>
            </Card>

            <Card delay={60} className="p-7">
              <div className="flex items-center gap-2 mb-5">
                <Target size={16} color={C.copper} strokeWidth={1.7} />
                <span className="text-sm" style={{ color: C.text, fontWeight: 500 }}>Weekly Goals</span>
              </div>
              <div className="flex flex-col gap-5">
                {weeklyGoals.map((g, i) => (
                  <ProgressBar key={g.label} icon={CheckCircle2} label={g.label} value={g.value} delay={i * 100} />
                ))}
              </div>
            </Card>

            <Card delay={120} className="p-7">
              <div className="flex items-center gap-2 mb-5">
                <Clock3 size={16} color={C.copper} strokeWidth={1.7} />
                <span className="text-sm" style={{ color: C.text, fontWeight: 500 }}>Upcoming Tasks</span>
              </div>
              <div className="flex flex-col gap-1">
                {upcomingTasks.map((t, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between py-2.5"
                    style={{ borderBottom: i !== upcomingTasks.length - 1 ? `1px solid ${C.lineSoft}` : "none" }}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-1.5 h-1.5 rounded-full" style={{ background: C.gold }} />
                      <span className="text-sm" style={{ color: C.text }}>{t.label}</span>
                    </div>
                    <span className="lumora-mono text-xs" style={{ color: C.sub }}>{t.due}</span>
                  </div>
                ))}
              </div>
            </Card>

            <Card delay={180} className="p-7">
              <div className="flex items-center gap-2 mb-5">
                <Sparkles size={16} color={C.gold} strokeWidth={1.7} />
                <span className="text-sm" style={{ color: C.text, fontWeight: 500 }}>AI Recommendations</span>
              </div>
              <div className="flex flex-col gap-3">
                {recommendations.map((r, i) => (
                  <div key={i} className="flex items-start gap-2.5 group cursor-pointer">
                    <ChevronRight size={14} color={C.copper} className="mt-0.5 shrink-0" />
                    <span className="text-sm leading-snug" style={{ color: C.sub }}>{r}</span>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}