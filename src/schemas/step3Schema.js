import { z } from 'zod';
import {
  validateAadhaarChecksum,
  validatePAN,
  validatePANForLoanType,
  validatePassport,
  validateVoterID,
} from '../utils/validators';

function addValidationIssue(value, validator, ctx) {
  const result = validator(value);
  if (!result.valid) {
    ctx.addIssue({ code: 'custom', message: result.error });
  }
  return result.valid;
}

export function buildStep3Schema(loanType) {
  return z.object({
    panNumber: z
      .string()
      .min(1, 'PAN number is required')
      .superRefine((pan, ctx) => {
        if (!pan) return;
        const hasValidFormat = addValidationIssue(pan, validatePAN, ctx);
        if (hasValidFormat) {
          addValidationIssue(pan, (value) => validatePANForLoanType(value, loanType), ctx);
        }
      }),
    aadhaarNumber: z
      .string()
      .min(1, 'Aadhaar number is required')
      .superRefine((aadhaar, ctx) => {
        if (aadhaar) addValidationIssue(aadhaar, validateAadhaarChecksum, ctx);
      }),
    aadhaarConsent: z.boolean().refine((value) => value === true, {
      message: 'You must provide consent to proceed with Aadhaar verification',
    }),
    voterID: z.string().superRefine((voterID, ctx) => {
      if (voterID) addValidationIssue(voterID, validateVoterID, ctx);
    }).optional(),
    passport: z.string().superRefine((passport, ctx) => {
      if (passport) addValidationIssue(passport, validatePassport, ctx);
    }).optional(),
  });
}

export default buildStep3Schema;
