import { z } from 'zod';

export const RESIDENCE_TYPE_OPTIONS = [
  'Owned',
  'Rented',
  'Company Provided',
  'Family Owned',
];

const addressLine = (label) => z
  .string()
  .trim()
  .min(1, `${label} is required`)
  .min(5, `${label} must be at least 5 characters`)
  .max(200, `${label} must be 200 characters or fewer`);

const optionalAddressLine = z.string().trim().max(200, 'Address line must be 200 characters or fewer').optional();
const pincode = (label) => z.string().min(1, `${label} is required`).regex(/^\d{6}$/, 'PIN code must be 6 digits');
const requiredText = (label) => z.string().trim().min(1, `${label} is required`);
const yearsSchema = z.preprocess(
  (value) => (value === '' ? undefined : value),
  z.coerce
    .number({ error: 'Years at current address is required' })
    .min(0, 'Years at current address cannot be negative')
    .max(50, 'Years at current address cannot exceed 50'),
);

function addRequiredIssue(ctx, path, message) {
  ctx.addIssue({ code: 'custom', path: [path], message });
}

function validateConditionalAddress(data, ctx, prefix, label) {
  const line1 = data[`${prefix}AddressLine1`];
  const pin = data[`${prefix}Pincode`];
  const city = data[`${prefix}City`];
  const state = data[`${prefix}State`];

  if (!line1) addRequiredIssue(ctx, `${prefix}AddressLine1`, `${label} address line 1 is required`);
  else if (line1.trim().length < 5) {
    addRequiredIssue(ctx, `${prefix}AddressLine1`, `${label} address line 1 must be at least 5 characters`);
  } else if (line1.trim().length > 200) {
    addRequiredIssue(ctx, `${prefix}AddressLine1`, `${label} address line 1 must be 200 characters or fewer`);
  }

  if (!pin) addRequiredIssue(ctx, `${prefix}Pincode`, `${label} PIN code is required`);
  else if (!/^\d{6}$/.test(pin)) addRequiredIssue(ctx, `${prefix}Pincode`, 'PIN code must be 6 digits');

  if (!city?.trim()) addRequiredIssue(ctx, `${prefix}City`, `${label} city is required`);
  if (!state?.trim()) addRequiredIssue(ctx, `${prefix}State`, `${label} state is required`);
}

export function buildStep4Schema(pincodeDerivedState) {
  return z
    .object({
      currentAddressLine1: addressLine('Current address line 1'),
      currentAddressLine2: optionalAddressLine,
      currentPincode: pincode('Current PIN code'),
      currentCity: requiredText('Current city'),
      currentState: requiredText('Current state'),
      residenceType: z.enum(RESIDENCE_TYPE_OPTIONS, {
        error: 'Please select a residence type',
      }),
      rentAmount: z.string().optional(),
      yearsAtCurrentAddress: yearsSchema,
      previousAddressLine1: z.string().optional(),
      previousPincode: z.string().optional(),
      previousCity: z.string().optional(),
      previousState: z.string().optional(),
      sameAsPermanentAddress: z.boolean().default(true),
      permanentAddressLine1: z.string().optional(),
      permanentAddressLine2: optionalAddressLine,
      permanentPincode: z.string().optional(),
      permanentCity: z.string().optional(),
      permanentState: z.string().optional(),
    })
    .superRefine((data, ctx) => {
      if (data.residenceType === 'Rented') {
        const amount = Number(data.rentAmount);
        if (!data.rentAmount || !Number.isFinite(amount) || amount <= 0) {
          addRequiredIssue(ctx, 'rentAmount', 'Rent amount must be a positive number');
        }
      }

      if (data.yearsAtCurrentAddress < 1) {
        validateConditionalAddress(data, ctx, 'previous', 'Previous');
      }

      if (!data.sameAsPermanentAddress) {
        validateConditionalAddress(data, ctx, 'permanent', 'Permanent');
      }

      // A mismatch between currentState and pincodeDerivedState is advisory.
      // Step4Address renders a non-blocking warning instead of adding a Zod issue.
      void pincodeDerivedState;
    });
}

export const step4Schema = buildStep4Schema();

export default step4Schema;
