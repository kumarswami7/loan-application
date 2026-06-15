describe('Home loan happy path', () => {
  beforeEach(() => {
    cy.clearLocalStorage();
    cy.visit('/');
  });

  it('completes a Home Loan with co-applicant and property documents', () => {
    cy.fixture('home-loan-valid').then((data) => {
      cy.fillStep1(data.step1);
      cy.fillStep2(data.step2);
      cy.fillStep3(data.step3);
      cy.fillStep4(data.step4);
      cy.fillStep5Salaried(data.step5);
      cy.get('[data-testid="step-coApplicant"]').should('be.visible');
      cy.fillStep6(data.step6);
      cy.get('[data-testid="upload-propertyDocs"]').should('be.visible');
      cy.fillStep7('Home', 'Salaried');
      cy.get('[data-testid="coApplicant-signature-display"]').should('be.visible');
      cy.fillStep8();
    });

    cy.get('[data-testid="success-modal"]').should('be.visible');
    cy.get('[data-testid="reference-number"]').invoke('text').should('match', /[a-f0-9-]{36}/i);
  });
});
