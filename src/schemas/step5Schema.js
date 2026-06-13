import { z } from 'zod';
import { validateGST } from '../utils/gstValidator';

export const EMPLOYMENT_TYPE_OPTIONS = ['Salaried', 'Self-Employed', 'Business Owner'];
export const BUSINESS_TYPE_OPTIONS = [
  'Sole Proprietorship',
  'Partnership',
  'Professional Practice',
  'Freelance/Consultancy',
  'Other',
];

const requiredString = (label, max) => z
  .string()
  .trim()
  .min(1, `${label} is required`)
  .min(2, `${label} must be at least 2 characters`)
  .max(max, `${label} must be ${max} characters or fewer`);

const moneyString = (requiredMessage, minimum, minimumMessage) => z
  .string()
  .min(1, requiredMessage)
  .regex(/^\d+$/, 'Enter a valid amount')
  .refine((value) => Number(value) >= minimum, minimumMessage);

const numberField = (requiredMessage, minimum, maximum, minimumMessage) => z.preprocess(
  (value) => (value === '' ? undefined : value),
  z.coerce
    .number({ error: requiredMessage })
    .min(minimum, minimumMessage)
    .max(maximum, `Value cannot exceed ${maximum}`),
);

const officeAddressSchema = z.object({
  addressLine1: z
    .string()
    .trim()
    .min(1, 'Office address line 1 is required')
    .min(5, 'Office address line 1 must be at least 5 characters')
    .max(200, 'Office address line 1 must be 200 characters or fewer'),
  pincode: z
    .string()
    .min(1, 'Office PIN code is required')
    .regex(/^\d{6}$/, 'PIN code must be 6 digits'),
  city: z.string().trim().min(1, 'Office city is required'),
  state: z.string().trim().min(1, 'Office state is required'),
});

const commonExperience = {
  yearsOfExperience: numberField(
    'Years of experience is required',
    0,
    50,
    'Years of experience cannot be negative',
  ),
};

const salariedSchema = z.object({
  employmentType: z.literal('Salaried'),
  companyName: requiredString('Company name', 100),
  designation: requiredString('Designation', 60),
  monthlyNetSalary: moneyString(
    'Monthly net salary is required',
    15000,
    'Minimum monthly salary for salaried applicants is ₹15,000',
  ),
  ...commonExperience,
});

const businessBase = {
  businessName: requiredString('Business name', 100),
  businessType: z.enum(BUSINESS_TYPE_OPTIONS, { error: 'Please select a business type' }),
  annualTurnover: moneyString(
    'Annual turnover is required',
    300000,
    'Minimum annual turnover for self-employed applicants is ₹3,00,000',
  ),
  yearsInBusiness: numberField(
    'Years in business is required',
    2,
    50,
    'Minimum 2 years in business required',
  ),
  officeAddress: officeAddressSchema,
  ...commonExperience,
};

const selfEmployedSchema = z.object({
  employmentType: z.literal('Self-Employed'),
  ...businessBase,
  monthlyIncome: moneyString('Monthly income is required', 1, 'Monthly income must be positive'),
});

const businessOwnerSchema = z.object({
  employmentType: z.literal('Business Owner'),
  ...businessBase,
  gstNumber: z.string().min(1, 'GST number is required').superRefine((gst, ctx) => {
    if (!gst) return;
    const validation = validateGST(gst);
    if (!validation.valid) {
      ctx.addIssue({ code: 'custom', message: validation.error });
    }
  }),
});

const employmentUnion = z.discriminatedUnion('employmentType', [
  salariedSchema,
  selfEmployedSchema,
  businessOwnerSchema,
]);

export function buildStep5Schema(loanType) {
  // Zod 4 supports refinements directly on discriminated unions. Branch parsing
  // runs first; this second layer enforces policy inherited from Step 1.
  return employmentUnion.superRefine((data, ctx) => {
    if (loanType === 'Business' && data.employmentType === 'Salaried') {
      ctx.addIssue({
        code: 'custom',
        path: ['employmentType'],
        message: 'Business loans require Self-Employed or Business Owner employment type. Please change your Loan Type in Step 1, or update your employment type here.',
      });
    }
  });
}

export const step5Schema = buildStep5Schema();

export default step5Schema;
