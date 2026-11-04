import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { AppShell } from "../../components/AppShell";
import { PrismLogo } from "../../components/PrismLogo";
import { Stepper } from "./Stepper";
import { MovementDetailsStep } from "./MovementDetailsStep";
import { DetailsStep } from "./DetailsStep";
import { PreviewStep } from "./PreviewStep";
import { announcementToWizardState, emptyEmployee, WizardState } from "./wizardTypes";
import { announcementsApi } from "../../api/endpoints";
import type { MovementType } from "../../api/types";

const STEP_META: Record<number, { title: string }> = {
  1: { title: "Movement Details" },
  2: { title: "Announcement Details" },
  3: { title: "Preview & Generate" },
};

function initialState(): WizardState {
  return {
    announcementNumber: "",
    announcementDate: new Date().toISOString().slice(0, 10),
    city: "Jakarta",
    notes: "",
    templateId: "",
    movementType: "Transfer" as MovementType,
    emailLogoKey: "ITM",
    letterheadKey: "ITM",
    employees: [emptyEmployee()],
    announcementId: null,
  };
}

export function CreatePage() {
  const { id } = useParams<{ id?: string }>();
  const isEdit = Boolean(id);
  const [step, setStep] = useState(1);
  const [state, setState] = useState<WizardState>(initialState());
  const [loading, setLoading] = useState(isEdit);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    announcementsApi
      .get(id)
      .then(({ announcement }) => setState(announcementToWizardState(announcement)))
      .catch((e) => setLoadError(e.message ?? "Could not load this announcement"))
      .finally(() => setLoading(false));
  }, [id]);

  const patch = (updates: Partial<WizardState>) => setState((s) => ({ ...s, ...updates }));
  const meta = STEP_META[step];
  const prefix = isEdit ? "EDIT ANNOUNCEMENT" : "CREATE ANNOUNCEMENT";

  if (loading)
    return (
      <AppShell eyebrow={`// ${prefix}`} title="Loading…">
        <div style={{ display: "flex", justifyContent: "center", padding: 80 }}>
          <div className="cp-glow"><PrismLogo size={56} /></div>
        </div>
      </AppShell>
    );

  if (loadError)
    return (
      <AppShell eyebrow={`// ${prefix}`} title="Edit Announcement">
        <div className="alert alert-error" style={{ marginTop: 18 }}>{loadError}</div>
      </AppShell>
    );

  return (
    <AppShell eyebrow={`// ${prefix} · STEP ${step}`} title={meta.title}>
      <Stepper current={step} />
      <div style={{ marginTop: 24 }}>
        {step === 1 && <MovementDetailsStep state={state} patch={patch} onNext={() => setStep(2)} />}
        {step === 2 && (
          <DetailsStep state={state} patch={patch} onBack={() => setStep(1)} onNext={() => setStep(3)} />
        )}
        {step === 3 && <PreviewStep state={state} onBack={() => setStep(2)} />}
      </div>
    </AppShell>
  );
}
