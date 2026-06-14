import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { getSchemaForStep, validateAllSteps, validateStep } from '../schemaFactory';
import { personalLoanSalaried } from '../../test/integrationFixtures';
import { getMaxTenureMonths } from '../step2Schema';

describe('schemaFactory', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-06-14T12:00:00.000Z'));
  });
  afterEach(() => vi.useRealTimers());

  it('applies the DOB-derived Step 1 tenure ceiling', () => {
    const formData = { personalInfo: { dateOfBirth: '1996-06-14' } };
    const result = getSchemaForStep('loanType', formData).safeParse({
      loanType: 'Home', loanAmount: 5000000, loanTenure: 480, loanPurpose: 'Home purchase', referralCode: '',
    });
    expect(result.success).toBe(false);
  });

  it('calculates a 420-month maximum tenure for an applicant aged 30', async () => {
    const dateOfBirth = '1996-06-14';
    expect(getMaxTenureMonths(dateOfBirth)).toBe(420);
    const schema = getSchemaForStep('step1', { personalInfo: { dateOfBirth } });
    const result = await schema.safeParseAsync({
      loanType: 'Home', loanAmount: 5000000, loanTenure: 360, loanPurpose: 'Home purchase', referralCode: '',
    });
    expect(result.success).toBe(true);
  });

  it('rejects salaried employment for Business Loans', () => {
    const result = getSchemaForStep('employment', { loanType: { loanType: 'Business' } }).safeParse({
      employmentType: 'Salaried', companyName: 'Infosys', designation: 'Engineer', monthlyNetSalary: '50000', yearsOfExperience: 5,
    });
    expect(result.success).toBe(false);
    expect(result.error.issues[0].path).toEqual(['employmentType']);
  });

  it('makes PAN card metadata optional after verification', () => {
    const formData = {
      loanType: { loanType: 'Personal', loanAmount: 500000 },
      employment: { employmentType: 'Salaried' },
      kyc: { panVerified: true },
    };
    const result = getSchemaForStep('step7', formData).safeParse({
      panCard: [],
      aadhaarFront: [{ name: 'front.pdf', size: 1, type: 'application/pdf' }],
      aadhaarBack: [{ name: 'back.pdf', size: 1, type: 'application/pdf' }],
      bankStatements: [{ name: 'bank.pdf', size: 1, type: 'application/pdf' }],
      photograph: [{ name: 'photo.jpg', size: 1, type: 'image/jpeg' }],
      salarySlips: [{ name: 'salary.pdf', size: 1, type: 'application/pdf' }],
      applicantSignature: 'signed',
    });
    expect(result.success).toBe(true);
  });

  it('returns structured success from validateStep', async () => {
    const result = await validateStep('personalInfo', personalLoanSalaried.personalInfo, personalLoanSalaried);
    expect(result).toMatchObject({ success: true, errors: [] });
  });

  it('returns structured issues from validateStep', async () => {
    const result = await validateStep('personalInfo', {}, personalLoanSalaried);
    expect(result.success).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it('validates a complete Personal Loan fixture', async () => {
    await expect(validateAllSteps(personalLoanSalaried)).resolves.toEqual({ valid: true, stepErrors: {} });
  });

  it('reports employment errors for Business Loan plus Salaried employment', async () => {
    const invalid = structuredClone(personalLoanSalaried);
    invalid.loanType = { loanType: 'Business', loanAmount: 2500000, loanTenure: 60, loanPurpose: 'Working capital', referralCode: '' };
    const result = await validateAllSteps(invalid);
    expect(result.valid).toBe(false);
    expect(result.stepErrors.employment).toBeDefined();
  });

  it('throws for unknown step ids', () => {
    expect(() => getSchemaForStep('not-a-step', {})).toThrow('Unknown step id');
  });
});
