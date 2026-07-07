import React, { useState, useEffect, useCallback, useMemo } from "react";
import { supabase } from "../../supabase";
import { useNavigate } from "react-router-dom";
import Sidebar from "../pages/Sidebar";

const CATEGORY_OPTIONS = ["AI", "SaaS", "FinTech", "Health", "Education", "Other"];
const PRIORITY_OPTIONS = ["Low", "Medium", "High"];
const STATUS_OPTIONS = ["Draft", "In Progress", "Completed", "Archived"];

const COLORS = {
  bg: "#090909",
  card: "#171717",
  primary: "#C46A32",
  secondary: "#D4AF37",
  text: "#FFFFFF",
  subtext: "#A1A1AA",
  border: "#262626",
};

const STATUS_STYLES = {
  Draft: { bg: "rgba(161,161,170,0.12)", color: "#A1A1AA", dot: "#A1A1AA" },
  "In Progress": { bg: "rgba(212,175,55,0.12)", color: "#D4AF37", dot: "#D4AF37" },
  Completed: { bg: "rgba(52,211,153,0.12)", color: "#34D399", dot: "#34D399" },
  Archived: { bg: "rgba(248,113,113,0.12)", color: "#F87171", dot: "#F87171" },
};

const PRIORITY_STYLES = {
  Low: { bg: "rgba(52,211,153,0.12)", color: "#34D399" },
  Medium: { bg: "rgba(212,175,55,0.12)", color: "#D4AF37" },
  High: { bg: "rgba(196,106,50,0.18)", color: "#C46A32" },
};

const emptyForm = {
  title: "",
  description: "",
  category: "AI",
  priority: "Medium",
  status: "Draft",
};

function IdeaVault() {
  const navigate = useNavigate();

  const [ideas, setIdeas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [sortBy, setSortBy] = useState("Newest");

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const fetchIdeas = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const { data, error: fetchError } = await supabase
        .from("ideas")
        .select("*")
        .order("created_at", { ascending: false });

      if (fetchError) throw fetchError;
      setIdeas(data || []);
    } catch (err) {
      console.error("Error fetching ideas:", err);
      setError("Failed to load ideas. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchIdeas();
  }, [fetchIdeas]);

  const openCreateModal = () => {
    setEditingId(null);
    setFormData(emptyForm);
    setModalOpen(true);
  };

  const openEditModal = (idea) => {
    setEditingId(idea.id);
    setFormData({
      title: idea.title || "",
      description: idea.description || "",
      category: idea.category || "AI",
      priority: idea.priority || "Medium",
      status: idea.status || "Draft",
    });
    setModalOpen(true);
  };

  const closeModal = () => {
    if (saving) return;
    setModalOpen(false);
    setEditingId(null);
    setFormData(emptyForm);
  };

  const handleFormChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      window.alert("Please enter a title for your idea.");
      return;
    }

    setSaving(true);
    try {
      if (editingId) {
        const { error: updateError } = await supabase
          .from("ideas")
          .update({
            title: formData.title.trim(),
            description: formData.description.trim(),
            category: formData.category,
            priority: formData.priority,
            status: formData.status,
          })
          .eq("id", editingId);

        if (updateError) throw updateError;
      } else {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        const { error: insertError } = await supabase.from("ideas").insert([
          {
            user_id: user ? user.id : null,
            title: formData.title.trim(),
            description: formData.description.trim(),
            category: formData.category,
            priority: formData.priority,
            status: formData.status,
          },
        ]);

        if (insertError) throw insertError;
      }

      await fetchIdeas();
      setModalOpen(false);
      setEditingId(null);
      setFormData(emptyForm);
    } catch (err) {
      console.error("Error saving idea:", err);
      window.alert("Something went wrong while saving your idea. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = (idea) => setDeleteTarget(idea);
  const cancelDelete = () => {
    if (deleting) return;
    setDeleteTarget(null);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const { error: deleteError } = await supabase
        .from("ideas")
        .delete()
        .eq("id", deleteTarget.id);

      if (deleteError) throw deleteError;

      await fetchIdeas();
      setDeleteTarget(null);
    } catch (err) {
      console.error("Error deleting idea:", err);
      window.alert("Could not delete this idea. Please try again.");
    } finally {
      setDeleting(false);
    }
  };

  const stats = useMemo(() => {
    const total = ideas.length;
    const draft = ideas.filter((i) => i.status === "Draft").length;
    const completed = ideas.filter((i) => i.status === "Completed").length;
    const archived = ideas.filter((i) => i.status === "Archived").length;
    return { total, draft, completed, archived };
  }, [ideas]);

  const visibleIdeas = useMemo(() => {
    let result = [...ideas];

    if (searchTerm.trim()) {
      const q = searchTerm.trim().toLowerCase();
      result = result.filter((i) => (i.title || "").toLowerCase().includes(q));
    }

    if (categoryFilter !== "All") {
      result = result.filter((i) => i.category === categoryFilter);
    }

    if (statusFilter !== "All") {
      result = result.filter((i) => i.status === statusFilter);
    }

    const priorityRank = { High: 3, Medium: 2, Low: 1 };

    switch (sortBy) {
      case "Newest":
        result.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        break;
      case "Oldest":
        result.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
        break;
      case "Priority":
        result.sort(
          (a, b) => (priorityRank[b.priority] || 0) - (priorityRank[a.priority] || 0)
        );
        break;
      case "Alphabetical":
        result.sort((a, b) => (a.title || "").localeCompare(b.title || ""));
        break;
      default:
        break;
    }

    return result;
  }, [ideas, searchTerm, categoryFilter, statusFilter, sortBy]);

  const formatDate = (dateStr) => {
    if (!dateStr) return "—";
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };

  return (
    <div style={styles.page}>
      <style>{cssAnimations}</style>
      <Sidebar />

      <div style={styles.main}>
        <div style={styles.topBar}>
          <button style={styles.backBtn} onClick={() => navigate(-1)}>
            ← Back
          </button>
          <div style={styles.brandTag}>
            LUMORA <span style={styles.brandDot}>•</span> Build Brands. Launch Faster.
          </div>
        </div>

        <div style={styles.headerRow}>
          <div>
            <h1 style={styles.title}>Idea Vault</h1>
            <p style={styles.subtitle}>
              Your smart workspace to save, organize and grow every startup idea.
            </p>
          </div>
          <button
            style={styles.newIdeaBtn}
            onClick={openCreateModal}
            onMouseEnter={(e) => (e.currentTarget.style.transform = "translateY(-2px)")}
            onMouseLeave={(e) => (e.currentTarget.style.transform = "translateY(0)")}
          >
            + New Idea
          </button>
        </div>

        <div style={styles.statsGrid}>
          <StatCard label="Total Ideas" value={stats.total} accent={COLORS.primary} />
          <StatCard label="Draft" value={stats.draft} accent={COLORS.subtext} />
          <StatCard label="Completed" value={stats.completed} accent="#34D399" />
          <StatCard label="Archived" value={stats.archived} accent="#F87171" />
        </div>

        <div style={styles.controlsBar}>
          <div style={styles.searchWrap}>
            <span style={styles.searchIcon}>⌕</span>
            <input
              type="text"
              placeholder="Search ideas by title..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={styles.searchInput}
            />
          </div>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            style={styles.select}
          >
            <option value="All">All Categories</option>
            {CATEGORY_OPTIONS.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={styles.select}
          >
            <option value="All">All Statuses</option>
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            style={styles.select}
          >
            <option value="Newest">Sort: Newest</option>
            <option value="Oldest">Sort: Oldest</option>
            <option value="Priority">Sort: Priority</option>
            <option value="Alphabetical">Sort: Alphabetical</option>
          </select>
        </div>

        {error && <div style={styles.errorBanner}>{error}</div>}

        {loading ? (
          <div style={styles.loadingWrap}>
            <div style={styles.spinner} />
            <p style={styles.loadingText}>Loading your ideas...</p>
          </div>
        ) : visibleIdeas.length === 0 ? (
          <EmptyState hasIdeas={ideas.length > 0} onCreate={openCreateModal} />
        ) : (
          <div style={styles.grid}>
            {visibleIdeas.map((idea) => (
              <IdeaCard
                key={idea.id}
                idea={idea}
                onEdit={() => openEditModal(idea)}
                onDelete={() => confirmDelete(idea)}
                formatDate={formatDate}
              />
            ))}
          </div>
        )}
      </div>

      {modalOpen && (
        <IdeaModal
          formData={formData}
          onChange={handleFormChange}
          onSave={handleSave}
          onClose={closeModal}
          saving={saving}
          isEditing={!!editingId}
        />
      )}

      {deleteTarget && (
        <DeleteConfirmModal
          idea={deleteTarget}
          onCancel={cancelDelete}
          onConfirm={handleDelete}
          deleting={deleting}
        />
      )}
    </div>
  );
}

function StatCard({ label, value, accent }) {
  return (
    <div style={styles.statCard}>
      <div style={{ ...styles.statAccent, background: accent }} />
      <div style={styles.statValue}>{value}</div>
      <div style={styles.statLabel}>{label}</div>
    </div>
  );
}

function IdeaCard({ idea, onEdit, onDelete, formatDate }) {
  const [hover, setHover] = useState(false);
  const statusStyle = STATUS_STYLES[idea.status] || STATUS_STYLES.Draft;
  const priorityStyle = PRIORITY_STYLES[idea.priority] || PRIORITY_STYLES.Medium;

  return (
    <div
      style={{
        ...styles.card,
        borderColor: hover ? COLORS.primary : COLORS.border,
        boxShadow: hover
          ? "0 12px 30px rgba(196,106,50,0.15)"
          : "0 4px 14px rgba(0,0,0,0.3)",
        transform: hover ? "translateY(-4px)" : "translateY(0)",
      }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      <div style={styles.cardTopRow}>
        <span style={styles.categoryTag}>{idea.category || "Other"}</span>
        <span
          style={{
            ...styles.priorityBadge,
            background: priorityStyle.bg,
            color: priorityStyle.color,
          }}
        >
          {idea.priority || "Medium"}
        </span>
      </div>

      <h3 style={styles.cardTitle}>{idea.title}</h3>
      <p style={styles.cardDescription}>
        {idea.description ? idea.description : "No description added yet."}
      </p>

      <div style={styles.cardFooter}>
        <span
          style={{
            ...styles.statusBadge,
            background: statusStyle.bg,
            color: statusStyle.color,
          }}
        >
          <span style={{ ...styles.statusDot, background: statusStyle.dot }} />
          {idea.status || "Draft"}
        </span>
        <span style={styles.dateText}>{formatDate(idea.created_at)}</span>
      </div>

      <div style={styles.cardActions}>
        <button style={styles.editBtn} onClick={onEdit}>
          Edit
        </button>
        <button style={styles.deleteBtn} onClick={onDelete}>
          Delete
        </button>
      </div>
    </div>
  );
}

function IdeaModal({ formData, onChange, onSave, onClose, saving, isEditing }) {
  return (
    <div style={styles.modalOverlay} onClick={onClose}>
      <div style={styles.modalBox} onClick={(e) => e.stopPropagation()}>
        <div style={styles.modalHeader}>
          <h2 style={styles.modalTitle}>{isEditing ? "Edit Idea" : "New Idea"}</h2>
          <button style={styles.closeIconBtn} onClick={onClose}>
            ✕
          </button>
        </div>

        <form onSubmit={onSave} style={styles.form}>
          <label style={styles.label}>Title</label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => onChange("title", e.target.value)}
            placeholder="e.g. AI-powered onboarding assistant"
            style={styles.input}
            autoFocus
          />

          <label style={styles.label}>Description</label>
          <textarea
            value={formData.description}
            onChange={(e) => onChange("description", e.target.value)}
            placeholder="Describe the core value of this idea..."
            style={styles.textarea}
            rows={4}
          />

          <div style={styles.formRow}>
            <div style={styles.formCol}>
              <label style={styles.label}>Category</label>
              <select
                value={formData.category}
                onChange={(e) => onChange("category", e.target.value)}
                style={styles.select}
              >
                {CATEGORY_OPTIONS.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div style={styles.formCol}>
              <label style={styles.label}>Priority</label>
              <select
                value={formData.priority}
                onChange={(e) => onChange("priority", e.target.value)}
                style={styles.select}
              >
                {PRIORITY_OPTIONS.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>

            <div style={styles.formCol}>
              <label style={styles.label}>Status</label>
              <select
                value={formData.status}
                onChange={(e) => onChange("status", e.target.value)}
                style={styles.select}
              >
                {STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div style={styles.modalActions}>
            <button type="button" style={styles.cancelBtn} onClick={onClose} disabled={saving}>
              Cancel
            </button>
            <button type="submit" style={styles.saveBtn} disabled={saving}>
              {saving ? "Saving..." : isEditing ? "Save Changes" : "Save Idea"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function DeleteConfirmModal({ idea, onCancel, onConfirm, deleting }) {
  return (
    <div style={styles.modalOverlay} onClick={onCancel}>
      <div style={styles.confirmBox} onClick={(e) => e.stopPropagation()}>
        <h3 style={styles.confirmTitle}>Delete this idea?</h3>
        <p style={styles.confirmText}>
          "{idea.title}" will be permanently removed from your Idea Vault. This action cannot be
          undone.
        </p>
        <div style={styles.modalActions}>
          <button style={styles.cancelBtn} onClick={onCancel} disabled={deleting}>
            Cancel
          </button>
          <button style={styles.deleteConfirmBtn} onClick={onConfirm} disabled={deleting}>
            {deleting ? "Deleting..." : "Delete Idea"}
          </button>
        </div>
      </div>
    </div>
  );
}

function EmptyState({ hasIdeas, onCreate }) {
  return (
    <div style={styles.emptyWrap}>
      <svg width="140" height="140" viewBox="0 0 140 140" fill="none">
        <circle cx="70" cy="70" r="68" stroke="#262626" strokeWidth="2" />
        <rect x="40" y="50" width="60" height="46" rx="6" stroke={COLORS.primary} strokeWidth="2" />
        <path d="M50 50V42a20 20 0 0140 0v8" stroke={COLORS.secondary} strokeWidth="2" />
        <circle cx="70" cy="72" r="6" fill={COLORS.primary} />
        <path d="M70 78v8" stroke={COLORS.primary} strokeWidth="2" strokeLinecap="round" />
      </svg>
      <h3 style={styles.emptyTitle}>{hasIdeas ? "No Matching Ideas" : "No Ideas Yet"}</h3>
      <p style={styles.emptyText}>
        {hasIdeas
          ? "Try adjusting your search or filters."
          : "Create your first startup idea and start building."}
      </p>
      {!hasIdeas && (
        <button style={styles.newIdeaBtn} onClick={onCreate}>
          + New Idea
        </button>
      )}
    </div>
  );
}

const cssAnimations = `
@keyframes lumora-spin {
  to { transform: rotate(360deg); }
}
@keyframes lumora-fade-in {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}
input::placeholder, textarea::placeholder {
  color: #6B6B70;
}
select option {
  background: #171717;
  color: #ffffff;
}
@media (max-width: 1024px) {
  .lumora-controls-bar { flex-wrap: wrap; }
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
    padding: "32px 40px 60px",
    maxWidth: "100%",
    boxSizing: "border-box",
  },
  topBar: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: "24px",
  },
  backBtn: {
    background: "transparent",
    border: `1px solid ${COLORS.border}`,
    color: COLORS.subtext,
    padding: "8px 14px",
    borderRadius: "8px",
    cursor: "pointer",
    fontSize: "13px",
  },
  brandTag: {
    fontSize: "12px",
    letterSpacing: "1px",
    color: COLORS.subtext,
  },
  brandDot: { color: COLORS.secondary },
  headerRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-end",
    flexWrap: "wrap",
    gap: "16px",
    marginBottom: "28px",
  },
  title: {
    fontSize: "32px",
    fontWeight: 700,
    margin: 0,
    background: `linear-gradient(90deg, ${COLORS.text}, ${COLORS.secondary})`,
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
  },
  subtitle: {
    color: COLORS.subtext,
    marginTop: "8px",
    fontSize: "14px",
    maxWidth: "480px",
  },
  newIdeaBtn: {
    background: `linear-gradient(135deg, ${COLORS.primary}, #a3551f)`,
    color: "#fff",
    border: "none",
    padding: "13px 24px",
    borderRadius: "10px",
    fontSize: "14px",
    fontWeight: 600,
    cursor: "pointer",
    transition: "transform 0.2s ease, box-shadow 0.2s ease",
    boxShadow: "0 6px 18px rgba(196,106,50,0.35)",
  },
  statsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(4, 1fr)",
    gap: "18px",
    marginBottom: "28px",
  },
  statCard: {
    position: "relative",
    background: COLORS.card,
    border: `1px solid ${COLORS.border}`,
    borderRadius: "14px",
    padding: "20px 22px",
    overflow: "hidden",
  },
  statAccent: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: "3px",
  },
  statValue: {
    fontSize: "28px",
    fontWeight: 700,
    color: COLORS.text,
  },
  statLabel: {
    fontSize: "13px",
    color: COLORS.subtext,
    marginTop: "6px",
  },
  controlsBar: {
    display: "flex",
    gap: "12px",
    flexWrap: "wrap",
    marginBottom: "28px",
  },
  searchWrap: {
    position: "relative",
    flex: "1 1 260px",
    minWidth: "220px",
  },
  searchIcon: {
    position: "absolute",
    left: "14px",
    top: "50%",
    transform: "translateY(-50%)",
    color: COLORS.subtext,
    fontSize: "16px",
  },
  searchInput: {
    width: "100%",
    background: COLORS.card,
    border: `1px solid ${COLORS.border}`,
    borderRadius: "10px",
    padding: "12px 14px 12px 38px",
    color: COLORS.text,
    fontSize: "14px",
    outline: "none",
    boxSizing: "border-box",
  },
  select: {
    background: COLORS.card,
    border: `1px solid ${COLORS.border}`,
    borderRadius: "10px",
    padding: "12px 14px",
    color: COLORS.text,
    fontSize: "13px",
    outline: "none",
    cursor: "pointer",
    minWidth: "150px",
  },
  errorBanner: {
    background: "rgba(248,113,113,0.1)",
    border: "1px solid rgba(248,113,113,0.3)",
    color: "#F87171",
    padding: "14px 18px",
    borderRadius: "10px",
    marginBottom: "20px",
    fontSize: "14px",
  },
  loadingWrap: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: "100px 0",
  },
  spinner: {
    width: "48px",
    height: "48px",
    borderRadius: "50%",
    border: `3px solid ${COLORS.border}`,
    borderTopColor: COLORS.primary,
    borderRightColor: COLORS.secondary,
    animation: "lumora-spin 0.9s linear infinite",
  },
  loadingText: {
    color: COLORS.subtext,
    marginTop: "18px",
    fontSize: "14px",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
    gap: "20px",
  },
  card: {
    background: COLORS.card,
    border: "1px solid",
    borderRadius: "16px",
    padding: "22px",
    display: "flex",
    flexDirection: "column",
    transition: "transform 0.25s ease, box-shadow 0.25s ease, border-color 0.25s ease",
    animation: "lumora-fade-in 0.4s ease",
  },
  cardTopRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "14px",
  },
  categoryTag: {
    fontSize: "11px",
    fontWeight: 600,
    letterSpacing: "0.5px",
    color: COLORS.secondary,
    background: "rgba(212,175,55,0.1)",
    padding: "5px 10px",
    borderRadius: "6px",
    textTransform: "uppercase",
  },
  priorityBadge: {
    fontSize: "11px",
    fontWeight: 600,
    padding: "5px 10px",
    borderRadius: "6px",
  },
  cardTitle: {
    fontSize: "17px",
    fontWeight: 600,
    margin: "0 0 8px",
    color: COLORS.text,
  },
  cardDescription: {
    fontSize: "13px",
    color: COLORS.subtext,
    lineHeight: 1.6,
    margin: "0 0 18px",
    flex: 1,
    display: "-webkit-box",
    WebkitLineClamp: 3,
    WebkitBoxOrient: "vertical",
    overflow: "hidden",
  },
  cardFooter: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "16px",
  },
  statusBadge: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    fontSize: "11px",
    fontWeight: 600,
    padding: "5px 10px",
    borderRadius: "20px",
  },
  statusDot: {
    width: "6px",
    height: "6px",
    borderRadius: "50%",
  },
  dateText: {
    fontSize: "12px",
    color: COLORS.subtext,
  },
  cardActions: {
    display: "flex",
    gap: "10px",
    borderTop: `1px solid ${COLORS.border}`,
    paddingTop: "14px",
  },
  editBtn: {
    flex: 1,
    background: "transparent",
    border: `1px solid ${COLORS.primary}`,
    color: COLORS.primary,
    padding: "9px 0",
    borderRadius: "8px",
    fontSize: "13px",
    fontWeight: 600,
    cursor: "pointer",
  },
  deleteBtn: {
    flex: 1,
    background: "transparent",
    border: `1px solid ${COLORS.border}`,
    color: "#F87171",
    padding: "9px 0",
    borderRadius: "8px",
    fontSize: "13px",
    fontWeight: 600,
    cursor: "pointer",
  },
  emptyWrap: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: "80px 20px",
    textAlign: "center",
  },
  emptyTitle: {
    fontSize: "20px",
    fontWeight: 600,
    marginTop: "24px",
    marginBottom: "8px",
  },
  emptyText: {
    color: COLORS.subtext,
    fontSize: "14px",
    marginBottom: "24px",
    maxWidth: "320px",
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
    zIndex: 1000,
    padding: "20px",
  },
  modalBox: {
    background: COLORS.card,
    border: `1px solid ${COLORS.border}`,
    borderRadius: "18px",
    padding: "28px",
    width: "100%",
    maxWidth: "560px",
    maxHeight: "90vh",
    overflowY: "auto",
    animation: "lumora-fade-in 0.25s ease",
  },
  modalHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "22px",
  },
  modalTitle: {
    fontSize: "20px",
    fontWeight: 700,
    margin: 0,
  },
  closeIconBtn: {
    background: "transparent",
    border: "none",
    color: COLORS.subtext,
    fontSize: "18px",
    cursor: "pointer",
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "6px",
  },
  label: {
    fontSize: "12px",
    color: COLORS.subtext,
    marginTop: "12px",
    marginBottom: "4px",
    fontWeight: 600,
    textTransform: "uppercase",
    letterSpacing: "0.5px",
  },
  input: {
    background: "#0F0F0F",
    border: `1px solid ${COLORS.border}`,
    borderRadius: "10px",
    padding: "12px 14px",
    color: COLORS.text,
    fontSize: "14px",
    outline: "none",
  },
  textarea: {
    background: "#0F0F0F",
    border: `1px solid ${COLORS.border}`,
    borderRadius: "10px",
    padding: "12px 14px",
    color: COLORS.text,
    fontSize: "14px",
    outline: "none",
    resize: "vertical",
    fontFamily: "inherit",
  },
  formRow: {
    display: "flex",
    gap: "12px",
    flexWrap: "wrap",
  },
  formCol: {
    flex: "1 1 140px",
    display: "flex",
    flexDirection: "column",
  },
  modalActions: {
    display: "flex",
    justifyContent: "flex-end",
    gap: "12px",
    marginTop: "26px",
  },
  cancelBtn: {
    background: "transparent",
    border: `1px solid ${COLORS.border}`,
    color: COLORS.subtext,
    padding: "11px 20px",
    borderRadius: "10px",
    fontSize: "14px",
    fontWeight: 600,
    cursor: "pointer",
  },
  saveBtn: {
    background: `linear-gradient(135deg, ${COLORS.primary}, #a3551f)`,
    border: "none",
    color: "#fff",
    padding: "11px 22px",
    borderRadius: "10px",
    fontSize: "14px",
    fontWeight: 600,
    cursor: "pointer",
    boxShadow: "0 6px 18px rgba(196,106,50,0.35)",
  },
  confirmBox: {
    background: COLORS.card,
    border: `1px solid ${COLORS.border}`,
    borderRadius: "18px",
    padding: "28px",
    width: "100%",
    maxWidth: "420px",
    animation: "lumora-fade-in 0.25s ease",
  },
  confirmTitle: {
    fontSize: "18px",
    fontWeight: 700,
    margin: "0 0 12px",
  },
  confirmText: {
    fontSize: "14px",
    color: COLORS.subtext,
    lineHeight: 1.6,
    margin: 0,
  },
  deleteConfirmBtn: {
    background: "#F87171",
    border: "none",
    color: "#090909",
    padding: "11px 22px",
    borderRadius: "10px",
    fontSize: "14px",
    fontWeight: 700,
    cursor: "pointer",
  },
};

export default IdeaVault;