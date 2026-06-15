function pressSpace(testId) {
  cy.get(`[data-testid="${testId}"]`)
    .focus()
    .trigger('keydown', { key: ' ', code: 'Space', which: 32 })
    .trigger('keyup', { key: ' ', code: 'Space', which: 32 })
    .then(($element) => $element[0].click());
  cy.get(`[data-testid="${testId}"]`).should('be.checked');
}

function pressEnter(testId) {
  cy.get(`[data-testid="${testId}"]`)
    .focus()
    .trigger('keydown', { key: 'Enter', code: 'Enter', which: 13 })
    .trigger('keyup', { key: 'Enter', code: 'Enter', which: 13 })
    .then(($element) => $element[0].click());
}

describe('Keyboard navigation and accessibility', () => {
  beforeEach(() => {
    cy.clearLocalStorage();
    cy.visit('/');
  });

  it('completes the entire form using keyboard interactions', () => {
    cy.fixture('personal-loan-valid').then((data) => {
      pressSpace('loanType-loanType-Personal');
      cy.get('[data-testid="loanType-loanType-Personal"]').should('be.checked');
      cy.get('[data-testid="loanType-loanAmount"]').focus().type(data.step1.loanAmount);
      cy.get('[data-testid="loanType-loanTenure"]').should('be.enabled').focus().select(data.step1.loanTenure);
      cy.get('[data-testid="loanType-loanPurpose"]').should('be.enabled').focus().select(data.step1.loanPurpose);
      pressEnter('wizard-next');

      cy.get('[data-testid="personalInfo-fullName"]').focus().type(data.step2.fullName);
      cy.get('[data-testid="personalInfo-dateOfBirth"]').focus().type(data.step2.dateOfBirth);
      pressSpace(`personalInfo-gender-${data.step2.gender}`);
      cy.get('[data-testid="personalInfo-maritalStatus"]').focus().select(data.step2.maritalStatus);
      cy.get('[data-testid="personalInfo-fatherName"]').focus().type(data.step2.fatherName);
      cy.get('[data-testid="personalInfo-motherName"]').focus().type(data.step2.motherName);
      cy.get('[data-testid="personalInfo-email"]').focus().type(data.step2.email);
      cy.get('[data-testid="personalInfo-mobileNumber"]').focus().type(data.step2.mobileNumber);
      pressEnter('wizard-next');

      cy.get('[data-testid="kyc-panNumber"]').focus().type(data.step3.panNumber, { delay: 20 });
      cy.get('[data-testid="pan-verified-badge"]').should('be.visible');
      cy.get('[data-testid="kyc-aadhaarNumber"]').focus().type(data.step3.aadhaarNumber, { delay: 20 });
      cy.get('[data-testid="aadhaar-verified-badge"]').should('be.visible');
      pressSpace('kyc-aadhaarConsent');
      pressEnter('wizard-next');

      cy.get('[data-testid="address-currentAddressLine1"]').focus().type(data.step4.currentAddressLine1);
      cy.get('[data-testid="address-currentPincode"]').focus().type(data.step4.currentPincode);
      cy.get('[data-testid="address-currentCity"]').should('not.have.value', '');
      cy.get('[data-testid="address-residenceType"]').focus().select(data.step4.residenceType);
      cy.get('[data-testid="address-yearsAtCurrentAddress"]').focus().type(data.step4.yearsAtCurrentAddress);
      pressEnter('wizard-next');

      pressSpace('employment-employmentType-Salaried');
      cy.get('[data-testid="employment-companyName"]').focus().type(data.step5.companyName);
      cy.get('[data-testid="employment-designation"]').focus().type(data.step5.designation);
      cy.get('[data-testid="employment-monthlyNetSalary"]').focus().type(data.step5.monthlyNetSalary);
      cy.get('[data-testid="employment-yearsOfExperience"]').focus().type(data.step5.yearsOfExperience);
      pressEnter('wizard-next');
    });

    cy.uploadRequiredDocuments('Personal', 'Salaried');
    cy.drawSignature();
    cy.get('[data-testid="step-documents"]').should('not.contain', 'Pending');
    cy.get('[data-testid="step-documents"]').should('not.contain', 'Please provide your signature');
    pressEnter('wizard-next');
    cy.get('[data-testid="step-review"]').should('be.visible');
    ['consentAccuracy', 'consentCreditCheck', 'consentTerms', 'consentCommunications'].forEach((name) => {
      pressSpace(`review-${name}`);
    });
    cy.get('body').then(($body) => {
      if ($body.find('[data-testid="review-emiAffordabilityAcknowledged"]').length) {
        pressSpace('review-emiAffordabilityAcknowledged');
      }
    });
    cy.get('[data-testid="submit-button"]').should('be.enabled');
    pressEnter('submit-button');
    cy.get('[data-testid="success-modal"]').should('be.visible');
  });

  it('keeps Step 1 focus order aligned with the visual field order', () => {
    pressSpace('loanType-loanType-Personal');
    cy.get('[data-testid="step-loanType"]')
      .find('input:not([type="hidden"]), select, button')
      .then(($elements) => {
        const order = [...$elements].map((element) => element.dataset.testid).filter(Boolean);
        expect(order.indexOf('loanType-loanAmount')).to.be.lessThan(order.indexOf('loanType-loanTenure'));
        expect(order.indexOf('loanType-loanTenure')).to.be.lessThan(order.indexOf('loanType-loanPurpose'));
      });
  });

  it('announces validation errors through ARIA live regions', () => {
    cy.get('[data-testid="wizard-next"]').click();
    cy.get('[aria-live="polite"]').should('exist');
    cy.get('[role="alert"]').should('have.length.greaterThan', 0);
    cy.get('[role="alert"]').first().invoke('text').should('not.be.empty');
  });
});
