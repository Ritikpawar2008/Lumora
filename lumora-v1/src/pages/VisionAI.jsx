import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { supabase } from "../../supabase";
import Sidebar from "../pages/Sidebar";

const STORAGE_BUCKET = "vision-images";
const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY;
const GROQ_MODEL = "meta-llama/llama-4-scout-17b-16e-instruct";
const GROQ_ENDPOINT = "https://api.groq.com/openai/v1/chat/completions";

const COLORS = {
  bg: "#090909",
  card: "#171717",
  primary: "#C46A32",
  secondary: "#D4AF37",
  text: "#FFFFFF",
  subtext: "#A1A1AA",
  border: "#262626",
};

const ANALYSIS_PROMPT = `You are Vision AI, LUMORA's expert brand and design analyst. LUMORA's mission is "Build Brands. Launch Faster."
Analyze the uploaded image, which may be a startup logo, landing page screenshot, dashboard screenshot, pitch deck screenshot, marketing poster, social media creative, business card, product packaging, or competitor screenshot.

Respond ONLY with valid JSON, no markdown fences, no preamble, matching exactly this shape:
{
  "imageType": "string, what kind of image this is",
  "summary": "2-3 sentence overall summary",
  "brandAnalysis": "paragraph analyzing brand identity and perception",
  "designQuality": "paragraph analyzing overall design quality and craftsmanship",
  "colorPsychology": "paragraph analyzing the color palette and psychological impact",
  "typography": "paragraph analyzing typography choices and readability",
  "visualHierarchy": "paragraph analyzing layout, focus, and visual flow",
  "strengths": ["short strength 1", "short strength 2", "short strength 3"],
  "weaknesses": ["short weakness 1", "short weakness 2", "short weakness 3"],
  "improvements": ["actionable suggestion 1", "actionable suggestion 2", "actionable suggestion 3"],
  "professionalScore": number from 1 to 10,
  "overallRating": "one of: Excellent, Good, Average, Needs Work, Poor"
}`;

function formatDate(dateInput) {
  const d = new Date(dateInput);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function parseAnalysisResponse(raw) {
  let cleaned = raw.trim();
  cleaned = cleaned.replace(/^```json/i, "").replace(/^```/, "").replace(/```$/, "").trim();
  return JSON.parse(cleaned);
}

export function VisionAI() {
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [dragOver, setDragOver] = useState(false);

  const [analyzing, setAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  const [analysisError, setAnalysisError] = useState("");

  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [historyError, setHistoryError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [historyPanelOpen, setHistoryPanelOpen] = useState(false);

  const fileInputRef = useRef(null);

  const fetchHistory = useCallback(async () => {
    setHistoryLoading(true);
    setHistoryError("");
    try {
      const { data, error } = await supabase
        .from("vision_history")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setHistory(data || []);
    } catch (err) {
      console.error("Error fetching vision history:", err);
      setHistoryError("Failed to load past analyses.");
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  useEffect(() => {
    return () => {
      if (previewUrl && previewUrl.startsWith("blob:")) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const handleFileSelect = (selectedFile) => {
    if (!selectedFile) return;
    if (!selectedFile.type.startsWith("image/")) {
      window.alert("Please upload a valid image file.");
      return;
    }
    setFile(selectedFile);
    setPreviewUrl(URL.createObjectURL(selectedFile));
    setAnalysis(null);
    setAnalysisError("");
  };

  const handleBrowse = (e) => {
    handleFileSelect(e.target.files[0]);
    e.target.value = "";
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const droppedFile = e.dataTransfer.files && e.dataTransfer.files[0];
    handleFileSelect(droppedFile);
  };

  const handleRemoveImage = () => {
    setFile(null);
    setPreviewUrl("");
    setAnalysis(null);
    setAnalysisError("");
  };

  const uploadImageToStorage = useCallback(async (imageFile) => {
    const fileExt = imageFile.name.split(".").pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(fileName, imageFile, { upsert: false });

    if (uploadError) throw uploadError;

    const { data } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(fileName);
    return data?.publicUrl || "";
  }, []);

  const callGroqVision = useCallback(async (base64DataUrl) => {
    const response = await fetch(GROQ_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: ANALYSIS_PROMPT },
              { type: "image_url", image_url: { url: base64DataUrl } },
            ],
          },
        ],
        temperature: 0.4,
        max_tokens: 1800,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Groq Vision API error: ${response.status} ${errText}`);
    }

    const data = await response.json();
    const raw = data?.choices?.[0]?.message?.content;
    if (!raw) throw new Error("No analysis returned from Groq Vision API.");
    return parseAnalysisResponse(raw);
  }, []);

  const saveHistory = useCallback(async (imageUrl, analysisData) => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      const { error } = await supabase.from("vision_history").insert([
        {
          user_id: user ? user.id : null,
          image_url: imageUrl,
          analysis: analysisData,
        },
      ]);

      if (error) throw error;
      fetchHistory();
    } catch (err) {
      console.error("Error saving analysis history:", err);
    }
  }, [fetchHistory]);

  const handleAnalyze = async () => {
    if (!file || analyzing) return;
    setAnalyzing(true);
    setAnalysisError("");
    setAnalysis(null);

    try {
      const base64DataUrl = await fileToBase64(file);
      const result = await callGroqVision(base64DataUrl);
      setAnalysis(result);

      let imageUrl = "";
      try {
        imageUrl = await uploadImageToStorage(file);
      } catch (uploadErr) {
        console.error("Error uploading image to storage:", uploadErr);
      }

      await saveHistory(imageUrl, result);
    } catch (err) {
      console.error("Error analyzing image:", err);
      setAnalysisError("Vision AI couldn't analyze this image. Please try again.");
      window.alert("Something went wrong while analyzing your image. Please try again.");
    } finally {
      setAnalyzing(false);
    }
  };

  const handleDeleteHistory = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const { error } = await supabase.from("vision_history").delete().eq("id", deleteTarget.id);
      if (error) throw error;
      setHistory((prev) => prev.filter((h) => h.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch (err) {
      console.error("Error deleting analysis:", err);
      window.alert("Could not delete this analysis. Please try again.");
    } finally {
      setDeleting(false);
    }
  };

  const handleLoadHistoryItem = (item) => {
    setFile(null);
    setPreviewUrl(item.image_url || "");
    setAnalysis(
      typeof item.analysis === "string" ? safeParseStored(item.analysis) : item.analysis
    );
    setAnalysisError("");
    setHistoryPanelOpen(false);
  };

  const safeParseStored = (raw) => {
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  };

  const filteredHistory = useMemo(() => {
    if (!searchTerm.trim()) return history;
    const q = searchTerm.trim().toLowerCase();
    return history.filter((h) => {
      const summary =
        typeof h.analysis === "string"
          ? h.analysis
          : h.analysis && h.analysis.summary
          ? h.analysis.summary
          : "";
      const imageType =
        typeof h.analysis === "object" && h.analysis ? h.analysis.imageType || "" : "";
      return summary.toLowerCase().includes(q) || imageType.toLowerCase().includes(q);
    });
  }, [history, searchTerm]);

  const ratingColor = (rating) => {
    switch (rating) {
      case "Excellent":
        return "#34D399";
      case "Good":
        return COLORS.secondary;
      case "Average":
        return COLORS.primary;
      case "Needs Work":
        return "#F59E0B";
      case "Poor":
        return "#F87171";
      default:
        return COLORS.subtext;
    }
  };

  return (
    <div style={styles.page}>
      <style>{cssBlock}</style>
      <Sidebar />

      <div style={styles.main}>
        <div style={styles.headerRow}>
          <div>
            <h1 style={styles.title}>Vision AI</h1>
            <p style={styles.subtitle}>Analyze images using AI.</p>
          </div>
          <button
            style={styles.historyToggleBtn}
            onClick={() => setHistoryPanelOpen((s) => !s)}
          >
            {historyPanelOpen ? "Close History" : "View History"}
          </button>
        </div>

        <div className="lumora-content-grid" style={styles.contentGrid}>
          <div style={styles.leftCol}>
            <div
              style={{
                ...styles.uploadArea,
                borderColor: dragOver ? COLORS.primary : COLORS.border,
                background: dragOver ? "rgba(196,106,50,0.06)" : COLORS.card,
              }}
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
            >
              {previewUrl ? (
                <div style={styles.previewWrap}>
                  <div style={styles.previewImageWrap}>
                    <img src={previewUrl} alt="Uploaded preview" style={styles.previewImage} />
                    {analyzing && (
                      <div style={styles.scanOverlay}>
                        <div style={styles.scanLine} />
                      </div>
                    )}
                  </div>
                  <div style={styles.previewActions}>
                    <button
                      style={styles.removeBtn}
                      onClick={handleRemoveImage}
                      disabled={analyzing}
                    >
                      Remove Image
                    </button>
                    <button
                      style={{
                        ...styles.analyzeBtn,
                        opacity: analyzing || !file ? 0.6 : 1,
                        cursor: analyzing || !file ? "not-allowed" : "pointer",
                      }}
                      onClick={handleAnalyze}
                      disabled={analyzing || !file}
                    >
                      {analyzing ? (
                        <span style={styles.analyzingLabel}>
                          <span style={styles.miniSpinner} /> Analyzing...
                        </span>
                      ) : (
                        "Analyze Image"
                      )}
                    </button>
                  </div>
                </div>
              ) : (
                <div style={styles.dropZoneContent}>
                  <div style={styles.uploadIconCircle}>
                    <span style={styles.uploadIcon}>⤒</span>
                  </div>
                  <p style={styles.dropTitle}>Drag & drop an image here</p>
                  <p style={styles.dropSubtitle}>
                    Logos, landing pages, dashboards, pitch decks, posters & more
                  </p>
                  <button style={styles.browseBtn} onClick={() => fileInputRef.current.click()}>
                    Browse Image
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleBrowse}
                    style={{ display: "none" }}
                  />
                </div>
              )}
            </div>

            {analysisError && <div style={styles.errorBanner}>{analysisError}</div>}

            {analyzing && !analysis && (
              <div style={styles.scanningPanel}>
                <div style={styles.scanningSpinner} />
                <p style={styles.scanningText}>Vision AI is scanning your image...</p>
                <p style={styles.scanningSubtext}>
                  Evaluating brand, design quality, color, typography & hierarchy
                </p>
              </div>
            )}

            {!previewUrl && !analyzing && (
              <div style={styles.emptyWrap}>
                <svg width="110" height="110" viewBox="0 0 110 110" fill="none">
                  <circle cx="55" cy="55" r="52" stroke="#262626" strokeWidth="2" />
                  <rect x="30" y="38" width="50" height="36" rx="6" stroke={COLORS.primary} strokeWidth="2" />
                  <circle cx="42" cy="50" r="4" fill={COLORS.secondary} />
                  <path d="M30 68l14-12 10 8 10-10 6 6" stroke={COLORS.primary} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <h3 style={styles.emptyTitle}>Upload an image to start AI analysis.</h3>
              </div>
            )}

            {analysis && <AnalysisResult analysis={analysis} ratingColor={ratingColor} />}
          </div>

          <div
            className="lumora-history-panel"
            style={{
              ...styles.historyPanel,
              transform: historyPanelOpen ? "translateX(0)" : undefined,
            }}
          >
            <div style={styles.historyHeader}>
              <h3 style={styles.historyTitle}>Analysis History</h3>
            </div>

            <div style={styles.historySearchWrap}>
              <span style={styles.historySearchIcon}>⌕</span>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search previous analyses..."
                style={styles.historySearchInput}
              />
            </div>

            <div style={styles.historyList}>
              {historyLoading ? (
                <div style={styles.historyLoadingWrap}>
                  <div style={styles.miniSpinner} />
                  <span>Loading history...</span>
                </div>
              ) : historyError ? (
                <div style={styles.historyErrorText}>{historyError}</div>
              ) : filteredHistory.length === 0 ? (
                <div style={styles.historyEmptyText}>
                  {searchTerm ? "No matching analyses." : "No analyses yet."}
                </div>
              ) : (
                filteredHistory.map((item) => (
                  <HistoryCard
                    key={item.id}
                    item={item}
                    onClick={() => handleLoadHistoryItem(item)}
                    onDelete={(e) => {
                      e.stopPropagation();
                      setDeleteTarget(item);
                    }}
                  />
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {deleteTarget && (
        <div style={styles.modalOverlay} onClick={() => !deleting && setDeleteTarget(null)}>
          <div style={styles.confirmBox} onClick={(e) => e.stopPropagation()}>
            <h3 style={styles.confirmTitle}>Delete this analysis?</h3>
            <p style={styles.confirmText}>
              This analysis will be permanently removed from your history.
            </p>
            <div style={styles.confirmActions}>
              <button
                style={styles.cancelBtn}
                onClick={() => setDeleteTarget(null)}
                disabled={deleting}
              >
                Cancel
              </button>
              <button style={styles.deleteConfirmBtn} onClick={handleDeleteHistory} disabled={deleting}>
                {deleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function HistoryCard({ item, onClick, onDelete }) {
  const [hover, setHover] = useState(false);
  const analysisData =
    typeof item.analysis === "string" ? safeParseJson(item.analysis) : item.analysis;
  const summary = analysisData?.summary || "Analysis unavailable";
  const imageType = analysisData?.imageType || "Image";
  const score = analysisData?.professionalScore;

  return (
    <div
      style={{
        ...styles.historyCard,
        borderColor: hover ? COLORS.primary : COLORS.border,
      }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onClick={onClick}
    >
      {item.image_url && (
        <img src={item.image_url} alt={imageType} style={styles.historyCardImage} />
      )}
      <div style={styles.historyCardBody}>
        <div style={styles.historyCardTopRow}>
          <span style={styles.historyCardType}>{imageType}</span>
          {typeof score === "number" && (
            <span style={styles.historyCardScore}>{score}/10</span>
          )}
        </div>
        <p style={styles.historyCardSummary}>{summary}</p>
        <div style={styles.historyCardFooter}>
          <span style={styles.historyCardDate}>{formatDate(item.created_at)}</span>
          <button style={styles.historyDeleteBtn} onClick={onDelete}>
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

function safeParseJson(raw) {
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function AnalysisResult({ analysis, ratingColor }) {
  const {
    imageType,
    summary,
    brandAnalysis,
    designQuality,
    colorPsychology,
    typography,
    visualHierarchy,
    strengths = [],
    weaknesses = [],
    improvements = [],
    professionalScore,
    overallRating,
  } = analysis;

  return (
    <div style={styles.resultsWrap}>
      <div style={styles.scoreCard}>
        <div style={styles.scoreCircleWrap}>
          <svg width="88" height="88" viewBox="0 0 88 88">
            <circle cx="44" cy="44" r="38" stroke="#262626" strokeWidth="6" fill="none" />
            <circle
              cx="44"
              cy="44"
              r="38"
              stroke={COLORS.secondary}
              strokeWidth="6"
              fill="none"
              strokeDasharray={2 * Math.PI * 38}
              strokeDashoffset={2 * Math.PI * 38 * (1 - (professionalScore || 0) / 10)}
              strokeLinecap="round"
              transform="rotate(-90 44 44)"
            />
          </svg>
          <div style={styles.scoreNumber}>{professionalScore ?? "-"}</div>
        </div>
        <div style={styles.scoreInfo}>
          <div style={styles.scoreLabel}>Professional Score</div>
          <div style={{ ...styles.ratingBadge, color: ratingColor(overallRating), background: `${ratingColor(overallRating)}22` }}>
            {overallRating || "N/A"}
          </div>
          {imageType && <div style={styles.imageTypeTag}>{imageType}</div>}
        </div>
      </div>

      <AnalysisCard title="Overall Summary" content={summary} />
      <div className="lumora-cards-grid" style={styles.cardsGrid}>
        <AnalysisCard title="Brand Analysis" content={brandAnalysis} />
        <AnalysisCard title="Design Quality" content={designQuality} />
        <AnalysisCard title="Color Psychology" content={colorPsychology} />
        <AnalysisCard title="Typography" content={typography} />
        <AnalysisCard title="Visual Hierarchy" content={visualHierarchy} />
      </div>

      <div className="lumora-cards-grid" style={styles.cardsGrid}>
        <ListCard title="Strengths" items={strengths} color="#34D399" />
        <ListCard title="Weaknesses" items={weaknesses} color="#F87171" />
        <ListCard title="Improvement Suggestions" items={improvements} color={COLORS.secondary} />
      </div>
    </div>
  );
}

function AnalysisCard({ title, content }) {
  if (!content) return null;
  return (
    <div style={styles.analysisCard}>
      <h4 style={styles.analysisCardTitle}>{title}</h4>
      <p style={styles.analysisCardText}>{content}</p>
    </div>
  );
}

function ListCard({ title, items, color }) {
  if (!items || items.length === 0) return null;
  return (
    <div style={styles.analysisCard}>
      <h4 style={styles.analysisCardTitle}>{title}</h4>
      <ul style={styles.listWrap}>
        {items.map((item, idx) => (
          <li key={idx} style={styles.listItem}>
            <span style={{ ...styles.listDot, background: color }} />
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

const cssBlock = `
@keyframes lumora-spin { to { transform: rotate(360deg); } }
@keyframes lumora-fade-in { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
@keyframes lumora-scan { 0% { top: 0%; } 50% { top: 96%; } 100% { top: 0%; } }
input::placeholder { color: #6B6B70; }
::-webkit-scrollbar { width: 8px; height: 8px; }
::-webkit-scrollbar-thumb { background: #262626; border-radius: 8px; }
::-webkit-scrollbar-track { background: transparent; }

@media (max-width: 1100px) {
  .lumora-content-grid { grid-template-columns: 1fr !important; }
  .lumora-history-panel {
    position: fixed !important;
    top: 0;
    right: 0;
    height: 100vh;
    width: 320px !important;
    max-width: 85vw;
    z-index: 1000;
    transform: translateX(100%);
    transition: transform 0.3s ease;
    box-shadow: -20px 0 60px rgba(0,0,0,0.6);
  }
}
@media (max-width: 640px) {
  .lumora-cards-grid { grid-template-columns: 1fr !important; }
}
`;

const styles = {
  page: {
    display: "flex",
    minHeight: "100vh",
    background: COLORS.bg,
    color: COLORS.text,
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  },
  main: {
    flex: 1,
    padding: "28px 36px 60px",
    boxSizing: "border-box",
    minWidth: 0,
  },
  headerRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: "14px",
    marginBottom: "24px",
  },
  title: {
    fontSize: "28px",
    fontWeight: 700,
    margin: 0,
    background: `linear-gradient(90deg, ${COLORS.text}, ${COLORS.secondary})`,
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
  },
  subtitle: {
    color: COLORS.subtext,
    fontSize: "14px",
    marginTop: "6px",
  },
  historyToggleBtn: {
    background: COLORS.card,
    border: `1px solid ${COLORS.border}`,
    color: COLORS.text,
    padding: "10px 18px",
    borderRadius: "10px",
    fontSize: "13px",
    fontWeight: 600,
    cursor: "pointer",
  },
  contentGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 340px",
    gap: "22px",
    alignItems: "start",
  },
  leftCol: {
    display: "flex",
    flexDirection: "column",
    gap: "20px",
    minWidth: 0,
  },
  uploadArea: {
    border: "2px dashed",
    borderRadius: "18px",
    padding: "10px",
    transition: "border-color 0.25s ease, background 0.25s ease",
    minHeight: "260px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  dropZoneContent: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    textAlign: "center",
    padding: "40px 24px",
  },
  uploadIconCircle: {
    width: "58px",
    height: "58px",
    borderRadius: "50%",
    background: "rgba(196,106,50,0.12)",
    border: `1px solid ${COLORS.primary}`,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: "16px",
  },
  uploadIcon: {
    fontSize: "24px",
    color: COLORS.primary,
  },
  dropTitle: {
    fontSize: "16px",
    fontWeight: 600,
    margin: "0 0 6px",
  },
  dropSubtitle: {
    fontSize: "13px",
    color: COLORS.subtext,
    margin: "0 0 20px",
    maxWidth: "320px",
  },
  browseBtn: {
    background: `linear-gradient(135deg, ${COLORS.primary}, #a3551f)`,
    border: "none",
    color: "#fff",
    padding: "11px 24px",
    borderRadius: "10px",
    fontSize: "13.5px",
    fontWeight: 600,
    cursor: "pointer",
    boxShadow: "0 6px 18px rgba(196,106,50,0.3)",
  },
  previewWrap: {
    width: "100%",
    padding: "14px",
    display: "flex",
    flexDirection: "column",
    gap: "14px",
  },
  previewImageWrap: {
    position: "relative",
    borderRadius: "14px",
    overflow: "hidden",
    maxHeight: "420px",
    display: "flex",
    justifyContent: "center",
    background: "#000",
  },
  previewImage: {
    width: "100%",
    maxHeight: "420px",
    objectFit: "contain",
    display: "block",
  },
  scanOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: "rgba(9,9,9,0.25)",
    overflow: "hidden",
  },
  scanLine: {
    position: "absolute",
    left: 0,
    right: 0,
    height: "3px",
    background: `linear-gradient(90deg, transparent, ${COLORS.secondary}, transparent)`,
    boxShadow: `0 0 16px 2px ${COLORS.secondary}`,
    animation: "lumora-scan 2.2s ease-in-out infinite",
  },
  previewActions: {
    display: "flex",
    gap: "12px",
    flexWrap: "wrap",
  },
  removeBtn: {
    background: "transparent",
    border: `1px solid ${COLORS.border}`,
    color: "#F87171",
    padding: "11px 18px",
    borderRadius: "10px",
    fontSize: "13.5px",
    fontWeight: 600,
    cursor: "pointer",
  },
  analyzeBtn: {
    flex: 1,
    background: `linear-gradient(135deg, ${COLORS.primary}, #a3551f)`,
    border: "none",
    color: "#fff",
    padding: "11px 18px",
    borderRadius: "10px",
    fontSize: "13.5px",
    fontWeight: 700,
    boxShadow: "0 6px 18px rgba(196,106,50,0.3)",
    minWidth: "160px",
  },
  analyzingLabel: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
  },
  miniSpinner: {
    width: "14px",
    height: "14px",
    borderRadius: "50%",
    border: "2px solid rgba(255,255,255,0.3)",
    borderTopColor: "#fff",
    display: "inline-block",
    animation: "lumora-spin 0.7s linear infinite",
  },
  errorBanner: {
    background: "rgba(248,113,113,0.1)",
    border: "1px solid rgba(248,113,113,0.3)",
    color: "#F87171",
    padding: "12px 16px",
    borderRadius: "10px",
    fontSize: "13.5px",
  },
  scanningPanel: {
    background: COLORS.card,
    border: `1px solid ${COLORS.border}`,
    borderRadius: "16px",
    padding: "30px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    textAlign: "center",
  },
  scanningSpinner: {
    width: "40px",
    height: "40px",
    borderRadius: "50%",
    border: `3px solid ${COLORS.border}`,
    borderTopColor: COLORS.primary,
    borderRightColor: COLORS.secondary,
    animation: "lumora-spin 0.9s linear infinite",
    marginBottom: "16px",
  },
  scanningText: {
    fontSize: "15px",
    fontWeight: 600,
    margin: "0 0 6px",
  },
  scanningSubtext: {
    fontSize: "13px",
    color: COLORS.subtext,
    margin: 0,
  },
  emptyWrap: {
    background: COLORS.card,
    border: `1px solid ${COLORS.border}`,
    borderRadius: "16px",
    padding: "50px 20px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    textAlign: "center",
  },
  emptyTitle: {
    fontSize: "15px",
    color: COLORS.subtext,
    marginTop: "18px",
    fontWeight: 500,
  },
  resultsWrap: {
    display: "flex",
    flexDirection: "column",
    gap: "18px",
    animation: "lumora-fade-in 0.4s ease",
  },
  scoreCard: {
    background: COLORS.card,
    border: `1px solid ${COLORS.border}`,
    borderRadius: "16px",
    padding: "22px",
    display: "flex",
    alignItems: "center",
    gap: "22px",
    flexWrap: "wrap",
  },
  scoreCircleWrap: {
    position: "relative",
    width: "88px",
    height: "88px",
    flexShrink: 0,
  },
  scoreNumber: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "22px",
    fontWeight: 800,
    color: COLORS.text,
  },
  scoreInfo: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },
  scoreLabel: {
    fontSize: "12px",
    color: COLORS.subtext,
    textTransform: "uppercase",
    letterSpacing: "0.5px",
    fontWeight: 600,
  },
  ratingBadge: {
    fontSize: "14px",
    fontWeight: 700,
    padding: "5px 14px",
    borderRadius: "20px",
    display: "inline-block",
    width: "fit-content",
  },
  imageTypeTag: {
    fontSize: "12px",
    color: COLORS.subtext,
  },
  cardsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
    gap: "16px",
  },
  analysisCard: {
    background: COLORS.card,
    border: `1px solid ${COLORS.border}`,
    borderRadius: "16px",
    padding: "20px",
    transition: "border-color 0.2s ease, transform 0.2s ease",
  },
  analysisCardTitle: {
    fontSize: "13px",
    fontWeight: 700,
    color: COLORS.secondary,
    textTransform: "uppercase",
    letterSpacing: "0.5px",
    margin: "0 0 10px",
  },
  analysisCardText: {
    fontSize: "13.5px",
    color: COLORS.text,
    lineHeight: 1.6,
    margin: 0,
  },
  listWrap: {
    listStyle: "none",
    margin: 0,
    padding: 0,
    display: "flex",
    flexDirection: "column",
    gap: "10px",
  },
  listItem: {
    display: "flex",
    alignItems: "flex-start",
    gap: "10px",
    fontSize: "13.5px",
    color: COLORS.text,
    lineHeight: 1.5,
  },
  listDot: {
    width: "6px",
    height: "6px",
    borderRadius: "50%",
    marginTop: "6px",
    flexShrink: 0,
  },
  historyPanel: {
    background: "rgba(23,23,23,0.9)",
    backdropFilter: "blur(16px)",
    WebkitBackdropFilter: "blur(16px)",
    border: `1px solid ${COLORS.border}`,
    borderRadius: "18px",
    padding: "20px",
    display: "flex",
    flexDirection: "column",
    maxHeight: "calc(100vh - 100px)",
    position: "sticky",
    top: "28px",
  },
  historyHeader: {
    marginBottom: "14px",
  },
  historyTitle: {
    fontSize: "16px",
    fontWeight: 700,
    margin: 0,
  },
  historySearchWrap: {
    position: "relative",
    marginBottom: "16px",
  },
  historySearchIcon: {
    position: "absolute",
    left: "12px",
    top: "50%",
    transform: "translateY(-50%)",
    color: COLORS.subtext,
    fontSize: "14px",
  },
  historySearchInput: {
    width: "100%",
    background: "#0F0F0F",
    border: `1px solid ${COLORS.border}`,
    borderRadius: "10px",
    padding: "10px 12px 10px 32px",
    color: COLORS.text,
    fontSize: "13px",
    outline: "none",
    boxSizing: "border-box",
  },
  historyList: {
    overflowY: "auto",
    display: "flex",
    flexDirection: "column",
    gap: "12px",
    paddingRight: "4px",
  },
  historyLoadingWrap: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    color: COLORS.subtext,
    fontSize: "13px",
    padding: "10px 0",
  },
  historyErrorText: {
    color: "#F87171",
    fontSize: "13px",
  },
  historyEmptyText: {
    color: COLORS.subtext,
    fontSize: "13px",
  },
  historyCard: {
    background: "#0F0F0F",
    border: "1px solid",
    borderRadius: "12px",
    overflow: "hidden",
    cursor: "pointer",
    transition: "border-color 0.2s ease",
  },
  historyCardImage: {
    width: "100%",
    height: "100px",
    objectFit: "cover",
    display: "block",
  },
  historyCardBody: {
    padding: "12px",
  },
  historyCardTopRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "6px",
  },
  historyCardType: {
    fontSize: "11px",
    fontWeight: 700,
    color: COLORS.secondary,
    textTransform: "uppercase",
  },
  historyCardScore: {
    fontSize: "11px",
    fontWeight: 700,
    color: COLORS.primary,
  },
  historyCardSummary: {
    fontSize: "12.5px",
    color: COLORS.subtext,
    lineHeight: 1.5,
    margin: "0 0 10px",
    display: "-webkit-box",
    WebkitLineClamp: 2,
    WebkitBoxOrient: "vertical",
    overflow: "hidden",
  },
  historyCardFooter: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  historyCardDate: {
    fontSize: "11px",
    color: COLORS.subtext,
  },
  historyDeleteBtn: {
    background: "transparent",
    border: "none",
    color: "#F87171",
    fontSize: "11px",
    fontWeight: 600,
    cursor: "pointer",
  },
  modalOverlay: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: "rgba(0,0,0,0.7)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1200,
    padding: "20px",
  },
  confirmBox: {
    background: COLORS.card,
    border: `1px solid ${COLORS.border}`,
    borderRadius: "18px",
    padding: "26px",
    width: "100%",
    maxWidth: "400px",
  },
  confirmTitle: {
    fontSize: "17px",
    fontWeight: 700,
    margin: "0 0 10px",
  },
  confirmText: {
    fontSize: "13.5px",
    color: COLORS.subtext,
    lineHeight: 1.6,
    margin: 0,
  },
  confirmActions: {
    display: "flex",
    justifyContent: "flex-end",
    gap: "12px",
    marginTop: "22px",
  },
  cancelBtn: {
    background: "transparent",
    border: `1px solid ${COLORS.border}`,
    color: COLORS.subtext,
    padding: "10px 18px",
    borderRadius: "10px",
    fontSize: "13.5px",
    fontWeight: 600,
    cursor: "pointer",
  },
  deleteConfirmBtn: {
    background: "#F87171",
    border: "none",
    color: "#090909",
    padding: "10px 18px",
    borderRadius: "10px",
    fontSize: "13.5px",
    fontWeight: 700,
    cursor: "pointer",
  },
};

export default VisionAI;