import { useState } from "react";
import { AppShell } from "../../components/AppShell";
import { Stepper } from "./Stepper";
import { MovementDetailsStep } from "./MovementDetailsStep";
import { DetailsStep } from "./DetailsStep";
import { PreviewStep } from "./PreviewStep";
import { emptyEmployee, WizardState } from "./wizardTypes";
import type { MovementType } from "../../api/types";

const STEP_META: Record<number, { eyebrow: string; title: string }> = {
  1: { eyebrow: "// CREATE ANNOUNCEMENT · STEP 1", title: "Movement Details" },
  2: { eyebrow: "// CREATE ANNOUNCEMENT · STEP 2", title: "Announcement Details" },
  3: { eyebrow: "// CREATE ANNOUNCEMENT · STEP 3", title: "Preview & Generate" },
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
  const [step, setStep] = useState(1);
  const [state, setState] = useState<WizardState>(initialState());

  const patch = (updates: Partial<WizardState>) => setState((s) => ({ ...s, ...updates }));

  const meta = STEP_META[step];

  return (
    <AppShell eyebrow={meta.eyebrow} title={meta.title}>
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
