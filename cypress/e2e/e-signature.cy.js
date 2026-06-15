describe('E-signature', () => {
  beforeEach(() => {
    cy.clearLocalStorage();
    cy.visit('/');
    cy.fixture('personal-loan-valid').then((data) => {
      cy.fillStep1(data.step1);
      cy.fillStep2(data.step2);
      cy.fillStep3(data.step3);
      cy.fillStep4(data.step4);
      cy.fillStep5Salaried(data.step5);
    });
    cy.get('[data-testid="step-documents"]').should('be.visible');
  });

  it('draws a non-empty signature', () => {
    cy.drawSignature();
    cy.get('[data-testid="signature-canvas-applicant"] canvas')
      .then(($canvas) => expect($canvas[0].toDataURL()).not.to.equal('data:,'));
    cy.get('[data-testid="applicantSignature-error"]').should('not.exist');
  });

  it('shows a signature error when proceeding without signing', () => {
    cy.uploadRequiredDocuments('Personal', 'Salaried');
    cy.get('[data-testid="step-documents"]').should('not.contain', 'Pending');
    cy.get('[data-testid="wizard-next"]').click();
    cy.get('[data-testid="applicantSignature-error"]').should('contain', 'signature');
    cy.get('[data-testid="step-documents"]').should('be.visible');
  });

  it('clears the signature and restores empty validation', () => {
    cy.drawSignature();
    cy.get('[data-testid="signature-clear-applicant"]').click();
    cy.get('[data-testid="wizard-next"]').click();
    cy.get('[data-testid="applicantSignature-error"]').should('contain', 'signature');
  });

  it('shows the signature in the Step 8 review summary', () => {
    cy.uploadRequiredDocuments('Personal', 'Salaried');
    cy.drawSignature();
    cy.get('[data-testid="step-documents"]').should('not.contain', 'Pending');
    cy.get('[data-testid="wizard-next"]').click();
    cy.get('[data-testid="step-review"]').should('be.visible');
    cy.get('[data-testid="applicant-signature-display"]')
      .should('be.visible')
      .find('img')
      .should('have.attr', 'src')
      .and('include', 'data:image/png;base64');
  });
});
