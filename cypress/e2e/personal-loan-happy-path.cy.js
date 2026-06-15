describe('Personal loan happy path', () => {
  beforeEach(() => {
    cy.clearLocalStorage();
    cy.visit('/');
  });

  it('completes a Personal Loan application with Salaried employment', () => {
    cy.fixture('personal-loan-valid').then((data) => {
      cy.fillStep1(data.step1);
      cy.fillStep2(data.step2);
      cy.fillStep3(data.step3);
      cy.fillStep4(data.step4);
      cy.fillStep5Salaried(data.step5);
      cy.get('[data-testid="step-coApplicant"]').should('not.exist');
      cy.get('[data-testid="step-documents"]').should('be.visible');
      cy.fillStep7('Personal', 'Salaried');
      cy.fillStep8();
    });

    cy.get('[data-testid="success-modal"]').should('be.visible');
    cy.get('[data-testid="reference-number"]').invoke('text').should('match', /[a-f0-9-]{36}/i);
    cy.get('[data-testid="pre-approval-summary"]').should('contain', 'Estimated EMI');
    cy.window().then((win) => {
      expect(win.localStorage.getItem('lendswift_draft_Personal')).to.be.null;
    });
  });
});
