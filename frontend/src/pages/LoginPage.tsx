import { FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { PrismLogo } from "../components/PrismLogo";
import { GoogleButton, TextInput } from "../components/ui";
import { authApi } from "../api/endpoints";
import { ApiError } from "../api/client";
import { useAuth } from "../auth/AuthContext";
import { useGoogleSignIn } from "../auth/useGoogleSignIn";

export function LoginPage() {
  const { setUser } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const handleGoogle = useGoogleSignIn(async (idToken) => {
    try {
      const { user } = await authApi.google(idToken);
      setUser(user);
      navigate("/");
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Google sign-in failed");
    }
  });

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const { user } = await authApi.login(email, password);
      setUser(user);
      navigate("/");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Login failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="neon-backdrop center-screen" style={{ padding: 32 }}>
      <div
        className="frame"
        style={{
          width: "100%",
          maxWidth: 1080,
          padding: 0,
          display: "grid",
          gridTemplateColumns: "1.15fr 1fr",
          overflow: "hidden",
          minHeight: 640,
        }}
      >
        {/* brand */}
        <div
          style={{
            padding: "56px 52px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            borderRight: "1px solid rgba(177,74,237,0.22)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <PrismLogo size={52} />
            <div style={{ display: "flex", flexDirection: "column", lineHeight: 1.2 }}>
              <span style={{ fontFamily: "var(--font-head)", fontWeight: 700, fontSize: 16, color: "var(--text)" }}>
                ITM HR COMMUNICATION
              </span>
              <span
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: 9.5,
                  fontWeight: 700,
                  letterSpacing: "0.2em",
                  color: "rgba(177,74,237,0.85)",
                }}
              >
                // EMPLOYEE MOVEMENT ANALYSIS
              </span>
            </div>
          </div>
          <div>
            <div
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: "0.22em",
                color: "rgba(177,74,237,0.85)",
                marginBottom: 16,
              }}
            >
              // SECURE TERMINAL _
            </div>
            <h1
              style={{
                margin: 0,
                fontFamily: "var(--font-wonky)",
                fontSize: 52,
                fontStyle: "italic",
                lineHeight: 0.98,
                transform: "skewX(-7deg)",
                background: "linear-gradient(180deg,#fff 0%,#ffd0e4 26%,#ff2a6d 60%,#b14aed 100%)",
                WebkitBackgroundClip: "text",
                backgroundClip: "text",
                color: "transparent",
              }}
            >
              MOVEMENT
            </h1>
            <p
              style={{
                margin: "18px 0 0",
                fontFamily: "var(--font-mono)",
                fontSize: 13,
                lineHeight: 1.7,
                color: "rgba(255,150,190,0.6)",
                maxWidth: 420,
              }}
            >
              Generate official employee movement announcements from approved forms — extract, review, and publish on
              the ITM letterhead.
            </p>
          </div>
          <div style={{ display: "flex", gap: 26, fontFamily: "var(--font-mono)" }}>
            <Stat value="1,248" label="// ANNOUNCEMENTS" />
            <Stat value="99.2%" label="// AI ACCURACY" />
          </div>
        </div>

        {/* form */}
        <form
          onSubmit={submit}
          style={{ padding: "56px 52px", display: "flex", flexDirection: "column", justifyContent: "center", gap: 18 }}
        >
          <div>
            <div style={{ fontFamily: "var(--font-head)", fontWeight: 700, fontSize: 26, color: "var(--text)" }}>
              Sign in
            </div>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "rgba(255,150,190,0.55)", marginTop: 6 }}>
              Welcome back. Continue with Google or your email.
            </div>
          </div>

          <GoogleButton
            label="Continue with Google"
            onClick={() => handleGoogle().catch((e) => setError(e.message))}
          />

          <div className="or-divider">
            <span className="line" />
            OR SIGN IN WITH EMAIL
            <span className="line" />
          </div>

          {error && <div className="alert alert-error">{error}</div>}

          <div>
            <div className="label">// EMAIL</div>
            <TextInput
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@company.com"
              required
              accent
            />
          </div>
          <div>
            <div className="label">// PASSWORD</div>
            <div style={{ position: "relative" }}>
              <TextInput
                type={showPw ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
              <span
                onClick={() => setShowPw((s) => !s)}
                style={{
                  position: "absolute",
                  right: 14,
                  top: "50%",
                  transform: "translateY(-50%)",
                  fontSize: 11,
                  color: "rgba(255,150,190,0.6)",
                  cursor: "pointer",
                  fontFamily: "var(--font-mono)",
                }}
              >
                {showPw ? "HIDE" : "SHOW"}
              </span>
            </div>
          </div>

          <button type="submit" className="btn" style={{ height: 50 }} disabled={busy}>
            {busy ? "SIGNING IN…" : "ENTER TERMINAL →"}
          </button>

          <div
            style={{
              textAlign: "center",
              fontFamily: "var(--font-mono)",
              fontSize: 11.5,
              color: "rgba(255,150,190,0.55)",
            }}
          >
            No account yet? <Link to="/signup">Create one →</Link>
          </div>
        </form>
      </div>
    </div>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <div style={{ fontFamily: "var(--font-head)", fontWeight: 700, fontSize: 22, color: "var(--text)" }}>{value}</div>
      <div style={{ fontSize: 10, color: "rgba(177,74,237,0.8)", letterSpacing: "0.08em" }}>{label}</div>
    </div>
  );
}
