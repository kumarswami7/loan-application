import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useState,
} from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Checkbox from '../components/common/Checkbox';
import CurrencyInput from '../components/common/CurrencyInput';
import Input from '../components/common/Input';
import MaskedInput from '../components/common/MaskedInput';
import Select from '../components/common/Select';
import { useFormData } from '../components/wizard/FormDataContext';
import useVerification from '../hooks/useVerification';
import step6Schema, { RELATIONSHIP_OPTIONS } from '../schemas/step6Schema';

const CONSENT_TEXT = 'I, as co-applicant, consent to being added to this loan application and authorise LendSwift to verify my details and credit history.';
const VERIFICATION_PENDING_MESSAGE = 'Please wait for verification to complete';

const Step6CoApplicant = forwardRef(function Step6CoApplicant(_props, ref) {
  const { formData, updateStepData } = useFormData();
  const savedData = formData.coApplicant || {};
  const defaultRelationship = savedData.relationship
    || (formData.personalInfo?.maritalStatus === 'Married' ? 'Spouse' : '');
  const [verificationAttempted, setVerificationAttempted] = useState(false);

  const {
    control,
    formState: { errors },
    handleSubmit,
    register,
    setFocus,
  } = useForm({
    resolver: zodResolver(step6Schema),
    mode: 'onBlur',
    shouldFocusError: true,
    defaultValues: {
      coApplicantName: savedData.coApplicantName || '',
      relationship: defaultRelationship,
      coApplicantPAN: savedData.coApplicantPAN || '',
      coApplicantIncome: savedData.coApplicantIncome || '',
      coApplicantConsent: savedData.coApplicantConsent || false,
      // TODO Phase 8: replace with SignatureCanvas data from
      // formData.documents.coApplicantSignature.
      coApplicantSignature: savedData.coApplicantSignature || 'PENDING_SIGNATURE',
    },
  });

  const panValue = useWatch({ control, name: 'coApplicantPAN' });
  const panVerification = useVerification(panValue, 'PAN');

  useEffect(() => {
    setFocus('coApplicantName');
  }, [setFocus]);

  const submitVerifiedData = useCallback((data) => {
    setVerificationAttempted(true);
    if (!panVerification.isVerified) return false;

    const primaryIncome = Number(formData.employment?.monthlyIncomeForEMI || 0);
    updateStepData('coApplicant', {
      ...data,
      panVerified: true,
      combinedMonthlyIncomeForEMI: primaryIncome + Number(data.coApplicantIncome),
    });
    return true;
  }, [formData.employment?.monthlyIncomeForEMI, panVerification.isVerified, updateStepData]);

  useImperativeHandle(ref, () => ({
    async validateAndSubmit() {
      let isValid = false;
      await handleSubmit(
        (data) => {
          isValid = submitVerifiedData(data);
        },
        () => {
          isValid = false;
        },
      )();
      return isValid;
    },
  }), [handleSubmit, submitVerifiedData]);

  const panError = errors.coApplicantPAN?.message
    || panVerification.error
    || (verificationAttempted && !panVerification.isVerified
      ? VERIFICATION_PENDING_MESSAGE
      : undefined);

  return (
    <form onSubmit={handleSubmit(submitVerifiedData)} noValidate className="space-y-5">
      <h3 className="text-xl font-semibold text-primary">Co-Applicant &amp; Guarantor</h3>

      <Input
        label="Co-Applicant Name"
        autoComplete="name"
        error={errors.coApplicantName?.message}
        required
        {...register('coApplicantName')}
      />

      <Select
        label="Relationship"
        options={RELATIONSHIP_OPTIONS}
        placeholder="Select relationship"
        error={errors.relationship?.message}
        required
        {...register('relationship')}
      />

      <Controller
        name="coApplicantPAN"
        control={control}
        render={({ field }) => (
          <MaskedInput
            {...field}
            label="Co-Applicant PAN"
            maxLength={10}
            maskAfterLength={10}
            autoComplete="off"
            error={panError}
            isVerifying={panVerification.isVerifying}
            verified={panVerification.isVerified}
            onChange={(event) => field.onChange(event.target.value.toUpperCase())}
            required
          />
        )}
      />

      <Controller
        name="coApplicantIncome"
        control={control}
        render={({ field }) => (
          <CurrencyInput
            {...field}
            label="Co-Applicant Monthly Income"
            error={errors.coApplicantIncome?.message}
            required
          />
        )}
      />

      <div className="rounded-md border border-gray-200 bg-gray-50 p-4 text-sm text-gray-600">
        E-signature capture will be added in the Documents step
      </div>
      <input type="hidden" {...register('coApplicantSignature')} />

      <Checkbox
        label={CONSENT_TEXT}
        error={errors.coApplicantConsent?.message}
        required
        {...register('coApplicantConsent')}
      />
    </form>
  );
});

export default Step6CoApplicant;
