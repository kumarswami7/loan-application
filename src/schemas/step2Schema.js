import { z } from 'zod';

export const GENDER_OPTIONS = ['Male', 'Female', 'Other', 'Prefer not to say'];
export const MARITAL_STATUS_OPTIONS = ['Single', 'Married', 'Divorced', 'Widowed'];

export function calculateAge(dobString) {
  if (!dobString) return Number.NaN;
  const dob = new Date(`${dobString}T00:00:00`);
  if (Number.isNaN(dob.getTime())) return Number.NaN;

  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const beforeBirthday =
    today.getMonth() < dob.getMonth()
    || (today.getMonth() === dob.getMonth() && today.getDate() < dob.getDate());
  if (beforeBirthday) age -= 1;
  return age;
}

export function getMaxTenureMonths(dobString) {
  const age = calculateAge(dobString);
  if (Number.isNaN(age)) return undefined;
  return Math.max(0, (65 - age) * 12);
}

const requiredName = (label) => z
  .string()
  .trim()
  .min(1, `${label} is required`)
  .min(2, `${label} must be at least 2 characters`)
  .regex(/^[A-Za-z][A-Za-z .'-]*$/, `${label} contains invalid characters`);

const mobileSchema = z
  .string()
  .min(1, 'Mobile number is required')
  .regex(/^[6-9]\d{9}$/, 'Enter a valid 10-digit mobile number');

export const step2Schema = z
  .object({
    fullName: requiredName('Full name'),
    dateOfBirth: z.string().min(1, 'Date of birth is required'),
    gender: z.enum(GENDER_OPTIONS, { error: 'Please select a gender' }),
    maritalStatus: z.enum(MARITAL_STATUS_OPTIONS, { error: 'Please select a marital status' }),
    fatherName: requiredName("Father's name"),
    motherName: requiredName("Mother's name"),
    email: z.string().min(1, 'Email is required').email('Enter a valid email address'),
    mobileNumber: mobileSchema,
    alternateMobile: z
      .string()
      .regex(/^$|^[6-9]\d{9}$/, 'Enter a valid 10-digit alternate mobile number')
      .optional(),
  })
  .superRefine((data, ctx) => {
    const age = calculateAge(data.dateOfBirth);
    if (!Number.isNaN(age) && (age < 21 || age > 60)) {
      ctx.addIssue({
        code: 'custom',
        path: ['dateOfBirth'],
        message: 'Applicant must be between 21 and 60 years old',
      });
    }

    if (data.alternateMobile && data.alternateMobile === data.mobileNumber) {
      ctx.addIssue({
        code: 'custom',
        path: ['alternateMobile'],
        message: 'Alternate mobile number must be different from mobile number',
      });
    }
  });

export default step2Schema;
