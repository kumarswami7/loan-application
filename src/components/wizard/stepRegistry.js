/**
 * Central step registry for the Wizard component (Pattern 3: Wizard with Step Registry).
 * Each entry defines a step's id, label, and a visibility predicate based on
 * the accumulated form data (used for conditional steps like Step 6).
 */

export const STEP_IDS = {
  LOAN_TYPE: 'loanType',
  PERSONAL_INFO: 'personalInfo',
  KYC: 'kyc',
  ADDRESS: 'address',
  EMPLOYMENT: 'employment',
  CO_APPLICANT: 'coApplicant',
  DOCUMENTS: 'documents',
  REVIEW: 'review',
};

export const LOAN_TYPES = {
  PERSONAL: 'Personal',
  HOME: 'Home',
  BUSINESS: 'Business',
};

/**
 * Determines whether Step 6 (Co-Applicant) should be visible, per Section B2/B3:
 * - Always shown for Home Loans
 * - Personal Loan: shown if loanAmount > 5,00,000
 * - Business Loan: shown if loanAmount > 20,00,000
 */
export function isCoApplicantStepVisible(formData) {
  const loanType = formData?.loanType?.loanType;
  const amount = Number(formData?.loanType?.loanAmount || 0);

  if (loanType === LOAN_TYPES.HOME) return true;
  if (loanType === LOAN_TYPES.PERSONAL) return amount > 500000;
  if (loanType === LOAN_TYPES.BUSINESS) return amount > 2000000;
  return false;
}

/**
 * The ordered list of steps. `isVisible` is evaluated against the live
 * accumulated form state so steps can appear/disappear dynamically
 * (e.g. changing Loan Type or Loan Amount on Step 1 affects Step 6).
 */
export const STEP_REGISTRY = [
  {
    id: STEP_IDS.LOAN_TYPE,
    label: 'Loan Details',
    shortLabel: 'Loan',
    isVisible: () => true,
  },
  {
    id: STEP_IDS.PERSONAL_INFO,
    label: 'Personal Information',
    shortLabel: 'Personal',
    isVisible: () => true,
  },
  {
    id: STEP_IDS.KYC,
    label: 'Identity Verification',
    shortLabel: 'KYC',
    isVisible: () => true,
  },
  {
    id: STEP_IDS.ADDRESS,
    label: 'Address Information',
    shortLabel: 'Address',
    isVisible: () => true,
  },
  {
    id: STEP_IDS.EMPLOYMENT,
    label: 'Employment & Income',
    shortLabel: 'Employment',
    isVisible: () => true,
  },
  {
    id: STEP_IDS.CO_APPLICANT,
    label: 'Co-Applicant & Guarantor',
    shortLabel: 'Co-Applicant',
    isVisible: isCoApplicantStepVisible,
  },
  {
    id: STEP_IDS.DOCUMENTS,
    label: 'Document Upload & E-Signature',
    shortLabel: 'Documents',
    isVisible: () => true,
  },
  {
    id: STEP_IDS.REVIEW,
    label: 'Review & Submit',
    shortLabel: 'Review',
    isVisible: () => true,
  },
];

/** Returns only the steps currently visible given the form data. */
export function getVisibleSteps(formData) {
  return STEP_REGISTRY.filter((step) => step.isVisible(formData));
}
