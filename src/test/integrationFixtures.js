const signature = 'data:image/png;base64,c2lnbmF0dXJl';
const metadata = (name, type = 'application/pdf') => [{ name, size: 120000, type }];

const personalInfo = {
  fullName: 'Aarav Sharma',
  dateOfBirth: '1990-01-01',
  gender: 'Male',
  maritalStatus: 'Married',
  fatherName: 'Rohan Sharma',
  motherName: 'Meera Sharma',
  email: 'aarav.sharma@example.com',
  mobileNumber: '9876543210',
  alternateMobile: '9123456780',
};

const address = {
  currentAddressLine1: '12 MG Road',
  currentAddressLine2: '',
  currentPincode: '560001',
  currentCity: 'Bengaluru',
  currentState: 'Karnataka',
  residenceType: 'Owned',
  rentAmount: '',
  yearsAtCurrentAddress: 4,
  previousAddressLine1: '',
  previousPincode: '',
  previousCity: '',
  previousState: '',
  sameAsPermanentAddress: true,
  permanentAddressLine1: '',
  permanentAddressLine2: '',
  permanentPincode: '',
  permanentCity: '',
  permanentState: '',
};

const coApplicant = {
  coApplicantName: 'Meera Sharma',
  relationship: 'Spouse',
  coApplicantPAN: 'BBBPP1234B',
  coApplicantIncome: '50000',
  coApplicantConsent: true,
  coApplicantSignature: signature,
  panVerified: true,
};

const review = {
  consentAccuracy: true,
  consentCreditCheck: true,
  consentTerms: true,
  consentCommunications: true,
  emiAffordabilityAcknowledged: true,
};

function kyc(loanType) {
  return {
    panNumber: loanType === 'Business' ? 'AAACA1234A' : 'AAAPA1234A',
    aadhaarNumber: '123456789010',
    aadhaarConsent: true,
    voterID: '',
    passport: '',
    panVerified: true,
    aadhaarVerified: true,
  };
}

function salariedEmployment() {
  return {
    employmentType: 'Salaried',
    companyName: 'Infosys',
    designation: 'Senior Engineer',
    monthlyNetSalary: '120000',
    yearsOfExperience: 8,
    monthlyIncomeForEMI: 120000,
  };
}

function selfEmployedEmployment() {
  return {
    employmentType: 'Self-Employed',
    businessName: 'Sharma Consulting',
    businessType: 'Freelance/Consultancy',
    annualTurnover: '2400000',
    yearsInBusiness: 5,
    monthlyIncome: '140000',
    officeAddress: { addressLine1: '21 Residency Road', pincode: '560001', city: 'Bengaluru', state: 'Karnataka' },
    yearsOfExperience: 10,
    monthlyIncomeForEMI: 140000,
  };
}

function businessOwnerEmployment() {
  return {
    employmentType: 'Business Owner',
    businessName: 'Sharma Trading Company',
    businessType: 'Sole Proprietorship',
    annualTurnover: '3600000',
    yearsInBusiness: 6,
    gstNumber: '29AAAPA1234A1Z5',
    officeAddress: { addressLine1: '44 Market Road', pincode: '560001', city: 'Bengaluru', state: 'Karnataka' },
    yearsOfExperience: 12,
    monthlyIncomeForEMI: 300000,
  };
}

function documents({ employmentType, loanType, needsCoApplicant }) {
  return {
    panCard: [],
    aadhaarFront: metadata('aadhaar-front.pdf'),
    aadhaarBack: metadata('aadhaar-back.pdf'),
    bankStatements: metadata('bank-statements.pdf'),
    photograph: metadata('photo.jpg', 'image/jpeg'),
    ...(employmentType === 'Salaried'
      ? { salarySlips: metadata('salary-slips.pdf') }
      : { itrDocs: metadata('itr.pdf') }),
    ...(loanType === 'Home' ? { propertyDocs: metadata('property.pdf') } : {}),
    ...(loanType === 'Business' ? {
      businessRegistration: metadata('registration.pdf'),
      gstReturns: metadata('gst-returns.pdf'),
    } : {}),
    applicantSignature: signature,
    ...(needsCoApplicant ? { coApplicantSignature: signature } : {}),
  };
}

function buildFixture({ loanType, loanAmount, loanTenure, loanPurpose, employment }) {
  const needsCoApplicant = loanType === 'Home'
    || (loanType === 'Personal' && loanAmount > 500000)
    || (loanType === 'Business' && loanAmount > 2000000);
  return {
    loanType: { loanType, loanAmount, loanTenure, loanPurpose, referralCode: '' },
    personalInfo: { ...personalInfo },
    kyc: kyc(loanType),
    address: { ...address },
    employment,
    coApplicant: needsCoApplicant ? { ...coApplicant } : {},
    documents: documents({ employmentType: employment.employmentType, loanType, needsCoApplicant }),
    review: { ...review },
  };
}

export const personalLoanSalaried = buildFixture({
  loanType: 'Personal', loanAmount: 800000, loanTenure: 36, loanPurpose: 'Education', employment: salariedEmployment(),
});

export const personalLoanSelfEmployed = buildFixture({
  loanType: 'Personal', loanAmount: 500000, loanTenure: 36, loanPurpose: 'Medical expenses', employment: selfEmployedEmployment(),
});

export const homeLoanSalaried = buildFixture({
  loanType: 'Home', loanAmount: 5000000, loanTenure: 240, loanPurpose: 'Home purchase', employment: salariedEmployment(),
});

export const homeLoanBusinessOwner = buildFixture({
  loanType: 'Home', loanAmount: 7500000, loanTenure: 240, loanPurpose: 'Home construction', employment: businessOwnerEmployment(),
});

export const businessLoanBusinessOwner = buildFixture({
  loanType: 'Business', loanAmount: 2500000, loanTenure: 60, loanPurpose: 'Business expansion', employment: businessOwnerEmployment(),
});

export const businessLoanSelfEmployed = buildFixture({
  loanType: 'Business', loanAmount: 2500000, loanTenure: 60, loanPurpose: 'Working capital', employment: selfEmployedEmployment(),
});

export const allIntegrationFixtures = {
  personalLoanSalaried,
  personalLoanSelfEmployed,
  homeLoanSalaried,
  homeLoanBusinessOwner,
  businessLoanBusinessOwner,
  businessLoanSelfEmployed,
};
