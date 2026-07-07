import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { supabase } from "../../supabase";
import Sidebar from "./Sidebar";


const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY;
const GROQ_MODEL = "llama-3.3-70b-versatile";
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

const SYSTEM_PROMPT = `You are AI Founder, the AI Co-Founder inside LUMORA — a platform whose mission is "Build Brands. Launch Faster."
You are not a generic chatbot. You think, challenge, and advise like an experienced startup co-founder and operator who has built and scaled companies before.
You help founders with startup validation, competitor analysis, market research, revenue ideas, business strategy, pricing, customer personas, go-to-market strategy, growth strategy, pitch decks, and funding preparation.
Always be direct, strategic, and specific. Give structured, actionable answers (use short headers or bullet points when helpful). Challenge weak ideas constructively, like a real co-founder would. Keep a confident, sharp, encouraging tone — never generic or vague.`;

const QUICK_ACTIONS = [
  { label: "Generate Startup Idea", prompt: "Generate a promising startup idea for me, including the core concept and why it could work." },
  { label: "Improve Business Model", prompt: "Help me improve my current business model. Ask me what my startup does if you need more context, then suggest improvements." },
  { label: "Create Problem Statement", prompt: "Help me craft a sharp, compelling problem statement for my startup." },
  { label: "Generate Solution", prompt: "Help me define a clear, differentiated solution for my startup's problem statement." },
  { label: "Find Target Audience", prompt: "Help me identify and define the ideal target audience and customer persona for my startup." },
  { label: "Revenue Model", prompt: "Suggest strong revenue model options for my startup and which one might fit best." },
  { label: "SWOT Analysis", prompt: "Run a SWOT analysis for my startup idea." },
  { label: "Pitch Deck", prompt: "Help me outline a compelling investor pitch deck for my startup, slide by slide." },
  { label: "Marketing Plan", prompt: "Help me build a practical marketing plan to launch and grow my startup." },
  { label: "Investor Pitch", prompt: "Help me craft a strong investor pitch narrative for my startup." },
  { label: "Roadmap", prompt: "Help me build a realistic product and business roadmap for the next 12 months." },
  { label: "Brand Name", prompt: "Suggest strong brand name ideas for my startup and explain the reasoning behind each." },
  { label: "Mission & Vision", prompt: "Help me write a clear and inspiring mission and vision statement for my startup." },
  { label: "Tagline", prompt: "Suggest sharp, memorable taglines for my startup." },
];

function formatTime(dateInput) {
  const d = new Date(dateInput);
  return d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
}

function formatDay(dateInput) {
  const d = new Date(dateInput);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  if (d.toDateString() === today.toDateString()) return "Today";
  if (d.toDateString() === yesterday.toDateString()) return "Yesterday";
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function AIFounder() {
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [historyError, setHistoryError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [pinnedIds, setPinnedIds] = useState([]);

  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [listening, setListening] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);

  const fetchHistory = useCallback(async () => {
    setHistoryLoading(true);
    setHistoryError("");
    try {
      const { data, error } = await supabase
        .from("ai_chats")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setHistory(data || []);
    } catch (err) {
      console.error("Error fetching chat history:", err);
      setHistoryError("Failed to load conversation history.");
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, sending]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 160)}px`;
    }
  }, [input]);

  const saveChat = useCallback(async (message, response) => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      const { error } = await supabase.from("ai_chats").insert([
        {
          user_id: user ? user.id : null,
          message,
          response,
        },
      ]);

      if (error) throw error;
      fetchHistory();
    } catch (err) {
      console.error("Error saving chat:", err);
    }
  }, [fetchHistory]);

  const callGroq = useCallback(async (userMessage, conversation) => {
    const conversationPayload = [
      { role: "system", content: SYSTEM_PROMPT },
      ...conversation.map((m) => ({ role: m.role, content: m.content })),
      { role: "user", content: userMessage },
    ];

    const response = await fetch(GROQ_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        messages: conversationPayload,
        temperature: 0.7,
        max_tokens: 1500,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Groq API error: ${response.status} ${errText}`);
    }

    const data = await response.json();
    const reply = data?.choices?.[0]?.message?.content;
    if (!reply) throw new Error("No response returned from Groq API.");
    return reply;
  }, []);

  const sendMessage = useCallback(
    async (rawText) => {
      const text = (rawText !== undefined ? rawText : input).trim();
      if (!text || sending) return;

      const userMsg = { role: "user", content: text, timestamp: new Date().toISOString() };
      const priorConversation = messages;
      setMessages((prev) => [...prev, userMsg]);
      setInput("");
      setSending(true);

      try {
        const reply = await callGroq(text, priorConversation);
        const aiMsg = { role: "assistant", content: reply, timestamp: new Date().toISOString() };
        setMessages((prev) => [...prev, aiMsg]);
        await saveChat(text, reply);
      } catch (err) {
        console.error("Error getting AI response:", err);
        window.alert("Your AI Co-Founder couldn't respond right now. Please try again.");
        const errMsg = {
          role: "assistant",
          content: "I ran into an issue processing that. Please try again in a moment.",
          timestamp: new Date().toISOString(),
          isError: true,
        };
        setMessages((prev) => [...prev, errMsg]);
      } finally {
        setSending(false);
      }
    },
    [input, sending, messages, callGroq, saveChat]
  );

  const handleQuickAction = (prompt) => {
    sendMessage(prompt);
  };

  const handleNewChat = () => {
    if (sending) return;
    setMessages([]);
    setInput("");
  };

  const handleClearChat = () => {
    if (sending) return;
    setMessages([]);
  };

  const handleLoadHistoryItem = (item) => {
    setMessages([
      { role: "user", content: item.message, timestamp: item.created_at },
      { role: "assistant", content: item.response, timestamp: item.created_at },
    ]);
    setSidebarOpen(false);
  };

  const handleDeleteHistoryItem = async (id, e) => {
    e.stopPropagation();
    const confirmed = window.confirm("Delete this conversation from history?");
    if (!confirmed) return;

    try {
      const { error } = await supabase.from("ai_chats").delete().eq("id", id);
      if (error) throw error;
      setHistory((prev) => prev.filter((h) => h.id !== id));
      setPinnedIds((prev) => prev.filter((pid) => pid !== id));
    } catch (err) {
      console.error("Error deleting chat:", err);
      window.alert("Could not delete this conversation. Please try again.");
    }
  };

  const togglePin = (id, e) => {
    e.stopPropagation();
    setPinnedIds((prev) => (prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]));
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const filteredHistory = useMemo(() => {
    if (!searchTerm.trim()) return history;
    const q = searchTerm.trim().toLowerCase();
    return history.filter(
      (h) =>
        (h.message || "").toLowerCase().includes(q) || (h.response || "").toLowerCase().includes(q)
    );
  }, [history, searchTerm]);

  const pinnedHistory = useMemo(
    () => filteredHistory.filter((h) => pinnedIds.includes(h.id)),
    [filteredHistory, pinnedIds]
  );
  const recentHistory = useMemo(
    () => filteredHistory.filter((h) => !pinnedIds.includes(h.id)),
    [filteredHistory, pinnedIds]
  );

  return (
    <div style={styles.page}>
      <style>{cssBlock}</style>

      <button
        className="lumora-mobile-menu-btn"
        style={styles.mobileMenuBtn}
        onClick={() => setSidebarOpen((s) => !s)}
      >
        ☰
      </button>

      <aside
        className="lumora-sidebar"
        style={{
          ...styles.sidebar,
          transform: sidebarOpen ? "translateX(0)" : undefined,
        }}
      >
        <div style={styles.sidebarBrand}>
          <div style={styles.sidebarLogo}>LUMORA</div>
          <div style={styles.sidebarTagline}>Build Brands. Launch Faster.</div>
        </div>

        <button style={styles.newChatBtn} onClick={handleNewChat}>
          <span style={{ fontSize: "16px" }}>+</span> New Chat
        </button>

        <div style={styles.sidebarSearchWrap}>
          <span style={styles.sidebarSearchIcon}>⌕</span>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search conversations..."
            style={styles.sidebarSearchInput}
          />
        </div>

        <div style={styles.sidebarScroll}>
          {historyLoading ? (
            <div style={styles.sidebarLoading}>
              <div style={styles.miniSpinner} />
              <span>Loading history...</span>
            </div>
          ) : historyError ? (
            <div style={styles.sidebarError}>{historyError}</div>
          ) : (
            <>
              {pinnedHistory.length > 0 && (
                <div style={styles.sidebarSection}>
                  <div style={styles.sidebarSectionLabel}>Pinned</div>
                  {pinnedHistory.map((item) => (
                    <HistoryItem
                      key={item.id}
                      item={item}
                      pinned
                      onClick={() => handleLoadHistoryItem(item)}
                      onDelete={(e) => handleDeleteHistoryItem(item.id, e)}
                      onTogglePin={(e) => togglePin(item.id, e)}
                    />
                  ))}
                </div>
              )}

              <div style={styles.sidebarSection}>
                <div style={styles.sidebarSectionLabel}>Recent Chats</div>
                {recentHistory.length === 0 ? (
                  <div style={styles.sidebarEmpty}>
                    {searchTerm ? "No matches found." : "No conversations yet."}
                  </div>
                ) : (
                  recentHistory.map((item) => (
                    <HistoryItem
                      key={item.id}
                      item={item}
                      pinned={false}
                      onClick={() => handleLoadHistoryItem(item)}
                      onDelete={(e) => handleDeleteHistoryItem(item.id, e)}
                      onTogglePin={(e) => togglePin(item.id, e)}
                    />
                  ))
                )}
              </div>
            </>
          )}
        </div>
      </aside>

      <div style={styles.main}>
        <header style={styles.header}>
          <div>
            <h1 style={styles.headerTitle}>AI Founder</h1>
            <p style={styles.headerSubtitle}>Your AI Co-Founder for Building Better Startups.</p>
          </div>
        </header>

        <div style={styles.quickActionsWrap}>
          {QUICK_ACTIONS.map((qa) => (
            <button
              key={qa.label}
              style={styles.quickActionBtn}
              onClick={() => handleQuickAction(qa.prompt)}
              disabled={sending}
            >
              {qa.label}
            </button>
          ))}
        </div>

        <div style={styles.chatArea}>
          {messages.length === 0 ? (
            <EmptyState />
          ) : (
            <div style={styles.messagesList}>
              {messages.map((m, idx) => (
                <MessageBubble key={idx} message={m} />
              ))}
              {sending && <TypingBubble />}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        <div style={styles.inputBar}>
          <div style={styles.inputBox}>
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask anything about your startup..."
              style={styles.textarea}
              rows={1}
              disabled={sending}
            />
            <div style={styles.inputActions}>
              <button
                style={{
                  ...styles.voiceBtn,
                  ...(listening ? styles.voiceBtnActive : {}),
                }}
                onClick={() => setListening((l) => !l)}
                type="button"
                title="Voice input (UI only)"
              >
                🎤
              </button>
              <button
                style={styles.clearBtn}
                onClick={handleClearChat}
                type="button"
                disabled={sending || messages.length === 0}
              >
                Clear Chat
              </button>
              <button
                style={{
                  ...styles.sendBtn,
                  opacity: sending || !input.trim() ? 0.5 : 1,
                  cursor: sending || !input.trim() ? "not-allowed" : "pointer",
                }}
                onClick={() => sendMessage()}
                type="button"
                disabled={sending || !input.trim()}
              >
                {sending ? "Thinking..." : "Send"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function HistoryItem({ item, pinned, onClick, onDelete, onTogglePin }) {
  const [hover, setHover] = useState(false);
  return (
    <div
      style={{
        ...styles.historyItem,
        background: hover ? "rgba(196,106,50,0.08)" : "transparent",
        borderColor: hover ? COLORS.primary : "transparent",
      }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onClick={onClick}
    >
      <div style={styles.historyItemContent}>
        <div style={styles.historyItemTitle}>
          {(item.message || "Untitled conversation").slice(0, 46)}
          {(item.message || "").length > 46 ? "..." : ""}
        </div>
        <div style={styles.historyItemMeta}>
          {formatDay(item.created_at)} · {formatTime(item.created_at)}
        </div>
      </div>
      <div style={styles.historyItemActions}>
        <button style={styles.historyIconBtn} onClick={onTogglePin} title={pinned ? "Unpin" : "Pin"}>
          {pinned ? "★" : "☆"}
        </button>
        <button style={styles.historyIconBtn} onClick={onDelete} title="Delete">
          🗑
        </button>
      </div>
    </div>
  );
}

function MessageBubble({ message }) {
  const isUser = message.role === "user";
  return (
    <div style={{ ...styles.bubbleRow, justifyContent: isUser ? "flex-end" : "flex-start" }}>
      {!isUser && (
        <div style={styles.aiAvatar}>
          <span style={styles.aiAvatarText}>AI</span>
        </div>
      )}
      <div
        style={{
          ...styles.bubble,
          ...(isUser ? styles.bubbleUser : styles.bubbleAi),
          ...(message.isError ? styles.bubbleErrorBorder : {}),
        }}
      >
        <div style={styles.bubbleText}>{message.content}</div>
        <div style={{ ...styles.bubbleTime, textAlign: isUser ? "right" : "left" }}>
          {formatTime(message.timestamp)}
        </div>
      </div>
    </div>
  );
}

function TypingBubble() {
  return (
    <div style={{ ...styles.bubbleRow, justifyContent: "flex-start" }}>
      <div style={styles.aiAvatar}>
        <span style={styles.aiAvatarText}>AI</span>
      </div>
      <div style={{ ...styles.bubble, ...styles.bubbleAi, ...styles.typingBubble }}>
        <span className="lumora-dot" style={styles.typingDot} />
        <span className="lumora-dot" style={{ ...styles.typingDot, animationDelay: "0.15s" }} />
        <span className="lumora-dot" style={{ ...styles.typingDot, animationDelay: "0.3s" }} />
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div style={styles.emptyWrap}>
      <div style={styles.emptyGlow} />
      <svg width="120" height="120" viewBox="0 0 120 120" fill="none" style={{ position: "relative" }}>
        <circle cx="60" cy="60" r="56" stroke="#262626" strokeWidth="2" />
        <circle cx="60" cy="60" r="34" stroke={COLORS.primary} strokeWidth="2" />
        <circle cx="60" cy="60" r="6" fill={COLORS.secondary} />
        <path d="M60 26v10M60 84v10M26 60h10M84 60h10" stroke={COLORS.secondary} strokeWidth="2" strokeLinecap="round" />
      </svg>
      <h2 style={styles.emptyTitle}>Your AI Co-Founder is Ready.</h2>
      <p style={styles.emptyText}>
        Ask a question, or pick a quick action above to start building your startup with strategic,
        founder-level guidance.
      </p>
    </div>
  );
}

const cssBlock = `
@keyframes lumora-spin { to { transform: rotate(360deg); } }
@keyframes lumora-fade-in { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
@keyframes lumora-pulse { 0%, 100% { box-shadow: 0 0 0 0 rgba(196,106,50,0.5); } 50% { box-shadow: 0 0 0 10px rgba(196,106,50,0); } }
@keyframes lumora-bounce { 0%, 60%, 100% { transform: translateY(0); opacity: 0.5; } 30% { transform: translateY(-6px); opacity: 1; } }
.lumora-dot { animation: lumora-bounce 1s ease-in-out infinite; }
textarea::placeholder, input::placeholder { color: #6B6B70; }
textarea { font-family: inherit; }
::-webkit-scrollbar { width: 8px; height: 8px; }
::-webkit-scrollbar-thumb { background: #262626; border-radius: 8px; }
::-webkit-scrollbar-track { background: transparent; }

@media (max-width: 900px) {
  .lumora-sidebar {
    position: fixed !important;
    top: 0;
    left: 0;
    height: 100vh;
    z-index: 999;
    transform: translateX(-100%);
    box-shadow: 20px 0 60px rgba(0,0,0,0.6);
  }
  .lumora-mobile-menu-btn {
    display: flex !important;
    align-items: center;
    justify-content: center;
  }
}
`;

const styles = {
  page: {
    display: "flex",
    minHeight: "100vh",
    background: COLORS.bg,
    color: COLORS.text,
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    position: "relative",
  },
  mobileMenuBtn: {
    display: "none",
    position: "fixed",
    top: "16px",
    left: "16px",
    zIndex: 1001,
    background: COLORS.card,
    border: `1px solid ${COLORS.border}`,
    color: COLORS.text,
    borderRadius: "10px",
    width: "40px",
    height: "40px",
    cursor: "pointer",
    fontSize: "16px",
  },
  sidebar: {
    width: "300px",
    minWidth: "300px",
    background: "rgba(23,23,23,0.85)",
    backdropFilter: "blur(20px)",
    WebkitBackdropFilter: "blur(20px)",
    borderRight: `1px solid ${COLORS.border}`,
    display: "flex",
    flexDirection: "column",
    padding: "24px 18px",
    boxSizing: "border-box",
    transition: "transform 0.3s ease",
  },
  sidebarBrand: {
    marginBottom: "20px",
    paddingLeft: "4px",
  },
  sidebarLogo: {
    fontSize: "20px",
    fontWeight: 800,
    letterSpacing: "1px",
    background: `linear-gradient(90deg, ${COLORS.text}, ${COLORS.secondary})`,
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
  },
  sidebarTagline: {
    fontSize: "11px",
    color: COLORS.subtext,
    marginTop: "4px",
  },
  newChatBtn: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    background: `linear-gradient(135deg, ${COLORS.primary}, #a3551f)`,
    color: "#fff",
    border: "none",
    padding: "12px 16px",
    borderRadius: "12px",
    fontSize: "14px",
    fontWeight: 600,
    cursor: "pointer",
    marginBottom: "16px",
    boxShadow: "0 6px 18px rgba(196,106,50,0.3)",
  },
  sidebarSearchWrap: {
    position: "relative",
    marginBottom: "18px",
  },
  sidebarSearchIcon: {
    position: "absolute",
    left: "12px",
    top: "50%",
    transform: "translateY(-50%)",
    color: COLORS.subtext,
    fontSize: "14px",
  },
  sidebarSearchInput: {
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
  sidebarScroll: {
    flex: 1,
    overflowY: "auto",
    paddingRight: "4px",
  },
  sidebarSection: {
    marginBottom: "18px",
  },
  sidebarSectionLabel: {
    fontSize: "11px",
    fontWeight: 700,
    letterSpacing: "0.8px",
    textTransform: "uppercase",
    color: COLORS.subtext,
    marginBottom: "8px",
    paddingLeft: "6px",
  },
  sidebarEmpty: {
    fontSize: "12.5px",
    color: COLORS.subtext,
    paddingLeft: "6px",
  },
  sidebarLoading: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    color: COLORS.subtext,
    fontSize: "13px",
    padding: "10px 6px",
  },
  sidebarError: {
    color: "#F87171",
    fontSize: "12.5px",
    padding: "10px 6px",
  },
  miniSpinner: {
    width: "16px",
    height: "16px",
    borderRadius: "50%",
    border: `2px solid ${COLORS.border}`,
    borderTopColor: COLORS.primary,
    animation: "lumora-spin 0.8s linear infinite",
  },
  historyItem: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "10px 10px",
    borderRadius: "10px",
    cursor: "pointer",
    border: "1px solid transparent",
    marginBottom: "4px",
    transition: "background 0.2s ease, border-color 0.2s ease",
  },
  historyItemContent: {
    overflow: "hidden",
  },
  historyItemTitle: {
    fontSize: "13px",
    color: COLORS.text,
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
  historyItemMeta: {
    fontSize: "11px",
    color: COLORS.subtext,
    marginTop: "2px",
  },
  historyItemActions: {
    display: "flex",
    gap: "4px",
    flexShrink: 0,
  },
  historyIconBtn: {
    background: "transparent",
    border: "none",
    color: COLORS.subtext,
    cursor: "pointer",
    fontSize: "13px",
    padding: "4px 6px",
    borderRadius: "6px",
  },
  main: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    height: "100vh",
    boxSizing: "border-box",
    padding: "28px 36px",
  },
  header: {
    marginBottom: "18px",
  },
  headerTitle: {
    fontSize: "28px",
    fontWeight: 700,
    margin: 0,
    background: `linear-gradient(90deg, ${COLORS.text}, ${COLORS.secondary})`,
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
  },
  headerSubtitle: {
    color: COLORS.subtext,
    fontSize: "14px",
    marginTop: "6px",
  },
  quickActionsWrap: {
    display: "flex",
    gap: "10px",
    flexWrap: "wrap",
    marginBottom: "18px",
    paddingBottom: "18px",
    borderBottom: `1px solid ${COLORS.border}`,
  },
  quickActionBtn: {
    background: COLORS.card,
    border: `1px solid ${COLORS.border}`,
    color: COLORS.text,
    padding: "9px 16px",
    borderRadius: "24px",
    fontSize: "12.5px",
    fontWeight: 500,
    cursor: "pointer",
    transition: "border-color 0.2s ease, transform 0.15s ease",
    whiteSpace: "nowrap",
  },
  chatArea: {
    flex: 1,
    overflowY: "auto",
    display: "flex",
    flexDirection: "column",
    marginBottom: "16px",
    borderRadius: "18px",
  },
  messagesList: {
    display: "flex",
    flexDirection: "column",
    gap: "18px",
    padding: "8px 4px 12px",
  },
  bubbleRow: {
    display: "flex",
    alignItems: "flex-end",
    gap: "10px",
  },
  aiAvatar: {
    width: "32px",
    height: "32px",
    minWidth: "32px",
    borderRadius: "10px",
    background: `linear-gradient(135deg, ${COLORS.primary}, ${COLORS.secondary})`,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  aiAvatarText: {
    fontSize: "11px",
    fontWeight: 800,
    color: "#090909",
  },
  bubble: {
    maxWidth: "70%",
    padding: "14px 16px",
    borderRadius: "16px",
    fontSize: "14.5px",
    lineHeight: 1.6,
    animation: "lumora-fade-in 0.3s ease",
  },
  bubbleUser: {
    background: `linear-gradient(135deg, ${COLORS.primary}, #a3551f)`,
    color: "#fff",
    borderBottomRightRadius: "4px",
  },
  bubbleAi: {
    background: COLORS.card,
    border: `1px solid ${COLORS.border}`,
    color: COLORS.text,
    borderBottomLeftRadius: "4px",
  },
  bubbleErrorBorder: {
    borderColor: "#F87171",
  },
  bubbleText: {
    whiteSpace: "pre-wrap",
    wordBreak: "break-word",
  },
  bubbleTime: {
    fontSize: "10.5px",
    color: "rgba(255,255,255,0.55)",
    marginTop: "8px",
  },
  typingBubble: {
    display: "flex",
    alignItems: "center",
    gap: "5px",
    padding: "16px 18px",
  },
  typingDot: {
    width: "7px",
    height: "7px",
    borderRadius: "50%",
    background: COLORS.secondary,
    display: "inline-block",
  },
  emptyWrap: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    textAlign: "center",
    padding: "40px 20px",
    position: "relative",
  },
  emptyGlow: {
    position: "absolute",
    width: "260px",
    height: "260px",
    borderRadius: "50%",
    background: "radial-gradient(circle, rgba(196,106,50,0.15), transparent 70%)",
    filter: "blur(10px)",
  },
  emptyTitle: {
    fontSize: "20px",
    fontWeight: 700,
    marginTop: "22px",
    marginBottom: "8px",
    position: "relative",
  },
  emptyText: {
    color: COLORS.subtext,
    fontSize: "14px",
    maxWidth: "380px",
    lineHeight: 1.6,
    position: "relative",
  },
  inputBar: {
    borderTop: `1px solid ${COLORS.border}`,
    paddingTop: "16px",
  },
  inputBox: {
    background: "rgba(23,23,23,0.9)",
    backdropFilter: "blur(16px)",
    WebkitBackdropFilter: "blur(16px)",
    border: `1px solid ${COLORS.border}`,
    borderRadius: "18px",
    padding: "14px 16px",
    display: "flex",
    flexDirection: "column",
    gap: "10px",
  },
  textarea: {
    background: "transparent",
    border: "none",
    outline: "none",
    color: COLORS.text,
    fontSize: "14.5px",
    resize: "none",
    minHeight: "24px",
    maxHeight: "160px",
    lineHeight: 1.5,
  },
  inputActions: {
    display: "flex",
    justifyContent: "flex-end",
    alignItems: "center",
    gap: "10px",
  },
  voiceBtn: {
    background: "transparent",
    border: `1px solid ${COLORS.border}`,
    color: COLORS.subtext,
    width: "38px",
    height: "38px",
    borderRadius: "12px",
    cursor: "pointer",
    fontSize: "15px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  voiceBtnActive: {
    borderColor: COLORS.primary,
    color: COLORS.primary,
    animation: "lumora-pulse 1.5s infinite",
  },
  clearBtn: {
    background: "transparent",
    border: `1px solid ${COLORS.border}`,
    color: COLORS.subtext,
    padding: "10px 16px",
    borderRadius: "12px",
    fontSize: "13px",
    fontWeight: 600,
    cursor: "pointer",
  },
  sendBtn: {
    background: `linear-gradient(135deg, ${COLORS.primary}, #a3551f)`,
    border: "none",
    color: "#fff",
    padding: "10px 22px",
    borderRadius: "12px",
    fontSize: "13.5px",
    fontWeight: 700,
    boxShadow: "0 6px 18px rgba(196,106,50,0.3)",
  },
};

export default AIFounder;