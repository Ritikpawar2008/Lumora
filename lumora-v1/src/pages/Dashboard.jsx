import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "./Sidebar";
import { supabase } from "../../supabase";

const COLORS = {
  background: "#090909",
  card: "#171717",
  primary: "#C46A32",
  secondary: "#D4AF37",
  text: "#F5F5F5",
  secondaryText: "#A1A1AA",
  border: "#262626",
  danger: "#EF4444",
  success: "#4ADE80",
};

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTH_LABELS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

const AI_SUGGESTIONS = [
  "LUMORA recommends validating your latest idea with a quick 5-question customer survey before building.",
  "LUMORA recommends reviewing startups with 'Archived' status — some may be worth reviving with a pivot.",
  "LUMORA recommends setting a weekly check-in to track startup momentum and avoid stalled progress.",
  "LUMORA recommends turning your most active idea into a startup this week to keep momentum going.",
  "LUMORA recommends documenting your AI usage patterns to identify which prompts drive the best outcomes.",
];

const getInitials = (name) => {
  if (!name) return "U";
  const parts = name.trim().split(" ");
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
};

const formatTimeAgo = (dateString) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
};

const isSameDay = (a, b) =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate();

/* ---------------- Inline SVG Chart Components ---------------- */

const MiniLineChart = ({ data, color }) => {
  if (!data || data.length === 0) {
    return (
      <div
        style={{
          height: "140px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: COLORS.secondaryText,
          fontSize: "13px",
        }}
      >
        No data yet
      </div>
    );
  }

  const width = 280;
  const height = 140;
  const padding = 20;
  const max = Math.max(...data.map((d) => d.value), 1);

  const points = data.map((d, i) => {
    const x = padding + (i * (width - padding * 2)) / Math.max(data.length - 1, 1);
    const y = height - padding - (d.value / max) * (height - padding * 2);
    return { x, y };
  });

  const pathD = points
    .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`)
    .join(" ");

  const areaD = `${pathD} L ${points[points.length - 1].x} ${height - padding} L ${points[0].x} ${height - padding} Z`;

  return (
    <svg width="100%" viewBox={`0 0 ${width} ${height}`} style={{ display: "block" }}>
      <defs>
        <linearGradient id="lineGradient" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.35" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={areaD} fill="url(#lineGradient)" stroke="none" />
      <path d={pathD} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      {points.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r="3.5" fill={color} />
      ))}
      {data.map((d, i) => (
        <text
          key={i}
          x={points[i].x}
          y={height - 4}
          fontSize="10"
          fill={COLORS.secondaryText}
          textAnchor="middle"
        >
          {d.label}
        </text>
      ))}
    </svg>
  );
};

const MiniBarChart = ({ data, color }) => {
  if (!data || data.length === 0) {
    return (
      <div
        style={{
          height: "140px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: COLORS.secondaryText,
          fontSize: "13px",
        }}
      >
        No data yet
      </div>
    );
  }

  const width = 280;
  const height = 140;
  const padding = 20;
  const max = Math.max(...data.map((d) => d.value), 1);
  const barWidth = (width - padding * 2) / data.length - 8;

  return (
    <svg width="100%" viewBox={`0 0 ${width} ${height}`} style={{ display: "block" }}>
      {data.map((d, i) => {
        const barHeight = (d.value / max) * (height - padding * 2);
        const x = padding + i * ((width - padding * 2) / data.length) + 4;
        const y = height - padding - barHeight;
        return (
          <g key={i}>
            <rect
              x={x}
              y={y}
              width={barWidth}
              height={Math.max(barHeight, 2)}
              rx="4"
              fill={color}
              opacity={d.value === 0 ? 0.25 : 1}
            />
            <text
              x={x + barWidth / 2}
              y={height - 4}
              fontSize="10"
              fill={COLORS.secondaryText}
              textAnchor="middle"
            >
              {d.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
};

/* ---------------- Main Dashboard Component ---------------- */

const Dashboard = () => {
  const navigate = useNavigate();
  const notificationsRef = useRef(null);
  const profileRef = useRef(null);

  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState("");

  const [loadingStats, setLoadingStats] = useState(true);
  const [stats, setStats] = useState({
    totalStartups: 0,
    totalIdeas: 0,
    aiRequests: 0,
    growth: 0,
  });

  const [growthData, setGrowthData] = useState([]);
  const [weeklyActivity, setWeeklyActivity] = useState([]);
  const [aiUsageData, setAiUsageData] = useState([]);

  const [recentStartups, setRecentStartups] = useState([]);
  const [recentIdeas, setRecentIdeas] = useState([]);
  const [aiSuggestion, setAiSuggestion] = useState("");

  const [activityTimeline, setActivityTimeline] = useState({
    today: [],
    yesterday: [],
    lastWeek: [],
  });

  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (notificationsRef.current && !notificationsRef.current.contains(e.target)) {
        setShowNotifications(false);
      }
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setShowProfileMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const loadUser = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        const displayName =
          user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split("@")[0] || "there";
        setUserName(displayName);
        setUserEmail(user.email || "");
      }
      return user;
    } catch (error) {
      console.error("Error loading user:", error.message);
      return null;
    }
  };

  const loadStats = async (userId) => {
    try {
      const { count: startupsCount, error: startupsError } = await supabase
        .from("startups")
        .select("*", { count: "exact", head: true })
        .eq("user_id", userId);
      if (startupsError) throw startupsError;

      let ideasCount = 0;
      try {
        const { count, error } = await supabase
          .from("ideas")
          .select("*", { count: "exact", head: true })
          .eq("user_id", userId);
        if (!error) ideasCount = count || 0;
      } catch (err) {
        console.error("Ideas table not available:", err.message);
      }

      let aiRequestsCount = 0;
      try {
        const { count, error } = await supabase
          .from("ai_requests")
          .select("*", { count: "exact", head: true })
          .eq("user_id", userId);
        if (!error) aiRequestsCount = count || 0;
      } catch (err) {
        console.error("AI requests table not available:", err.message);
      }

      const now = new Date();
      const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString();

      let growth = 0;
      try {
        const { count: thisMonthCount } = await supabase
          .from("startups")
          .select("*", { count: "exact", head: true })
          .eq("user_id", userId)
          .gte("created_at", startOfThisMonth);

        const { count: lastMonthCount } = await supabase
          .from("startups")
          .select("*", { count: "exact", head: true })
          .eq("user_id", userId)
          .gte("created_at", startOfLastMonth)
          .lt("created_at", startOfThisMonth);

        if (lastMonthCount && lastMonthCount > 0) {
          growth = Math.round(((thisMonthCount - lastMonthCount) / lastMonthCount) * 100);
        } else if (thisMonthCount && thisMonthCount > 0) {
          growth = 100;
        }
      } catch (err) {
        console.error("Error calculating growth:", err.message);
      }

      setStats({
        totalStartups: startupsCount || 0,
        totalIdeas: ideasCount,
        aiRequests: aiRequestsCount,
        growth,
      });
    } catch (error) {
      console.error("Error loading stats:", error.message);
      alert("Failed to load dashboard stats.");
    } finally {
      setLoadingStats(false);
    }
  };

  const loadGrowthChart = async (userId) => {
    try {
      const { data, error } = await supabase
        .from("startups")
        .select("created_at")
        .eq("user_id", userId);
      if (error) throw error;

      const now = new Date();
      const buckets = [];
      for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        buckets.push({ year: d.getFullYear(), month: d.getMonth(), label: MONTH_LABELS[d.getMonth()], value: 0 });
      }

      (data || []).forEach((row) => {
        if (!row.created_at) return;
        const d = new Date(row.created_at);
        const bucket = buckets.find((b) => b.year === d.getFullYear() && b.month === d.getMonth());
        if (bucket) bucket.value += 1;
      });

      setGrowthData(buckets.map((b) => ({ label: b.label, value: b.value })));
    } catch (error) {
      console.error("Error loading growth chart:", error.message);
      setGrowthData([]);
    }
  };

  const loadWeeklyActivity = async (userId) => {
    try {
      const now = new Date();
      const sevenDaysAgo = new Date(now);
      sevenDaysAgo.setDate(now.getDate() - 6);
      sevenDaysAgo.setHours(0, 0, 0, 0);

      const [{ data: startupRows }, ideasResult] = await Promise.all([
        supabase.from("startups").select("created_at").eq("user_id", userId).gte("created_at", sevenDaysAgo.toISOString()),
        supabase.from("ideas").select("created_at").eq("user_id", userId).gte("created_at", sevenDaysAgo.toISOString()),
      ]);

      const ideaRows = ideasResult?.data || [];
      const combined = [...(startupRows || []), ...ideaRows];

      const buckets = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date(now);
        d.setDate(now.getDate() - i);
        buckets.push({ date: d, label: DAY_LABELS[d.getDay()], value: 0 });
      }

      combined.forEach((row) => {
        if (!row.created_at) return;
        const d = new Date(row.created_at);
        const bucket = buckets.find((b) => isSameDay(b.date, d));
        if (bucket) bucket.value += 1;
      });

      setWeeklyActivity(buckets.map((b) => ({ label: b.label, value: b.value })));
    } catch (error) {
      console.error("Error loading weekly activity:", error.message);
      setWeeklyActivity([]);
    }
  };

  const loadAiUsage = async (userId) => {
    try {
      const now = new Date();
      const sevenDaysAgo = new Date(now);
      sevenDaysAgo.setDate(now.getDate() - 6);
      sevenDaysAgo.setHours(0, 0, 0, 0);

      const { data, error } = await supabase
        .from("ai_requests")
        .select("created_at")
        .eq("user_id", userId)
        .gte("created_at", sevenDaysAgo.toISOString());
      if (error) throw error;

      const buckets = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date(now);
        d.setDate(now.getDate() - i);
        buckets.push({ date: d, label: DAY_LABELS[d.getDay()], value: 0 });
      }

      (data || []).forEach((row) => {
        if (!row.created_at) return;
        const d = new Date(row.created_at);
        const bucket = buckets.find((b) => isSameDay(b.date, d));
        if (bucket) bucket.value += 1;
      });

      setAiUsageData(buckets.map((b) => ({ label: b.label, value: b.value })));
    } catch (error) {
      console.error("AI usage data not available:", error.message);
      setAiUsageData([]);
    }
  };

  const loadRecentStartups = async (userId) => {
    try {
      const { data, error } = await supabase
        .from("startups")
        .select("*")
        .eq("user_id", userId)
        .order("id", { ascending: false })
        .limit(3);
      if (error) throw error;
      setRecentStartups(data || []);
    } catch (error) {
      console.error("Error loading recent startups:", error.message);
      setRecentStartups([]);
    }
  };

  const loadRecentIdeas = async (userId) => {
    try {
      const { data, error } = await supabase
        .from("ideas")
        .select("*")
        .eq("user_id", userId)
        .order("id", { ascending: false })
        .limit(4);
      if (error) throw error;
      setRecentIdeas(data || []);
    } catch (error) {
      console.error("Ideas table not available:", error.message);
      setRecentIdeas([]);
    }
  };

  const loadNotifications = async (userId) => {
    try {
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(6);
      if (error) throw error;
      setNotifications(data || []);
    } catch (error) {
      console.error("Notifications table not available:", error.message);
      setNotifications([]);
    }
  };

  const loadActivityTimeline = async (userId) => {
    try {
      const [{ data: startupRows }, ideasResult] = await Promise.all([
        supabase.from("startups").select("id, name, created_at").eq("user_id", userId),
        supabase.from("ideas").select("id, title, created_at").eq("user_id", userId),
      ]);

      const ideaRows = ideasResult?.data || [];

      const combined = [
        ...(startupRows || []).map((r) => ({
          id: `startup-${r.id}`,
          text: `Created startup "${r.name}"`,
          created_at: r.created_at,
        })),
        ...ideaRows.map((r) => ({
          id: `idea-${r.id}`,
          text: `Added idea "${r.title}"`,
          created_at: r.created_at,
        })),
      ].filter((r) => r.created_at);

      combined.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

      const now = new Date();
      const yesterday = new Date(now);
      yesterday.setDate(now.getDate() - 1);
      const weekAgo = new Date(now);
      weekAgo.setDate(now.getDate() - 7);

      const today = [];
      const yest = [];
      const lastWeek = [];

      combined.forEach((item) => {
        const d = new Date(item.created_at);
        if (isSameDay(d, now)) {
          today.push(item);
        } else if (isSameDay(d, yesterday)) {
          yest.push(item);
        } else if (d >= weekAgo) {
          lastWeek.push(item);
        }
      });

      setActivityTimeline({
        today: today.slice(0, 5),
        yesterday: yest.slice(0, 5),
        lastWeek: lastWeek.slice(0, 5),
      });
    } catch (error) {
      console.error("Error loading activity timeline:", error.message);
      setActivityTimeline({ today: [], yesterday: [], lastWeek: [] });
    }
  };

  const loadDashboardData = async () => {
    try {
      setLoadingStats(true);
      const user = await loadUser();
      if (!user) {
        setLoadingStats(false);
        return;
      }

      setAiSuggestion(AI_SUGGESTIONS[Math.floor(Math.random() * AI_SUGGESTIONS.length)]);

      await Promise.all([
        loadStats(user.id),
        loadGrowthChart(user.id),
        loadWeeklyActivity(user.id),
        loadAiUsage(user.id),
        loadRecentStartups(user.id),
        loadRecentIdeas(user.id),
        loadNotifications(user.id),
        loadActivityTimeline(user.id),
      ]);
    } catch (error) {
      console.error("Error loading dashboard:", error.message);
      alert("Something went wrong loading your dashboard.");
    } finally {
      setLoadingStats(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  const handleSearchKeyDown = (e) => {
    if (e.key === "Enter" && searchQuery.trim()) {
      navigate(`/my-startups?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      navigate("/login");
    } catch (error) {
      console.error("Error logging out:", error.message);
      alert("Failed to log out. Please try again.");
    }
  };

  const statCards = [
    {
      key: "startups",
      icon: "🚀",
      label: "Total Startups",
      value: stats.totalStartups,
      accent: COLORS.primary,
    },
    {
      key: "ideas",
      icon: "💡",
      label: "Total Ideas",
      value: stats.totalIdeas,
      accent: COLORS.secondary,
    },
    {
      key: "ai",
      icon: "🤖",
      label: "AI Requests",
      value: stats.aiRequests,
      accent: "#8B5CF6",
    },
    {
      key: "growth",
      icon: "📈",
      label: "Growth %",
      value: `${stats.growth > 0 ? "+" : ""}${stats.growth}%`,
      accent: stats.growth >= 0 ? COLORS.success : COLORS.danger,
    },
  ];

  const quickActions = [
    { key: "create-startup", icon: "➕", label: "Create Startup", path: "/my-startups" },
    { key: "new-idea", icon: "💡", label: "New Idea", path: "/ideas" },
    { key: "ask-ai", icon: "🤖", label: "Ask AI", path: "/ai-assistant" },
    { key: "send-report", icon: "📧", label: "Send Report", path: "/reports" },
  ];

  const cardStyle = {
    backgroundColor: COLORS.card,
    borderRadius: "16px",
    border: `1px solid ${COLORS.border}`,
    padding: "22px",
  };

  const sectionTitleStyle = {
    fontSize: "17px",
    fontWeight: 700,
    color: COLORS.text,
    margin: "0 0 18px 0",
    display: "flex",
    alignItems: "center",
    gap: "8px",
  };

  return (
    <div
      style={{
        display: "flex",
        minHeight: "100vh",
        backgroundColor: COLORS.background,
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      }}
    >
      <Sidebar />

      <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column" }}>
        {/* Top Navbar */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "16px",
            flexWrap: "wrap",
            padding: "20px 40px",
            borderBottom: `1px solid ${COLORS.border}`,
            position: "sticky",
            top: 0,
            backgroundColor: COLORS.background,
            zIndex: 50,
          }}
        >
          <div>
            <h2 style={{ margin: 0, fontSize: "20px", fontWeight: 700, color: COLORS.text }}>
              👋 Welcome Back, {userName || "..."}
            </h2>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "16px", flex: 1, justifyContent: "flex-end", flexWrap: "wrap" }}>
            <input
              type="text"
              placeholder="Search startups, ideas..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleSearchKeyDown}
              style={{
                backgroundColor: COLORS.card,
                border: `1px solid ${COLORS.border}`,
                borderRadius: "10px",
                padding: "10px 14px",
                color: COLORS.text,
                fontSize: "14px",
                outline: "none",
                minWidth: "220px",
                maxWidth: "320px",
              }}
            />

            {/* Notifications */}
            <div style={{ position: "relative" }} ref={notificationsRef}>
              <button
                onClick={() => setShowNotifications((prev) => !prev)}
                style={{
                  backgroundColor: COLORS.card,
                  border: `1px solid ${COLORS.border}`,
                  borderRadius: "10px",
                  width: "42px",
                  height: "42px",
                  fontSize: "18px",
                  cursor: "pointer",
                  color: COLORS.text,
                  position: "relative",
                }}
              >
                🔔
                {notifications.length > 0 && (
                  <span
                    style={{
                      position: "absolute",
                      top: "6px",
                      right: "6px",
                      width: "8px",
                      height: "8px",
                      borderRadius: "50%",
                      backgroundColor: COLORS.primary,
                    }}
                  />
                )}
              </button>

              {showNotifications && (
                <div
                  style={{
                    position: "absolute",
                    right: 0,
                    top: "50px",
                    width: "300px",
                    backgroundColor: COLORS.card,
                    border: `1px solid ${COLORS.border}`,
                    borderRadius: "14px",
                    boxShadow: "0 12px 30px rgba(0,0,0,0.5)",
                    zIndex: 100,
                    overflow: "hidden",
                  }}
                >
                  <div style={{ padding: "14px 16px", borderBottom: `1px solid ${COLORS.border}`, fontWeight: 700, color: COLORS.text, fontSize: "14px" }}>
                    Notifications
                  </div>
                  <div style={{ maxHeight: "260px", overflowY: "auto" }}>
                    {notifications.length === 0 ? (
                      <div style={{ padding: "24px 16px", textAlign: "center", color: COLORS.secondaryText, fontSize: "13px" }}>
                        No notifications yet.
                      </div>
                    ) : (
                      notifications.map((n) => (
                        <div
                          key={n.id}
                          style={{
                            padding: "12px 16px",
                            borderBottom: `1px solid ${COLORS.border}`,
                            fontSize: "13px",
                            color: COLORS.text,
                          }}
                        >
                          <div>{n.message || n.title || "Notification"}</div>
                          {n.created_at && (
                            <div style={{ color: COLORS.secondaryText, fontSize: "11px", marginTop: "4px" }}>
                              {formatTimeAgo(n.created_at)}
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Profile */}
            <div style={{ position: "relative" }} ref={profileRef}>
              <button
                onClick={() => setShowProfileMenu((prev) => !prev)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  backgroundColor: COLORS.card,
                  border: `1px solid ${COLORS.border}`,
                  borderRadius: "10px",
                  padding: "6px 12px 6px 6px",
                  cursor: "pointer",
                }}
              >
                <div
                  style={{
                    width: "32px",
                    height: "32px",
                    borderRadius: "50%",
                    backgroundColor: COLORS.primary,
                    color: "#FFFFFF",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "13px",
                    fontWeight: 700,
                  }}
                >
                  {getInitials(userName)}
                </div>
                <span style={{ color: COLORS.text, fontSize: "13px", fontWeight: 600 }}>
                  {userName || "Account"}
                </span>
              </button>

              {showProfileMenu && (
                <div
                  style={{
                    position: "absolute",
                    right: 0,
                    top: "52px",
                    width: "220px",
                    backgroundColor: COLORS.card,
                    border: `1px solid ${COLORS.border}`,
                    borderRadius: "14px",
                    boxShadow: "0 12px 30px rgba(0,0,0,0.5)",
                    zIndex: 100,
                    overflow: "hidden",
                  }}
                >
                  <div style={{ padding: "14px 16px", borderBottom: `1px solid ${COLORS.border}` }}>
                    <div style={{ color: COLORS.text, fontSize: "13px", fontWeight: 700 }}>{userName}</div>
                    <div style={{ color: COLORS.secondaryText, fontSize: "12px", marginTop: "2px" }}>{userEmail}</div>
                  </div>
                  <button
                    onClick={() => navigate("/profile")}
                    style={{
                      width: "100%",
                      textAlign: "left",
                      padding: "12px 16px",
                      backgroundColor: "transparent",
                      border: "none",
                      color: COLORS.text,
                      fontSize: "13px",
                      cursor: "pointer",
                    }}
                  >
                    View Profile
                  </button>
                  <button
                    onClick={handleLogout}
                    style={{
                      width: "100%",
                      textAlign: "left",
                      padding: "12px 16px",
                      backgroundColor: "transparent",
                      border: "none",
                      color: COLORS.danger,
                      fontSize: "13px",
                      cursor: "pointer",
                    }}
                  >
                    Log Out
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Main scrollable content */}
        <div style={{ padding: "32px 40px", flex: 1 }}>
          {/* Stats Cards */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
              gap: "20px",
              marginBottom: "32px",
            }}
          >
            {statCards.map((stat) => (
              <div key={stat.key} style={cardStyle}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span style={{ fontSize: "24px" }}>{stat.icon}</span>
                  <span
                    style={{
                      width: "8px",
                      height: "8px",
                      borderRadius: "50%",
                      backgroundColor: stat.accent,
                    }}
                  />
                </div>
                <div style={{ marginTop: "16px", fontSize: "26px", fontWeight: 700, color: COLORS.text }}>
                  {loadingStats ? "…" : stat.value}
                </div>
                <div style={{ marginTop: "4px", fontSize: "13px", color: COLORS.secondaryText }}>
                  {stat.label}
                </div>
              </div>
            ))}
          </div>

          {/* Analytics */}
          <h3 style={sectionTitleStyle}>📈 Analytics</h3>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
              gap: "20px",
              marginBottom: "32px",
            }}
          >
            <div style={cardStyle}>
              <div style={{ fontSize: "14px", fontWeight: 600, color: COLORS.text, marginBottom: "10px" }}>
                Startup Growth
              </div>
              <MiniLineChart data={growthData} color={COLORS.primary} />
            </div>
            <div style={cardStyle}>
              <div style={{ fontSize: "14px", fontWeight: 600, color: COLORS.text, marginBottom: "10px" }}>
                Weekly Activity
              </div>
              <MiniBarChart data={weeklyActivity} color={COLORS.secondary} />
            </div>
            <div style={cardStyle}>
              <div style={{ fontSize: "14px", fontWeight: 600, color: COLORS.text, marginBottom: "10px" }}>
                AI Usage
              </div>
              <MiniBarChart data={aiUsageData} color="#8B5CF6" />
            </div>
          </div>

          {/* Quick Actions */}
          <h3 style={sectionTitleStyle}>⚡ Quick Actions</h3>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
              gap: "16px",
              marginBottom: "32px",
            }}
          >
            {quickActions.map((action) => (
              <button
                key={action.key}
                onClick={() => navigate(action.path)}
                style={{
                  ...cardStyle,
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  cursor: "pointer",
                  transition: "transform 0.15s ease, border-color 0.15s ease",
                  textAlign: "left",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-3px)";
                  e.currentTarget.style.borderColor = COLORS.primary;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.borderColor = COLORS.border;
                }}
              >
                <span style={{ fontSize: "22px" }}>{action.icon}</span>
                <span style={{ color: COLORS.text, fontSize: "14px", fontWeight: 600 }}>{action.label}</span>
              </button>
            ))}
          </div>

          {/* Recent Startups & Recent Ideas */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "2fr 1fr",
              gap: "20px",
              marginBottom: "32px",
              alignItems: "start",
            }}
          >
            <div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <h3 style={sectionTitleStyle}>🚀 Recent Startups</h3>
                <button
                  onClick={() => navigate("/my-startups")}
                  style={{
                    background: "none",
                    border: "none",
                    color: COLORS.secondary,
                    fontSize: "13px",
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  View All →
                </button>
              </div>

              {recentStartups.length === 0 ? (
                <div style={{ ...cardStyle, textAlign: "center", color: COLORS.secondaryText, fontSize: "13px" }}>
                  No startups yet. Create your first one!
                </div>
              ) : (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "16px" }}>
                  {recentStartups.map((startup) => (
                    <div
                      key={startup.id}
                      onClick={() => navigate(`/startup/${startup.id}`)}
                      style={{
                        ...cardStyle,
                        cursor: "pointer",
                        transition: "transform 0.15s ease, border-color 0.15s ease",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = "translateY(-3px)";
                        e.currentTarget.style.borderColor = COLORS.primary;
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = "translateY(0)";
                        e.currentTarget.style.borderColor = COLORS.border;
                      }}
                    >
                      <div style={{ fontSize: "15px", fontWeight: 700, color: COLORS.text, marginBottom: "6px" }}>
                        {startup.name}
                      </div>
                      <div
                        style={{
                          fontSize: "12px",
                          color: COLORS.secondaryText,
                          display: "-webkit-box",
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: "vertical",
                          overflow: "hidden",
                          marginBottom: "10px",
                        }}
                      >
                        {startup.description || "No description provided."}
                      </div>
                      <span
                        style={{
                          fontSize: "11px",
                          fontWeight: 700,
                          color: COLORS.secondary,
                          border: `1px solid ${COLORS.secondary}`,
                          borderRadius: "999px",
                          padding: "3px 10px",
                        }}
                      >
                        {startup.status || "N/A"}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <h3 style={sectionTitleStyle}>💡 Recent Ideas</h3>
                <button
                  onClick={() => navigate("/ideas")}
                  style={{
                    background: "none",
                    border: "none",
                    color: COLORS.secondary,
                    fontSize: "13px",
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  View All →
                </button>
              </div>

              <div style={cardStyle}>
                {recentIdeas.length === 0 ? (
                  <div style={{ textAlign: "center", color: COLORS.secondaryText, fontSize: "13px" }}>
                    No ideas captured yet.
                  </div>
                ) : (
                  recentIdeas.map((idea, index) => (
                    <div
                      key={idea.id}
                      style={{
                        padding: "10px 0",
                        borderBottom: index === recentIdeas.length - 1 ? "none" : `1px solid ${COLORS.border}`,
                      }}
                    >
                      <div style={{ fontSize: "13px", fontWeight: 600, color: COLORS.text }}>
                        {idea.title || idea.name || "Untitled idea"}
                      </div>
                      {idea.created_at && (
                        <div style={{ fontSize: "11px", color: COLORS.secondaryText, marginTop: "3px" }}>
                          {formatTimeAgo(idea.created_at)}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* AI Suggestions */}
          <h3 style={sectionTitleStyle}>🤖 AI Suggestions</h3>
          <div
            style={{
              ...cardStyle,
              display: "flex",
              alignItems: "center",
              gap: "16px",
              marginBottom: "32px",
              background: `linear-gradient(135deg, ${COLORS.card} 0%, #1E1710 100%)`,
              border: `1px solid ${COLORS.primary}33`,
            }}
          >
            <div style={{ fontSize: "28px" }}>🤖</div>
            <div style={{ flex: 1 }}>
              <div style={{ color: COLORS.text, fontSize: "14px", lineHeight: 1.6 }}>{aiSuggestion}</div>
              <button
                onClick={() => navigate("/ai-assistant")}
                style={{
                  marginTop: "12px",
                  backgroundColor: COLORS.primary,
                  color: "#FFFFFF",
                  border: "none",
                  borderRadius: "8px",
                  padding: "8px 16px",
                  fontSize: "13px",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Ask AI →
              </button>
            </div>
          </div>

          {/* Activity Timeline */}
          <h3 style={sectionTitleStyle}>📅 Activity Timeline</h3>
          <div style={{ ...cardStyle, marginBottom: "32px" }}>
            {[
              { label: "Today", items: activityTimeline.today },
              { label: "Yesterday", items: activityTimeline.yesterday },
              { label: "Last Week", items: activityTimeline.lastWeek },
            ].map((group) => (
              <div key={group.label} style={{ marginBottom: "20px" }}>
                <div style={{ fontSize: "13px", fontWeight: 700, color: COLORS.secondary, marginBottom: "10px" }}>
                  {group.label}
                </div>
                {group.items.length === 0 ? (
                  <div style={{ fontSize: "13px", color: COLORS.secondaryText, paddingLeft: "4px" }}>
                    No activity.
                  </div>
                ) : (
                  group.items.map((item) => (
                    <div
                      key={item.id}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "10px",
                        padding: "8px 0",
                        borderBottom: `1px solid ${COLORS.border}`,
                        fontSize: "13px",
                        color: COLORS.text,
                      }}
                    >
                      <span
                        style={{
                          width: "6px",
                          height: "6px",
                          borderRadius: "50%",
                          backgroundColor: COLORS.primary,
                          flexShrink: 0,
                        }}
                      />
                      <span style={{ flex: 1 }}>{item.text}</span>
                      <span style={{ color: COLORS.secondaryText, fontSize: "11px" }}>
                        {formatTimeAgo(item.created_at)}
                      </span>
                    </div>
                  ))
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            padding: "20px 40px",
            borderTop: `1px solid ${COLORS.border}`,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "12px",
          }}
        >
          <span style={{ color: COLORS.secondaryText, fontSize: "13px" }}>
            © {new Date().getFullYear()} LUMORA. All rights reserved.
          </span>
          <div style={{ display: "flex", gap: "20px" }}>
            <button
              onClick={() => navigate("/privacy")}
              style={{ background: "none", border: "none", color: COLORS.secondaryText, fontSize: "13px", cursor: "pointer" }}
            >
              Privacy
            </button>
            <button
              onClick={() => navigate("/terms")}
              style={{ background: "none", border: "none", color: COLORS.secondaryText, fontSize: "13px", cursor: "pointer" }}
            >
              Terms
            </button>
            <button
              onClick={() => navigate("/support")}
              style={{ background: "none", border: "none", color: COLORS.secondaryText, fontSize: "13px", cursor: "pointer" }}
            >
              Support
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;