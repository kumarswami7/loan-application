import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import ProgressBar from './ProgressBar';
import ResumeDraftModal from './ResumeDraftModal';
import StepNavigation from './StepNavigation';
import { STEP_REGISTRY, getVisibleSteps } from './stepRegistry';
import { FormDataContext } from './FormDataContext';
import Step1LoanType from '../../steps/Step1LoanType';
import Step2PersonalInfo from '../../steps/Step2PersonalInfo';
import Step3KYC from '../../steps/Step3KYC';
import Step4Address from '../../steps/Step4Address';
import Step5Employment from '../../steps/Step5Employment';
import Step6CoApplicant from '../../steps/Step6CoApplicant';
import Step7Documents from '../../steps/Step7Documents';
import Step8Review from '../../steps/Step8Review';
import useAutoSave from '../../hooks/useAutoSave';
import useFormPersistence, {
  clearDraft,
  resumeDraft,
} from '../../hooks/useFormPersistence';

const STEP_COMPONENTS = {
  loanType: Step1LoanType,
  personalInfo: Step2PersonalInfo,
  kyc: Step3KYC,
  address: Step4Address,
  employment: Step5Employment,
  coApplicant: Step6CoApplicant,
  documents: Step7Documents,
  review: Step8Review,
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
  const [draftStepData, setDraftStepData] = useState({});
  const [currentStepId, setCurrentStepId] = useState(STEP_REGISTRY[0].id);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isReviewReady, setIsReviewReady] = useState(false);
  const persistence = useFormPersistence();
  const [showResumeModal, setShowResumeModal] = useState(persistence.hasSavedDraft);
  const [restoreMessage, setRestoreMessage] = useState('');
  const stepRef = useRef(null);

  const {
    showToast,
    toastMessage,
    triggerManualSave,
    dismissToast,
    cancelAutoSave,
  } = useAutoSave(
    formData,
    currentStepId,
    formData.loanType?.loanType,
    30000,
  );

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

  const saveDraftStepData = useCallback((stepId, data) => {
    setDraftStepData((previous) => ({ ...previous, [stepId]: data }));
  }, []);

  const captureCurrentStepDraft = useCallback(() => {
    const values = stepRef.current?.getDirtyValues?.();
    if (values) saveDraftStepData(currentStep.id, values);
  }, [currentStep.id, saveDraftStepData]);

  const goToStep = useCallback((stepId) => {
    if (!visibleSteps.some((step) => step.id === stepId)) return;
    captureCurrentStepDraft();
    setCurrentStepId(stepId);
    history.pushState({ step: stepId }, '', `#${stepId}`);
  }, [captureCurrentStepDraft, visibleSteps]);

  const goNext = useCallback(async () => {
    const isValid = stepRef.current?.validateAndSubmit
      ? await stepRef.current.validateAndSubmit()
      : true;

    if (!isValid) return;

    setDraftStepData((previous) => {
      const next = { ...previous };
      delete next[currentStep.id];
      return next;
    });

    if (safeIndex < visibleSteps.length - 1) {
      const nextStep = visibleSteps[safeIndex + 1];
      setCurrentStepId(nextStep.id);
      history.pushState({ step: nextStep.id }, '', `#${nextStep.id}`);
    } else {
      cancelAutoSave();
      setIsSubmitting(true);
      setIsSubmitting(false);
    }
  }, [cancelAutoSave, currentStep.id, safeIndex, visibleSteps]);

  const goPrevious = useCallback(() => {
    if (safeIndex > 0) {
      captureCurrentStepDraft();
      const prevStep = visibleSteps[safeIndex - 1];
      setCurrentStepId(prevStep.id);
    }
  }, [captureCurrentStepDraft, safeIndex, visibleSteps]);

  useEffect(() => {
    const initialStepId = STEP_REGISTRY[0].id;
    history.replaceState({ step: initialStepId }, '', `#${initialStepId}`);
  }, []); // Page refresh intentionally starts from persisted state or Step 1.

  useEffect(() => {
    // Best-effort wizard history, not a router: refreshing a hash still uses
    // the saved draft or Step 1 as the source of truth.
    const handlePopState = () => goPrevious();
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [goPrevious]);

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      const stepContainer = document.querySelector(`[data-testid="step-${currentStepId}"]`);
      const firstField = stepContainer?.querySelector(
        'input:not([type="hidden"]):not([disabled]), select:not([disabled]), textarea:not([disabled]), button:not([disabled]), [tabindex="0"]',
      );
      firstField?.focus();
    });
    return () => cancelAnimationFrame(frame);
  }, [currentStepId]);

  const handleSaveDraft = useCallback(() => {
    void triggerManualSave();
  }, [triggerManualSave]);

  const handleResumeDraft = useCallback(async () => {
    const loanType = persistence.draftMeta?.loanType;
    const restored = await resumeDraft(loanType);
    setShowResumeModal(false);
    if (restored) {
      setFormData(restored.formData);
      setDraftStepData({});
      setCurrentStepId(restored.currentStepId);
    } else {
      setFormData(INITIAL_FORM_DATA);
      setCurrentStepId(STEP_REGISTRY[0].id);
      setRestoreMessage('Your saved draft could not be restored and has been cleared. Starting fresh.');
      setTimeout(() => setRestoreMessage(''), 4000);
    }
  }, [persistence.draftMeta?.loanType]);

  const handleStartFresh = useCallback(() => {
    clearDraft(persistence.draftMeta?.loanType);
    setFormData(INITIAL_FORM_DATA);
    setDraftStepData({});
    setCurrentStepId(STEP_REGISTRY[0].id);
    setShowResumeModal(false);
  }, [persistence.draftMeta?.loanType]);

  return (
    <FormDataContext.Provider value={{
      formData,
      draftStepData,
      updateStepData,
      saveDraftStepData,
      goToStep,
    }}>
      {showResumeModal && (
        <ResumeDraftModal
          loanType={persistence.draftMeta?.loanType}
          onResume={handleResumeDraft}
          onStartFresh={handleStartFresh}
        />
      )}
      <div className="mx-auto max-w-3xl px-3 py-5 sm:px-4 sm:py-8">
        <header className="mb-6">
          <h1 className="text-2xl font-bold text-primary">LendSwift Loan Application</h1>
          <p className="text-sm text-gray-500">
            Complete all steps to receive your pre-approval summary.
          </p>
        </header>

        <ProgressBar steps={visibleSteps} currentIndex={safeIndex} />

        <main
          role="main"
          className="rounded-lg border border-gray-300 bg-white p-4 shadow-sm sm:p-6"
          aria-live="polite"
        >
          <div data-testid={`step-${currentStep.id}`}>
            <StepComponent
              ref={stepRef}
              stepId={currentStep.id}
              stepLabel={currentStep.label}
              onReadinessChange={setIsReviewReady}
            />
          </div>
        </main>

        <StepNavigation
          onPrevious={goPrevious}
          onNext={goNext}
          onSaveDraft={handleSaveDraft}
          isFirstStep={safeIndex === 0}
          isLastStep={safeIndex === visibleSteps.length - 1}
          isSubmitting={isSubmitting}
          nextDisabled={currentStep.id === 'review' && !isReviewReady}
        />
      </div>

      {restoreMessage && (
        <div role="status" className="fixed bottom-4 right-4 max-w-sm rounded bg-amber-700 px-4 py-2 text-white shadow-lg">
          {restoreMessage}
        </div>
      )}

      {showToast && (
        <div role="status" className="fixed bottom-4 right-4 flex items-center gap-3 rounded bg-accent px-4 py-2 text-white shadow-lg">
          <span>{toastMessage}</span>
          <button type="button" onClick={dismissToast} aria-label="Dismiss draft saved notification" className="font-bold">
            <span aria-hidden="true">&times;</span>
          </button>
        </div>
      )}
    </FormDataContext.Provider>
  );
}
