import { ROLES, NAV_BY_ROLE } from "../../constants/roles";
import { Avatar } from "../ui/index";
import { TaskivoLogo } from "../ui/TaskivoLogo";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faXmark } from "@fortawesome/free-solid-svg-icons";

export function Sidebar({ currentUser, activePage, onNav, pendingReviewCount = 0, mappedRole, isMobile, onCloseSidebar }) {
  const role     = currentUser.role;
  const rc       = ROLES[role];
  const navLinks = NAV_BY_ROLE[role] || [];

  return (
    <nav style={{
      width: isMobile ? "80vw" : 250,
      maxWidth: isMobile ? 280 : 250,
      height: "100vh", position: "fixed", top: 0, left: 0,
      backgroundColor: "#fff", boxShadow: "2px 0 12px rgba(0,0,0,0.08)",
      zIndex: 1000, display: "flex", flexDirection: "column", paddingTop: 24,
    }}>
      {/* Brand */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "0 18px", marginBottom: 20, position: "relative" }}>
        <TaskivoLogo size={80} />
        {isMobile && onCloseSidebar && (
          <button
            onClick={onCloseSidebar}
            aria-label="Close menu"
            style={{
              position: "absolute",
              top: 0,
              right: 0,
              margin: 10,
              background: "none",
              border: "none",
              fontSize: 22,
              cursor: "pointer",
              color: "#333",
              padding: 6,
              borderRadius: 6,
            }}
          >
            <FontAwesomeIcon icon={faXmark} />
          </button>
        )}
      </div>

      {/* User identity card */}
      <div style={{ margin: "0 12px 16px", padding: "11px 13px", borderRadius: 10, backgroundColor: rc.lightBg, border: `1px solid ${rc.color}33` }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Avatar initials={currentUser.avatar} color={rc.color} size={34} />
          <div style={{ minWidth: 0 }}>
            <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: "#1a1a1a", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{currentUser.name}</p>
            <p style={{ margin: 0, fontSize: 11, fontWeight: 600, color: rc.color }}>{rc.label}</p>
          </div>
        </div>
      </div>

      {/* Nav links */}
      <div className="nav-responsive" style={{ fontSize: 14, fontWeight: 600, flex: 1, overflowY: "auto" }}>
        {navLinks.map(({ id, icon, label }) => {
          const isActive = activePage === id;
          const isLogout = id === "logout";

          return (
            <a key={id} href="#"
              onClick={e => { e.preventDefault(); onNav(id); }}
              className="nav-item"
              style={{
                display: "flex", alignItems: "center", gap: 11,
                padding: "10px 14px", margin: "2px 8px", borderRadius: 7,
                textDecoration: "none", transition: "background 0.15s",
                color: isLogout ? "#e74c3c" : isActive ? "#2386ff" : "#444",
                backgroundColor: isActive ? "#ddeeff" : "transparent",
                fontWeight: isActive ? 700 : 600,
                ...(isLogout ? { marginTop: 8, borderTop: "1px solid #f0f0f0", paddingTop: 12 } : {}),
              }}
            >
              <i className={icon} style={{ width: 16, textAlign: "center", fontSize: 14 }} />
              <span style={{ flex: 1 }}>{label}</span>
            </a>
          );
        })}
      </div>
    </nav>
  );
}