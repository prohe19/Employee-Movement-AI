import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { BrandLockup } from "./PrismLogo";
import { CreateModal } from "./CreateModal";
import { useAuth } from "../auth/AuthContext";

const NAV_ITEMS = [
  { label: "DASHBOARD", to: "/" },
  { label: "RECORDS", to: "/records" },
  { label: "SETTINGS", to: "/settings" },
];

const navStyle = (isActive: boolean) => ({
  padding: isActive ? "8px 14px" : "8px 12px",
  fontSize: 12,
  fontWeight: isActive ? 700 : 600,
  letterSpacing: "0.06em",
  cursor: "pointer",
  color: isActive ? "#fff" : "rgba(255,150,190,0.7)",
  background: isActive ? "linear-gradient(180deg,#ff2a6d,#d61a56)" : "transparent",
  boxShadow: isActive ? "0 0 16px rgba(255,42,109,0.5)" : "none",
  border: "none" as const,
  fontFamily: "var(--font-head)",
});

export function NavBar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [createOpen, setCreateOpen] = useState(false);
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
        <NavLink to="/" end style={({ isActive }) => navStyle(isActive)}>DASHBOARD</NavLink>
        <button onClick={() => setCreateOpen(true)} style={navStyle(false)}>CREATE</button>
        {NAV_ITEMS.slice(1).map((item) => (
          <NavLink key={item.to} to={item.to} style={({ isActive }) => navStyle(isActive)}>
            {item.label}
          </NavLink>
        ))}
      </div>
      {createOpen && <CreateModal onClose={() => setCreateOpen(false)} />}
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
