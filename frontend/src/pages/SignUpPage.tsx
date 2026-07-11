import { FormEvent, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { PrismLogo } from "../components/PrismLogo";
import { GoogleButton, TextInput } from "../components/ui";
import { authApi } from "../api/endpoints";
import { ApiError } from "../api/client";
import { useAuth } from "../auth/AuthContext";
import { useGoogleSignIn } from "../auth/useGoogleSignIn";

function passwordStrength(pw: string): { score: number; label: string } {
  let score = 0;
  if (pw.length >= 8) score++;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  const labels = ["Too weak", "Weak", "Fair", "Strong", "Very strong"];
  return { score, label: labels[score] };
}

export function SignUpPage() {
  const { setUser } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    fullName: "",
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [agree, setAgree] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const strength = useMemo(() => passwordStrength(form.password), [form.password]);
  const match = form.confirmPassword.length > 0 && form.password === form.confirmPassword;

  const handleGoogle = useGoogleSignIn(async (idToken) => {
    try {
      const { user } = await authApi.google(idToken);
      setUser(user);
      navigate("/");
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Google sign-up failed");
    }
  });

  const update = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!agree) {
      setError("Please accept the Terms of Service to continue.");
      return;
    }
    setBusy(true);
    try {
      const { user } = await authApi.signup(form);
      setUser(user);
      navigate("/");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Sign up failed");
    } finally {
      setBusy(false);
    }
  };

  const strengthColors = ["rgba(177,74,237,0.2)", "#f87171", "#fbbf24", "#34d399", "#34d399"];

  return (
    <div className="neon-backdrop center-screen" style={{ padding: 32 }}>
      <div
        className="frame"
        style={{
          width: "100%",
          maxWidth: 1080,
          padding: 0,
          display: "grid",
          gridTemplateColumns: "1.05fr 0.95fr",
          overflow: "hidden",
          minHeight: 680,
        }}
      >
        {/* form */}
        <form
          onSubmit={submit}
          style={{ padding: "48px 52px", display: "flex", flexDirection: "column", justifyContent: "center", gap: 15 }}
        >
          <PrismLogo size={40} />
          <div>
            <div style={{ fontFamily: "var(--font-head)", fontWeight: 700, fontSize: 26, color: "var(--text)" }}>
              Create your account
            </div>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "rgba(255,150,190,0.55)", marginTop: 6 }}>
              Join your team's workspace. Fastest with Google.
            </div>
          </div>

          <GoogleButton label="Sign up with Google" onClick={() => handleGoogle().catch((e) => setError(e.message))} />

          <div className="or-divider">
            <span className="line" />
            OR WITH EMAIL
            <span className="line" />
          </div>

          {error && <div className="alert alert-error">{error}</div>}

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <div className="label">// FULL NAME</div>
              <TextInput value={form.fullName} onChange={update("fullName")} placeholder="Jane Doe" required />
            </div>
            <div>
              <div className="label">// USERNAME</div>
              <TextInput value={form.username} onChange={update("username")} placeholder="jane.d" required />
            </div>
          </div>
          <div>
            <div className="label">// EMAIL</div>
            <TextInput type="email" value={form.email} onChange={update("email")} placeholder="you@company.com" required accent />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <div className="label">// PASSWORD</div>
              <TextInput type="password" value={form.password} onChange={update("password")} placeholder="••••••••" required />
            </div>
            <div>
              <div className="label">// CONFIRM</div>
              <input
                type="password"
                value={form.confirmPassword}
                onChange={update("confirmPassword")}
                placeholder="••••••••"
                required
                className="input"
                style={{ borderColor: match ? "rgba(52,211,153,0.4)" : undefined }}
              />
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 8, fontFamily: "var(--font-mono)", fontSize: 10, color: "rgba(255,150,190,0.5)" }}>
            <span style={{ display: "flex", gap: 3 }}>
              {[0, 1, 2, 3].map((i) => (
                <span
                  key={i}
                  style={{
                    width: 34,
                    height: 4,
                    background: i < strength.score ? strengthColors[strength.score] : "rgba(177,74,237,0.2)",
                  }}
                />
              ))}
            </span>
            {form.password ? strength.label : "Password strength"}
          </div>

          <label
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: 9,
              fontFamily: "var(--font-mono)",
              fontSize: 11,
              color: "rgba(255,150,190,0.6)",
              lineHeight: 1.5,
              cursor: "pointer",
            }}
          >
            <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} style={{ marginTop: 2 }} />
            I agree to the Terms of Service and Privacy Policy.
          </label>

          <button type="submit" className="btn" style={{ height: 50 }} disabled={busy}>
            {busy ? "CREATING…" : "CREATE ACCOUNT →"}
          </button>

          <div style={{ textAlign: "center", fontFamily: "var(--font-mono)", fontSize: 11.5, color: "rgba(255,150,190,0.55)" }}>
            Already have an account? <Link to="/login">Sign in →</Link>
          </div>
        </form>

        {/* brand */}
        <div
          style={{
            padding: "52px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            borderLeft: "1px solid rgba(177,74,237,0.22)",
            textAlign: "right",
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", lineHeight: 1.2 }}>
            <span style={{ fontFamily: "var(--font-head)", fontWeight: 700, fontSize: 16, color: "var(--text)" }}>
              ITM HR COMMUNICATION
            </span>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: 9.5, fontWeight: 700, letterSpacing: "0.2em", color: "rgba(177,74,237,0.85)" }}>
              // EMPLOYEE MOVEMENT ANALYSIS
            </span>
          </div>
          <div>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, fontWeight: 700, letterSpacing: "0.22em", color: "rgba(177,74,237,0.85)", marginBottom: 16 }}>
              // NEW OPERATOR _
            </div>
            <h1
              style={{
                margin: 0,
                fontFamily: "var(--font-wonky)",
                fontSize: 50,
                fontStyle: "italic",
                lineHeight: 0.98,
                transform: "skewX(-7deg)",
                background: "linear-gradient(180deg,#fff 0%,#ffd0e4 26%,#ff2a6d 60%,#b14aed 100%)",
                WebkitBackgroundClip: "text",
                backgroundClip: "text",
                color: "transparent",
              }}
            >
              JOIN US
            </h1>
            <p style={{ margin: "18px 0 0", fontFamily: "var(--font-mono)", fontSize: 13, lineHeight: 1.7, color: "rgba(255,150,190,0.6)", maxWidth: 360, marginLeft: "auto" }}>
              Create movement announcements from approved forms in minutes — AI extraction, editable review, and
              one-click PDF on the ITM letterhead.
            </p>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12, fontFamily: "var(--font-mono)", alignItems: "flex-end" }}>
            {["Upload approved movement forms", "AI extracts & you review every field", "Generate official announcement PDFs"].map(
              (t) => (
                <div key={t} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 12, color: "rgba(255,150,190,0.7)" }}>
                  {t}
                  <span
                    style={{
                      width: 20,
                      height: 20,
                      border: "1px solid rgba(52,211,153,0.5)",
                      color: "#34d399",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 10,
                    }}
                  >
                    ✓
                  </span>
                </div>
              )
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
