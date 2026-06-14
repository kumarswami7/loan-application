import { describe, expect, it } from 'vitest';
import { buildStep7Schema, getDocumentRequirements } from '../step7Schema';

function formData({ loanType = 'Personal', employmentType = 'Salaried', panVerified = false, loanAmount = 500000 } = {}) {
  return { loanType: { loanType, loanAmount }, employment: { employmentType }, kyc: { panVerified } };
}

function ids(data) {
  return getDocumentRequirements(data).map(({ id }) => id);
}

function validMetadata(name = 'document.pdf') {
  return [{ name, size: 1000, type: 'application/pdf' }];
}

describe('step7Schema', () => {
  it('returns base and salary documents for salaried personal applicants', () => {
    expect(ids(formData())).toEqual(['panCard', 'aadhaarFront', 'aadhaarBack', 'bankStatements', 'photograph', 'salarySlips']);
  });

  it('returns ITR and property documents for self-employed home applicants', () => {
    expect(ids(formData({ loanType: 'Home', employmentType: 'Self-Employed', loanAmount: 1000000 }))).toEqual(expect.arrayContaining(['itrDocs', 'propertyDocs']));
  });

  it('returns business registration and GST returns for business loans', () => {
    expect(ids(formData({ loanType: 'Business', employmentType: 'Business Owner' }))).toEqual(expect.arrayContaining(['itrDocs', 'businessRegistration', 'gstReturns']));
  });

  it('marks PAN optional after PAN verification', () => {
    const pan = getDocumentRequirements(formData({ panVerified: true })).find(({ id }) => id === 'panCard');
    expect(pan.required).toBe(false);
  });

  it('marks PAN required before PAN verification', () => {
    const pan = getDocumentRequirements(formData()).find(({ id }) => id === 'panCard');
    expect(pan.required).toBe(true);
  });

  it('requires all required document arrays', () => {
    const result = buildStep7Schema(formData()).safeParse({
      panCard: [], aadhaarFront: [], aadhaarBack: [], bankStatements: [], photograph: [], salarySlips: [], applicantSignature: '',
    });
    expect(result.success).toBe(false);
    expect(result.error.issues.map(({ message }) => message)).toContain('PAN Card Copy is required');
  });

  it('allows an empty optional PAN array', () => {
    const result = buildStep7Schema(formData({ panVerified: true })).safeParse({
      panCard: [],
      aadhaarFront: validMetadata(),
      aadhaarBack: validMetadata(),
      bankStatements: validMetadata(),
      photograph: validMetadata('photo.jpg').map((entry) => ({ ...entry, type: 'image/jpeg' })),
      salarySlips: validMetadata(),
      applicantSignature: 'data:image/png;base64,test',
    });
    expect(result.success).toBe(true);
  });

  it('requires a co-applicant signature when the conditional step is visible', () => {
    const data = formData({ loanAmount: 600000, panVerified: true });
    const result = buildStep7Schema(data).safeParse({
      panCard: [], aadhaarFront: validMetadata(), aadhaarBack: validMetadata(), bankStatements: validMetadata(), photograph: validMetadata(), salarySlips: validMetadata(), applicantSignature: 'signed',
    });
    expect(result.error.issues).toEqual(expect.arrayContaining([
      expect.objectContaining({ path: ['coApplicantSignature'], message: 'Please provide the co-applicant signature' }),
    ]));
  });

  it('accepts a complete salaried personal document payload', () => {
    const metadata = validMetadata();
    expect(buildStep7Schema(formData()).safeParse({
      panCard: metadata, aadhaarFront: metadata, aadhaarBack: metadata, bankStatements: metadata, photograph: metadata, salarySlips: metadata, applicantSignature: 'signed',
    }).success).toBe(true);
  });
});
