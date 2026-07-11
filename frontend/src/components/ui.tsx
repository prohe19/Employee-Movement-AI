import { CSSProperties, ReactNode } from "react";

const CONFIDENCE_COLOR: Record<string, string> = {
  high: "#34d399",
  review: "#fbbf24",
  missing: "#f87171",
};

export function ConfidenceDot({ confidence }: { confidence: string }) {
  const color = CONFIDENCE_COLOR[confidence] ?? "#f87171";
  return (
    <span
      className="dot"
      style={{ background: color, boxShadow: `0 0 6px ${color}` }}
      title={confidence.toUpperCase()}
    />
  );
}

const STATUS_META: Record<string, { label: string; color: string }> = {
  Draft: { label: "DRAFT", color: "#c98bff" },
  RequiresReview: { label: "REQUIRES REVIEW", color: "#fbbf24" },
  ReadyToGenerate: { label: "READY", color: "#34d399" },
  Finalized: { label: "FINALIZED", color: "#3fe0d0" },
  Published: { label: "PUBLISHED", color: "#34d399" },
  Cancelled: { label: "CANCELLED", color: "#f87171" },
};

export function StatusPill({ status }: { status: string }) {
  const meta = STATUS_META[status] ?? { label: status.toUpperCase(), color: "#c98bff" };
  return (
    <span className="pill" style={{ color: meta.color }}>
      <span className="dot" style={{ width: 7, height: 7, background: meta.color, boxShadow: `0 0 6px ${meta.color}` }} />
      {meta.label}
    </span>
  );
}

interface FieldProps {
  label: string;
  children: ReactNode;
  span2?: boolean;
  right?: ReactNode;
}

export function Field({ label, children, span2, right }: FieldProps) {
  return (
    <div style={span2 ? { gridColumn: "1 / -1" } : undefined}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div className="label">{label}</div>
        {right}
      </div>
      {children}
    </div>
  );
}

export function TextInput(props: React.InputHTMLAttributes<HTMLInputElement> & { accent?: boolean }) {
  const { accent, className, ...rest } = props;
  return <input {...rest} className={`input${accent ? " accent" : ""} ${className ?? ""}`} />;
}

export function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  const { className, children, ...rest } = props;
  return (
    <select {...rest} className={`select ${className ?? ""}`} style={{ appearance: "none", cursor: "pointer", ...props.style }}>
      {children}
    </select>
  );
}

export function TextArea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const { className, ...rest } = props;
  return <textarea {...rest} className={`textarea ${className ?? ""}`} />;
}

export function InfoNote({ children, style }: { children: ReactNode; style?: CSSProperties }) {
  return (
    <div
      className="mono"
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: 9,
        padding: "11px 13px",
        border: "1px solid rgba(177,74,237,0.25)",
        background: "rgba(177,74,237,0.06)",
        fontSize: 11,
        color: "rgba(255,150,190,0.7)",
        lineHeight: 1.5,
        ...style,
      }}
    >
      <span style={{ color: "#c98bff", flex: "0 0 auto" }}>ⓘ</span>
      <span>{children}</span>
    </div>
  );
}

export function GoogleButton({ label, onClick }: { label: string; onClick?: () => void }) {
  return (
    <button type="button" className="btn-white" onClick={onClick}>
      <svg width="20" height="20" viewBox="0 0 48 48">
        <path
          fill="#EA4335"
          d="M24 9.5c3.5 0 6.6 1.2 9.1 3.6l6.8-6.8C35.9 2.4 30.3 0 24 0 14.6 0 6.5 5.4 2.6 13.2l7.9 6.2C12.4 13.6 17.7 9.5 24 9.5z"
        />
        <path
          fill="#4285F4"
          d="M46.1 24.6c0-1.6-.1-3.1-.4-4.6H24v9.1h12.4c-.5 2.9-2.2 5.3-4.6 7l7.1 5.5c4.2-3.9 6.6-9.6 6.6-16z"
        />
        <path
          fill="#FBBC05"
          d="M10.5 28.4c-.5-1.4-.8-2.9-.8-4.4s.3-3 .8-4.4l-7.9-6.2C1 16.5 0 20.1 0 24s1 7.5 2.6 10.6l7.9-6.2z"
        />
        <path
          fill="#34A853"
          d="M24 48c6.3 0 11.6-2.1 15.5-5.7l-7.1-5.5c-2 1.3-4.5 2.1-8.4 2.1-6.3 0-11.6-4.1-13.5-9.9l-7.9 6.2C6.5 42.6 14.6 48 24 48z"
        />
      </svg>
      {label}
    </button>
  );
}
