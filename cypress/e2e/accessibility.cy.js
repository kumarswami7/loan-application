const axeOptions = {
  runOnly: {
    type: 'tag',
    values: ['wcag2a', 'wcag2aa'],
  },
  rules: {
    'color-contrast': { enabled: true },
    label: { enabled: true },
    'aria-required-attr': { enabled: true },
    'aria-valid-attr': { enabled: true },
  },
};

function auditStep(stepId) {
  cy.get(`[data-testid="step-${stepId}"]`).should('be.visible');
  cy.injectAxe();
  cy.checkA11y(null, axeOptions, (violations) => {
    violations.forEach((violation) => {
      Cypress.log({
        name: `a11y:${violation.id}`,
        message: `${violation.description}; affected: ${violation.nodes.map((node) => node.target.join(' ')).join(', ')}`,
      });
    });
    const details = violations.map((violation) => (
      `${violation.id}: ${violation.nodes.map((node) => node.target.join(' ')).join(', ')}`
    )).join(' | ');
    expect(violations, `${stepId} WCAG 2.1 A/AA violations: ${details}`).to.have.length(0);
  });
}

describe('WCAG 2.1 A and AA audit', () => {
  beforeEach(() => {
    cy.clearLocalStorage();
    cy.visit('/');
  });

  it('audits every wizard step, including the conditional co-applicant step', () => {
    cy.fixture('home-loan-valid').then((data) => {
      auditStep('loanType');
      cy.fillStep1(data.step1);

      auditStep('personalInfo');
      cy.fillStep2(data.step2);

      auditStep('kyc');
      cy.fillStep3(data.step3);

      auditStep('address');
      cy.fillStep4(data.step4);

      auditStep('employment');
      cy.fillStep5Salaried(data.step5);

      auditStep('coApplicant');
      cy.fillStep6(data.step6);

      auditStep('documents');
      cy.fillStep7('Home', 'Salaried');

      auditStep('review');
    });
  });
});
