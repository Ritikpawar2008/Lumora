import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "../../supabase";

const COLORS = {
  bg: "#090909",
  card: "#171717",
  primary: "#C46A32",
  secondary: "#D4AF37",
  text: "#FFFFFF",
  subtext: "#A1A1AA",
  border: "#262626",
};

export default function AuthPage() {
  const navigate = useNavigate();
  const location = useLocation();

  const initialMode =
    location.state && location.state.mode === "register" ? "register" : "login";

  const [mode, setMode] = useState(initialMode);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const isLogin = mode === "login";

  const resetMessages = () => {
    setError("");
    setSuccess("");
  };

  const switchMode = (nextMode) => {
    setMode(nextMode);
    resetMessages();
    setPassword("");
    if (nextMode === "login") setFullName("");
  };

  const validate = () => {
    if (!email.trim()) return "Email is required.";
    if (!password.trim()) return "Password is required.";
    if (password.length < 6) return "Password must be at least 6 characters.";
    if (!isLogin && !fullName.trim()) return "Full name is required.";
    return "";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    resetMessages();

    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);

    try {
      if (isLogin) {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });

        if (signInError) throw signInError;

        navigate("/dashboard");
      } else {
        const { error: signUpError } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            data: {
              full_name: fullName.trim(),
            },
          },
        });

        if (signUpError) throw signUpError;

        setSuccess("Account Created Successfully");
        setEmail("");
        setPassword("");
        setFullName("");

        setTimeout(() => {
          setMode("login");
          setSuccess("");
        }, 1500);
      }
    } catch (err) {
      console.error("Auth error:", err);
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      <style>{cssBlock}</style>

      <div style={styles.card} className="lumora-auth-card">
        <div
          style={{ ...styles.logoWrap, cursor: "pointer" }}
          onClick={() => navigate("/")}
        >
          <div style={styles.logoBadge}>L</div>
          <div style={styles.logoText}>LUMORA</div>
        </div>
        <p style={styles.tagline}>Build Brands. Launch Faster.</p>

        <div style={styles.switchWrap}>
          <button
            type="button"
            style={{
              ...styles.switchBtn,
              ...(isLogin ? styles.switchBtnActive : {}),
            }}
            onClick={() => switchMode("login")}
          >
            Login
          </button>
          <button
            type="button"
            style={{
              ...styles.switchBtn,
              ...(!isLogin ? styles.switchBtnActive : {}),
            }}
            onClick={() => switchMode("register")}
          >
            Register
          </button>
        </div>

        <form onSubmit={handleSubmit} style={styles.form}>
          {!isLogin && (
            <div style={styles.fieldGroup}>
              <label style={styles.label}>Full Name</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Your full name"
                style={styles.input}
              />
            </div>
          )}

          <div style={styles.fieldGroup}>
            <label style={styles.label}>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              style={styles.input}
            />
          </div>

          <div style={styles.fieldGroup}>
            <label style={styles.label}>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 6 characters"
              style={styles.input}
            />
          </div>

          {error && <div style={styles.errorBox}>{error}</div>}
          {success && <div style={styles.successBox}>{success}</div>}

          <button
            type="submit"
            style={{
              ...styles.submitBtn,
              opacity: loading ? 0.7 : 1,
              cursor: loading ? "not-allowed" : "pointer",
            }}
            disabled={loading}
          >
            {loading ? (
              <span style={styles.loadingWrap}>
                <span style={styles.spinner} />
                {isLogin ? "Logging in..." : "Creating account..."}
              </span>
            ) : isLogin ? (
              "Login"
            ) : (
              "Register"
            )}
          </button>
        </form>

        <p style={styles.footerText}>
          {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
          <span
            style={styles.footerLink}
            onClick={() => switchMode(isLogin ? "register" : "login")}
          >
            {isLogin ? "Register" : "Login"}
          </span>
        </p>
      </div>
    </div>
  );
}

const cssBlock = `
@keyframes lumora-spin { to { transform: rotate(360deg); } }
@keyframes lumora-fade-in { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
input::placeholder { color: #6B6B70; }
@media (max-width: 480px) {
  .lumora-auth-card { padding: 32px 22px !important; }
}
`;

const styles = {
  page: {
    minHeight: "100vh",
    width: "100%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: COLORS.bg,
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    padding: "24px",
    boxSizing: "border-box",
  },
  card: {
    background: COLORS.card,
    border: `1px solid ${COLORS.border}`,
    borderRadius: "20px",
    padding: "42px 40px",
    width: "100%",
    maxWidth: "420px",
    boxShadow: "0 20px 60px rgba(0,0,0,0.5)",
    animation: "lumora-fade-in 0.4s ease",
    boxSizing: "border-box",
  },
  logoWrap: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "10px",
    marginBottom: "6px",
  },
  logoBadge: {
    width: "38px",
    height: "38px",
    borderRadius: "10px",
    background: `linear-gradient(135deg, ${COLORS.primary}, ${COLORS.secondary})`,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: 800,
    fontSize: "17px",
    color: "#0A0A0A",
  },
  logoText: {
    fontSize: "22px",
    fontWeight: 800,
    letterSpacing: "1.5px",
    background: `linear-gradient(90deg, ${COLORS.text}, ${COLORS.secondary})`,
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
  },
  tagline: {
    textAlign: "center",
    color: COLORS.subtext,
    fontSize: "13px",
    marginBottom: "28px",
  },
  switchWrap: {
    display: "flex",
    background: "#0F0F0F",
    border: `1px solid ${COLORS.border}`,
    borderRadius: "12px",
    padding: "4px",
    marginBottom: "24px",
  },
  switchBtn: {
    flex: 1,
    background: "transparent",
    border: "none",
    color: COLORS.subtext,
    padding: "10px 0",
    borderRadius: "9px",
    fontSize: "13.5px",
    fontWeight: 600,
    cursor: "pointer",
    transition: "all 0.2s ease",
  },
  switchBtnActive: {
    background: `linear-gradient(135deg, ${COLORS.primary}, #a3551f)`,
    color: "#fff",
    boxShadow: "0 4px 14px rgba(196,106,50,0.3)",
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "16px",
  },
  fieldGroup: {
    display: "flex",
    flexDirection: "column",
    gap: "6px",
  },
  label: {
    fontSize: "12px",
    fontWeight: 600,
    color: COLORS.subtext,
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
    boxSizing: "border-box",
    transition: "border-color 0.2s ease",
  },
  errorBox: {
    background: "rgba(248,113,113,0.1)",
    border: "1px solid rgba(248,113,113,0.3)",
    color: "#F87171",
    padding: "10px 14px",
    borderRadius: "10px",
    fontSize: "13px",
  },
  successBox: {
    background: "rgba(52,211,153,0.1)",
    border: "1px solid rgba(52,211,153,0.3)",
    color: "#34D399",
    padding: "10px 14px",
    borderRadius: "10px",
    fontSize: "13px",
  },
  submitBtn: {
    background: `linear-gradient(135deg, ${COLORS.primary}, #a3551f)`,
    border: "none",
    color: "#fff",
    padding: "13px 0",
    borderRadius: "10px",
    fontSize: "14.5px",
    fontWeight: 700,
    marginTop: "4px",
    boxShadow: "0 8px 20px rgba(196,106,50,0.3)",
  },
  loadingWrap: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
  },
  spinner: {
    width: "15px",
    height: "15px",
    borderRadius: "50%",
    border: "2px solid rgba(255,255,255,0.3)",
    borderTopColor: "#fff",
    display: "inline-block",
    animation: "lumora-spin 0.7s linear infinite",
  },
  footerText: {
    textAlign: "center",
    color: COLORS.subtext,
    fontSize: "13.5px",
    marginTop: "22px",
    marginBottom: 0,
  },
  footerLink: {
    color: COLORS.secondary,
    fontWeight: 600,
    cursor: "pointer",
  },
};