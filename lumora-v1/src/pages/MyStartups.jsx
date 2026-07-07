import React, { useState, useEffect } from "react";
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
};

const STATUS_OPTIONS = ["Active", "Completed", "Archived"];

const MyStartups = () => {
  const navigate = useNavigate();

  const [startups, setStartups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState("create"); // "create" | "edit"
  const [activeStartup, setActiveStartup] = useState(null);

  const [formName, setFormName] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formStatus, setFormStatus] = useState("Active");
  const [submitting, setSubmitting] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const fetchStartups = async () => {
    try {
      setLoading(true);
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        console.error("No authenticated user found.");
        setStartups([]);
        return;
      }

      const { data, error } = await supabase
        .from("startups")
        .select("*")
        .eq("user_id", user.id)
        .order("id", { ascending: false });

      if (error) throw error;

      setStartups(data || []);
    } catch (error) {
      console.error("Error fetching startups:", error.message);
      alert("Failed to load startups. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStartups();
  }, []);

  const resetForm = () => {
    setFormName("");
    setFormDescription("");
    setFormStatus("Active");
    setActiveStartup(null);
  };

  const openCreateModal = () => {
    resetForm();
    setModalMode("create");
    setIsModalOpen(true);
  };

  const openEditModal = (startup) => {
    setActiveStartup(startup);
    setFormName(startup.name || "");
    setFormDescription(startup.description || "");
    setFormStatus(startup.status || "Active");
    setModalMode("edit");
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    resetForm();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formName.trim()) {
      alert("Startup name is required.");
      return;
    }

    try {
      setSubmitting(true);

      if (modalMode === "create") {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          alert("You must be logged in to create a startup.");
          return;
        }

        const { error } = await supabase.from("startups").insert([
          {
            user_id: user.id,
            name: formName.trim(),
            description: formDescription.trim(),
            status: formStatus,
          },
        ]);

        if (error) throw error;
      } else if (modalMode === "edit" && activeStartup) {
        const { error } = await supabase
          .from("startups")
          .update({
            name: formName.trim(),
            description: formDescription.trim(),
            status: formStatus,
          })
          .eq("id", activeStartup.id);

        if (error) throw error;
      }

      closeModal();
      await fetchStartups();
    } catch (error) {
      console.error("Error saving startup:", error.message);
      alert("Failed to save startup. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const confirmDelete = (startup) => {
    setDeleteTarget(startup);
  };

  const cancelDelete = () => {
    setDeleteTarget(null);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;

    try {
      setDeleting(true);
      const { error } = await supabase
        .from("startups")
        .delete()
        .eq("id", deleteTarget.id);

      if (error) throw error;

      setDeleteTarget(null);
      await fetchStartups();
    } catch (error) {
      console.error("Error deleting startup:", error.message);
      alert("Failed to delete startup. Please try again.");
    } finally {
      setDeleting(false);
    }
  };

  const handleCardClick = (id) => {
    navigate(`/startup/${id}`);
  };

  const filteredStartups = startups.filter((startup) => {
    const matchesSearch = startup.name
      ?.toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesStatus =
      statusFilter === "All" || startup.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status) => {
    switch (status) {
      case "Active":
        return COLORS.secondary;
      case "Completed":
        return "#4ADE80";
      case "Archived":
        return "#71717A";
      default:
        return COLORS.secondaryText;
    }
  };

  return (
    <div
      style={{
        display: "flex",
        minHeight: "100vh",
        backgroundColor: COLORS.background,
        fontFamily:
          "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      }}
    >
      <Sidebar />

      <div
        style={{
          flex: 1,
          padding: "40px",
          color: COLORS.text,
          maxWidth: "100%",
          boxSizing: "border-box",
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "16px",
            marginBottom: "32px",
          }}
        >
          <div>
            <h1
              style={{
                fontSize: "28px",
                fontWeight: 700,
                margin: 0,
                letterSpacing: "-0.5px",
                color: COLORS.text,
              }}
            >
              My Startups
            </h1>
            <p
              style={{
                margin: "6px 0 0 0",
                color: COLORS.secondaryText,
                fontSize: "14px",
              }}
            >
              Manage and track all your startup ventures in one place.
            </p>
          </div>

          <button
            onClick={openCreateModal}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              backgroundColor: COLORS.primary,
              color: "#FFFFFF",
              border: "none",
              borderRadius: "10px",
              padding: "12px 20px",
              fontSize: "14px",
              fontWeight: 600,
              cursor: "pointer",
              boxShadow: "0 4px 14px rgba(196, 106, 50, 0.35)",
              transition: "transform 0.15s ease, box-shadow 0.15s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-2px)";
              e.currentTarget.style.boxShadow =
                "0 6px 18px rgba(196, 106, 50, 0.5)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow =
                "0 4px 14px rgba(196, 106, 50, 0.35)";
            }}
          >
            <span style={{ fontSize: "18px", lineHeight: 1 }}>+</span>
            Create Startup
          </button>
        </div>

        {/* Search & Filter */}
        <div
          style={{
            display: "flex",
            gap: "16px",
            flexWrap: "wrap",
            marginBottom: "28px",
          }}
        >
          <input
            type="text"
            placeholder="Search startups by name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              flex: 1,
              minWidth: "220px",
              backgroundColor: COLORS.card,
              border: "1px solid #262626",
              borderRadius: "10px",
              padding: "12px 16px",
              color: COLORS.text,
              fontSize: "14px",
              outline: "none",
            }}
          />

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{
              backgroundColor: COLORS.card,
              border: "1px solid #262626",
              borderRadius: "10px",
              padding: "12px 16px",
              color: COLORS.text,
              fontSize: "14px",
              outline: "none",
              cursor: "pointer",
              minWidth: "160px",
            }}
          >
            <option value="All">All Statuses</option>
            <option value="Active">Active</option>
            <option value="Completed">Completed</option>
            <option value="Archived">Archived</option>
          </select>
        </div>

        {/* Content */}
        {loading ? (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              padding: "80px 0",
            }}
          >
            <div
              style={{
                width: "44px",
                height: "44px",
                border: `4px solid #262626`,
                borderTop: `4px solid ${COLORS.primary}`,
                borderRadius: "50%",
                animation: "lumora-spin 0.8s linear infinite",
              }}
            />
            <style>
              {`@keyframes lumora-spin { 0% { transform: rotate(0deg);} 100% { transform: rotate(360deg);} }`}
            </style>
            <p style={{ color: COLORS.secondaryText, marginTop: "16px" }}>
              Loading startups...
            </p>
          </div>
        ) : filteredStartups.length === 0 ? (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              padding: "80px 20px",
              backgroundColor: COLORS.card,
              borderRadius: "16px",
              border: "1px solid #262626",
            }}
          >
            <div
              style={{
                fontSize: "48px",
                marginBottom: "16px",
              }}
            >
              🚀
            </div>
            <h3
              style={{
                margin: 0,
                color: COLORS.text,
                fontSize: "20px",
                fontWeight: 600,
              }}
            >
              No Startups Found
            </h3>
            <p
              style={{
                color: COLORS.secondaryText,
                marginTop: "8px",
                marginBottom: "24px",
                textAlign: "center",
              }}
            >
              Create your first startup to get started.
            </p>
            <button
              onClick={openCreateModal}
              style={{
                backgroundColor: COLORS.primary,
                color: "#FFFFFF",
                border: "none",
                borderRadius: "10px",
                padding: "12px 22px",
                fontSize: "14px",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              + Create Startup
            </button>
          </div>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
              gap: "20px",
            }}
          >
            {filteredStartups.map((startup) => (
              <div
                key={startup.id}
                onClick={() => handleCardClick(startup.id)}
                style={{
                  backgroundColor: COLORS.card,
                  borderRadius: "16px",
                  padding: "22px",
                  border: "1px solid #262626",
                  cursor: "pointer",
                  transition:
                    "transform 0.18s ease, box-shadow 0.18s ease, border-color 0.18s ease",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-4px)";
                  e.currentTarget.style.boxShadow =
                    "0 12px 30px rgba(0,0,0,0.45)";
                  e.currentTarget.style.borderColor = COLORS.primary;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "none";
                  e.currentTarget.style.borderColor = "#262626";
                }}
              >
                <div>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                      marginBottom: "12px",
                    }}
                  >
                    <h3
                      style={{
                        margin: 0,
                        fontSize: "18px",
                        fontWeight: 700,
                        color: COLORS.text,
                        wordBreak: "break-word",
                        paddingRight: "8px",
                      }}
                    >
                      {startup.name}
                    </h3>
                    <span
                      style={{
                        fontSize: "11px",
                        fontWeight: 700,
                        color: getStatusColor(startup.status),
                        backgroundColor: "rgba(255,255,255,0.05)",
                        padding: "4px 10px",
                        borderRadius: "999px",
                        whiteSpace: "nowrap",
                        border: `1px solid ${getStatusColor(startup.status)}`,
                      }}
                    >
                      {startup.status || "N/A"}
                    </span>
                  </div>

                  <p
                    style={{
                      color: COLORS.secondaryText,
                      fontSize: "14px",
                      lineHeight: 1.5,
                      margin: 0,
                      display: "-webkit-box",
                      WebkitLineClamp: 3,
                      WebkitBoxOrient: "vertical",
                      overflow: "hidden",
                    }}
                  >
                    {startup.description || "No description provided."}
                  </p>
                </div>

                <div
                  style={{
                    display: "flex",
                    gap: "10px",
                    marginTop: "20px",
                  }}
                >
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      openEditModal(startup);
                    }}
                    style={{
                      flex: 1,
                      backgroundColor: "transparent",
                      color: COLORS.secondary,
                      border: `1px solid ${COLORS.secondary}`,
                      borderRadius: "8px",
                      padding: "8px 12px",
                      fontSize: "13px",
                      fontWeight: 600,
                      cursor: "pointer",
                      transition: "background-color 0.15s ease",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor =
                        "rgba(212, 175, 55, 0.12)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = "transparent";
                    }}
                  >
                    Edit
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      confirmDelete(startup);
                    }}
                    style={{
                      flex: 1,
                      backgroundColor: "transparent",
                      color: "#EF4444",
                      border: "1px solid #EF4444",
                      borderRadius: "8px",
                      padding: "8px 12px",
                      fontSize: "13px",
                      fontWeight: 600,
                      cursor: "pointer",
                      transition: "background-color 0.15s ease",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor =
                        "rgba(239, 68, 68, 0.12)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = "transparent";
                    }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create / Edit Modal */}
      {isModalOpen && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0,0,0,0.65)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            padding: "20px",
          }}
          onClick={closeModal}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundColor: COLORS.card,
              borderRadius: "18px",
              padding: "32px",
              width: "100%",
              maxWidth: "460px",
              border: "1px solid #262626",
              boxShadow: "0 20px 60px rgba(0,0,0,0.5)",
            }}
          >
            <h2
              style={{
                margin: "0 0 24px 0",
                color: COLORS.text,
                fontSize: "22px",
                fontWeight: 700,
              }}
            >
              {modalMode === "create" ? "Create Startup" : "Edit Startup"}
            </h2>

            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: "18px" }}>
                <label
                  style={{
                    display: "block",
                    marginBottom: "8px",
                    color: COLORS.secondaryText,
                    fontSize: "13px",
                    fontWeight: 600,
                  }}
                >
                  Startup Name
                </label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g. Lumora AI"
                  style={{
                    width: "100%",
                    backgroundColor: "#0F0F0F",
                    border: "1px solid #262626",
                    borderRadius: "10px",
                    padding: "12px 14px",
                    color: COLORS.text,
                    fontSize: "14px",
                    outline: "none",
                    boxSizing: "border-box",
                  }}
                  required
                />
              </div>

              <div style={{ marginBottom: "18px" }}>
                <label
                  style={{
                    display: "block",
                    marginBottom: "8px",
                    color: COLORS.secondaryText,
                    fontSize: "13px",
                    fontWeight: 600,
                  }}
                >
                  Description
                </label>
                <textarea
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Briefly describe your startup..."
                  rows={4}
                  style={{
                    width: "100%",
                    backgroundColor: "#0F0F0F",
                    border: "1px solid #262626",
                    borderRadius: "10px",
                    padding: "12px 14px",
                    color: COLORS.text,
                    fontSize: "14px",
                    outline: "none",
                    resize: "vertical",
                    fontFamily: "inherit",
                    boxSizing: "border-box",
                  }}
                />
              </div>

              <div style={{ marginBottom: "26px" }}>
                <label
                  style={{
                    display: "block",
                    marginBottom: "8px",
                    color: COLORS.secondaryText,
                    fontSize: "13px",
                    fontWeight: 600,
                  }}
                >
                  Status
                </label>
                <select
                  value={formStatus}
                  onChange={(e) => setFormStatus(e.target.value)}
                  style={{
                    width: "100%",
                    backgroundColor: "#0F0F0F",
                    border: "1px solid #262626",
                    borderRadius: "10px",
                    padding: "12px 14px",
                    color: COLORS.text,
                    fontSize: "14px",
                    outline: "none",
                    cursor: "pointer",
                    boxSizing: "border-box",
                  }}
                >
                  {STATUS_OPTIONS.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </div>

              <div
                style={{
                  display: "flex",
                  gap: "12px",
                  justifyContent: "flex-end",
                }}
              >
                <button
                  type="button"
                  onClick={closeModal}
                  style={{
                    backgroundColor: "transparent",
                    color: COLORS.secondaryText,
                    border: "1px solid #262626",
                    borderRadius: "10px",
                    padding: "11px 20px",
                    fontSize: "14px",
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  style={{
                    backgroundColor: COLORS.primary,
                    color: "#FFFFFF",
                    border: "none",
                    borderRadius: "10px",
                    padding: "11px 24px",
                    fontSize: "14px",
                    fontWeight: 600,
                    cursor: submitting ? "not-allowed" : "pointer",
                    opacity: submitting ? 0.7 : 1,
                  }}
                >
                  {submitting
                    ? "Saving..."
                    : modalMode === "create"
                    ? "Create"
                    : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0,0,0,0.65)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            padding: "20px",
          }}
          onClick={cancelDelete}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundColor: COLORS.card,
              borderRadius: "18px",
              padding: "28px",
              width: "100%",
              maxWidth: "400px",
              border: "1px solid #262626",
              boxShadow: "0 20px 60px rgba(0,0,0,0.5)",
              textAlign: "center",
            }}
          >
            <div style={{ fontSize: "40px", marginBottom: "12px" }}>⚠️</div>
            <h3
              style={{
                margin: "0 0 8px 0",
                color: COLORS.text,
                fontSize: "18px",
                fontWeight: 700,
              }}
            >
              Delete Startup?
            </h3>
            <p
              style={{
                color: COLORS.secondaryText,
                fontSize: "14px",
                marginBottom: "24px",
              }}
            >
              Are you sure you want to delete{" "}
              <strong style={{ color: COLORS.text }}>
                {deleteTarget.name}
              </strong>
              ? This action cannot be undone.
            </p>
            <div
              style={{
                display: "flex",
                gap: "12px",
                justifyContent: "center",
              }}
            >
              <button
                onClick={cancelDelete}
                style={{
                  backgroundColor: "transparent",
                  color: COLORS.secondaryText,
                  border: "1px solid #262626",
                  borderRadius: "10px",
                  padding: "11px 20px",
                  fontSize: "14px",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                style={{
                  backgroundColor: "#EF4444",
                  color: "#FFFFFF",
                  border: "none",
                  borderRadius: "10px",
                  padding: "11px 20px",
                  fontSize: "14px",
                  fontWeight: 600,
                  cursor: deleting ? "not-allowed" : "pointer",
                  opacity: deleting ? 0.7 : 1,
                }}
              >
                {deleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyStartups;