describe('Business loan happy path', () => {
  beforeEach(() => {
    cy.clearLocalStorage();
    cy.visit('/');
  });

  it('completes a Business Loan with Business Owner and GST', () => {
    cy.fixture('business-loan-valid').then((data) => {
      cy.fillStep1(data.step1);
      cy.fillStep2(data.step2);
      cy.fillStep3(data.step3);
      cy.fillStep4(data.step4);
      cy.fillStep5BusinessOwner(data.step5);
      cy.get('[data-testid="step-coApplicant"]').should('be.visible');
      cy.fillStep6(data.step6);
      cy.get('[data-testid="upload-businessRegistration"]').should('be.visible');
      cy.get('[data-testid="upload-gstReturns"]').should('be.visible');
      cy.fillStep7('Business', 'Business Owner');
      cy.fillStep8();
    });

    cy.get('[data-testid="success-modal"]').should('be.visible');
    cy.get('[data-testid="reference-number"]').invoke('text').should('match', /[a-f0-9-]{36}/i);
  });
});
