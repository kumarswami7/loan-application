import { getVisibleSteps } from '../components/wizard/stepRegistry';
import { buildLoanSummary } from '../utils/emiCalculator';
import { buildStep1Schema } from './step1Schema';
import step2Schema, { getMaxTenureMonths } from './step2Schema';
import { buildStep3Schema } from './step3Schema';
import { buildStep4Schema } from './step4Schema';
import { buildStep5Schema } from './step5Schema';
import step6Schema from './step6Schema';
import { buildStep7Schema } from './step7Schema';
import { buildStep8Schema } from './step8Schema';

const STEP_ALIASES = {
  step1: 'loanType',
  step2: 'personalInfo',
  step3: 'kyc',
  step4: 'address',
  step5: 'employment',
  step6: 'coApplicant',
  step7: 'documents',
  step8: 'review',
};

function canonicalStepId(stepId) {
  return STEP_ALIASES[stepId] || stepId;
}

function affordabilityThreshold(formData) {
  const primaryIncome = Number(formData?.employment?.monthlyIncomeForEMI || 0);
  const coApplicantIncome = Number(formData?.coApplicant?.coApplicantIncome || 0);
  return buildLoanSummary(
    formData?.loanType?.loanType,
    formData?.loanType?.loanAmount,
    formData?.loanType?.loanTenure,
    primaryIncome + coApplicantIncome,
  ).exceedsAffordabilityThreshold;
}

/**
 * Centralizes Section B3's dependency map.
 *
 * 1: Step 1 loan type -> Step 5 employment policy (wired below).
 * 2/4: Step 1 loan type/amount -> Step 6 visibility (stepRegistry).
 * 3: Step 1 loan type -> Step 7 requirements (buildStep7Schema).
 * 5/6: Step 1 amount/tenure -> Step 8 affordability (buildLoanSummary).
 * 7: Step 2 DOB -> Step 1 maximum tenure (getMaxTenureMonths).
 * 8: Step 2 marital status -> Step 6 relationship default (component).
 * 9: Step 3 PAN verified -> optional PAN upload (buildStep7Schema).
 * 10: Step 4 residence type -> rent validation (step4 superRefine).
 * 11: Step 5 employment type -> branch fields (discriminated union).
 * 12: Step 5 employment type -> Step 7 requirements (buildStep7Schema).
 * 13/14: Step 5 primary income + Step 6 co-applicant income -> Step 8 ratio.
 */
export function getSchemaForStep(stepId, formData = {}) {
  const id = canonicalStepId(stepId);
  switch (id) {
    case 'loanType':
      return buildStep1Schema(getMaxTenureMonths(formData.personalInfo?.dateOfBirth));
    case 'personalInfo':
      return step2Schema;
    case 'kyc':
      return buildStep3Schema(formData.loanType?.loanType);
    case 'address':
      return buildStep4Schema();
    case 'employment':
      return buildStep5Schema(formData.loanType?.loanType);
    case 'coApplicant':
      return step6Schema;
    case 'documents':
      return buildStep7Schema(formData);
    case 'review':
      return buildStep8Schema(affordabilityThreshold(formData));
    default:
      throw new Error(`Unknown step id: ${stepId}`);
  }
}

export async function validateStep(stepId, data, formData = {}) {
  const result = await getSchemaForStep(stepId, formData).safeParseAsync(data);
  return result.success
    ? { success: true, data: result.data, errors: [] }
    : { success: false, errors: result.error.issues };
}

export async function validateAllSteps(formData) {
  const results = await Promise.all(getVisibleSteps(formData).map(async ({ id }) => [
    id,
    await validateStep(id, formData[id] || {}, formData),
  ]));
  const stepErrors = Object.fromEntries(
    results.filter(([, result]) => !result.success).map(([id, result]) => [id, result.errors]),
  );
  return { valid: Object.keys(stepErrors).length === 0, stepErrors };
}
