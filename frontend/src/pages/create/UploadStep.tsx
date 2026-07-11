import { useRef, useState } from "react";
import { PrismLogo } from "../../components/PrismLogo";
import { TextInput } from "../../components/ui";
import { formsApi } from "../../api/endpoints";
import { ApiError } from "../../api/client";
import { formatFileSize } from "../../lib/format";
import type { WizardState } from "./wizardTypes";

interface Props {
  state: WizardState;
  patch: (updates: Partial<WizardState>) => void;
  onNext: () => void;
}

export function UploadStep({ state, patch, onNext }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFile = async (file: File) => {
    setError(null);
    setUploading(true);
    try {
      const { form } = await formsApi.upload(file);
      patch({
        formId: form.id,
        fileName: form.fileName,
        fileUrl: form.fileUrl,
        pageCount: form.pageCount,
      });
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: 16, alignItems: "start" }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragOver(false);
            const file = e.dataTransfer.files?.[0];
            if (file) handleFile(file);
          }}
          onClick={() => inputRef.current?.click()}
          style={{
            border: `1.5px dashed rgba(255,42,109,${dragOver ? 0.75 : 0.45})`,
            background: "linear-gradient(180deg,rgba(255,42,109,0.06),rgba(177,74,237,0.02))",
            padding: 46,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            textAlign: "center",
            gap: 14,
            cursor: "pointer",
          }}
        >
          <PrismLogo size={46} />
          <div>
            <div style={{ fontFamily: "var(--font-head)", fontWeight: 700, fontSize: 17, color: "var(--text)" }}>
              Drag &amp; drop the movement form
            </div>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "rgba(255,150,190,0.55)", marginTop: 6 }}>
              Approved Transfer / Assignment / Movement form · PDF or image up to 25 MB
            </div>
          </div>
          <span className="btn" style={{ height: 40 }}>
            {uploading ? "UPLOADING…" : "BROWSE FILES"}
          </span>
          <input
            ref={inputRef}
            type="file"
            accept="application/pdf,image/png,image/jpeg,image/webp"
            style={{ display: "none" }}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFile(file);
            }}
          />
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        {state.formId && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 14,
              border: "1px solid rgba(177,74,237,0.28)",
              background: "rgba(177,74,237,0.03)",
              padding: "16px 18px",
            }}
          >
            <div
              style={{
                width: 44,
                height: 44,
                border: "1px solid rgba(255,42,109,0.4)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#ff5a8c",
                flex: "0 0 auto",
              }}
            >
              <svg width="18" height="18" viewBox="0 0 16 16" fill="none">
                <path d="M4 1.5h5l3 3v10H4z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
                <path d="M9 1.5v3h3" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
              </svg>
            </div>
            <div style={{ flex: 1, minWidth: 0, fontFamily: "var(--font-mono)" }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {state.fileName}
              </div>
              <div style={{ fontSize: 11, color: "rgba(255,150,190,0.5)", marginTop: 6 }}>
                {state.pageCount ? `${state.pageCount} page${state.pageCount > 1 ? "s" : ""}` : "Ready"}
              </div>
            </div>
            <span className="pill" style={{ color: "#34d399" }}>
              <span className="dot" style={{ width: 7, height: 7, background: "#34d399", boxShadow: "0 0 6px #34d399" }} />
              UPLOADED
            </span>
          </div>
        )}
      </div>

      <div className="panel">
        <div style={{ fontFamily: "var(--font-head)", fontWeight: 700, fontSize: 14, color: "var(--text)" }}>
          Announcement Number
        </div>
        <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "rgba(255,150,190,0.5)", marginTop: 5, lineHeight: 1.5 }}>
          Enter the official number before analyzing. Leave blank to auto-generate. The AI reads the form and drafts the
          announcement automatically.
        </div>
        <div style={{ marginTop: 16 }}>
          <div className="label">// ANNOUNCEMENT NUMBER</div>
          <TextInput
            accent
            value={state.announcementNumber}
            onChange={(e) => patch({ announcementNumber: e.target.value })}
            placeholder="2016/ A/ ITM/ HR/ 6/ 2026 (optional)"
          />
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 14 }}>
          <div>
            <div className="label">// DATE</div>
            <TextInput type="date" value={state.announcementDate} onChange={(e) => patch({ announcementDate: e.target.value })} />
          </div>
          <div>
            <div className="label">// CITY</div>
            <TextInput value={state.city} onChange={(e) => patch({ city: e.target.value })} />
          </div>
        </div>
        <button
          className="btn"
          style={{ width: "100%", marginTop: 18 }}
          disabled={!state.formId || uploading}
          onClick={onNext}
        >
          ANALYZE DOCUMENT
        </button>
      </div>
    </div>
  );
}
