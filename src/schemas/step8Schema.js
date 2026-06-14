import { z } from 'zod';

const requiredConsent = (message) => z.boolean().refine((value) => value === true, { message });

export function buildStep8Schema(exceedsAffordabilityThreshold) {
  return z.object({
    consentAccuracy: requiredConsent('Please confirm the information provided is accurate'),
    consentCreditCheck: requiredConsent('Please authorise the credit score check to proceed'),
    consentTerms: requiredConsent('Please agree to the Terms and Conditions'),
    consentCommunications: requiredConsent('Please consent to receive communications regarding this application'),
    emiAffordabilityAcknowledged: z.boolean().optional(),
  }).superRefine((data, ctx) => {
    if (exceedsAffordabilityThreshold && data.emiAffordabilityAcknowledged !== true) {
      ctx.addIssue({
        code: 'custom',
        path: ['emiAffordabilityAcknowledged'],
        message: 'Please acknowledge that your EMI exceeds 50% of your monthly income to proceed',
      });
    }
  });
}
