import { z } from 'zod';

export const LOAN_TYPE_VALUES = ['Personal', 'Home', 'Business'];

export const LOAN_CONSTRAINTS = {
  Personal: { min: 50000, max: 2500000 },
  Home: { min: 500000, max: 50000000 },
  Business: { min: 100000, max: 20000000 },
};

export const TENURE_OPTIONS = {
  Personal: [12, 24, 36, 48, 60],
  Home: [60, 120, 180, 240, 300, 360],
  Business: [12, 24, 36, 48, 60, 84],
};

export const LOAN_PURPOSE_OPTIONS = {
  Personal: ['Medical expenses', 'Education', 'Wedding', 'Travel', 'Debt consolidation', 'Other'],
  Home: ['Home purchase', 'Home construction', 'Home renovation', 'Balance transfer'],
  Business: ['Working capital', 'Equipment purchase', 'Business expansion', 'Inventory', 'Other'],
};

export function buildStep1Schema(maxTenureMonths) {
  return z
    .object({
      loanType: z.enum(LOAN_TYPE_VALUES, {
        error: 'Please select a loan type',
      }),
      loanAmount: z.coerce.number({ error: 'Loan amount is required' }),
      loanTenure: z.coerce.number({ error: 'Please select a loan tenure' }),
      loanPurpose: z.string().min(1, 'Please select a loan purpose'),
      referralCode: z.string().trim().max(20, 'Referral code must be 20 characters or fewer').optional(),
    })
    .superRefine((data, ctx) => {
      const constraints = LOAN_CONSTRAINTS[data.loanType];
      if (data.loanAmount < constraints.min) {
        ctx.addIssue({
          code: 'custom',
          path: ['loanAmount'],
          message: `Minimum amount for ${data.loanType} Loans is INR ${constraints.min.toLocaleString('en-IN')}`,
        });
      }
      if (data.loanAmount > constraints.max) {
        ctx.addIssue({
          code: 'custom',
          path: ['loanAmount'],
          message: `Maximum amount for ${data.loanType} Loans is INR ${constraints.max.toLocaleString('en-IN')}`,
        });
      }

      const allowedTenures = TENURE_OPTIONS[data.loanType];
      if (!allowedTenures.includes(data.loanTenure)) {
        ctx.addIssue({
          code: 'custom',
          path: ['loanTenure'],
          message: 'Please select a valid loan tenure',
        });
      } else if (maxTenureMonths && data.loanTenure > maxTenureMonths) {
        ctx.addIssue({
          code: 'custom',
          path: ['loanTenure'],
          message: `Loan tenure cannot exceed ${maxTenureMonths} months based on the applicant's age`,
        });
      }

      if (!LOAN_PURPOSE_OPTIONS[data.loanType].includes(data.loanPurpose)) {
        ctx.addIssue({
          code: 'custom',
          path: ['loanPurpose'],
          message: 'Please select a valid loan purpose',
        });
      }
    });
}

export const step1Schema = buildStep1Schema();

export default step1Schema;
