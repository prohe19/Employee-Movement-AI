import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { AppShell } from "../components/AppShell";
import { Tabs } from "../components/Tabs";
import { InfoNote, TextInput } from "../components/ui";
import { settingsApi } from "../api/endpoints";
import { ApiError } from "../api/client";
import { useAuth } from "../auth/AuthContext";
import type { Setting } from "../api/types";
import { TemplatesPage } from "./TemplatesPage";
import { SignatoriesPage } from "./SignatoriesPage";

type Tab = "general" | "templates" | "signatories";
const TABS: { key: Tab; label: string }[] = [
  { key: "general", label: "GENERAL" },
  { key: "templates", label: "TEMPLATES" },
  { key: "signatories", label: "SIGNATORIES" },
];

export function SettingsPage() {
  const [params, setParams] = useSearchParams();
  const tabParam = params.get("tab") as Tab | null;
  const [tab, setTab] = useState<Tab>(tabParam && TABS.some((t) => t.key === tabParam) ? tabParam : "general");

  const changeTab = (t: Tab) => {
    setTab(t);
    setParams(t === "general" ? {} : { tab: t }, { replace: true });
  };

  return (
    <AppShell eyebrow="// CONFIGURATION" title="Settings">
      <Tabs tabs={TABS} active={tab} onChange={changeTab} />
      <div style={{ marginTop: 18 }}>
        {tab === "general" && <GeneralSettings />}
        {tab === "templates" && <TemplatesPage embedded />}
        {tab === "signatories" && <SignatoriesPage embedded />}
      </div>
    </AppShell>
  );
}

function GeneralSettings() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const [settings, setSettings] = useState<Setting | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    settingsApi
      .get()
      .then(({ settings }) => setSettings(settings))
      .catch((e) => setError(e.message));
  }, []);

  const update = (key: keyof Setting) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setSettings((s) => (s ? { ...s, [key]: e.target.value } : s));

  const save = async () => {
    if (!settings) return;
    setSaving(true);
    setSaved(false);
    setError(null);
    try {
      const { settings: updated } = await settingsApi.update({
        numberingFormat: settings.numberingFormat,
        defaultCity: settings.defaultCity,
        defaultCompany: settings.defaultCompany,
        dateFormat: settings.dateFormat,
      });
      setSettings(updated);
      setSaved(true);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Could not save settings");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      {error && <div className="alert alert-error" style={{ marginBottom: 14 }}>{error}</div>}
      {saved && <div className="alert alert-ok" style={{ marginBottom: 14 }}>Settings saved.</div>}

      {settings && (
        <div className="panel" style={{ maxWidth: 720 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <div style={{ gridColumn: "1 / -1" }}>
              <div className="label">// ANNOUNCEMENT NUMBER FORMAT</div>
              <TextInput value={settings.numberingFormat} onChange={update("numberingFormat")} disabled={!isAdmin} />
            </div>
            <div>
              <div className="label">// DEFAULT CITY</div>
              <TextInput value={settings.defaultCity} onChange={update("defaultCity")} disabled={!isAdmin} />
            </div>
            <div>
              <div className="label">// DATE FORMAT</div>
              <TextInput value={settings.dateFormat} onChange={update("dateFormat")} disabled={!isAdmin} />
            </div>
            <div style={{ gridColumn: "1 / -1" }}>
              <div className="label">// DEFAULT COMPANY</div>
              <TextInput value={settings.defaultCompany} onChange={update("defaultCompany")} disabled={!isAdmin} />
            </div>
          </div>

          <InfoNote style={{ marginTop: 18 }}>
            Number format tokens: <strong style={{ color: "#c98bff" }}>{"{seq}"}</strong> (sequence),{" "}
            <strong style={{ color: "#c98bff" }}>{"{month}"}</strong>, <strong style={{ color: "#c98bff" }}>{"{year}"}</strong>.
            Uniqueness is enforced server-side.
          </InfoNote>

          {isAdmin ? (
            <button className="btn" style={{ marginTop: 18 }} onClick={save} disabled={saving}>
              {saving ? "SAVING…" : "SAVE SETTINGS"}
            </button>
          ) : (
            <div className="alert alert-warn" style={{ marginTop: 18 }}>
              Only admins can change settings. You are signed in as <strong>{user?.role}</strong>.
            </div>
          )}
        </div>
      )}
    </>
  );
}
