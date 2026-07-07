import React, { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "../../supabase";
import Sidebar from "./Sidebar";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;
const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY;

const GROQ_MODEL = "llama-3.3-70b-versatile";
const GROQ_ENDPOINT = "https://api.groq.com/openai/v1/chat/completions";



/* --------------------------------- THEME --------------------------------- */

const THEME = {
  bg: "#090909",
  card: "#171717",
  cardAlt: "#1D1D1D",
  primary: "#C46A32",
  primaryDim: "rgba(196, 106, 50, 0.16)",
  secondary: "#D4AF37",
  secondaryDim: "rgba(212, 175, 55, 0.16)",
  white: "#F5F5F5",
  textSecondary: "#A1A1AA",
  border: "rgba(245, 245, 245, 0.08)",
  borderStrong: "rgba(245, 245, 245, 0.14)",
  danger: "#E5484D",
  glass: "rgba(23, 23, 23, 0.6)",
};

const FONT_DISPLAY = "'Playfair Display', Georgia, 'Times New Roman', serif";
const FONT_BODY =
  "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";

/* ------------------------------ KEYFRAMES -------------------------------- */
/* A single injected <style> tag limited to @keyframes / scrollbar styling.
   No Tailwind, no utility classes — every layout & color rule below is
   still authored as inline style objects. */

const KEYFRAMES = `
@keyframes lumora-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
@keyframes lumora-spin-rev { from { transform: rotate(360deg); } to { transform: rotate(0deg); } }
@keyframes lumora-pulse { 0%, 100% { opacity: 0.55; transform: scale(1); } 50% { opacity: 1; transform: scale(1.08); } }
@keyframes lumora-fade-up { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
@keyframes lumora-fade-in { from { opacity: 0; } to { opacity: 1; } }
@keyframes lumora-shimmer { 0% { background-position: -400px 0; } 100% { background-position: 400px 0; } }
@keyframes lumora-glow { 0%, 100% { box-shadow: 0 0 0 0 rgba(196,106,50,0.0); } 50% { box-shadow: 0 0 24px 2px rgba(196,106,50,0.25); } }
* { box-sizing: border-box; }
.lumora-root ::-webkit-scrollbar { width: 8px; height: 8px; }
.lumora-root ::-webkit-scrollbar-track { background: transparent; }
.lumora-root ::-webkit-scrollbar-thumb { background: rgba(245,245,245,0.12); border-radius: 8px; }
.lumora-root ::-webkit-scrollbar-thumb:hover { background: rgba(196,106,50,0.5); }
.lumora-root textarea:focus, .lumora-root input:focus { outline: none; }
.lumora-root button { font-family: inherit; }
`;

/* ------------------------------ FIELD CONFIG ------------------------------ */

const FIELD_DEFS = [
  { key: "brand_name", label: "Brand Name", type: "input", ai: "brand_name", placeholder: "e.g. Nimbus Labs" },
  { key: "tagline", label: "Tagline", type: "input", ai: "tagline", placeholder: "A short, memorable line" },
  { key: "mission", label: "Mission", type: "textarea", ai: "mission", placeholder: "Why does this company exist?" },
  { key: "vision", label: "Vision", type: "textarea", ai: "vision", placeholder: "Where is this company headed?" },
  { key: "story", label: "Brand Story", type: "textarea", ai: "story", placeholder: "The narrative behind the brand" },
  { key: "values", label: "Core Values", type: "textarea", ai: "values", placeholder: "Comma-separated core values" },
  { key: "target_audience", label: "Target Audience", type: "textarea", ai: "target_audience", placeholder: "Who is this brand for?" },
  { key: "personality", label: "Brand Personality", type: "input", ai: "personality", placeholder: "e.g. Bold, Warm, Precise" },
  { key: "color_palette", label: "Color Palette", type: "input", ai: "color_palette", placeholder: "#C46A32, #D4AF37, #090909" },
  { key: "typography", label: "Typography Suggestions", type: "input", ai: "typography", placeholder: "Display + body pairing", ephemeral: true },
  { key: "logo_prompt", label: "Logo Prompt Generator", type: "textarea", ai: "logo_prompt", placeholder: "Prompt for an AI logo generator" },
];

const AI_QUICK_ACTIONS = [
  { key: "usp", label: "Generate USP", ephemeral: true },
  { key: "elevator_pitch", label: "Generate Elevator Pitch", ephemeral: true },
  { key: "brand_voice", label: "Generate Brand Voice", ephemeral: true },
];

const EMPTY_BRAND = {
  brand_name: "",
  tagline: "",
  mission: "",
  vision: "",
  story: "",
  values: "",
  target_audience: "",
  personality: "",
  color_palette: "",
  logo_prompt: "",
};

const EMPTY_EPHEMERAL = {
  typography: "",
  usp: "",
  elevator_pitch: "",
  brand_voice: "",
};

/* --------------------------------- GROQ ----------------------------------- */

async function generateWithGroq(fieldKey, brand) {
  if (!GROQ_API_KEY) {
    throw new Error(
      "Missing Groq API key. Set VITE_GROQ_API_KEY in your environment."
    );
  }

  const context = `
Brand Name: ${brand.brand_name || "(not set)"}
Tagline: ${brand.tagline || "(not set)"}
Mission: ${brand.mission || "(not set)"}
Vision: ${brand.vision || "(not set)"}
Brand Story: ${brand.story || "(not set)"}
Core Values: ${brand.values || "(not set)"}
Target Audience: ${brand.target_audience || "(not set)"}
Brand Personality: ${brand.personality || "(not set)"}
`.trim();

  const PROMPTS = {
    brand_name: "Suggest one striking, ownable startup brand name. Reply with just the name, no quotes, no punctuation, no explanation.",
    tagline: "Write one short, premium tagline (max 8 words) for this brand. Reply with just the tagline, no quotes.",
    mission: "Write a concise, compelling mission statement (2-3 sentences) for this brand.",
    vision: "Write a concise, inspiring vision statement (2-3 sentences) for this brand's future.",
    story: "Write a short brand story (3-4 sentences) that explains the origin and purpose of this brand in a compelling narrative voice.",
    values: "List 4-5 core values for this brand as a single comma-separated line. No numbering, no explanation.",
    target_audience: "Describe the ideal target audience for this brand in 2-3 sentences: demographics, mindset, and needs.",
    personality: "Describe this brand's personality in 3-5 adjectives as a single comma-separated line. No explanation.",
    color_palette: "Suggest a 4-5 color brand palette as hex codes only, comma-separated (e.g. #111111, #C46A32, #D4AF37, #F5F5F5). No names, no explanation.",
    typography: "Suggest a display font and a body font pairing for this brand in the format 'Display: X / Body: Y'. One line only, no explanation.",
    logo_prompt: "Write a single, vivid AI image-generation prompt (2-3 sentences) for designing this brand's logo mark. Describe style, shapes, and mood only.",
    usp: "Write a single, sharp unique selling proposition (1-2 sentences) for this brand.",
    elevator_pitch: "Write a compelling 30-second elevator pitch (3-4 sentences) for this brand.",
    brand_voice: "Describe this brand's tone of voice in 2-3 sentences, with 3 example phrases it might use.",
  };

  const systemPrompt =
    "You are an elite brand strategist and copywriter for premium startups. You write with precision, restraint, and confidence. Never use markdown, asterisks, or quotation marks in your output. Never add preamble or explanation — output only the requested content.";

  const userPrompt = `${PROMPTS[fieldKey]}\n\nBrand context so far:\n${context}`;

  const response = await fetch(GROQ_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model: GROQ_MODEL,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.85,
      max_tokens: 300,
    }),
  });

  if (!response.ok) {
    const errText = await response.text().catch(() => "");
    throw new Error(`Groq API error (${response.status}): ${errText || "request failed"}`);
  }

  const data = await response.json();
  const content = data?.choices?.[0]?.message?.content;
  if (!content) throw new Error("Groq API returned an empty response.");
  return content.trim().replace(/^["']|["']$/g, "");
}

/* -------------------------------- SUPABASE -------------------------------- */

async function fetchBrands(userId) {
  if (!supabase) throw new Error("Supabase is not configured.");
  const { data, error } = await supabase
    .from("brand_studio")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data || [];
}

async function insertBrand(payload) {
  if (!supabase) throw new Error("Supabase is not configured.");
  const { data, error } = await supabase.from("brand_studio").insert([payload]).select();
  if (error) throw error;
  return data?.[0];
}

async function updateBrandRow(id, payload) {
  if (!supabase) throw new Error("Supabase is not configured.");
  const { data, error } = await supabase
    .from("brand_studio")
    .update(payload)
    .eq("id", id)
    .select();
  if (error) throw error;
  return data?.[0];
}

async function deleteBrandRow(id) {
  if (!supabase) throw new Error("Supabase is not configured.");
  const { error } = await supabase.from("brand_studio").delete().eq("id", id);
  if (error) throw error;
  return true;
}

/* --------------------------------- HELPERS -------------------------------- */

function parsePalette(str) {
  if (!str) return [];
  return str
    .split(",")
    .map((s) => s.trim())
    .filter((s) => /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/.test(s))
    .slice(0, 6);
}

function parseTags(str) {
  if (!str) return [];
  return str
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 8);
}

function initials(name) {
  if (!name) return "LB";
  const parts = name.trim().split(/\s+/);
  return parts
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
}

function timeAgo(dateStr) {
  if (!dateStr) return "";
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

/* ================================================================
   MAIN COMPONENT
   ================================================================ */

export default function BrandStudio({
  userId = "demo-user-001",
  startupId = "default-startup",
}) {
  const [viewportWidth, setViewportWidth] = useState(
    typeof window !== "undefined" ? window.innerWidth : 1440
  );
  const isMobile = viewportWidth < 720;
  const isTablet = viewportWidth >= 720 && viewportWidth < 1080;

  const [brand, setBrand] = useState(EMPTY_BRAND);
  const [ephemeral, setEphemeral] = useState(EMPTY_EPHEMERAL);
  const [currentId, setCurrentId] = useState(null);

  const [savedBrands, setSavedBrands] = useState([]);
  const [listLoading, setListLoading] = useState(false);
  const [search, setSearch] = useState("");

  const [fieldLoading, setFieldLoading] = useState({});
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [error, setError] = useState("");
  const [toast, setToast] = useState(null);
  const toastTimer = useRef(null);

  const [sidebarView, setSidebarView] = useState("saved"); // "saved" | "workspace"
  const [hovered, setHovered] = useState("");
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  /* --------------------------- responsive listener --------------------------- */
  useEffect(() => {
    function onResize() {
      setViewportWidth(window.innerWidth);
    }
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  /* ------------------------------- toast helper ------------------------------ */
  const showToast = useCallback((message, kind = "success") => {
    setToast({ message, kind });
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 3200);
  }, []);

  /* ------------------------------- load brands -------------------------------- */
  const loadBrands = useCallback(async () => {
    setListLoading(true);
    setError("");
    try {
      const rows = await fetchBrands(userId);
      setSavedBrands(rows);
    } catch (err) {
      console.error("Failed to fetch saved brands:", err);
      setError(err.message || "Failed to load saved brands.");
    } finally {
      setListLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    loadBrands();
  }, [loadBrands]);

  /* --------------------------------- handlers --------------------------------- */

  function handleFieldChange(key, value) {
    if (key in EMPTY_EPHEMERAL) {
      setEphemeral((prev) => ({ ...prev, [key]: value }));
    } else {
      setBrand((prev) => ({ ...prev, [key]: value }));
    }
  }

  async function handleGenerate(fieldKey) {
    setFieldLoading((prev) => ({ ...prev, [fieldKey]: true }));
    setError("");
    try {
      const result = await generateWithGroq(fieldKey, brand);
      if (fieldKey in EMPTY_EPHEMERAL) {
        setEphemeral((prev) => ({ ...prev, [fieldKey]: result }));
      } else {
        setBrand((prev) => ({ ...prev, [fieldKey]: result }));
      }
      showToast("Generated successfully.");
    } catch (err) {
      console.error(`AI generation failed for ${fieldKey}:`, err);
      setError(err.message || "AI generation failed. Please try again.");
      showToast("Generation failed.", "error");
    } finally {
      setFieldLoading((prev) => ({ ...prev, [fieldKey]: false }));
    }
  }

  function resetWorkspace() {
    setBrand(EMPTY_BRAND);
    setEphemeral(EMPTY_EPHEMERAL);
    setCurrentId(null);
    setError("");
  }

  function loadBrandIntoWorkspace(row) {
    setBrand({
      brand_name: row.brand_name || "",
      tagline: row.tagline || "",
      mission: row.mission || "",
      vision: row.vision || "",
      story: row.story || "",
      values: row.values || "",
      target_audience: row.target_audience || "",
      personality: row.personality || "",
      color_palette: row.color_palette || "",
      logo_prompt: row.logo_prompt || "",
    });
    setEphemeral(EMPTY_EPHEMERAL);
    setCurrentId(row.id);
    setError("");
    if (isMobile) setMobileNavOpen(false);
    setSidebarView("workspace");
  }

  async function handleSave() {
    if (!brand.brand_name.trim()) {
      setError("Brand Name is required before saving.");
      showToast("Add a brand name first.", "error");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const payload = { ...brand, user_id: userId, startup_id: startupId };
      if (currentId) {
        const updated = await updateBrandRow(currentId, payload);
        showToast("Brand updated.");
        if (updated) {
          setSavedBrands((prev) =>
            prev.map((b) => (b.id === currentId ? updated : b))
          );
        }
      } else {
        const created = await insertBrand(payload);
        showToast("Brand saved.");
        if (created) {
          setCurrentId(created.id);
          setSavedBrands((prev) => [created, ...prev]);
        }
      }
    } catch (err) {
      console.error("Failed to save brand:", err);
      setError(err.message || "Failed to save brand.");
      showToast("Save failed.", "error");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id) {
    if (!id) return;
    const confirmed = window.confirm(
      "Delete this brand permanently? This cannot be undone."
    );
    if (!confirmed) return;
    setDeleting(true);
    setError("");
    try {
      await deleteBrandRow(id);
      setSavedBrands((prev) => prev.filter((b) => b.id !== id));
      if (currentId === id) resetWorkspace();
      showToast("Brand deleted.");
    } catch (err) {
      console.error("Failed to delete brand:", err);
      setError(err.message || "Failed to delete brand.");
      showToast("Delete failed.", "error");
    } finally {
      setDeleting(false);
    }
  }

  const filteredBrands = savedBrands.filter((b) =>
    (b.brand_name || "").toLowerCase().includes(search.toLowerCase())
  );

  /* ================================ STYLES ================================ */

  const styles = {
    root: {
      display: "flex",
      flexDirection: isMobile ? "column" : "row",
      minHeight: "100vh",
      width: "100%",
      background: THEME.bg,
      color: THEME.white,
      fontFamily: FONT_BODY,
      position: "relative",
      overflowX: "hidden",
    },
    sidebar: {
      width: isMobile ? "100%" : isTablet ? "260px" : "300px",
      flexShrink: 0,
      background: "linear-gradient(180deg, #101010 0%, #0c0c0c 100%)",
      borderRight: isMobile ? "none" : `1px solid ${THEME.border}`,
      borderBottom: isMobile ? `1px solid ${THEME.border}` : "none",
      display: isMobile && !mobileNavOpen ? "none" : "flex",
      flexDirection: "column",
      height: isMobile ? "auto" : "100vh",
      position: isMobile ? "relative" : "sticky",
      top: 0,
      padding: "24px 18px",
      gap: "20px",
      zIndex: 20,
    },
    sidebarTop: {
      display: "flex",
      alignItems: "center",
      gap: "10px",
      padding: "4px 6px 12px 6px",
      borderBottom: `1px solid ${THEME.border}`,
    },
    logoMark: {
      width: "34px",
      height: "34px",
      borderRadius: "9px",
      background: `linear-gradient(135deg, ${THEME.primary}, ${THEME.secondary})`,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontFamily: FONT_DISPLAY,
      fontWeight: 700,
      fontSize: "15px",
      color: "#0c0c0c",
      flexShrink: 0,
    },
    logoText: {
      fontFamily: FONT_DISPLAY,
      fontSize: "19px",
      letterSpacing: "0.06em",
      fontWeight: 600,
      color: THEME.white,
    },
    logoTag: {
      fontSize: "10.5px",
      color: THEME.textSecondary,
      letterSpacing: "0.03em",
      marginTop: "1px",
    },
    navGroup: { display: "flex", flexDirection: "column", gap: "4px" },
    navLabel: {
      fontSize: "11px",
      textTransform: "uppercase",
      letterSpacing: "0.12em",
      color: THEME.textSecondary,
      padding: "0 8px",
      marginBottom: "4px",
      marginTop: "6px",
    },
    navBtn: (active) => ({
      display: "flex",
      alignItems: "center",
      gap: "10px",
      padding: "10px 12px",
      borderRadius: "10px",
      background: active ? THEME.primaryDim : "transparent",
      color: active ? THEME.primary : THEME.textSecondary,
      border: active ? `1px solid rgba(196,106,50,0.35)` : "1px solid transparent",
      cursor: "pointer",
      fontSize: "13.5px",
      fontWeight: 500,
      textAlign: "left",
      transition: "background 0.2s ease, color 0.2s ease, border-color 0.2s ease",
      width: "100%",
    }),
    searchWrap: {
      display: "flex",
      alignItems: "center",
      gap: "8px",
      background: THEME.card,
      border: `1px solid ${THEME.border}`,
      borderRadius: "10px",
      padding: "9px 12px",
    },
    searchInput: {
      flex: 1,
      background: "transparent",
      border: "none",
      color: THEME.white,
      fontSize: "13px",
      fontFamily: FONT_BODY,
    },
    savedList: {
      display: "flex",
      flexDirection: "column",
      gap: "8px",
      overflowY: "auto",
      flex: 1,
      paddingRight: "2px",
    },
    savedCard: (active, isHover) => ({
      background: active ? "rgba(196,106,50,0.10)" : isHover ? THEME.cardAlt : THEME.card,
      border: `1px solid ${active ? "rgba(196,106,50,0.4)" : THEME.border}`,
      borderRadius: "12px",
      padding: "12px",
      cursor: "pointer",
      transition: "all 0.2s ease",
      transform: isHover ? "translateY(-1px)" : "translateY(0)",
    }),
    savedCardTop: {
      display: "flex",
      alignItems: "center",
      gap: "10px",
      marginBottom: "6px",
    },
    savedAvatar: {
      width: "30px",
      height: "30px",
      borderRadius: "8px",
      background: `linear-gradient(135deg, ${THEME.secondary}, ${THEME.primary})`,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontSize: "11px",
      fontWeight: 700,
      color: "#0c0c0c",
      flexShrink: 0,
    },
    savedName: {
      fontSize: "13.5px",
      fontWeight: 600,
      color: THEME.white,
      whiteSpace: "nowrap",
      overflow: "hidden",
      textOverflow: "ellipsis",
    },
    savedTagline: {
      fontSize: "11.5px",
      color: THEME.textSecondary,
      whiteSpace: "nowrap",
      overflow: "hidden",
      textOverflow: "ellipsis",
    },
    savedMeta: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      marginTop: "6px",
    },
    savedTime: { fontSize: "10.5px", color: THEME.textSecondary },
    iconBtnSm: (danger, isHover) => ({
      width: "24px",
      height: "24px",
      borderRadius: "6px",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: isHover ? (danger ? "rgba(229,72,77,0.15)" : "rgba(245,245,245,0.08)") : "transparent",
      color: danger ? THEME.danger : THEME.textSecondary,
      border: "none",
      cursor: "pointer",
      transition: "background 0.15s ease",
    }),

    /* main */
    main: { flex: 1, display: "flex", flexDirection: "column", minWidth: 0 },
    header: {
      padding: isMobile ? "16px 18px" : "26px 36px",
      borderBottom: `1px solid ${THEME.border}`,
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      gap: "16px",
      position: "sticky",
      top: 0,
      background: "rgba(9,9,9,0.85)",
      backdropFilter: "blur(14px)",
      WebkitBackdropFilter: "blur(14px)",
      zIndex: 15,
    },
    headerLeft: { display: "flex", flexDirection: "column", gap: "3px" },
    headerTitle: {
      fontFamily: FONT_DISPLAY,
      fontSize: isMobile ? "22px" : "28px",
      fontWeight: 600,
      letterSpacing: "0.01em",
      color: THEME.white,
      display: "flex",
      alignItems: "center",
      gap: "10px",
    },
    headerSubtitle: {
      fontSize: isMobile ? "12.5px" : "13.5px",
      color: THEME.textSecondary,
    },
    headerActions: { display: "flex", gap: "10px", alignItems: "center" },
    hamburger: {
      display: isMobile ? "flex" : "none",
      width: "36px",
      height: "36px",
      borderRadius: "9px",
      background: THEME.card,
      border: `1px solid ${THEME.border}`,
      alignItems: "center",
      justifyContent: "center",
      color: THEME.white,
      cursor: "pointer",
      marginRight: "6px",
    },

    content: {
      flex: 1,
      display: "flex",
      flexDirection: isMobile || isTablet ? "column" : "row",
      gap: isMobile ? "18px" : "24px",
      padding: isMobile ? "18px" : "28px 36px 60px 36px",
      alignItems: "flex-start",
    },
    workspace: {
      flex: isMobile || isTablet ? "none" : "1.15",
      width: "100%",
      display: "flex",
      flexDirection: "column",
      gap: "16px",
      minWidth: 0,
    },
    preview: {
      flex: isMobile || isTablet ? "none" : "0.85",
      width: "100%",
      position: isMobile || isTablet ? "static" : "sticky",
      top: "108px",
      display: "flex",
      flexDirection: "column",
      gap: "16px",
    },

    sectionLabel: {
      fontSize: "11px",
      textTransform: "uppercase",
      letterSpacing: "0.14em",
      color: THEME.secondary,
      fontWeight: 600,
      marginBottom: "2px",
    },

    fieldCard: {
      background: THEME.card,
      border: `1px solid ${THEME.border}`,
      borderRadius: "16px",
      padding: "18px 18px 16px 18px",
      display: "flex",
      flexDirection: "column",
      gap: "10px",
      transition: "border-color 0.2s ease, transform 0.2s ease",
      animation: "lumora-fade-up 0.4s ease both",
    },
    fieldTop: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      gap: "10px",
    },
    fieldLabel: {
      fontSize: "13.5px",
      fontWeight: 600,
      color: THEME.white,
      display: "flex",
      alignItems: "center",
      gap: "8px",
    },
    genBtn: (isHover, isLoading) => ({
      display: "flex",
      alignItems: "center",
      gap: "6px",
      background: isLoading
        ? "rgba(212,175,55,0.12)"
        : isHover
        ? "rgba(212,175,55,0.16)"
        : "rgba(212,175,55,0.08)",
      border: `1px solid ${isHover || isLoading ? "rgba(212,175,55,0.5)" : "rgba(212,175,55,0.25)"}`,
      color: THEME.secondary,
      borderRadius: "999px",
      padding: "5px 12px",
      fontSize: "11.5px",
      fontWeight: 600,
      letterSpacing: "0.02em",
      cursor: isLoading ? "default" : "pointer",
      transition: "all 0.18s ease",
      whiteSpace: "nowrap",
      flexShrink: 0,
    }),
    input: (isFocus) => ({
      width: "100%",
      background: THEME.bg,
      border: `1px solid ${isFocus ? THEME.primary : THEME.border}`,
      borderRadius: "10px",
      padding: "10px 12px",
      color: THEME.white,
      fontSize: "13.5px",
      fontFamily: FONT_BODY,
      transition: "border-color 0.18s ease",
    }),
    textarea: (isFocus) => ({
      width: "100%",
      minHeight: "76px",
      resize: "vertical",
      background: THEME.bg,
      border: `1px solid ${isFocus ? THEME.primary : THEME.border}`,
      borderRadius: "10px",
      padding: "10px 12px",
      color: THEME.white,
      fontSize: "13.5px",
      fontFamily: FONT_BODY,
      lineHeight: 1.55,
      transition: "border-color 0.18s ease",
    }),

    quickRow: {
      display: "flex",
      gap: "10px",
      flexWrap: "wrap",
    },
    quickCard: {
      flex: "1 1 200px",
      background: THEME.card,
      border: `1px solid ${THEME.border}`,
      borderRadius: "14px",
      padding: "14px",
      display: "flex",
      flexDirection: "column",
      gap: "8px",
    },

    footerBar: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      gap: "12px",
      background: THEME.card,
      border: `1px solid ${THEME.border}`,
      borderRadius: "16px",
      padding: "14px 18px",
      flexWrap: "wrap",
    },
    primaryBtn: (isHover, disabled) => ({
      display: "flex",
      alignItems: "center",
      gap: "8px",
      background: disabled
        ? "rgba(196,106,50,0.35)"
        : isHover
        ? "linear-gradient(135deg, #d4763c, #C46A32)"
        : "linear-gradient(135deg, #C46A32, #a85526)",
      color: "#fff",
      border: "none",
      borderRadius: "10px",
      padding: "11px 22px",
      fontSize: "13.5px",
      fontWeight: 600,
      cursor: disabled ? "default" : "pointer",
      transition: "all 0.2s ease",
      boxShadow: isHover && !disabled ? "0 8px 20px rgba(196,106,50,0.28)" : "none",
    }),
    ghostBtn: (isHover) => ({
      display: "flex",
      alignItems: "center",
      gap: "8px",
      background: isHover ? "rgba(245,245,245,0.06)" : "transparent",
      color: THEME.textSecondary,
      border: `1px solid ${THEME.border}`,
      borderRadius: "10px",
      padding: "11px 18px",
      fontSize: "13.5px",
      fontWeight: 500,
      cursor: "pointer",
      transition: "all 0.2s ease",
    }),

    /* preview panel */
    previewCard: {
      background: `linear-gradient(155deg, ${THEME.card} 0%, #131313 100%)`,
      border: `1px solid ${THEME.border}`,
      borderRadius: "20px",
      padding: "26px 22px",
      position: "relative",
      overflow: "hidden",
    },
    previewGlow: {
      position: "absolute",
      top: "-60px",
      right: "-60px",
      width: "180px",
      height: "180px",
      borderRadius: "50%",
      background: `radial-gradient(circle, rgba(196,106,50,0.28), transparent 70%)`,
      pointerEvents: "none",
    },
    previewBadge: {
      width: "52px",
      height: "52px",
      borderRadius: "14px",
      background: `linear-gradient(135deg, ${THEME.secondary}, ${THEME.primary})`,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontFamily: FONT_DISPLAY,
      fontWeight: 700,
      fontSize: "19px",
      color: "#0c0c0c",
      marginBottom: "14px",
    },
    previewName: {
      fontFamily: FONT_DISPLAY,
      fontSize: "24px",
      fontWeight: 600,
      color: THEME.white,
      marginBottom: "4px",
    },
    previewTagline: {
      fontSize: "13.5px",
      color: THEME.secondary,
      fontStyle: "italic",
      marginBottom: "16px",
    },
    previewDivider: {
      height: "1px",
      background: THEME.border,
      margin: "14px 0",
    },
    previewBlockLabel: {
      fontSize: "10.5px",
      textTransform: "uppercase",
      letterSpacing: "0.12em",
      color: THEME.textSecondary,
      marginBottom: "5px",
    },
    previewBlockText: {
      fontSize: "13px",
      color: "#D8D8DA",
      lineHeight: 1.6,
    },
    tagPill: {
      display: "inline-flex",
      padding: "5px 11px",
      borderRadius: "999px",
      background: "rgba(245,245,245,0.06)",
      border: `1px solid ${THEME.border}`,
      color: THEME.white,
      fontSize: "11.5px",
      marginRight: "6px",
      marginBottom: "6px",
    },
    swatchRow: { display: "flex", gap: "8px", flexWrap: "wrap" },
    swatch: (hex) => ({
      width: "34px",
      height: "34px",
      borderRadius: "9px",
      background: hex,
      border: "1px solid rgba(255,255,255,0.15)",
      flexShrink: 0,
    }),

    emptyState: {
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      textAlign: "center",
      padding: "50px 20px",
      color: THEME.textSecondary,
      gap: "10px",
    },
    emptyIcon: {
      width: "56px",
      height: "56px",
      borderRadius: "16px",
      background: THEME.primaryDim,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      marginBottom: "6px",
    },

    toast: (kind) => ({
      position: "fixed",
      bottom: "22px",
      left: "50%",
      transform: "translateX(-50%)",
      background: kind === "error" ? "#2a1213" : "#141d13",
      border: `1px solid ${kind === "error" ? "rgba(229,72,77,0.5)" : "rgba(112,199,110,0.4)"}`,
      color: kind === "error" ? "#ffb3b5" : "#b7f2b4",
      padding: "12px 20px",
      borderRadius: "12px",
      fontSize: "13px",
      fontWeight: 500,
      zIndex: 100,
      animation: "lumora-fade-up 0.3s ease both",
      boxShadow: "0 10px 30px rgba(0,0,0,0.5)",
    }),

    errorBanner: {
      background: "rgba(229,72,77,0.08)",
      border: "1px solid rgba(229,72,77,0.3)",
      color: "#ff9a9d",
      borderRadius: "12px",
      padding: "12px 16px",
      fontSize: "13px",
      display: "flex",
      alignItems: "center",
      gap: "8px",
    },
  };

  /* ============================== SUBCOMPONENTS ============================== */

  function Spinner({ size = 16, color = THEME.secondary }) {
    return (
      <span
        style={{
          width: size,
          height: size,
          borderRadius: "50%",
          border: `2px solid rgba(212,175,55,0.2)`,
          borderTopColor: color,
          display: "inline-block",
          animation: "lumora-spin 0.7s linear infinite",
        }}
      />
    );
  }

  function AILoader({ label = "Generating with AI…" }) {
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "14px",
          padding: "40px 10px",
        }}
      >
        <div style={{ position: "relative", width: "58px", height: "58px" }}>
          <div
            style={{
              position: "absolute",
              inset: 0,
              borderRadius: "50%",
              border: "3px solid transparent",
              borderTopColor: THEME.primary,
              borderRightColor: THEME.secondary,
              animation: "lumora-spin 1s linear infinite",
            }}
          />
          <div
            style={{
              position: "absolute",
              inset: "10px",
              borderRadius: "50%",
              border: "3px solid transparent",
              borderBottomColor: THEME.secondary,
              animation: "lumora-spin-rev 1.4s linear infinite",
            }}
          />
          <div
            style={{
              position: "absolute",
              inset: "22px",
              borderRadius: "50%",
              background: `radial-gradient(circle, ${THEME.primary}, ${THEME.secondary})`,
              animation: "lumora-pulse 1.4s ease-in-out infinite",
            }}
          />
        </div>
        <span style={{ fontSize: "12.5px", color: THEME.textSecondary, letterSpacing: "0.02em" }}>
          {label}
        </span>
      </div>
    );
  }

  function FieldCard({ def }) {
    const [focus, setFocus] = useState(false);
    const [btnHover, setBtnHover] = useState(false);
    const value = def.ephemeral ? ephemeral[def.key] : brand[def.key];
    const isLoading = !!fieldLoading[def.key];

    return (
      <div
        style={{
          ...styles.fieldCard,
          borderColor: focus ? "rgba(196,106,50,0.4)" : THEME.border,
        }}
      >
        <div style={styles.fieldTop}>
          <span style={styles.fieldLabel}>{def.label}</span>
          <button
            style={styles.genBtn(btnHover, isLoading)}
            onMouseEnter={() => setBtnHover(true)}
            onMouseLeave={() => setBtnHover(false)}
            onClick={() => handleGenerate(def.key)}
            disabled={isLoading}
          >
            {isLoading ? <Spinner size={12} /> : <span>✦</span>}
            {isLoading ? "Generating" : "Generate"}
          </button>
        </div>
        {def.type === "textarea" ? (
          <textarea
            style={styles.textarea(focus)}
            placeholder={def.placeholder}
            value={value}
            onFocus={() => setFocus(true)}
            onBlur={() => setFocus(false)}
            onChange={(e) => handleFieldChange(def.key, e.target.value)}
          />
        ) : (
          <input
            style={styles.input(focus)}
            placeholder={def.placeholder}
            value={value}
            onFocus={() => setFocus(true)}
            onBlur={() => setFocus(false)}
            onChange={(e) => handleFieldChange(def.key, e.target.value)}
          />
        )}
      </div>
    );
  }

  function QuickCard({ action }) {
    const [btnHover, setBtnHover] = useState(false);
    const isLoading = !!fieldLoading[action.key];
    const value = ephemeral[action.key];
    return (
      <div style={styles.quickCard}>
        <div style={styles.fieldTop}>
          <span style={{ ...styles.fieldLabel, fontSize: "12.5px" }}>{action.label}</span>
          <button
            style={styles.genBtn(btnHover, isLoading)}
            onMouseEnter={() => setBtnHover(true)}
            onMouseLeave={() => setBtnHover(false)}
            onClick={() => handleGenerate(action.key)}
            disabled={isLoading}
          >
            {isLoading ? <Spinner size={12} /> : <span>✦</span>}
            {isLoading ? "" : "Generate"}
          </button>
        </div>
        <p style={{ fontSize: "12.5px", color: value ? "#D8D8DA" : THEME.textSecondary, lineHeight: 1.55, minHeight: "18px" }}>
          {isLoading ? "Thinking…" : value || "No content generated yet."}
        </p>
      </div>
    );
  }

  /* ================================== RENDER ================================== */

  const palette = parsePalette(brand.color_palette);
  const values = parseTags(brand.values);
  const personalityTags = parseTags(brand.personality);

  return (
    <div className="lumora-root" style={styles.root}>
      <style>{KEYFRAMES}</style>

      {/* ---------------------------- SIDEBAR ---------------------------- */}
      <aside style={styles.sidebar}>
        <div style={styles.sidebarTop}>
          <div style={styles.logoMark}>L</div>
          <div>
            <div style={styles.logoText}>LUMORA</div>
            <div style={styles.logoTag}>Build Brands. Launch Faster.</div>
          </div>
        </div>

        <div style={styles.navGroup}>
          <button
            style={styles.navBtn(sidebarView === "workspace")}
            onMouseEnter={() => setHovered("nav-workspace")}
            onMouseLeave={() => setHovered("")}
            onClick={() => {
              setSidebarView("workspace");
              if (isMobile) setMobileNavOpen(false);
            }}
          >
            <span>🎨</span> Brand Workspace
          </button>
          <button
            style={styles.navBtn(sidebarView === "saved")}
            onClick={() => setSidebarView("saved")}
          >
            <span>📁</span> Saved Brands
          </button>
          <button
            style={{ ...styles.navBtn(false), color: THEME.secondary }}
            onClick={resetWorkspace}
          >
            <span>＋</span> New Brand
          </button>
        </div>

        <div style={styles.navLabel}>Search Saved Brands</div>
        <div style={styles.searchWrap}>
          <span style={{ color: THEME.textSecondary, fontSize: "13px" }}>🔍</span>
          <input
            style={styles.searchInput}
            placeholder="Search by brand name…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div style={styles.savedList}>
          {listLoading ? (
            <div style={{ padding: "20px 0" }}>
              <Spinner size={20} />
            </div>
          ) : filteredBrands.length === 0 ? (
            <div style={{ fontSize: "12px", color: THEME.textSecondary, padding: "10px 4px" }}>
              {savedBrands.length === 0
                ? "No brands saved yet."
                : "No brands match your search."}
            </div>
          ) : (
            filteredBrands.map((b) => {
              const isHover = hovered === `card-${b.id}`;
              const isActive = currentId === b.id;
              return (
                <div
                  key={b.id}
                  style={styles.savedCard(isActive, isHover)}
                  onMouseEnter={() => setHovered(`card-${b.id}`)}
                  onMouseLeave={() => setHovered("")}
                  onClick={() => loadBrandIntoWorkspace(b)}
                >
                  <div style={styles.savedCardTop}>
                    <div style={styles.savedAvatar}>{initials(b.brand_name)}</div>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={styles.savedName}>{b.brand_name || "Untitled Brand"}</div>
                      <div style={styles.savedTagline}>{b.tagline || "No tagline yet"}</div>
                    </div>
                  </div>
                  <div style={styles.savedMeta}>
                    <span style={styles.savedTime}>{timeAgo(b.created_at)}</span>
                    <button
                      style={styles.iconBtnSm(true, hovered === `del-${b.id}`)}
                      onMouseEnter={(e) => {
                        e.stopPropagation();
                        setHovered(`del-${b.id}`);
                      }}
                      onMouseLeave={() => setHovered(`card-${b.id}`)}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(b.id);
                      }}
                      title="Delete brand"
                    >
                      🗑
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </aside>

      {/* ----------------------------- MAIN ------------------------------ */}
      <div style={styles.main}>
        <header style={styles.header}>
          <div style={{ display: "flex", alignItems: "center" }}>
            <div
              style={styles.hamburger}
              onClick={() => setMobileNavOpen((v) => !v)}
            >
              ☰
            </div>
            <div style={styles.headerLeft}>
              <div style={styles.headerTitle}>
                Brand Studio
                <span style={{ fontSize: "11px", color: THEME.secondary, border: `1px solid rgba(212,175,55,0.35)`, borderRadius: "999px", padding: "3px 10px", fontFamily: FONT_BODY, fontWeight: 600 }}>
                  AI
                </span>
              </div>
              <div style={styles.headerSubtitle}>
                Create your startup identity using AI.
              </div>
            </div>
          </div>
          <div style={styles.headerActions}>
            {currentId && (
              <span style={{ fontSize: "11.5px", color: THEME.textSecondary }}>
                Editing: <strong style={{ color: THEME.white }}>{brand.brand_name || "Untitled"}</strong>
              </span>
            )}
          </div>
        </header>

        <div style={styles.content}>
          {/* ------------------------- WORKSPACE ------------------------- */}
          <div style={styles.workspace}>
            {error && (
              <div style={styles.errorBanner}>
                <span>⚠</span>
                <span>{error}</span>
              </div>
            )}

            <div style={styles.sectionLabel}>Identity</div>
            {FIELD_DEFS.slice(0, 2).map((def) => (
              <FieldCard key={def.key} def={def} />
            ))}

            <div style={styles.sectionLabel}>Purpose</div>
            {FIELD_DEFS.slice(2, 4).map((def) => (
              <FieldCard key={def.key} def={def} />
            ))}

            <div style={styles.sectionLabel}>Narrative</div>
            {FIELD_DEFS.slice(4, 7).map((def) => (
              <FieldCard key={def.key} def={def} />
            ))}

            <div style={styles.sectionLabel}>Expression</div>
            {FIELD_DEFS.slice(7, 11).map((def) => (
              <FieldCard key={def.key} def={def} />
            ))}

            <div style={styles.sectionLabel}>Quick AI Generators</div>
            <div style={styles.quickRow}>
              {AI_QUICK_ACTIONS.map((action) => (
                <QuickCard key={action.key} action={action} />
              ))}
            </div>

            <div style={styles.footerBar}>
              <SaveDeleteControls />
            </div>
          </div>

          {/* -------------------------- PREVIEW --------------------------- */}
          <div style={styles.preview}>
            <div style={styles.sectionLabel}>Live Preview</div>
            <div style={styles.previewCard}>
              <div style={styles.previewGlow} />
              {!brand.brand_name && !brand.tagline && !brand.mission ? (
                <div style={styles.emptyState}>
                  <div style={styles.emptyIcon}>✦</div>
                  <div style={{ fontSize: "15px", fontWeight: 600, color: THEME.white }}>
                    No Brand Created Yet
                  </div>
                  <div style={{ fontSize: "12.5px" }}>Create your first brand.</div>
                </div>
              ) : (
                <>
                  <div style={styles.previewBadge}>{initials(brand.brand_name)}</div>
                  <div style={styles.previewName}>{brand.brand_name || "Untitled Brand"}</div>
                  {brand.tagline && <div style={styles.previewTagline}>“{brand.tagline}”</div>}

                  {brand.mission && (
                    <>
                      <div style={styles.previewBlockLabel}>Mission</div>
                      <div style={styles.previewBlockText}>{brand.mission}</div>
                    </>
                  )}
                  {brand.vision && (
                    <>
                      <div style={{ ...styles.previewBlockLabel, marginTop: "12px" }}>Vision</div>
                      <div style={styles.previewBlockText}>{brand.vision}</div>
                    </>
                  )}

                  {(values.length > 0 || personalityTags.length > 0) && (
                    <div style={styles.previewDivider} />
                  )}

                  {personalityTags.length > 0 && (
                    <>
                      <div style={styles.previewBlockLabel}>Personality</div>
                      <div style={{ marginBottom: "8px" }}>
                        {personalityTags.map((t, i) => (
                          <span key={i} style={styles.tagPill}>{t}</span>
                        ))}
                      </div>
                    </>
                  )}

                  {values.length > 0 && (
                    <>
                      <div style={styles.previewBlockLabel}>Core Values</div>
                      <div>
                        {values.map((t, i) => (
                          <span key={i} style={styles.tagPill}>{t}</span>
                        ))}
                      </div>
                    </>
                  )}

                  {palette.length > 0 && (
                    <>
                      <div style={styles.previewDivider} />
                      <div style={styles.previewBlockLabel}>Color Palette</div>
                      <div style={styles.swatchRow}>
                        {palette.map((hex, i) => (
                          <div key={i} style={styles.swatch(hex)} title={hex} />
                        ))}
                      </div>
                    </>
                  )}

                  {ephemeral.typography && (
                    <>
                      <div style={{ ...styles.previewBlockLabel, marginTop: "14px" }}>
                        Typography
                      </div>
                      <div style={styles.previewBlockText}>{ephemeral.typography}</div>
                    </>
                  )}

                  {brand.logo_prompt && (
                    <>
                      <div style={styles.previewDivider} />
                      <div style={styles.previewBlockLabel}>Logo Prompt</div>
                      <div style={{ ...styles.previewBlockText, fontStyle: "italic", color: THEME.textSecondary }}>
                        {brand.logo_prompt}
                      </div>
                    </>
                  )}
                </>
              )}
            </div>

            {(ephemeral.usp || ephemeral.elevator_pitch || ephemeral.brand_voice) && (
              <div style={styles.previewCard}>
                <div style={styles.sectionLabel}>Extras</div>
                {ephemeral.usp && (
                  <>
                    <div style={styles.previewBlockLabel}>USP</div>
                    <div style={{ ...styles.previewBlockText, marginBottom: "10px" }}>{ephemeral.usp}</div>
                  </>
                )}
                {ephemeral.elevator_pitch && (
                  <>
                    <div style={styles.previewBlockLabel}>Elevator Pitch</div>
                    <div style={{ ...styles.previewBlockText, marginBottom: "10px" }}>{ephemeral.elevator_pitch}</div>
                  </>
                )}
                {ephemeral.brand_voice && (
                  <>
                    <div style={styles.previewBlockLabel}>Brand Voice</div>
                    <div style={styles.previewBlockText}>{ephemeral.brand_voice}</div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {toast && <div style={styles.toast(toast.kind)}>{toast.message}</div>}
    </div>
  );

  /* ------------------------- inline save/delete UI ------------------------- */
  function SaveDeleteControls() {
    const [saveHover, setSaveHover] = useState(false);
    const [resetHover, setResetHover] = useState(false);
    const [delHover, setDelHover] = useState(false);
    return (
      <>
        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
          <button
            style={styles.primaryBtn(saveHover, saving)}
            onMouseEnter={() => setSaveHover(true)}
            onMouseLeave={() => setSaveHover(false)}
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? <Spinner size={14} color="#fff" /> : <span>💾</span>}
            {saving ? "Saving…" : currentId ? "Update Brand" : "Save Brand"}
          </button>
          <button
            style={styles.ghostBtn(resetHover)}
            onMouseEnter={() => setResetHover(true)}
            onMouseLeave={() => setResetHover(false)}
            onClick={resetWorkspace}
          >
            ↺ Reset
          </button>
        </div>
        {currentId && (
          <button
            style={{ ...styles.ghostBtn(delHover), color: THEME.danger, borderColor: delHover ? "rgba(229,72,77,0.4)" : THEME.border }}
            onMouseEnter={() => setDelHover(true)}
            onMouseLeave={() => setDelHover(false)}
            onClick={() => handleDelete(currentId)}
            disabled={deleting}
          >
            {deleting ? <Spinner size={14} color={THEME.danger} /> : "🗑"} Delete Brand
          </button>
        )}
      </>
    );
  }
}