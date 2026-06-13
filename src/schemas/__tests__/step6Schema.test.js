import { describe, expect, it } from 'vitest';
import step6Schema from '../step6Schema';

const validData = {
  coApplicantName: 'Meera Sharma',
  relationship: 'Spouse',
  coApplicantPAN: 'AAAPA1234A',
  coApplicantIncome: '50000',
  coApplicantConsent: true,
  coApplicantSignature: 'PENDING_SIGNATURE',
};

function messages(result) {
  return result.error?.issues.map((issue) => issue.message) || [];
}

describe('step6Schema', () => {
  it('accepts valid co-applicant data', () => {
    expect(step6Schema.safeParse(validData).success).toBe(true);
  });

  it('rejects missing consent with the required message', () => {
    const result = step6Schema.safeParse({ ...validData, coApplicantConsent: false });
    expect(messages(result)).toContain('Co-applicant consent is required to proceed');
  });

  it('rejects an invalid PAN format', () => {
    const result = step6Schema.safeParse({ ...validData, coApplicantPAN: 'BADPAN' });
    expect(messages(result)).toContain('PAN must be 10 characters in format AAAAA9999A');
  });

  it('rejects a non-individual PAN', () => {
    const result = step6Schema.safeParse({ ...validData, coApplicantPAN: 'AAACA1234A' });
    expect(messages(result)).toContain("Co-applicant PAN must be an individual PAN (4th character 'P')");
  });

  it('rejects a relationship outside the allowed values', () => {
    const result = step6Schema.safeParse({ ...validData, relationship: 'Friend' });
    expect(result.success).toBe(false);
  });

  it('requires a signature value', () => {
    const result = step6Schema.safeParse({ ...validData, coApplicantSignature: '' });
    expect(messages(result)).toContain('Co-applicant signature is required');
  });

  it('requires a positive co-applicant income', () => {
    const result = step6Schema.safeParse({ ...validData, coApplicantIncome: '0' });
    expect(messages(result)).toContain('Co-applicant income must be positive');
  });
});
