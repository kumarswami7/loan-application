const next = () => cy.get('[data-testid="wizard-next"]').click();

const fillText = (testId, value) => {
  if (value !== undefined && value !== '') {
    cy.get(`[data-testid="${testId}"]`).clear().type(String(value));
  }
};

Cypress.Commands.add('drawSignature', (testId = 'signature-canvas-applicant') => {
  cy.get(`[data-testid="${testId}"] canvas`).then(($canvas) => {
    const rect = $canvas[0].getBoundingClientRect();
    cy.wrap($canvas)
      .trigger('mousedown', {
        which: 1,
        buttons: 1,
        clientX: rect.left + 40,
        clientY: rect.top + 70,
        force: true,
      })
      .trigger('mousemove', {
        which: 1,
        buttons: 1,
        clientX: rect.left + 120,
        clientY: rect.top + 45,
        force: true,
      })
      .trigger('mousemove', {
        which: 1,
        buttons: 1,
        clientX: rect.left + 220,
        clientY: rect.top + 90,
        force: true,
      });
    cy.document().trigger('mouseup', { which: 1, force: true });
  });
});

Cypress.Commands.add('uploadRequiredDocuments', (loanType, employmentType) => {
  const pdfDocuments = ['aadhaarFront', 'aadhaarBack', 'bankStatements'];
  if (employmentType === 'Salaried') pdfDocuments.push('salarySlips');
  if (employmentType === 'Self-Employed' || employmentType === 'Business Owner') pdfDocuments.push('itrDocs');
  if (loanType === 'Home') pdfDocuments.push('propertyDocs');
  if (loanType === 'Business') pdfDocuments.push('businessRegistration', 'gstReturns');

  pdfDocuments.forEach((documentId) => {
    cy.get(`[data-testid="upload-${documentId}"] input[type="file"]`)
      .selectFile('cypress/fixtures/test-doc.pdf', { force: true });
  });
  cy.get('[data-testid="upload-photograph"] input[type="file"]')
    .selectFile('cypress/fixtures/test-image.jpg', { force: true });
});

Cypress.Commands.add('fillStep1', (data) => {
  cy.get(`[data-testid="loanType-loanType-${data.loanType}"]`).check();
  fillText('loanType-loanAmount', data.loanAmount);
  cy.get('[data-testid="loanType-loanTenure"]').select(String(data.loanTenure));
  cy.get('[data-testid="loanType-loanPurpose"]').select(data.loanPurpose);
  next();
  cy.get('[data-testid="step-personalInfo"]').should('be.visible');
});

Cypress.Commands.add('fillStep2', (data) => {
  fillText('personalInfo-fullName', data.fullName);
  fillText('personalInfo-dateOfBirth', data.dateOfBirth);
  cy.get(`[data-testid="personalInfo-gender-${data.gender}"]`).check();
  cy.get('[data-testid="personalInfo-maritalStatus"]').select(data.maritalStatus);
  fillText('personalInfo-fatherName', data.fatherName);
  fillText('personalInfo-motherName', data.motherName);
  fillText('personalInfo-email', data.email);
  fillText('personalInfo-mobileNumber', data.mobileNumber);
  fillText('personalInfo-alternateMobile', data.alternateMobile);
  next();
  cy.get('[data-testid="step-kyc"]').should('be.visible');
});

Cypress.Commands.add('fillStep3', (data) => {
  cy.get('[data-testid="kyc-panNumber"]').focus().clear().type(data.panNumber, { delay: 20 });
  cy.wait(2100);
  cy.get('[data-testid="pan-verified-badge"]').should('be.visible');
  cy.get('[data-testid="kyc-aadhaarNumber"]').focus().clear().type(data.aadhaarNumber, { delay: 20 });
  cy.wait(2100);
  cy.get('[data-testid="aadhaar-verified-badge"]').should('be.visible');
  cy.get('[data-testid="kyc-aadhaarConsent"]').check();
  next();
  cy.get('[data-testid="step-address"]').should('be.visible');
});

Cypress.Commands.add('fillStep4', (data) => {
  fillText('address-currentAddressLine1', data.currentAddressLine1);
  fillText('address-currentPincode', data.currentPincode);
  cy.wait(800);
  cy.get('[data-testid="address-currentCity"]').should('not.have.value', '');
  cy.get('[data-testid="address-currentState"]').should('not.have.value', '');
  cy.get('[data-testid="address-residenceType"]').select(data.residenceType);
  fillText('address-yearsAtCurrentAddress', data.yearsAtCurrentAddress);
  next();
  cy.get('[data-testid="step-employment"]').should('be.visible');
});

Cypress.Commands.add('fillStep5Salaried', (data) => {
  cy.get('[data-testid="employment-employmentType-Salaried"]').check();
  fillText('employment-companyName', data.companyName);
  fillText('employment-designation', data.designation);
  fillText('employment-monthlyNetSalary', data.monthlyNetSalary);
  fillText('employment-yearsOfExperience', data.yearsOfExperience);
  next();
});

Cypress.Commands.add('fillStep5BusinessOwner', (data) => {
  cy.get('[data-testid="employment-employmentType-Business Owner"]').check();
  fillText('employment-businessName', data.businessName);
  cy.get('[data-testid="employment-businessType"]').select(data.businessType);
  fillText('employment-annualTurnover', data.annualTurnover);
  fillText('employment-yearsInBusiness', data.yearsInBusiness);
  fillText('employment-gstNumber', data.gstNumber);
  cy.contains('GST registered in:').should('be.visible');
  fillText('employment-officeAddress-addressLine1', data.officeAddressLine1);
  fillText('employment-officeAddress-pincode', data.officePincode);
  cy.wait(800);
  cy.get('[data-testid="employment-officeAddress-city"]').should('not.have.value', '');
  cy.get('[data-testid="employment-officeAddress-state"]').should('not.have.value', '');
  fillText('employment-yearsOfExperience', data.yearsOfExperience);
  next();
});

Cypress.Commands.add('fillStep6', (data) => {
  fillText('coApplicant-coApplicantName', data.coApplicantName);
  cy.get('[data-testid="coApplicant-relationship"]').select(data.relationship);
  cy.get('[data-testid="coApplicant-coApplicantPAN"]').focus().clear().type(data.coApplicantPAN, { delay: 20 });
  cy.wait(2100);
  cy.get('[data-testid="coApplicant-pan-verified-badge"]').should('be.visible');
  fillText('coApplicant-coApplicantIncome', data.coApplicantIncome);
  cy.get('[data-testid="coApplicant-coApplicantConsent"]').check();
  next();
  cy.get('[data-testid="step-documents"]').should('be.visible');
});

Cypress.Commands.add('fillStep7', (loanType, employmentType) => {
  cy.uploadRequiredDocuments(loanType, employmentType);
  cy.drawSignature('signature-canvas-applicant');
  cy.get('body').then(($body) => {
    if ($body.find('[data-testid="signature-canvas-coApplicant"]').length) {
      cy.drawSignature('signature-canvas-coApplicant');
    }
  });
  cy.get('[data-testid="step-documents"]').should('not.contain', 'Pending');
  cy.get('[data-testid="step-documents"]').should('not.contain', 'Please provide your signature');
  next();
  cy.get('[data-testid="step-review"]').should('be.visible');
});

Cypress.Commands.add('fillStep8', () => {
  cy.get('[data-testid="review-consentAccuracy"]').check();
  cy.get('[data-testid="review-consentCreditCheck"]').check();
  cy.get('[data-testid="review-consentTerms"]').check();
  cy.get('[data-testid="review-consentCommunications"]').check();
  cy.get('body').then(($body) => {
    if ($body.find('[data-testid="review-emiAffordabilityAcknowledged"]').length) {
      cy.get('[data-testid="review-emiAffordabilityAcknowledged"]').check();
    }
  });
  cy.get('[data-testid="submit-button"]').should('be.enabled').click();
});
