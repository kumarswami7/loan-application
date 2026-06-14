import { z } from 'zod';
import { isCoApplicantStepVisible } from '../components/wizard/stepRegistry';

const IDENTITY_ACCEPT = ['application/pdf', 'image/jpeg', 'image/png'];

export const DOCUMENT_REQUIREMENTS_BASE = [
  { id: 'panCard', label: 'PAN Card Copy', accept: IDENTITY_ACCEPT, maxSizeMB: 5, maxFiles: 1 },
  { id: 'aadhaarFront', label: 'Aadhaar Card (Front)', accept: IDENTITY_ACCEPT, maxSizeMB: 5, maxFiles: 1 },
  { id: 'aadhaarBack', label: 'Aadhaar Card (Back)', accept: IDENTITY_ACCEPT, maxSizeMB: 5, maxFiles: 1 },
  { id: 'bankStatements', label: 'Bank Statements (Last 6 months)', accept: ['application/pdf'], maxSizeMB: 10, maxFiles: 1 },
  { id: 'photograph', label: 'Photograph (Passport size)', accept: ['image/jpeg', 'image/png'], maxSizeMB: 2, maxFiles: 1 },
];

export function getDocumentRequirements(formData) {
  const requirements = DOCUMENT_REQUIREMENTS_BASE.map((document) => ({
    ...document,
    accept: [...document.accept],
    required: document.id === 'panCard' ? formData?.kyc?.panVerified !== true : true,
  }));
  const employmentType = formData?.employment?.employmentType;
  const loanType = formData?.loanType?.loanType;

  if (employmentType === 'Salaried') {
    requirements.push({ id: 'salarySlips', label: 'Salary Slips (Last 3 months)', accept: ['application/pdf'], maxSizeMB: 5, maxFiles: 3, required: true });
  }
  if (employmentType === 'Self-Employed' || employmentType === 'Business Owner') {
    requirements.push({ id: 'itrDocs', label: 'ITR (Last 2 years)', accept: ['application/pdf'], maxSizeMB: 5, maxFiles: 2, required: true });
  }
  if (loanType === 'Home') {
    requirements.push({ id: 'propertyDocs', label: 'Property Documents', accept: ['application/pdf'], maxSizeMB: 10, maxFiles: 1, required: true });
  }
  if (loanType === 'Business') {
    requirements.push(
      { id: 'businessRegistration', label: 'Business Registration Certificate', accept: ['application/pdf'], maxSizeMB: 5, maxFiles: 1, required: true },
      { id: 'gstReturns', label: 'GST Returns (Last 4 quarters)', accept: ['application/pdf'], maxSizeMB: 5, maxFiles: 4, required: true },
    );
  }
  return requirements;
}

const fileMetadataSchema = z.object({
  name: z.string().min(1),
  size: z.number().nonnegative(),
  type: z.string().min(1),
});

export function buildStep7Schema(formData) {
  // RHF tracks serializable metadata only. Actual Blob/File values live in
  // Step7Documents.documentFiles, keyed by document id.
  const documentFields = Object.fromEntries(getDocumentRequirements(formData).map((document) => {
    const field = z.array(fileMetadataSchema);
    return [document.id, document.required ? field.min(1, `${document.label} is required`) : field];
  }));
  const signatureFields = {
    applicantSignature: z.string({ error: 'Please provide your signature' }).min(1, 'Please provide your signature'),
  };
  if (isCoApplicantStepVisible(formData)) {
    signatureFields.coApplicantSignature = z.string({ error: 'Please provide the co-applicant signature' }).min(1, 'Please provide the co-applicant signature');
  }
  return z.object({ ...documentFields, ...signatureFields });
}

export default buildStep7Schema;
