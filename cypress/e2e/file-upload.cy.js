describe('File uploads', () => {
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

  it('uploads a valid PDF and shows it in the checklist', () => {
    cy.get('[data-testid="upload-aadhaarFront"] input[type="file"]')
      .selectFile('cypress/fixtures/test-doc.pdf', { force: true });
    cy.get('[data-testid="checklist-aadhaarFront"]').should('contain', 'Uploaded');
    cy.get('[data-testid="preview-aadhaarFront"]').should('be.visible');
  });

  it('rejects a file with the wrong MIME type', () => {
    cy.get('[data-testid="upload-photograph"] input[type="file"]').selectFile({
      contents: Cypress.Buffer.from('fake pdf content'),
      fileName: 'photo.pdf',
      mimeType: 'application/pdf',
    }, { force: true });
    cy.get('[data-testid="upload-photograph-error"]').should('contain', 'not supported');
  });

  it('rejects a file that exceeds the size limit', () => {
    const largeContent = Cypress.Buffer.alloc(6 * 1024 * 1024, 'a');
    cy.get('[data-testid="upload-panCard"] input[type="file"]').selectFile({
      contents: largeContent,
      fileName: 'large.pdf',
      mimeType: 'application/pdf',
    }, { force: true });
    cy.get('[data-testid="upload-panCard-error"]').should('contain', '5MB');
  });

  it('uploads an image and shows compression information', () => {
    cy.get('[data-testid="upload-photograph"] input[type="file"]')
      .selectFile('cypress/fixtures/test-image.jpg', { force: true });
    cy.get('[data-testid="compression-info-photograph"]').should('be.visible').and('contain', 'B');
  });

  it('removes an uploaded file and returns the checklist item to Pending', () => {
    cy.get('[data-testid="upload-aadhaarFront"] input[type="file"]')
      .selectFile('cypress/fixtures/test-doc.pdf', { force: true });
    cy.get('[data-testid="checklist-aadhaarFront"]').should('contain', 'Uploaded');
    cy.get('[data-testid="remove-aadhaarFront-0"]').click();
    cy.get('[data-testid="checklist-aadhaarFront"]').should('contain', 'Pending');
  });
});
