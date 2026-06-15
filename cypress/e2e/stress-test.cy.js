describe('Wizard stress tests', () => {
  beforeEach(() => {
    cy.clearLocalStorage();
    cy.visit('/');
  });

  it('does not skip steps or corrupt state under rapid Next clicks', () => {
    cy.window().then((win) => cy.spy(win.console, 'error').as('consoleError'));
    Cypress._.times(10, () => cy.get('[data-testid="wizard-next"]').click());
    cy.get('[data-testid="step-loanType"]').should('be.visible');
    Cypress._.times(5, () => cy.get('[data-testid="wizard-next"]').click());
    cy.get('[data-testid="step-loanType"]').should('be.visible');
    cy.get('@consoleError').should('not.have.been.called');
  });

  it('does not render duplicate submission results after a double submit', () => {
    cy.fixture('personal-loan-valid').then((data) => {
      cy.fillStep1(data.step1);
      cy.fillStep2(data.step2);
      cy.fillStep3(data.step3);
      cy.fillStep4(data.step4);
      cy.fillStep5Salaried(data.step5);
      cy.fillStep7('Personal', 'Salaried');
    });
    ['consentAccuracy', 'consentCreditCheck', 'consentTerms', 'consentCommunications'].forEach((name) => {
      cy.get(`[data-testid="review-${name}"]`).check();
    });
    cy.get('body').then(($body) => {
      if ($body.find('[data-testid="review-emiAffordabilityAcknowledged"]').length) {
        cy.get('[data-testid="review-emiAffordabilityAcknowledged"]').check();
      }
    });
    cy.get('[data-testid="submit-button"]').should('be.enabled').dblclick();
    cy.get('[data-testid="success-modal"]').should('have.length', 1).and('be.visible');
    cy.get('[data-testid="reference-number"]').should('have.length', 1);
  });

  it('updates dependent steps after changing Personal to Business', () => {
    cy.fixture('personal-loan-valid').then((data) => {
      cy.fillStep1(data.step1);
      cy.fillStep2(data.step2);
      cy.fillStep3(data.step3);
      cy.fillStep4(data.step4);
      cy.fillStep5Salaried(data.step5);
    });
    Cypress._.times(5, () => cy.get('[data-testid="wizard-prev"]').click());
    cy.get('[data-testid="step-loanType"]').should('be.visible');
    cy.get('[data-testid="loanType-loanType-Business"]').check();
    cy.get('[data-testid="loanType-loanAmount"]').clear().type('3000000');
    cy.get('[data-testid="loanType-loanTenure"]').select('48');
    cy.get('[data-testid="loanType-loanPurpose"]').select('Working capital');
    cy.get('[data-testid="wizard-next"]').click();
    cy.fixture('business-loan-valid').then((data) => {
      cy.fillStep2(data.step2);
      cy.fillStep3(data.step3);
      cy.fillStep4(data.step4);
      cy.get('[data-testid="employment-employmentType-Salaried"]').check();
      cy.get('[data-testid="employment-companyName"]').type('Infosys');
      cy.get('[data-testid="employment-designation"]').type('Manager');
      cy.get('[data-testid="employment-monthlyNetSalary"]').type('100000');
      cy.get('[data-testid="employment-yearsOfExperience"]').type('8');
      cy.get('[data-testid="wizard-next"]').click();
      cy.get('[data-testid="employmentType-error"]').should('contain', 'Business loans');
      cy.fillStep5BusinessOwner(data.step5);
    });
    cy.get('[data-testid="step-coApplicant"]').should('be.visible');
  });

  it('renders the maximum Personal Loan amount without layout overflow', () => {
    cy.get('[data-testid="loanType-loanType-Personal"]').check();
    cy.get('[data-testid="loanType-loanAmount"]').type('2500000').should('have.value', '25,00,000');
    cy.get('[data-testid="loanType-loanAmount"]').then(($input) => {
      const inputRect = $input[0].getBoundingClientRect();
      const containerRect = $input[0].parentElement.getBoundingClientRect();
      expect(inputRect.left).to.be.at.least(containerRect.left);
      expect(inputRect.right).to.be.at.most(containerRect.right + 1);
    });
  });

  it('rejects script-like and Unicode values in ASCII-only name fields', () => {
    cy.fixture('personal-loan-valid').then(({ step1 }) => cy.fillStep1(step1));
    cy.get('[data-testid="personalInfo-fullName"]').type('<script>alert("xss")</script>').blur();
    cy.get('[data-testid="fullName-error"]').should('be.visible');
    cy.get('[data-testid="personalInfo-fullName"]').clear().type('राम कुमार').blur();
    cy.get('[data-testid="fullName-error"]').should('be.visible');
  });
});
