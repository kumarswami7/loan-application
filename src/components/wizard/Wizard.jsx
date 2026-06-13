import { useState, useMemo, useCallback, useRef } from 'react';
import ProgressBar from './ProgressBar';
import StepNavigation from './StepNavigation';
import { STEP_REGISTRY, getVisibleSteps } from './stepRegistry';
import { FormDataContext } from './FormDataContext';
import PlaceholderStep from '../../steps/PlaceholderStep';
import Step1LoanType from '../../steps/Step1LoanType';
import Step2PersonalInfo from '../../steps/Step2PersonalInfo';
import Step3KYC from '../../steps/Step3KYC';
import Step4Address from '../../steps/Step4Address';

// Map of stepId -> component. Real step components will replace
// PlaceholderStep here as they're built (Days 3-9 of the plan).
const STEP_COMPONENTS = {
  loanType: Step1LoanType,
  personalInfo: Step2PersonalInfo,
  kyc: Step3KYC,
  address: Step4Address,
  employment: PlaceholderStep,
  coApplicant: PlaceholderStep,
  documents: PlaceholderStep,
  review: PlaceholderStep,
};

const INITIAL_FORM_DATA = {
  loanType: {},
  personalInfo: {},
  kyc: {},
  address: {},
  employment: {},
  coApplicant: {},
  documents: {},
  review: {},
};

export default function Wizard() {
  const [formData, setFormData] = useState(INITIAL_FORM_DATA);
  const [currentStepId, setCurrentStepId] = useState(STEP_REGISTRY[0].id);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const stepRef = useRef(null);

  // Recompute visible steps whenever form data changes (e.g. loan type/amount
  // change affects whether the Co-Applicant step is shown - Section B3).
  const visibleSteps = useMemo(() => getVisibleSteps(formData), [formData]);

  const currentIndex = useMemo(
    () => visibleSteps.findIndex((s) => s.id === currentStepId),
    [visibleSteps, currentStepId],
  );

  // Defensive fallback: if the current step became invisible
  // (e.g. user changed loan type so Co-Applicant disappeared),
  // snap to the nearest valid step.
  const safeIndex = currentIndex === -1 ? 0 : currentIndex;
  const currentStep = visibleSteps[safeIndex];
  const StepComponent = STEP_COMPONENTS[currentStep.id];

  const updateStepData = useCallback((stepId, data) => {
    setFormData((prev) => ({ ...prev, [stepId]: { ...prev[stepId], ...data } }));
  }, []);

  const goNext = useCallback(async () => {
    const isValid = stepRef.current?.validateAndSubmit
      ? await stepRef.current.validateAndSubmit()
      : true;

    if (!isValid) return;

    if (safeIndex < visibleSteps.length - 1) {
      const nextStep = visibleSteps[safeIndex + 1];
      setCurrentStepId(nextStep.id);
      // Move focus to the new step's heading for accessibility (WCAG 2.4.3)
      requestAnimationFrame(() => {
        document.getElementById('step-heading')?.focus();
      });
    } else {
      // Last step -> submit
      setIsSubmitting(true);
      // Submission logic will be wired up in Step 8 (Review).
    }
  }, [safeIndex, visibleSteps]);

  const goPrevious = useCallback(() => {
    if (safeIndex > 0) {
      const prevStep = visibleSteps[safeIndex - 1];
      setCurrentStepId(prevStep.id);
      requestAnimationFrame(() => {
        document.getElementById('step-heading')?.focus();
      });
    }
  }, [safeIndex, visibleSteps]);

  const handleSaveDraft = useCallback(() => {
    // Will be replaced by useAutoSave's manual-save trigger (Day 7).
    console.info('Draft save requested (auto-save hook pending implementation).');
  }, []);

  return (
    <FormDataContext.Provider value={{ formData, updateStepData }}>
      <div className="max-w-3xl mx-auto px-4 py-8">
        <header className="mb-6">
          <h1 className="text-2xl font-bold text-primary">LendSwift Loan Application</h1>
          <p className="text-sm text-gray-500">
            Complete all steps to receive your pre-approval summary.
          </p>
        </header>

        <ProgressBar steps={visibleSteps} currentIndex={safeIndex} />

        <main
          className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 sm:p-6"
          aria-live="polite"
        >
          {/* tabIndex=-1 lets us programmatically focus this on step change */}
          <h2 id="step-heading" tabIndex={-1} className="sr-only">
            {currentStep.label}
          </h2>
          <StepComponent
            ref={stepRef}
            stepId={currentStep.id}
            stepLabel={currentStep.label}
          />
        </main>

        <StepNavigation
          onPrevious={goPrevious}
          onNext={goNext}
          onSaveDraft={handleSaveDraft}
          isFirstStep={safeIndex === 0}
          isLastStep={safeIndex === visibleSteps.length - 1}
          isSubmitting={isSubmitting}
        />
      </div>
    </FormDataContext.Provider>
  );
}
