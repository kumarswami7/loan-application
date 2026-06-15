function fillPersonalInfoFields(data) {
  cy.get('[data-testid="personalInfo-fullName"]').type(data.fullName);
  cy.get('[data-testid="personalInfo-dateOfBirth"]').type(data.dateOfBirth);
  cy.get(`[data-testid="personalInfo-gender-${data.gender}"]`).check();
  cy.get('[data-testid="personalInfo-maritalStatus"]').select(data.maritalStatus);
  cy.get('[data-testid="personalInfo-fatherName"]').type(data.fatherName);
  cy.get('[data-testid="personalInfo-motherName"]').type(data.motherName);
  cy.get('[data-testid="personalInfo-email"]').type(data.email);
  cy.get('[data-testid="personalInfo-mobileNumber"]').type(data.mobileNumber);
}

describe('Validation Errors - Step by Step', () => {
  beforeEach(() => {
    cy.clearLocalStorage();
    cy.visit('/');
  });

  it('Step 1: shows all required field errors on empty submit', () => {
    cy.get('[data-testid="wizard-next"]').click();
    cy.get('[data-testid="loanType-error"]').should('contain', 'Please select a loan type');
    cy.get('[data-testid="loanPurpose-error"]').should('be.visible');
    cy.get('[data-testid="loanType-loanType-Personal"]').check();
    cy.get('[data-testid="wizard-next"]').click();
    cy.get('[data-testid="loanAmount-error"]').should('be.visible');
    cy.get('[data-testid="loanTenure-error"]').should('be.visible');
    cy.get('[data-testid="step-loanType"]').should('be.visible');
  });

  it('Step 1: shows the Personal Loan amount range error', () => {
    cy.get('[data-testid="loanType-loanType-Personal"]').check();
    cy.get('[data-testid="loanType-loanAmount"]').type('50000000').blur();
    cy.get('[data-testid="loanAmount-error"]').should('contain', '25,00,000');
  });

  it('Step 1: clears the loan type error when a valid choice is entered', () => {
    cy.get('[data-testid="wizard-next"]').click();
    cy.get('[data-testid="loanType-error"]').should('be.visible');
    cy.get('[data-testid="loanType-loanType-Personal"]').check();
    cy.get('[data-testid="loanType-error"]').should('not.exist');
  });

  it('Step 2: shows age validation error for an applicant under 21', () => {
    cy.fixture('personal-loan-valid').then((data) => {
      cy.fillStep1(data.step1);
      fillPersonalInfoFields(data.step2);
    });
    const dob = new Date();
    dob.setFullYear(dob.getFullYear() - 20);
    dob.setDate(dob.getDate() + 5);
    cy.get('[data-testid="personalInfo-dateOfBirth"]')
      .clear()
      .type(dob.toISOString().split('T')[0])
      .blur();
    cy.get('[data-testid="wizard-next"]').click();
    cy.get('[data-testid="dateOfBirth-error"]').should('contain', '21');
  });

  it('Step 2: shows error when alternate mobile matches primary', () => {
    cy.fixture('personal-loan-valid').then((data) => {
      cy.fillStep1(data.step1);
      fillPersonalInfoFields(data.step2);
    });
    cy.get('[data-testid="personalInfo-alternateMobile"]').type('9876543210').blur();
    cy.get('[data-testid="wizard-next"]').click();
    cy.get('[data-testid="alternateMobile-error"]').should('contain', 'different');
  });

  it('Step 3: shows PAN format and entity-type errors', () => {
    cy.fixture('personal-loan-valid').then((data) => {
      cy.fillStep1(data.step1);
      cy.fillStep2(data.step2);
    });
    cy.get('[data-testid="kyc-panNumber"]').type('INVALID').blur();
    cy.get('[data-testid="panNumber-error"]').should('contain', 'AAAAA9999A');
    cy.get('[data-testid="kyc-panNumber"]').clear().type('ABCDE1234F').blur();
    cy.get('[data-testid="panNumber-error"]').should('contain', 'entity type');
    cy.get('[data-testid="wizard-next"]').click();
    cy.get('[data-testid="step-kyc"]').should('be.visible');
  });

  it('Step 3: requires Aadhaar consent after successful verification', () => {
    cy.fixture('personal-loan-valid').then((data) => {
      cy.fillStep1(data.step1);
      cy.fillStep2(data.step2);
      cy.get('[data-testid="kyc-panNumber"]').type(data.step3.panNumber);
      cy.wait(2100);
      cy.get('[data-testid="kyc-aadhaarNumber"]').type(data.step3.aadhaarNumber);
      cy.wait(2100);
    });
    cy.get('[data-testid="wizard-next"]').click();
    cy.get('[data-testid="aadhaarConsent-error"]').should('contain', 'consent');
  });

  it('Step 4: shows PIN code not found and leaves city empty', () => {
    cy.fixture('personal-loan-valid').then((data) => {
      cy.fillStep1(data.step1);
      cy.fillStep2(data.step2);
      cy.fillStep3(data.step3);
    });
    cy.get('[data-testid="address-currentPincode"]').type('999999');
    cy.get('[data-testid="pincode-not-found-message"]').should('be.visible');
    cy.get('[data-testid="address-currentCity"]').should('have.value', '');
  });

  it('Step 4: auto-fills city and state for a known PIN code', () => {
    cy.fixture('personal-loan-valid').then((data) => {
      cy.fillStep1(data.step1);
      cy.fillStep2(data.step2);
      cy.fillStep3(data.step3);
    });
    cy.get('[data-testid="address-currentPincode"]').type('110001');
    cy.get('[data-testid="address-currentCity"]').should('have.value', 'New Delhi');
    cy.get('[data-testid="address-currentState"]').should('have.value', 'Delhi');
  });

  it('Step 5: rejects Salaried employment for a Business Loan', () => {
    cy.fixture('business-loan-valid').then((data) => {
      cy.fillStep1(data.step1);
      cy.fillStep2(data.step2);
      cy.fillStep3(data.step3);
      cy.fillStep4(data.step4);
      cy.get('[data-testid="employment-employmentType-Salaried"]').check();
      cy.get('[data-testid="employment-companyName"]').type('Infosys');
      cy.get('[data-testid="employment-designation"]').type('Manager');
      cy.get('[data-testid="employment-monthlyNetSalary"]').type('100000');
      cy.get('[data-testid="employment-yearsOfExperience"]').type('8');
    });
    cy.get('[data-testid="wizard-next"]').click();
    cy.get('[data-testid="employmentType-error"]').should('contain', 'Business loans');
    cy.get('[data-testid="step-employment"]').should('be.visible');
  });
});
