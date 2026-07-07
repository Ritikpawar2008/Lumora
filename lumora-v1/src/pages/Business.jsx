import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { supabase } from "../../supabase";
import Sidebar from "./Sidebar";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;
const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY;

const GROQ_MODEL = "llama-3.3-70b-versatile";
const GROQ_ENDPOINT = "https://api.groq.com/openai/v1/chat/completions";



const TABLE = "business_canvas";

/* ============================================================
   THEME
   ============================================================ */
const THEME = {
  bg: "#090909",
  card: "#171717",
  cardAlt: "#141414",
  primary: "#C46A32",
  secondary: "#D4AF37",
  white: "#FFFFFF",
  textMuted: "#A1A1AA",
  border: "rgba(255,255,255,0.08)",
  borderStrong: "rgba(255,255,255,0.14)",
  danger: "#E5484D",
  success: "#3FB950",
  glass: "rgba(23,23,23,0.72)",
};

const GRADIENT = `linear-gradient(135deg, ${THEME.primary} 0%, ${THEME.secondary} 100%)`;

/* ============================================================
   CANVAS BLOCK DEFINITIONS
   ============================================================ */
const BLOCKS = [
  { key: "key_partners", label: "Key Partners", area: "partners", hint: "Who are your key partners & suppliers?" },
  { key: "key_activities", label: "Key Activities", area: "activities", hint: "What key activities does your value proposition require?" },
  { key: "value_proposition", label: "Value Proposition", area: "value", hint: "What value do you deliver to customers?" },
  { key: "customer_relationships", label: "Customer Relationships", area: "relationships", hint: "What relationship does each segment expect?" },
  { key: "customer_segments", label: "Customer Segments", area: "segments", hint: "Who are you creating value for?" },
  { key: "key_resources", label: "Key Resources", area: "resources", hint: "What key resources does your value proposition require?" },
  { key: "channels", label: "Channels", area: "channels", hint: "Through which channels do customers want to be reached?" },
  { key: "cost_structure", label: "Cost Structure", area: "cost", hint: "What are the most important costs in your model?" },
  { key: "revenue_streams", label: "Revenue Streams", area: "revenue", hint: "For what value are customers willing to pay?" },
];

const EMPTY_CANVAS = {
  id: null,
  startup_id: null,
  customer_segments: "",
  value_proposition: "",
  channels: "",
  customer_relationships: "",
  revenue_streams: "",
  key_resources: "",
  key_activities: "",
  key_partners: "",
  cost_structure: "",
};

/* ============================================================
   AI ACTIONS
   ============================================================ */
const AI_ACTIONS = [
  { id: "generate_complete", label: "Generate Complete Business Canvas", mode: "full" },
  { id: "improve_existing", label: "Improve Existing Canvas", mode: "full" },
  { id: "suggest_revenue", label: "Suggest Revenue Model", mode: "field", field: "revenue_streams" },
  { id: "suggest_pricing", label: "Suggest Pricing Strategy", mode: "field", field: "revenue_streams" },
  { id: "customer_persona", label: "Generate Customer Persona", mode: "insight" },
  { id: "market_strategy", label: "Generate Market Strategy", mode: "insight" },
  { id: "unique_value", label: "Generate Unique Value Proposition", mode: "field", field: "value_proposition" },
  { id: "business_risks", label: "Generate Business Risks", mode: "insight" },
  { id: "growth_plan", label: "Generate Growth Plan", mode: "insight" },
  { id: "go_to_market", label: "Generate Go-To-Market Strategy", mode: "insight" },
];

/* ============================================================
   HOOK — responsive breakpoint
   ============================================================ */
function useViewport() {
  const [width, setWidth] = useState(typeof window !== "undefined" ? window.innerWidth : 1440);
  useEffect(() => {
    const onResize = () => setWidth(window.innerWidth);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);
  return {
    width,
    isMobile: width < 768,
    isTablet: width >= 768 && width < 1180,
    isDesktop: width >= 1180,
  };
}

/* ============================================================
   GROQ HELPERS
   ============================================================ */
async function callGroq(systemPrompt, userPrompt, expectJSON) {
  if (!GROQ_API_KEY) {
    throw new Error("Groq API key is not configured. Set VITE_GROQ_API_KEY.");
  }
  const body = {
    model: GROQ_MODEL,
    temperature: 0.7,
    max_tokens: 2000,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
  };
  if (expectJSON) body.response_format = { type: "json_object" };

  const res = await fetch(GROQ_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${GROQ_API_KEY}`,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    throw new Error(`Groq API error (${res.status}): ${errText || res.statusText}`);
  }

  const data = await res.json();
  const content = data?.choices?.[0]?.message?.content;
  if (!content) throw new Error("Groq returned an empty response.");
  return content;
}

function buildFullCanvasPrompt(existing, isImprove) {
  const system = `You are a world-class startup strategist and business model expert. You always respond ONLY with strict JSON, no markdown, no commentary. The JSON object must contain exactly these keys as strings: customer_segments, value_proposition, channels, customer_relationships, revenue_streams, key_resources, key_activities, key_partners, cost_structure. Each value should be concise, actionable, formatted as short bullet lines separated by "\\n".`;
  const user = isImprove
    ? `Improve and enrich the following existing Business Model Canvas. Keep the same intent but make it sharper, more specific, and investor-ready.\n\n${JSON.stringify(existing, null, 2)}`
    : `Generate a complete, realistic, investor-ready Business Model Canvas for this startup idea:\n\n"${existing.startupIdea || "A modern SaaS startup"}"`;
  return { system, user };
}

function buildFieldPrompt(actionId, canvas) {
  const context = `Business context so far:\n${BLOCKS.map((b) => `${b.label}: ${canvas[b.key] || "N/A"}`).join("\n")}`;
  const map = {
    suggest_revenue: {
      system: "You are a monetization strategist. Respond with 4-6 concise bullet lines only, no preamble.",
      user: `${context}\n\nSuggest a strong revenue model (pricing tiers, monetization channels) as bullet lines separated by newlines.`,
    },
    suggest_pricing: {
      system: "You are a SaaS pricing strategist. Respond with 4-6 concise bullet lines only, no preamble.",
      user: `${context}\n\nSuggest a pricing strategy (tiers, price anchors, positioning) as bullet lines separated by newlines.`,
    },
    unique_value: {
      system: "You are a positioning expert. Respond with 3-5 concise bullet lines only, no preamble.",
      user: `${context}\n\nCraft a sharp, differentiated Unique Value Proposition as bullet lines separated by newlines.`,
    },
  };
  return map[actionId];
}

function buildInsightPrompt(actionId, canvas) {
  const context = `Business context:\n${BLOCKS.map((b) => `${b.label}: ${canvas[b.key] || "N/A"}`).join("\n")}`;
  const map = {
    customer_persona: {
      system: "You are a customer research expert. Respond in clean, well-structured plain text with short headers.",
      user: `${context}\n\nGenerate 1-2 detailed customer personas (name, age, role, goals, pain points, buying behavior).`,
    },
    market_strategy: {
      system: "You are a market strategy consultant. Respond in clean, well-structured plain text with short headers.",
      user: `${context}\n\nGenerate a market entry and positioning strategy.`,
    },
    business_risks: {
      system: "You are a risk analyst. Respond in clean, well-structured plain text with short headers.",
      user: `${context}\n\nIdentify the top business risks (market, financial, operational, competitive) with brief mitigation notes.`,
    },
    growth_plan: {
      system: "You are a growth advisor. Respond in clean, well-structured plain text with short headers.",
      user: `${context}\n\nGenerate a 12-month growth plan with phases and key milestones.`,
    },
    go_to_market: {
      system: "You are a GTM strategist. Respond in clean, well-structured plain text with short headers.",
      user: `${context}\n\nGenerate a Go-To-Market strategy including channels, launch sequence, and early traction tactics.`,
    },
  };
  return map[actionId];
}

/* ============================================================
   MAIN COMPONENT
   ============================================================ */
export default function BusinessCanvas() {
  const { isMobile, isTablet } = useViewport();

  const [canvasList, setCanvasList] = useState([]);
  const [listLoading, setListLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("newest");

  const [canvas, setCanvas] = useState(EMPTY_CANVAS);
  const [startupIdea, setStartupIdea] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [selectedAction, setSelectedAction] = useState(AI_ACTIONS[0].id);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiLoadingLabel, setAiLoadingLabel] = useState("");

  const [insight, setInsight] = useState({ open: false, title: "", content: "" });
  const [toast, setToast] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const toastTimer = useRef(null);

  const showToast = useCallback((message, type = "info") => {
    setToast({ message, type });
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 4200);
  }, []);

  /* ---------------- FETCH LIST ---------------- */
  const fetchCanvases = useCallback(async () => {
    setListLoading(true);
    try {
      if (!supabase) throw new Error("Supabase is not configured.");
      const { data, error } = await supabase
        .from(TABLE)
        .select("*")
        .order("created_at", { ascending: filter === "oldest" });
      if (error) throw error;
      setCanvasList(data || []);
    } catch (err) {
      console.error("fetchCanvases error:", err);
      showToast(err.message || "Failed to load saved canvases.", "error");
    } finally {
      setListLoading(false);
    }
  }, [filter, showToast]);

  useEffect(() => {
    fetchCanvases();
  }, [fetchCanvases]);

  /* ---------------- CRUD ---------------- */
  const handleSave = useCallback(async () => {
    setSaving(true);
    try {
      if (!supabase) throw new Error("Supabase is not configured.");
      const {
        data: { user },
      } = await supabase.auth.getUser();

      const payload = {
        user_id: user?.id || null,
        startup_id: canvas.startup_id,
        customer_segments: canvas.customer_segments,
        value_proposition: canvas.value_proposition,
        channels: canvas.channels,
        customer_relationships: canvas.customer_relationships,
        revenue_streams: canvas.revenue_streams,
        key_resources: canvas.key_resources,
        key_activities: canvas.key_activities,
        key_partners: canvas.key_partners,
        cost_structure: canvas.cost_structure,
      };

      const { data, error } = await supabase.from(TABLE).insert([payload]).select().single();
      if (error) throw error;
      setCanvas((prev) => ({ ...prev, id: data.id }));
      showToast("Canvas saved successfully.", "success");
      fetchCanvases();
    } catch (err) {
      console.error("handleSave error:", err);
      showToast(err.message || "Failed to save canvas.", "error");
    } finally {
      setSaving(false);
    }
  }, [canvas, fetchCanvases, showToast]);

  const handleUpdate = useCallback(async () => {
    if (!canvas.id) {
      showToast("Select or save a canvas first.", "error");
      return;
    }
    setSaving(true);
    try {
      if (!supabase) throw new Error("Supabase is not configured.");
      const payload = {
        customer_segments: canvas.customer_segments,
        value_proposition: canvas.value_proposition,
        channels: canvas.channels,
        customer_relationships: canvas.customer_relationships,
        revenue_streams: canvas.revenue_streams,
        key_resources: canvas.key_resources,
        key_activities: canvas.key_activities,
        key_partners: canvas.key_partners,
        cost_structure: canvas.cost_structure,
      };
      const { error } = await supabase.from(TABLE).update(payload).eq("id", canvas.id);
      if (error) throw error;
      showToast("Canvas updated successfully.", "success");
      fetchCanvases();
    } catch (err) {
      console.error("handleUpdate error:", err);
      showToast(err.message || "Failed to update canvas.", "error");
    } finally {
      setSaving(false);
    }
  }, [canvas, fetchCanvases, showToast]);

  const handleDelete = useCallback(
    async (id) => {
      const targetId = id || canvas.id;
      if (!targetId) {
        showToast("No canvas selected to delete.", "error");
        return;
      }
      if (!window.confirm("Delete this Business Canvas permanently?")) return;
      setDeleting(true);
      try {
        if (!supabase) throw new Error("Supabase is not configured.");
        const { error } = await supabase.from(TABLE).delete().eq("id", targetId);
        if (error) throw error;
        showToast("Canvas deleted.", "success");
        if (targetId === canvas.id) setCanvas(EMPTY_CANVAS);
        fetchCanvases();
      } catch (err) {
        console.error("handleDelete error:", err);
        showToast(err.message || "Failed to delete canvas.", "error");
      } finally {
        setDeleting(false);
      }
    },
    [canvas.id, fetchCanvases, showToast]
  );

  const handleClear = useCallback(() => {
    setCanvas(EMPTY_CANVAS);
    setStartupIdea("");
    showToast("Canvas cleared.", "info");
  }, [showToast]);

  const handleSelectCanvas = useCallback((item) => {
    setCanvas({ ...EMPTY_CANVAS, ...item });
    setSidebarOpen(false);
  }, []);

  const handleFieldChange = (key, value) => {
    setCanvas((prev) => ({ ...prev, [key]: value }));
  };

  /* ---------------- AI GENERATION ---------------- */
  const handleGenerateAI = useCallback(async () => {
    const action = AI_ACTIONS.find((a) => a.id === selectedAction);
    if (!action) return;

    setAiLoading(true);
    setAiLoadingLabel(action.label);
    try {
      if (action.mode === "full") {
        const isImprove = action.id === "improve_existing";
        if (isImprove) {
          const hasContent = BLOCKS.some((b) => (canvas[b.key] || "").trim().length > 0);
          if (!hasContent) {
            showToast("Add some content first, or use Generate Complete Canvas.", "error");
            setAiLoading(false);
            return;
          }
        }
        const { system, user } = buildFullCanvasPrompt({ ...canvas, startupIdea }, isImprove);
        const raw = await callGroq(system, user, true);
        const parsed = JSON.parse(raw);
        setCanvas((prev) => ({
          ...prev,
          customer_segments: parsed.customer_segments || prev.customer_segments,
          value_proposition: parsed.value_proposition || prev.value_proposition,
          channels: parsed.channels || prev.channels,
          customer_relationships: parsed.customer_relationships || prev.customer_relationships,
          revenue_streams: parsed.revenue_streams || prev.revenue_streams,
          key_resources: parsed.key_resources || prev.key_resources,
          key_activities: parsed.key_activities || prev.key_activities,
          key_partners: parsed.key_partners || prev.key_partners,
          cost_structure: parsed.cost_structure || prev.cost_structure,
        }));
        showToast("AI generated your business canvas.", "success");
      } else if (action.mode === "field") {
        const prompt = buildFieldPrompt(action.id, canvas);
        const raw = await callGroq(prompt.system, prompt.user, false);
        setCanvas((prev) => ({ ...prev, [action.field]: raw.trim() }));
        showToast(`${action.label} generated.`, "success");
      } else {
        const prompt = buildInsightPrompt(action.id, canvas);
        const raw = await callGroq(prompt.system, prompt.user, false);
        setInsight({ open: true, title: action.label, content: raw.trim() });
      }
    } catch (err) {
      console.error("handleGenerateAI error:", err);
      showToast(err.message || "AI generation failed. Please try again.", "error");
    } finally {
      setAiLoading(false);
      setAiLoadingLabel("");
    }
  }, [selectedAction, canvas, startupIdea, showToast]);

  const handleExportPDF = useCallback(() => {
    try {
      window.print();
    } catch (err) {
      console.error("handleExportPDF error:", err);
      showToast("Export failed.", "error");
    }
  }, [showToast]);

  /* ---------------- DERIVED LIST ---------------- */
  const filteredList = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return canvasList;
    return canvasList.filter((item) => {
      const haystack = BLOCKS.map((b) => item[b.key] || "").join(" ").toLowerCase();
      return haystack.includes(term);
    });
  }, [canvasList, search]);

  /* ============================================================
     STYLES
     ============================================================ */
  const styles = getStyles(isMobile, isTablet);

  return (
    <div style={styles.page}>
      <style>{GLOBAL_KEYFRAMES}</style>

      {/* MOBILE TOP BAR */}
      {isMobile && (
        <div style={styles.mobileTopBar}>
          <div style={styles.logoWrap}>
            <div style={styles.logoMark}>L</div>
            <span style={styles.logoText}>LUMORA</span>
          </div>
          <button style={styles.iconBtn} onClick={() => setSidebarOpen((s) => !s)} aria-label="Toggle sidebar">
            <BurgerIcon />
          </button>
        </div>
      )}

      <div style={styles.shell}>
        {/* ================= SIDEBAR ================= */}
        {(!isMobile || sidebarOpen) && (
          <aside style={styles.sidebar}>
            {!isMobile && (
              <div style={styles.logoWrap}>
                <div style={styles.logoMark}>L</div>
                <div>
                  <div style={styles.logoText}>LUMORA</div>
                  <div style={styles.logoTagline}>Build Brands. Launch Faster.</div>
                </div>
              </div>
            )}

            <div style={styles.navSection}>
              <div style={styles.navItemActive}>
                <GridIcon /> <span>Business Canvas</span>
              </div>
            </div>

            <div style={styles.sidebarDivider} />

            <div style={styles.sidebarLabel}>Search Saved Canvas</div>
            <div style={styles.searchWrap}>
              <SearchIcon />
              <input
                style={styles.searchInput}
                placeholder="Search canvas..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <div style={styles.filterRow}>
              <button
                style={filter === "newest" ? styles.filterChipActive : styles.filterChip}
                onClick={() => setFilter("newest")}
              >
                Newest
              </button>
              <button
                style={filter === "oldest" ? styles.filterChipActive : styles.filterChip}
                onClick={() => setFilter("oldest")}
              >
                Oldest
              </button>
            </div>

            <div style={styles.sidebarLabel}>Recent Canvas</div>
            <div style={styles.recentList}>
              {listLoading ? (
                <div style={styles.mutedSmall}>Loading canvases...</div>
              ) : filteredList.length === 0 ? (
                <div style={styles.emptySidebar}>
                  <div style={styles.emptySidebarTitle}>No Business Canvas Found</div>
                  <div style={styles.emptySidebarSub}>Create your first Business Model Canvas.</div>
                </div>
              ) : (
                filteredList.map((item) => (
                  <div
                    key={item.id}
                    style={{
                      ...styles.recentItem,
                      ...(canvas.id === item.id ? styles.recentItemActive : {}),
                    }}
                    onClick={() => handleSelectCanvas(item)}
                  >
                    <div style={styles.recentItemTitle}>
                      {(item.value_proposition || "Untitled Canvas").slice(0, 34) || "Untitled Canvas"}
                      {(item.value_proposition || "").length > 34 ? "…" : ""}
                    </div>
                    <div style={styles.recentItemDate}>
                      {item.created_at ? new Date(item.created_at).toLocaleDateString() : "—"}
                    </div>
                    <button
                      style={styles.recentDeleteBtn}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(item.id);
                      }}
                      aria-label="Delete canvas"
                    >
                      <TrashIcon size={13} />
                    </button>
                  </div>
                ))
              )}
            </div>
          </aside>
        )}

        {/* ================= MAIN WORKSPACE ================= */}
        <main style={styles.main}>
          <div style={styles.header}>
            <div>
              <h1 style={styles.headerTitle}>Business Canvas</h1>
              <p style={styles.headerSubtitle}>Build your complete startup business model with AI.</p>
            </div>
            <div style={styles.headerActions}>
              <button style={styles.ghostBtn} onClick={handleExportPDF}>
                <DownloadIcon /> Export PDF
              </button>
              <button style={styles.ghostBtn} onClick={handleClear}>
                <ClearIcon /> Clear Canvas
              </button>
            </div>
          </div>

          {/* AI TOOLBAR */}
          <div style={styles.aiBar}>
            <div style={styles.aiBarLeft}>
              <input
                style={styles.ideaInput}
                placeholder="Describe your startup idea (used for full generation)..."
                value={startupIdea}
                onChange={(e) => setStartupIdea(e.target.value)}
              />
              <select
                style={styles.select}
                value={selectedAction}
                onChange={(e) => setSelectedAction(e.target.value)}
              >
                {AI_ACTIONS.map((a) => (
                  <option key={a.id} value={a.id} style={{ background: THEME.card }}>
                    {a.label}
                  </option>
                ))}
              </select>
            </div>
            <button style={styles.primaryBtn} onClick={handleGenerateAI} disabled={aiLoading}>
              {aiLoading ? <MiniSpinner /> : <SparkleIcon />}
              {aiLoading ? "Generating..." : "Generate with AI"}
            </button>
          </div>

          {/* AI LOADING OVERLAY */}
          {aiLoading && (
            <div style={styles.aiOverlay}>
              <div style={styles.aiOverlayCard}>
                <div style={styles.aiPulseRing}>
                  <div style={styles.aiPulseCore} />
                </div>
                <div style={styles.aiOverlayTitle}>Crafting your canvas</div>
                <div style={styles.aiOverlaySub}>{aiLoadingLabel}...</div>
              </div>
            </div>
          )}

          {/* CANVAS GRID */}
          <div style={styles.canvasGrid}>
            {BLOCKS.map((block) => (
              <div key={block.key} style={{ ...styles.blockCard, gridArea: block.area }}>
                <div style={styles.blockHeader}>
                  <span style={styles.blockTitle}>{block.label}</span>
                  <span style={styles.blockDot} />
                </div>
                <textarea
                  style={styles.blockTextarea}
                  placeholder={block.hint}
                  value={canvas[block.key] || ""}
                  onChange={(e) => handleFieldChange(block.key, e.target.value)}
                />
              </div>
            ))}
          </div>

          {/* ACTION BAR */}
          <div style={styles.footerActions}>
            <button style={styles.primaryBtn} onClick={handleSave} disabled={saving}>
              {saving ? <MiniSpinner /> : <SaveIcon />}
              {saving ? "Saving..." : "Save Canvas"}
            </button>
            <button style={styles.secondaryBtn} onClick={handleUpdate} disabled={saving || !canvas.id}>
              <UpdateIcon /> Update Canvas
            </button>
            <button
              style={styles.dangerBtn}
              onClick={() => handleDelete()}
              disabled={deleting || !canvas.id}
            >
              {deleting ? <MiniSpinner /> : <TrashIcon />}
              {deleting ? "Deleting..." : "Delete Canvas"}
            </button>
          </div>
        </main>
      </div>

      {/* INSIGHT MODAL */}
      {insight.open && (
        <div style={styles.modalOverlay} onClick={() => setInsight({ open: false, title: "", content: "" })}>
          <div style={styles.modalCard} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <div style={styles.modalTitle}>{insight.title}</div>
              <button
                style={styles.iconBtn}
                onClick={() => setInsight({ open: false, title: "", content: "" })}
                aria-label="Close"
              >
                <CloseIcon />
              </button>
            </div>
            <div style={styles.modalBody}>
              {insight.content.split("\n").map((line, idx) => (
                <p key={idx} style={styles.modalLine}>
                  {line}
                </p>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TOAST */}
      {toast && (
        <div
          style={{
            ...styles.toast,
            borderColor:
              toast.type === "error" ? THEME.danger : toast.type === "success" ? THEME.success : THEME.borderStrong,
          }}
        >
          <span
            style={{
              ...styles.toastDot,
              background: toast.type === "error" ? THEME.danger : toast.type === "success" ? THEME.success : THEME.secondary,
            }}
          />
          {toast.message}
        </div>
      )}
    </div>
  );
}

/* ============================================================
   ICONS (inline SVG, no deps)
   ============================================================ */
const iconProps = (size, color) => ({
  width: size,
  height: size,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: color,
  strokeWidth: 1.8,
  strokeLinecap: "round",
  strokeLinejoin: "round",
});

function GridIcon() {
  return (
    <svg {...iconProps(17, THEME.secondary)}>
      <rect x="3" y="3" width="7" height="7" rx="1.5" />
      <rect x="14" y="3" width="7" height="7" rx="1.5" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" />
      <rect x="14" y="14" width="7" height="7" rx="1.5" />
    </svg>
  );
}
function SearchIcon() {
  return (
    <svg {...iconProps(15, THEME.textMuted)}>
      <circle cx="11" cy="11" r="7" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}
function SparkleIcon() {
  return (
    <svg {...iconProps(16, "#0A0A0A")}>
      <path d="M12 2l1.8 5.2L19 9l-5.2 1.8L12 16l-1.8-5.2L5 9l5.2-1.8L12 2z" fill="#0A0A0A" stroke="none" />
    </svg>
  );
}
function SaveIcon() {
  return (
    <svg {...iconProps(16, "#0A0A0A")}>
      <path d="M5 3h11l3 3v15H5V3z" />
      <path d="M8 3v6h8V3" />
      <path d="M8 21v-8h8v8" />
    </svg>
  );
}
function UpdateIcon() {
  return (
    <svg {...iconProps(16, THEME.secondary)}>
      <path d="M21 12a9 9 0 1 1-3-6.7" />
      <path d="M21 3v6h-6" />
    </svg>
  );
}
function TrashIcon({ size = 16 }) {
  return (
    <svg {...iconProps(size, THEME.danger)}>
      <path d="M3 6h18" />
      <path d="M8 6V4h8v2" />
      <path d="M19 6l-1 14H6L5 6" />
    </svg>
  );
}
function ClearIcon() {
  return (
    <svg {...iconProps(15, THEME.textMuted)}>
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  );
}
function DownloadIcon() {
  return (
    <svg {...iconProps(15, THEME.textMuted)}>
      <path d="M12 3v12" />
      <path d="M7 10l5 5 5-5" />
      <path d="M5 21h14" />
    </svg>
  );
}
function CloseIcon() {
  return (
    <svg {...iconProps(16, THEME.textMuted)}>
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  );
}
function BurgerIcon() {
  return (
    <svg {...iconProps(20, THEME.white)}>
      <path d="M4 6h16" />
      <path d="M4 12h16" />
      <path d="M4 18h16" />
    </svg>
  );
}
function MiniSpinner() {
  return (
    <span
      style={{
        width: 14,
        height: 14,
        borderRadius: "50%",
        border: "2px solid rgba(0,0,0,0.25)",
        borderTopColor: "#0A0A0A",
        display: "inline-block",
        animation: "lumora-spin 0.7s linear infinite",
      }}
    />
  );
}

/* ============================================================
   GLOBAL KEYFRAMES (scoped via <style> tag)
   ============================================================ */
const GLOBAL_KEYFRAMES = `
@keyframes lumora-spin { to { transform: rotate(360deg); } }
@keyframes lumora-pulse {
  0% { transform: scale(0.85); opacity: 0.9; }
  70% { transform: scale(1.5); opacity: 0; }
  100% { transform: scale(1.5); opacity: 0; }
}
@keyframes lumora-fade-in { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
@keyframes lumora-toast-in { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
textarea::placeholder, input::placeholder { color: #6B6B70; }
* { box-sizing: border-box; }
::-webkit-scrollbar { width: 8px; height: 8px; }
::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.12); border-radius: 8px; }
::-webkit-scrollbar-track { background: transparent; }
`;

/* ============================================================
   STYLE FACTORY
   ============================================================ */
function getStyles(isMobile, isTablet) {
  const sidebarWidth = isTablet ? 240 : 288;

  return {
    page: {
      minHeight: "100vh",
      width: "100%",
      background: `radial-gradient(1200px 600px at 15% -10%, rgba(196,106,50,0.10), transparent), radial-gradient(1000px 500px at 100% 0%, rgba(212,175,55,0.06), transparent), ${THEME.bg}`,
      color: THEME.white,
      fontFamily:
        "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
      display: "flex",
      flexDirection: "column",
    },
    mobileTopBar: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "14px 18px",
      borderBottom: `1px solid ${THEME.border}`,
      position: "sticky",
      top: 0,
      background: "rgba(9,9,9,0.9)",
      backdropFilter: "blur(12px)",
      zIndex: 40,
    },
    shell: {
      display: "flex",
      flexDirection: isMobile ? "column" : "row",
      flex: 1,
      width: "100%",
    },
    sidebar: {
      width: isMobile ? "100%" : sidebarWidth,
      minWidth: isMobile ? "100%" : sidebarWidth,
      background: THEME.card,
      borderRight: isMobile ? "none" : `1px solid ${THEME.border}`,
      borderBottom: isMobile ? `1px solid ${THEME.border}` : "none",
      padding: "26px 20px",
      display: "flex",
      flexDirection: "column",
      gap: 18,
      position: isMobile ? "relative" : "sticky",
      top: 0,
      height: isMobile ? "auto" : "100vh",
      overflowY: "auto",
      animation: "lumora-fade-in 0.35s ease",
    },
    logoWrap: { display: "flex", alignItems: "center", gap: 12 },
    logoMark: {
      width: 38,
      height: 38,
      borderRadius: 11,
      background: GRADIENT,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontWeight: 800,
      fontSize: 18,
      color: "#0A0A0A",
      flexShrink: 0,
      boxShadow: "0 6px 18px rgba(196,106,50,0.35)",
    },
    logoText: { fontSize: 17, fontWeight: 700, letterSpacing: 0.4, color: THEME.white },
    logoTagline: { fontSize: 11.5, color: THEME.textMuted, marginTop: 2 },
    navSection: { marginTop: 6, display: "flex", flexDirection: "column", gap: 6 },
    navItemActive: {
      display: "flex",
      alignItems: "center",
      gap: 10,
      padding: "11px 14px",
      borderRadius: 12,
      background: "rgba(196,106,50,0.14)",
      border: `1px solid rgba(196,106,50,0.35)`,
      color: THEME.white,
      fontSize: 13.5,
      fontWeight: 600,
    },
    sidebarDivider: { height: 1, background: THEME.border, margin: "4px 0" },
    sidebarLabel: {
      fontSize: 11,
      textTransform: "uppercase",
      letterSpacing: 1,
      color: THEME.textMuted,
      fontWeight: 700,
      marginBottom: -6,
    },
    searchWrap: {
      display: "flex",
      alignItems: "center",
      gap: 8,
      background: THEME.cardAlt,
      border: `1px solid ${THEME.border}`,
      borderRadius: 12,
      padding: "10px 12px",
    },
    searchInput: {
      background: "transparent",
      border: "none",
      outline: "none",
      color: THEME.white,
      fontSize: 13,
      width: "100%",
    },
    filterRow: { display: "flex", gap: 8 },
    filterChip: {
      flex: 1,
      padding: "8px 10px",
      borderRadius: 10,
      border: `1px solid ${THEME.border}`,
      background: "transparent",
      color: THEME.textMuted,
      fontSize: 12.5,
      fontWeight: 600,
      cursor: "pointer",
    },
    filterChipActive: {
      flex: 1,
      padding: "8px 10px",
      borderRadius: 10,
      border: `1px solid rgba(212,175,55,0.5)`,
      background: "rgba(212,175,55,0.14)",
      color: THEME.secondary,
      fontSize: 12.5,
      fontWeight: 700,
      cursor: "pointer",
    },
    recentList: {
      display: "flex",
      flexDirection: "column",
      gap: 8,
      overflowY: "auto",
      maxHeight: isMobile ? 260 : "100%",
      paddingRight: 2,
    },
    recentItem: {
      position: "relative",
      padding: "10px 34px 10px 12px",
      borderRadius: 12,
      background: THEME.cardAlt,
      border: `1px solid ${THEME.border}`,
      cursor: "pointer",
      transition: "border-color 0.2s ease",
    },
    recentItemActive: {
      border: `1px solid rgba(196,106,50,0.55)`,
      background: "rgba(196,106,50,0.08)",
    },
    recentItemTitle: { fontSize: 12.8, color: THEME.white, fontWeight: 600, marginBottom: 3 },
    recentItemDate: { fontSize: 11, color: THEME.textMuted },
    recentDeleteBtn: {
      position: "absolute",
      right: 8,
      top: "50%",
      transform: "translateY(-50%)",
      background: "transparent",
      border: "none",
      cursor: "pointer",
      padding: 4,
      borderRadius: 6,
      display: "flex",
    },
    mutedSmall: { fontSize: 12.5, color: THEME.textMuted },
    emptySidebar: {
      padding: "22px 12px",
      borderRadius: 12,
      border: `1px dashed ${THEME.border}`,
      textAlign: "center",
    },
    emptySidebarTitle: { fontSize: 13, fontWeight: 700, color: THEME.white, marginBottom: 4 },
    emptySidebarSub: { fontSize: 11.5, color: THEME.textMuted, lineHeight: 1.5 },

    main: {
      flex: 1,
      padding: isMobile ? "20px 16px 60px" : isTablet ? "32px 28px 60px" : "40px 46px 70px",
      overflowY: "auto",
      position: "relative",
    },
    header: {
      display: "flex",
      flexDirection: isMobile ? "column" : "row",
      alignItems: isMobile ? "flex-start" : "center",
      justifyContent: "space-between",
      gap: 16,
      marginBottom: 26,
    },
    headerTitle: {
      fontSize: isMobile ? 24 : 30,
      fontWeight: 800,
      margin: 0,
      background: GRADIENT,
      WebkitBackgroundClip: "text",
      WebkitTextFillColor: "transparent",
      backgroundClip: "text",
      letterSpacing: -0.4,
    },
    headerSubtitle: { fontSize: 14, color: THEME.textMuted, marginTop: 6 },
    headerActions: { display: "flex", gap: 10, flexWrap: "wrap" },

    aiBar: {
      display: "flex",
      flexDirection: isMobile ? "column" : "row",
      alignItems: isMobile ? "stretch" : "center",
      justifyContent: "space-between",
      gap: 12,
      background: THEME.glass,
      backdropFilter: "blur(18px)",
      border: `1px solid ${THEME.border}`,
      borderRadius: 18,
      padding: 16,
      marginBottom: 22,
    },
    aiBarLeft: { display: "flex", flexDirection: isMobile ? "column" : "row", gap: 10, flex: 1 },
    ideaInput: {
      flex: 1,
      minWidth: isMobile ? "auto" : 260,
      background: THEME.cardAlt,
      border: `1px solid ${THEME.border}`,
      borderRadius: 12,
      padding: "11px 14px",
      color: THEME.white,
      fontSize: 13.5,
      outline: "none",
    },
    select: {
      background: THEME.cardAlt,
      border: `1px solid ${THEME.border}`,
      borderRadius: 12,
      padding: "11px 14px",
      color: THEME.white,
      fontSize: 13,
      outline: "none",
      minWidth: isMobile ? "auto" : 240,
      cursor: "pointer",
    },

    primaryBtn: {
      display: "inline-flex",
      alignItems: "center",
      gap: 8,
      background: GRADIENT,
      color: "#0A0A0A",
      border: "none",
      borderRadius: 12,
      padding: "12px 20px",
      fontSize: 13.5,
      fontWeight: 700,
      cursor: "pointer",
      boxShadow: "0 8px 20px rgba(196,106,50,0.28)",
      whiteSpace: "nowrap",
    },
    secondaryBtn: {
      display: "inline-flex",
      alignItems: "center",
      gap: 8,
      background: "rgba(212,175,55,0.12)",
      color: THEME.secondary,
      border: `1px solid rgba(212,175,55,0.4)`,
      borderRadius: 12,
      padding: "12px 20px",
      fontSize: 13.5,
      fontWeight: 700,
      cursor: "pointer",
      whiteSpace: "nowrap",
    },
    dangerBtn: {
      display: "inline-flex",
      alignItems: "center",
      gap: 8,
      background: "rgba(229,72,77,0.10)",
      color: THEME.danger,
      border: `1px solid rgba(229,72,77,0.35)`,
      borderRadius: 12,
      padding: "12px 20px",
      fontSize: 13.5,
      fontWeight: 700,
      cursor: "pointer",
      whiteSpace: "nowrap",
    },
    ghostBtn: {
      display: "inline-flex",
      alignItems: "center",
      gap: 7,
      background: "transparent",
      color: THEME.textMuted,
      border: `1px solid ${THEME.border}`,
      borderRadius: 12,
      padding: "10px 16px",
      fontSize: 12.8,
      fontWeight: 600,
      cursor: "pointer",
      whiteSpace: "nowrap",
    },
    iconBtn: {
      background: "transparent",
      border: `1px solid ${THEME.border}`,
      borderRadius: 10,
      width: 34,
      height: 34,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      cursor: "pointer",
    },

    aiOverlay: {
      position: "fixed",
      inset: 0,
      background: "rgba(9,9,9,0.72)",
      backdropFilter: "blur(6px)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 80,
    },
    aiOverlayCard: {
      background: THEME.card,
      border: `1px solid ${THEME.borderStrong}`,
      borderRadius: 22,
      padding: "40px 50px",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      gap: 14,
      boxShadow: "0 30px 80px rgba(0,0,0,0.55)",
    },
    aiPulseRing: {
      width: 64,
      height: 64,
      borderRadius: "50%",
      border: `2px solid ${THEME.secondary}`,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      position: "relative",
    },
    aiPulseCore: {
      width: 26,
      height: 26,
      borderRadius: "50%",
      background: GRADIENT,
      animation: "lumora-pulse 1.4s ease-out infinite",
    },
    aiOverlayTitle: { fontSize: 16, fontWeight: 700, color: THEME.white, marginTop: 4 },
    aiOverlaySub: { fontSize: 12.8, color: THEME.textMuted },

    canvasGrid: {
      display: "grid",
      gridTemplateColumns: isMobile ? "1fr" : "repeat(5, 1fr)",
      gridTemplateAreas: isMobile
        ? `"partners" "activities" "value" "relationships" "segments" "resources" "channels" "cost" "revenue"`
        : isTablet
        ? `"partners partners activities activities value" "partners partners resources resources value" "relationships relationships segments segments value" "channels channels channels channels channels" "cost cost cost revenue revenue"`
        : `"partners activities value relationships segments" "partners resources value channels segments" "cost cost revenue revenue revenue"`,
      gap: 14,
      marginBottom: 26,
    },
    blockCard: {
      background: THEME.card,
      border: `1px solid ${THEME.border}`,
      borderRadius: 18,
      padding: 16,
      display: "flex",
      flexDirection: "column",
      gap: 10,
      minHeight: 150,
      backdropFilter: "blur(10px)",
      transition: "border-color 0.25s ease, transform 0.25s ease",
    },
    blockHeader: { display: "flex", alignItems: "center", justifyContent: "space-between" },
    blockTitle: { fontSize: 13, fontWeight: 700, color: THEME.secondary, letterSpacing: 0.2 },
    blockDot: { width: 7, height: 7, borderRadius: "50%", background: THEME.primary, opacity: 0.7 },
    blockTextarea: {
      flex: 1,
      minHeight: 100,
      resize: "vertical",
      background: THEME.cardAlt,
      border: `1px solid ${THEME.border}`,
      borderRadius: 12,
      padding: "10px 12px",
      color: THEME.white,
      fontSize: 12.8,
      lineHeight: 1.55,
      outline: "none",
      fontFamily: "inherit",
    },

    footerActions: {
      display: "flex",
      flexWrap: "wrap",
      gap: 12,
      borderTop: `1px solid ${THEME.border}`,
      paddingTop: 22,
    },

    modalOverlay: {
      position: "fixed",
      inset: 0,
      background: "rgba(0,0,0,0.6)",
      backdropFilter: "blur(4px)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 90,
      padding: 20,
    },
    modalCard: {
      width: "min(640px, 100%)",
      maxHeight: "80vh",
      overflowY: "auto",
      background: THEME.card,
      border: `1px solid ${THEME.borderStrong}`,
      borderRadius: 20,
      padding: 22,
      boxShadow: "0 30px 90px rgba(0,0,0,0.55)",
      animation: "lumora-fade-in 0.25s ease",
    },
    modalHeader: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 14,
    },
    modalTitle: { fontSize: 16, fontWeight: 700, color: THEME.secondary },
    modalBody: { display: "flex", flexDirection: "column", gap: 4 },
    modalLine: { fontSize: 13, color: THEME.white, lineHeight: 1.65, margin: 0 },

    toast: {
      position: "fixed",
      bottom: 24,
      left: "50%",
      transform: "translateX(-50%)",
      background: THEME.card,
      border: `1px solid ${THEME.borderStrong}`,
      borderRadius: 12,
      padding: "12px 18px",
      fontSize: 13,
      color: THEME.white,
      display: "flex",
      alignItems: "center",
      gap: 10,
      boxShadow: "0 20px 50px rgba(0,0,0,0.5)",
      zIndex: 100,
      animation: "lumora-toast-in 0.25s ease",
      maxWidth: "90vw",
    },
    toastDot: { width: 8, height: 8, borderRadius: "50%", flexShrink: 0 },
  };
}