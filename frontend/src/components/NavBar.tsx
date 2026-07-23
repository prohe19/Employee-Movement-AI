import { NavLink, useNavigate } from "react-router-dom";
import { BrandLockup } from "./PrismLogo";
import { useAuth } from "../auth/AuthContext";

const NAV_ITEMS = [
  { label: "DASHBOARD", to: "/" },
  { label: "CREATE", to: "/create" },
  { label: "TRANSFER FORMS", to: "/transfer-forms" },
  { label: "RECORDS", to: "/records" },
  { label: "TEMPLATES", to: "/templates" },
  { label: "SIGNATORIES", to: "/signatories" },
  { label: "SETTINGS", to: "/settings" },
];

export function NavBar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const initials = (user?.fullName || "?")
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 18,
        borderBottom: "1px solid rgba(255,42,109,0.2)",
        paddingBottom: 18,
      }}
    >
      <BrandLockup />
      <div style={{ display: "flex", alignItems: "center", gap: 2, fontFamily: "var(--font-head)" }}>
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === "/"}
            style={({ isActive }) => ({
              padding: isActive ? "8px 14px" : "8px 12px",
              fontSize: 12,
              fontWeight: isActive ? 700 : 600,
              letterSpacing: "0.06em",
              cursor: "pointer",
              color: isActive ? "#fff" : "rgba(255,150,190,0.7)",
              background: isActive ? "linear-gradient(180deg,#ff2a6d,#d61a56)" : "transparent",
              boxShadow: isActive ? "0 0 16px rgba(255,42,109,0.5)" : "none",
            })}
          >
            {item.label}
          </NavLink>
        ))}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <button
          className="btn-ghost"
          style={{ height: 34 }}
          onClick={async () => {
            await logout();
            navigate("/login");
          }}
        >
          LOG OUT
        </button>
        <div
          title={user?.email}
          style={{
            width: 38,
            height: 38,
            border: "1.5px solid #b14aed",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontFamily: "var(--font-head)",
            fontSize: 12,
            fontWeight: 700,
            color: "#e9c8ff",
            boxShadow: "0 0 12px rgba(177,74,237,0.4)",
          }}
        >
          {initials}
        </div>
      </div>
    </div>
  );
}
