import React, { useState, useEffect } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  Home,
  Rocket,
  Lightbulb,
  Palette,
  ClipboardList,
  Bot,
  Eye,
  BarChart3,
  Mail,
  User,
  Settings,
  LogOut,
  Menu,
  X,
} from "lucide-react";

const COLORS = {
  bg: "#090909",
  card: "#171717",
  primary: "#C46A32",
  secondary: "#D4AF37",
  text: "#FFFFFF",
  textMuted: "rgba(255,255,255,0.55)",
  border: "rgba(255,255,255,0.06)",
};

const NAV_ITEMS = [
  { id: "dashboard", label: "Dashboard", icon: Home, path: "/dashboard" },
  { id: "mystartups", label: "My Startups", icon: Rocket, path: "/mystartups" },
  { id: "ideas", label: "Idea Vault", icon: Lightbulb, path: "/ideas" },
  { id: "brand", label: "Brand Studio", icon: Palette, path: "/brand" },
  { id: "canvas", label: "Business Canvas", icon: ClipboardList, path: "/canvas" },
  { id: "ai-founder", label: "AI Founder", icon: Bot, path: "/founder" },
  { id: "vision-ai", label: "Vision AI", icon: Eye, path: "/visionai" },
  //{ id: "analytics", label: "Analytics", icon: BarChart3, path: "/analytics" },
  { id: "email", label: "Email Center", icon: Mail, path: "/email" },
  { id: "profile", label: "Profile", icon: User, path: "/profile" },
  { id: "settings", label: "Settings", icon: Settings, path: "/setting" },
];

const SIDEBAR_WIDTH = 260;
const MOBILE_BREAKPOINT = 768;

export default function Sidebar({ onLogout = () => {} }) {
  const navigate = useNavigate();

  const [isMobile, setIsMobile] = useState(
    typeof window !== "undefined" ? window.innerWidth <= MOBILE_BREAKPOINT : false
  );
  const [isOpen, setIsOpen] = useState(false);
  const [hoveredItem, setHoveredItem] = useState(null);
  const [hoveredLogout, setHoveredLogout] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth <= MOBILE_BREAKPOINT;
      setIsMobile(mobile);
      if (!mobile) setIsOpen(false);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const styles = {
    toggleButton: {
      position: "fixed",
      top: 18,
      left: 18,
      zIndex: 1100,
      width: 44,
      height: 44,
      borderRadius: 12,
      background: COLORS.card,
      border: `1px solid ${COLORS.border}`,
      display: isMobile ? "flex" : "none",
      alignItems: "center",
      justifyContent: "center",
      cursor: "pointer",
      color: COLORS.text,
      boxShadow: "0 4px 14px rgba(0,0,0,0.4)",
    },
    overlay: {
      position: "fixed",
      inset: 0,
      background: "rgba(0,0,0,0.6)",
      backdropFilter: "blur(2px)",
      zIndex: 999,
      opacity: isMobile && isOpen ? 1 : 0,
      pointerEvents: isMobile && isOpen ? "auto" : "none",
      transition: "opacity 0.3s ease",
    },
    sidebar: {
      position: isMobile ? "fixed" : "relative",
      top: 0,
      left: 0,
      height: "100vh",
      width: SIDEBAR_WIDTH,
      minWidth: SIDEBAR_WIDTH,
      background: COLORS.bg,
      borderRight: `1px solid ${COLORS.border}`,
      display: "flex",
      flexDirection: "column",
      padding: "22px 16px",
      boxSizing: "border-box",
      zIndex: 1000,
      transform: isMobile ? (isOpen ? "translateX(0)" : "translateX(-110%)") : "translateX(0)",
      transition: "transform 0.35s cubic-bezier(0.4, 0, 0.2, 1)",
      boxShadow: isMobile ? "8px 0 30px rgba(0,0,0,0.5)" : "none",
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    },
    logoRow: {
      display: "flex",
      alignItems: "center",
      gap: 12,
      padding: "6px 10px 20px 10px",
      borderBottom: `1px solid ${COLORS.border}`,
      marginBottom: 18,
    },
    logoBadge: {
      width: 40,
      height: 40,
      borderRadius: 12,
      background: `linear-gradient(135deg, ${COLORS.primary}, ${COLORS.secondary})`,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontWeight: 800,
      fontSize: 18,
      color: "#0A0A0A",
      letterSpacing: -0.5,
      flexShrink: 0,
      boxShadow: `0 4px 16px rgba(196, 106, 50, 0.35)`,
    },
    logoTextWrap: {
      display: "flex",
      flexDirection: "column",
      lineHeight: 1.15,
      overflow: "hidden",
    },
    logoText: {
      fontSize: 19,
      fontWeight: 700,
      color: COLORS.text,
      letterSpacing: 1.5,
      whiteSpace: "nowrap",
    },
    tagline: {
      fontSize: 11,
      color: COLORS.secondary,
      fontWeight: 500,
      letterSpacing: 0.4,
      marginTop: 2,
      whiteSpace: "nowrap",
    },
    nav: {
      flex: 1,
      overflowY: "auto",
      display: "flex",
      flexDirection: "column",
      gap: 4,
      paddingRight: 2,
    },
    navItemBase: {
      display: "flex",
      alignItems: "center",
      gap: 12,
      padding: "10px 12px",
      borderRadius: 10,
      cursor: "pointer",
      transition: "all 0.22s ease",
      fontSize: 14,
      textDecoration: "none",
      position: "relative",
      userSelect: "none",
    },
    iconWrap: {
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      flexShrink: 0,
    },
    footer: {
      borderTop: `1px solid ${COLORS.border}`,
      paddingTop: 14,
      marginTop: 10,
    },
    logoutItem: (hovered) => ({
      display: "flex",
      alignItems: "center",
      gap: 12,
      padding: "10px 12px",
      borderRadius: 10,
      cursor: "pointer",
      color: hovered ? "#ff8a65" : COLORS.textMuted,
      background: hovered ? "rgba(255, 90, 45, 0.08)" : "transparent",
      transition: "all 0.22s ease",
      fontSize: 14,
      fontWeight: 500,
    }),
  };

  const getNavItemStyle = (isActive, hovered) => ({
    ...styles.navItemBase,
    color: isActive ? "#FFFFFF" : hovered ? COLORS.text : COLORS.textMuted,
    background: isActive
      ? `linear-gradient(90deg, ${COLORS.primary}, #a85a29)`
      : hovered
      ? "rgba(255,255,255,0.04)"
      : "transparent",
    transform: hovered && !isActive ? "translateX(3px)" : "translateX(0px)",
    boxShadow: isActive ? "0 4px 14px rgba(196, 106, 50, 0.3)" : "none",
    fontWeight: isActive ? 600 : 500,
  });

  const closeMobileMenu = () => {
    if (isMobile) setIsOpen(false);
  };

  const handleLogout = () => {
    closeMobileMenu();
    onLogout();
  };

  return (
    <>
      <button
        style={styles.toggleButton}
        onClick={() => setIsOpen((prev) => !prev)}
        aria-label="Toggle sidebar"
        type="button"
      >
        {isOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      <div style={styles.overlay} onClick={() => setIsOpen(false)} />

      <aside style={styles.sidebar}>
        <div style={styles.logoRow}>
          <div
            style={styles.logoBadge}
            onClick={() => {
              navigate("/dashboard");
              closeMobileMenu();
            }}
          >
            L
          </div>
          <div style={styles.logoTextWrap}>
            <span style={styles.logoText}>LUMORA</span>
            <span style={styles.tagline}>Founder Workspace</span>
          </div>
        </div>

        <nav style={styles.nav}>
          {NAV_ITEMS.map(({ id, label, icon: Icon, path }) => {
            const hovered = hoveredItem === id;
            return (
              <NavLink
                key={id}
                to={path}
                onClick={closeMobileMenu}
                onMouseEnter={() => setHoveredItem(id)}
                onMouseLeave={() => setHoveredItem(null)}
                style={({ isActive }) => getNavItemStyle(isActive, hovered)}
              >
                {({ isActive }) => (
                  <>
                    <span style={styles.iconWrap}>
                      <Icon size={18} strokeWidth={isActive ? 2.3 : 1.8} />
                    </span>
                    <span>{label}</span>
                  </>
                )}
              </NavLink>
            );
          })}
        </nav>

        <div style={styles.footer}>
          <div
            style={styles.logoutItem(hoveredLogout)}
            onClick={handleLogout}
            onMouseEnter={() => setHoveredLogout(true)}
            onMouseLeave={() => setHoveredLogout(false)}
          >
            <span style={styles.iconWrap}>
              <LogOut size={18} strokeWidth={1.8} />
            </span>
            <span>Logout</span>
          </div>
        </div>
      </aside>
    </>
  );
}