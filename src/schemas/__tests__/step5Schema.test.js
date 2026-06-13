import { describe, expect, it } from 'vitest';
import { buildStep5Schema } from '../step5Schema';

const officeAddress = {
  addressLine1: '12 Business Park',
  pincode: '400001',
  city: 'Mumbai',
  state: 'Maharashtra',
};

const salaried = {
  employmentType: 'Salaried',
  companyName: 'Infosys',
  designation: 'Engineer',
  monthlyNetSalary: '75000',
  yearsOfExperience: 5,
};

const selfEmployed = {
  employmentType: 'Self-Employed',
  businessName: 'Sharma Consulting',
  businessType: 'Freelance/Consultancy',
  annualTurnover: '1200000',
  yearsInBusiness: 4,
  monthlyIncome: '90000',
  officeAddress,
  yearsOfExperience: 7,
};

const businessOwner = {
  employmentType: 'Business Owner',
  businessName: 'Aarav Industries',
  businessType: 'Sole Proprietorship',
  annualTurnover: '2400000',
  yearsInBusiness: 6,
  gstNumber: '27AAAPA1234A1Z5',
  officeAddress,
  yearsOfExperience: 10,
};

function messages(result) {
  return result.error?.issues.map((issue) => issue.message) || [];
}

describe('buildStep5Schema', () => {
  it('accepts valid Salaried data', () => {
    expect(buildStep5Schema('Personal').safeParse(salaried).success).toBe(true);
  });

  it('accepts valid Self-Employed data', () => {
    expect(buildStep5Schema('Personal').safeParse(selfEmployed).success).toBe(true);
  });

  it('accepts valid Business Owner data', () => {
    expect(buildStep5Schema('Personal').safeParse(businessOwner).success).toBe(true);
  });

  it('rejects missing salaried company and designation fields', () => {
    const result = buildStep5Schema('Personal').safeParse({
      ...salaried,
      companyName: '',
      designation: '',
    });
    expect(messages(result)).toEqual(expect.arrayContaining([
      'Company name is required',
      'Designation is required',
    ]));
  });

  it('rejects salary below the salaried minimum', () => {
    const result = buildStep5Schema('Personal').safeParse({
      ...salaried,
      monthlyNetSalary: '14999',
    });
    expect(messages(result)).toContain('Minimum monthly salary for salaried applicants is ₹15,000');
  });

  it('rejects missing self-employed branch fields', () => {
    const result = buildStep5Schema('Personal').safeParse({
      ...selfEmployed,
      businessName: '',
      monthlyIncome: '',
    });
    expect(messages(result)).toEqual(expect.arrayContaining([
      'Business name is required',
      'Monthly income is required',
    ]));
  });

  it('rejects self-employed applicants below turnover and business-tenure minimums', () => {
    const result = buildStep5Schema('Personal').safeParse({
      ...selfEmployed,
      annualTurnover: '299999',
      yearsInBusiness: 1,
    });
    expect(messages(result)).toEqual(expect.arrayContaining([
      'Minimum annual turnover for self-employed applicants is ₹3,00,000',
      'Minimum 2 years in business required',
    ]));
  });

  it('rejects missing Business Owner GST and office address fields', () => {
    const result = buildStep5Schema('Personal').safeParse({
      ...businessOwner,
      gstNumber: '',
      officeAddress: { ...officeAddress, addressLine1: '', city: '' },
    });
    expect(messages(result)).toEqual(expect.arrayContaining([
      'GST number is required',
      'Office address line 1 is required',
      'Office city is required',
    ]));
  });

  it('rejects Salaried employment for a Business loan', () => {
    const result = buildStep5Schema('Business').safeParse(salaried);
    expect(messages(result)).toContain(
      'Business loans require Self-Employed or Business Owner employment type. Please change your Loan Type in Step 1, or update your employment type here.',
    );
  });

  it('accepts Business Owner employment for a Business loan', () => {
    expect(buildStep5Schema('Business').safeParse(businessOwner).success).toBe(true);
  });

  it('integrates valid GST validation', () => {
    const result = buildStep5Schema('Business').safeParse(businessOwner);
    expect(result.success).toBe(true);
  });

  it('integrates invalid GST validation', () => {
    const result = buildStep5Schema('Business').safeParse({
      ...businessOwner,
      gstNumber: '27AAAZA1234A1Z5',
    });
    expect(messages(result)).toContain('GST number contains an invalid PAN');
  });
});
