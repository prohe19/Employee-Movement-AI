import { useState } from "react";
import { AppShell } from "../../components/AppShell";
import { Stepper } from "./Stepper";
import { UploadStep } from "./UploadStep";
import { ExtractionStep } from "./ExtractionStep";
import { ReviewStep } from "./ReviewStep";
import { DetailsStep } from "./DetailsStep";
import { PreviewStep } from "./PreviewStep";
import { emptyEmployee, WizardState } from "./wizardTypes";
import type { MovementType } from "../../api/types";

const STEP_META: Record<number, { eyebrow: string; title: string }> = {
  1: { eyebrow: "// CREATE ANNOUNCEMENT · STEP 1", title: "Upload Movement Form" },
  2: { eyebrow: "// CREATE ANNOUNCEMENT · STEP 2", title: "AI Extraction" },
  3: { eyebrow: "// CREATE ANNOUNCEMENT · STEP 3", title: "Review Extracted Data" },
  4: { eyebrow: "// CREATE ANNOUNCEMENT · STEP 4", title: "Announcement Details" },
  5: { eyebrow: "// CREATE ANNOUNCEMENT · STEP 5", title: "Preview & Generate" },
};

function initialState(): WizardState {
  return {
    formId: null,
    fileName: null,
    fileUrl: null,
    pageCount: null,
    announcementNumber: "",
    announcementDate: new Date().toISOString().slice(0, 10),
    city: "Jakarta",
    notes: "",
    templateId: "",
    movementType: "Other" as MovementType,
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
        {step === 1 && <UploadStep state={state} patch={patch} onNext={() => setStep(2)} />}
        {step === 2 && (
          <ExtractionStep state={state} patch={patch} onDone={() => setStep(3)} onError={() => setStep(1)} />
        )}
        {step === 3 && (
          <ReviewStep state={state} patch={patch} onBack={() => setStep(1)} onNext={() => setStep(4)} />
        )}
        {step === 4 && (
          <DetailsStep state={state} patch={patch} onBack={() => setStep(3)} onNext={() => setStep(5)} />
        )}
        {step === 5 && <PreviewStep state={state} onBack={() => setStep(4)} />}
      </div>
    </AppShell>
  );
}
