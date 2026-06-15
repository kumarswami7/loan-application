describe('Auto-save and resume', () => {
  beforeEach(() => {
    cy.clearLocalStorage();
    cy.visit('/');
  });

  it('saves a draft and resumes after page reload', () => {
    cy.fixture('personal-loan-valid').then((data) => {
      cy.fillStep1(data.step1);
      cy.fillStep2(data.step2);
      cy.fillStep3(data.step3);
      cy.fillStep4(data.step4);
    });
    cy.get('[data-testid="wizard-save-draft"]').click();
    cy.contains('Draft saved at').should('be.visible');
    cy.window().then((win) => {
      expect(win.localStorage.getItem('lendswift_draft_Personal')).to.be.a('string').and.not.be.empty;
      const metadata = JSON.parse(win.localStorage.getItem('lendswift_draft_meta_Personal'));
      expect(metadata).to.include({ version: '1.0', loanType: 'Personal', step: 'employment' });
    });
    cy.reload();
    cy.get('[data-testid="resume-draft-modal"]').should('be.visible').and('contain', 'Personal');
    cy.get('[data-testid="resume-draft-modal"]').contains('button', 'Resume').click();
    cy.get('[data-testid="step-employment"]').should('be.visible');
    for (let index = 0; index < 4; index += 1) {
      cy.get('[data-testid="wizard-prev"]').click();
    }
    cy.get('[data-testid="step-loanType"]').should('be.visible');
    cy.get('[data-testid="loanType-loanAmount"]').should('not.have.value', '');
  });

  it('starts fresh and clears the saved draft', () => {
    cy.fixture('personal-loan-valid').then(({ step1 }) => cy.fillStep1(step1));
    cy.get('[data-testid="wizard-save-draft"]').click();
    cy.contains('Draft saved at').should('be.visible');
    cy.reload();
    cy.get('[data-testid="resume-draft-modal"]').contains('button', 'Start Fresh').click();
    cy.get('[data-testid="step-loanType"]').should('be.visible');
    cy.get('[data-testid="loanType-loanAmount"]').should('have.value', '');
    cy.window().then((win) => {
      const draftKeys = Object.keys(win.localStorage).filter((key) => key.startsWith('lendswift_draft_'));
      expect(draftKeys).to.have.length(0);
    });
  });

  it('detects and clears corrupted draft data', () => {
    cy.window().then((win) => {
      win.localStorage.setItem('lendswift_draft_Personal', 'corrupted!!!');
      win.localStorage.setItem('lendswift_draft_meta_Personal', JSON.stringify({
        version: '1.0',
        timestamp: new Date().toISOString(),
        loanType: 'Personal',
        step: 'employment',
      }));
    });
    cy.reload();
    cy.get('[data-testid="resume-draft-modal"]').contains('button', 'Resume').click();
    cy.get('[data-testid="step-loanType"]').should('be.visible');
    cy.contains('could not be restored').should('be.visible');
    cy.window().then((win) => {
      expect(win.localStorage.getItem('lendswift_draft_Personal')).to.be.null;
      expect(win.localStorage.getItem('lendswift_draft_meta_Personal')).to.be.null;
    });
  });
});
