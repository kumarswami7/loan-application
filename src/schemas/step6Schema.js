import { z } from 'zod';
import { validatePAN } from '../utils/validators';

export const RELATIONSHIP_OPTIONS = ['Spouse', 'Parent', 'Sibling', 'Business Partner'];

export const step6Schema = z.object({
  coApplicantName: z
    .string()
    .trim()
    .min(1, 'Co-applicant name is required')
    .min(2, 'Co-applicant name must be at least 2 characters')
    .max(100, 'Co-applicant name must be 100 characters or fewer')
    .regex(/^[A-Za-z][A-Za-z .'-]*$/, 'Co-applicant name contains invalid characters'),
  relationship: z.enum(RELATIONSHIP_OPTIONS, { error: 'Please select a relationship' }),
  coApplicantPAN: z.string().min(1, 'Co-applicant PAN is required').superRefine((pan, ctx) => {
    if (!pan) return;
    const validation = validatePAN(pan);
    if (!validation.valid) {
      ctx.addIssue({ code: 'custom', message: validation.error });
    } else if (pan[3] !== 'P') {
      ctx.addIssue({ code: 'custom', message: "Co-applicant PAN must be an individual PAN (4th character 'P')" });
    }
  }),
  coApplicantIncome: z
    .string()
    .min(1, 'Co-applicant income is required')
    .regex(/^\d+$/, 'Enter a valid co-applicant income')
    .refine((value) => Number(value) >= 1, 'Co-applicant income must be positive'),
  coApplicantConsent: z.boolean().refine((value) => value === true, {
    message: 'Co-applicant consent is required to proceed',
  }),
  coApplicantSignature: z.string().min(1, 'Co-applicant signature is required'),
});

export default step6Schema;
