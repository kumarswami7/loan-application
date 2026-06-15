import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useState,
} from 'react';
import PropTypes from 'prop-types';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Checkbox from '../components/common/Checkbox';
import { useFormData } from '../components/wizard/FormDataContext';
import { STEP_REGISTRY, isCoApplicantStepVisible } from '../components/wizard/stepRegistry';
import { clearDraft } from '../hooks/useFormPersistence';
import { buildStep8Schema } from '../schemas/step8Schema';
import { getMissingDocumentRequirements } from '../utils/documentRequirements';
import { buildLoanSummary } from '../utils/emiCalculator';
import { formatIndianNumber, formatINR } from '../utils/numberFormat';

function maskIdentifier(value) {
  const text = String(value || '');
  if (text.length <= 4) return text;
  return `${'X'.repeat(text.length - 4)}${text.slice(-4)}`;
}

function formatDate(value) {
  if (!value) return '';
  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime())
    ? value
    : new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }).format(date);
}

function makeReferenceNumber() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  const hex = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx';
  return hex.replace(/[xy]/g, (character) => {
    const random = Math.floor(Math.random() * 16);
    const value = character === 'x' ? random : (random & 0x3) | 0x8;
    return value.toString(16);
  });
}

function summarySections(formData) {
  const sections = [
    {
      id: 'loanType',
      rows: [
        ['Loan Type', formData.loanType?.loanType],
        ['Amount', formatINR(formData.loanType?.loanAmount)],
        ['Tenure', `${formData.loanType?.loanTenure || ''} months`],
        ['Purpose', formData.loanType?.loanPurpose],
      ],
    },
    {
      id: 'personalInfo',
      rows: [
        ['Full Name', formData.personalInfo?.fullName],
        ['Date of Birth', formatDate(formData.personalInfo?.dateOfBirth)],
        ['Email', formData.personalInfo?.email],
        ['Mobile', formData.personalInfo?.mobileNumber],
      ],
    },
    {
      id: 'kyc',
      rows: [
        ['PAN', maskIdentifier(formData.kyc?.panNumber)],
        ['Aadhaar', maskIdentifier(formData.kyc?.aadhaarNumber)],
        ['PAN Status', formData.kyc?.panVerified ? 'Verified' : 'Provided'],
      ],
    },
    {
      id: 'address',
      rows: [
        ['Current Address', [formData.address?.currentAddressLine1, formData.address?.currentCity, formData.address?.currentState].filter(Boolean).join(', ')],
        ['PIN Code', formData.address?.currentPincode],
        ['Residence Type', formData.address?.residenceType],
      ],
    },
    {
      id: 'employment',
      rows: [
        ['Employment Type', formData.employment?.employmentType],
        ['Employer / Business', formData.employment?.companyName || formData.employment?.businessName],
        ['Monthly Income', formatINR(formData.employment?.monthlyIncomeForEMI)],
        ['Designation', formData.employment?.designation],
      ],
    },
  ];

  if (isCoApplicantStepVisible(formData)) {
    sections.push({
      id: 'coApplicant',
      rows: [
        ['Name', formData.coApplicant?.coApplicantName],
        ['Relationship', formData.coApplicant?.relationship],
        ['PAN', maskIdentifier(formData.coApplicant?.coApplicantPAN)],
        ['Monthly Income', formatINR(formData.coApplicant?.coApplicantIncome)],
      ],
    });
  }

  sections.push({
    id: 'documents',
    rows: getMissingDocumentRequirements(formData).length === 0
      ? [['Required Documents', 'Uploaded'], ['E-Signature', 'Captured']]
      : [['Required Documents', 'Incomplete']],
  });
  return sections;
}

function SuccessModal({ referenceNumber }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" role="presentation">
      <div
        role="dialog"
        data-testid="success-modal"
        aria-modal="true"
        aria-labelledby="submission-success-title"
        className="w-full max-w-lg rounded-lg bg-white p-6 text-center shadow-xl"
      >
        <h2 id="submission-success-title" className="text-2xl font-bold text-primary">
          Application Submitted Successfully!
        </h2>
        <p className="mt-4 text-sm text-gray-600">Your application reference number is</p>
        <p data-testid="reference-number" className="mt-2 select-all break-all font-mono text-xl font-semibold text-gray-900">
          {referenceNumber}
        </p>
        <p className="mt-5 text-sm text-gray-700">
          Our team will review your application within 2 business days. We will contact you using the details provided if any additional information is required.
        </p>
        {/* TODO: Generate and attach the application summary PDF. */}
        <button type="button" disabled className="mt-6 min-h-[44px] rounded-md bg-gray-200 px-5 py-2 text-gray-500">
          Download Summary (PDF) - Coming soon
        </button>
      </div>
    </div>
  );
}

SuccessModal.propTypes = { referenceNumber: PropTypes.string.isRequired };

const Step8Review = forwardRef(function Step8Review({ onReadinessChange }, ref) {
  const { formData, draftStepData, goToStep } = useFormData();
  const savedReview = { ...formData.review, ...draftStepData?.review };
  const combinedMonthlyIncome = Number(formData.employment?.monthlyIncomeForEMI || 0)
    + (formData.coApplicant?.coApplicantIncome ? Number(formData.coApplicant.coApplicantIncome) : 0);
  const loanSummary = useMemo(() => buildLoanSummary(
    formData.loanType?.loanType,
    formData.loanType?.loanAmount,
    formData.loanType?.loanTenure,
    combinedMonthlyIncome,
  ), [combinedMonthlyIncome, formData.loanType?.loanAmount, formData.loanType?.loanTenure, formData.loanType?.loanType]);
  const schema = useMemo(
    () => buildStep8Schema(loanSummary.exceedsAffordabilityThreshold),
    [loanSummary.exceedsAffordabilityThreshold],
  );
  const [referenceNumber, setReferenceNumber] = useState('');
  const sections = useMemo(() => summarySections(formData), [formData]);
  const missingDocuments = getMissingDocumentRequirements(formData);
  const missingSignatures = [
    ...(!formData.documents?.applicantSignature ? ['Provide your signature'] : []),
    ...(isCoApplicantStepVisible(formData) && !formData.documents?.coApplicantSignature
      ? ['Provide the co-applicant signature']
      : []),
  ];

  const {
    control,
    formState: { errors },
    getValues,
    handleSubmit,
    register,
  } = useForm({
    resolver: zodResolver(schema),
    mode: 'onBlur',
    defaultValues: {
      consentAccuracy: savedReview.consentAccuracy || false,
      consentCreditCheck: savedReview.consentCreditCheck || false,
      consentTerms: savedReview.consentTerms || false,
      consentCommunications: savedReview.consentCommunications || false,
      emiAffordabilityAcknowledged: savedReview.emiAffordabilityAcknowledged || false,
    },
  });
  const values = useWatch({ control });
  const requiredConsentsComplete = values.consentAccuracy
    && values.consentCreditCheck
    && values.consentTerms
    && values.consentCommunications
    && (!loanSummary.exceedsAffordabilityThreshold || values.emiAffordabilityAcknowledged);
  const isReady = Boolean(
    requiredConsentsComplete
    && missingDocuments.length === 0
    && missingSignatures.length === 0,
  );

  useEffect(() => {
    onReadinessChange(isReady);
    return () => onReadinessChange(false);
  }, [isReady, onReadinessChange]);

  const submitApplication = useCallback(() => {
    if (missingDocuments.length > 0 || missingSignatures.length > 0) return false;
    clearDraft(formData.loanType?.loanType);
    setReferenceNumber(makeReferenceNumber());
    return true;
  }, [formData.loanType?.loanType, missingDocuments.length, missingSignatures.length]);

  useImperativeHandle(ref, () => ({
    getDirtyValues: () => getValues(),
    async validateAndSubmit() {
      let isValid = false;
      await handleSubmit(
        (data) => { isValid = submitApplication(data); },
        () => { isValid = false; },
      )();
      return isValid;
    },
  }), [getValues, handleSubmit, submitApplication]);

  const missingItems = [
    ...(!values.consentAccuracy ? ['Confirm information accuracy'] : []),
    ...(!values.consentCreditCheck ? ['Authorise credit score check'] : []),
    ...(!values.consentTerms ? ['Agree to Terms and Conditions'] : []),
    ...(!values.consentCommunications ? ['Consent to communications'] : []),
    ...(loanSummary.exceedsAffordabilityThreshold && !values.emiAffordabilityAcknowledged
      ? ['Acknowledge EMI affordability warning'] : []),
    ...missingDocuments.map(({ label }) => `Upload ${label}`),
    ...missingSignatures,
  ];

  return (
    <form onSubmit={handleSubmit(submitApplication)} noValidate className="space-y-8">
      <h3 className="text-xl font-semibold text-primary">Review, Consent &amp; Pre-Approval Summary</h3>

      <section aria-labelledby="application-summary-heading" className="space-y-4">
        <h4 id="application-summary-heading" className="text-lg font-semibold">Application Summary</h4>
        {sections.map((section) => {
          const registryEntry = STEP_REGISTRY.find(({ id }) => id === section.id);
          return (
            <article key={section.id} className="rounded-lg border border-gray-200 p-4">
              <div className="flex items-center justify-between gap-4">
                <h5 className="font-semibold text-primary">{registryEntry?.label}</h5>
                <button
                  type="button"
                  data-testid={`edit-step-${section.id}`}
                  onClick={() => goToStep(section.id)}
                  className="min-h-[44px] rounded-md border border-primary px-4 py-2 text-sm font-medium text-primary"
                >
                  Edit {registryEntry?.shortLabel}
                </button>
              </div>
              <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
                {section.rows.filter(([, value]) => value !== '' && value !== undefined).map(([label, value]) => (
                  <div key={label}>
                    <dt className="text-gray-500">{label}</dt>
                    <dd className="font-medium text-gray-900">{value}</dd>
                  </div>
                ))}
              </dl>
            </article>
          );
        })}
      </section>

      <section data-testid="pre-approval-summary" className="rounded-lg border border-primary bg-primary/5 p-6" aria-labelledby="kfs-heading">
        <h4 id="kfs-heading" className="text-lg font-bold text-primary">Pre-Approval Summary (Key Fact Statement)</h4>
        <dl className="mt-4 grid gap-4 sm:grid-cols-2">
          <div><dt className="text-sm text-gray-600">Loan Amount</dt><dd className="text-lg font-semibold">{formatINR(formData.loanType?.loanAmount)}</dd></div>
          <div><dt className="text-sm text-gray-600">Tenure</dt><dd className="text-lg font-semibold">{formatIndianNumber(formData.loanType?.loanTenure)} months</dd></div>
          <div><dt className="text-sm text-gray-600">Indicative Interest Rate</dt><dd className="text-lg font-semibold">{loanSummary.interestRate}% p.a.</dd></div>
          <div><dt className="text-sm text-gray-600">Estimated EMI</dt><dd className="text-lg font-semibold">{formatINR(loanSummary.emi)}</dd></div>
          <div><dt className="text-sm text-gray-600">Total Cost of Borrowing</dt><dd className="text-lg font-semibold">{formatINR(loanSummary.totalCostOfBorrowing)}</dd></div>
          <div><dt className="text-sm text-gray-600">Processing Fee</dt><dd className="text-lg font-semibold">{formatINR(loanSummary.processingFee)}</dd></div>
        </dl>

        {loanSummary.exceedsAffordabilityThreshold && (
          <div className="mt-5 rounded-md border border-amber-400 bg-amber-50 p-4 text-amber-900">
            <p className="text-sm">
              Your estimated EMI is {loanSummary.emiToIncomeRatio.toFixed(1)}% of your monthly income, which exceeds our recommended 50% threshold. You may still proceed, but please review your affordability carefully.
            </p>
            <div className="mt-3">
              <Checkbox
                label="I understand the EMI-to-income ratio exceeds 50% and wish to proceed"
                error={errors.emiAffordabilityAcknowledged?.message}
                data-testid="review-emiAffordabilityAcknowledged"
                {...register('emiAffordabilityAcknowledged')}
              />
            </div>
          </div>
        )}

        <div className="mt-5 space-y-3 border-t border-primary/20 pt-4 text-sm text-gray-700">
          <p><strong>Cooling-off period:</strong> You have the right to exit this loan within 3 days of approval (cooling-off period) without any penalty, as per RBI Digital Lending Guidelines.</p>
          <p><strong>Grievance redressal:</strong> Grievance Officer: Mr. Rajesh Sharma, grievance@lendswift.in, 1800-XXX-XXXX. If unresolved within 30 days, escalate to the RBI Banking Ombudsman at rbi.org.in/Scripts/Complaints.aspx</p>
        </div>
      </section>

      <section aria-labelledby="signatures-heading">
        <h4 id="signatures-heading" className="text-lg font-semibold">E-Signatures</h4>
        <div className="mt-3 grid gap-4 sm:grid-cols-2">
          <div className="rounded-md border border-gray-200 p-3">
            <p className="mb-2 text-sm font-medium">Your Signature</p>
            {formData.documents?.applicantSignature
              ? <img src={formData.documents.applicantSignature} alt="Your Signature" className="h-24 w-full object-contain" />
              : <p className="text-sm text-error">Signature missing</p>}
          </div>
          {isCoApplicantStepVisible(formData) && (
            <div className="rounded-md border border-gray-200 p-3">
              <p className="mb-2 text-sm font-medium">Co-Applicant Signature</p>
              {formData.documents?.coApplicantSignature
                ? <img data-testid="coApplicant-signature-display" src={formData.documents.coApplicantSignature} alt="Co-Applicant Signature" className="h-24 w-full object-contain" />
                : <p className="text-sm text-error">Signature missing</p>}
            </div>
          )}
        </div>
      </section>

      <section className="space-y-2" aria-labelledby="consent-heading">
        <h4 id="consent-heading" className="text-lg font-semibold">Consent &amp; Authorisation</h4>
        <Checkbox label="I confirm that all information and documents provided in this application are true, complete and accurate." error={errors.consentAccuracy?.message} data-testid="review-consentAccuracy" required {...register('consentAccuracy')} />
        <Checkbox label="I authorise LendSwift and its lending partners to obtain and verify my credit score and credit history." error={errors.consentCreditCheck?.message} data-testid="review-consentCreditCheck" required {...register('consentCreditCheck')} />
        <Checkbox
          label={<span>I have read and agree to the <a href="#" target="_blank" rel="noreferrer" onClick={(event) => event.stopPropagation()} className="text-primary underline">Terms and Conditions</a>.</span>}
          error={errors.consentTerms?.message}
          required
          data-testid="review-consentTerms"
          {...register('consentTerms')}
        />
        {/* TODO: Replace the placeholder link above with the published Terms and Conditions PDF. */}
        <Checkbox label="I consent to receive communications regarding this application by phone, SMS, email and WhatsApp." error={errors.consentCommunications?.message} data-testid="review-consentCommunications" required {...register('consentCommunications')} />
      </section>

      {missingItems.length > 0 && (
        <p className="rounded-md bg-gray-50 p-3 text-sm text-gray-700" role="status">
          Complete the following to submit: {missingItems.map((item) => `\u2715 ${item}`).join(', ')}
        </p>
      )}

      {referenceNumber && <SuccessModal referenceNumber={referenceNumber} />}
    </form>
  );
});

Step8Review.propTypes = { onReadinessChange: PropTypes.func };
Step8Review.defaultProps = { onReadinessChange: () => {} };

export default Step8Review;
