describe('Cross-step dependencies', () => {
  beforeEach(() => {
    cy.clearLocalStorage();
    cy.visit('/');
  });

  it('adds the co-applicant step and property documents after changing Personal to Home', () => {
    cy.fixture('personal-loan-valid').then((data) => {
      cy.fillStep1(data.step1);
      cy.fillStep2(data.step2);
      cy.fillStep3(data.step3);
    });
    Cypress._.times(3, () => cy.get('[data-testid="wizard-prev"]').click());
    cy.get('[data-testid="loanType-loanType-Home"]').check();
    cy.get('[data-testid="loanType-loanAmount"]').clear().type('5000000');
    cy.get('[data-testid="loanType-loanTenure"]').select('120');
    cy.get('[data-testid="loanType-loanPurpose"]').select('Home purchase');
    cy.get('[data-testid="wizard-next"]').click();
    cy.fixture('home-loan-valid').then((data) => {
      cy.fillStep2(data.step2);
      cy.fillStep3(data.step3);
      cy.fillStep4(data.step4);
      cy.fillStep5Salaried(data.step5);
      cy.get('[data-testid="step-coApplicant"]').should('be.visible');
      cy.fillStep6(data.step6);
    });
    cy.get('[data-testid="upload-propertyDocs"]').should('be.visible');
    cy.get('[data-testid="upload-salarySlips"]').should('be.visible');
  });

  it('does not show Step 6 at the exact Personal Loan threshold of 500000', () => {
    cy.fixture('personal-loan-valid').then((data) => {
      cy.fillStep1({ ...data.step1, loanAmount: '500000' });
      cy.fillStep2(data.step2);
      cy.fillStep3(data.step3);
      cy.fillStep4(data.step4);
      cy.fillStep5Salaried(data.step5);
    });
    cy.get('[data-testid="step-coApplicant"]').should('not.exist');
    cy.get('[data-testid="step-documents"]').should('be.visible');
  });

  it('shows Step 6 when a Personal Loan exceeds the threshold by one rupee', () => {
    cy.fixture('personal-loan-valid').then((data) => {
      cy.fillStep1({ ...data.step1, loanAmount: '500001' });
      cy.fillStep2(data.step2);
      cy.fillStep3(data.step3);
      cy.fillStep4(data.step4);
      cy.fillStep5Salaried(data.step5);
    });
    cy.get('[data-testid="step-coApplicant"]').should('be.visible');
  });
});
