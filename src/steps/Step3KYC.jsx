import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useState,
} from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Checkbox from '../components/common/Checkbox';
import Input from '../components/common/Input';
import MaskedInput from '../components/common/MaskedInput';
import { useFormData } from '../components/wizard/FormDataContext';
import useVerification from '../hooks/useVerification';
import { buildStep3Schema } from '../schemas/step3Schema';

const CONSENT_TEXT = 'I hereby consent to LendSwift verifying my Aadhaar details for the purpose of this loan application, in accordance with the Aadhaar Act, 2016 and RBI Digital Lending Guidelines.';
const VERIFICATION_PENDING_MESSAGE = 'Please wait for verification to complete';

const Step3KYC = forwardRef(function Step3KYC(_props, ref) {
  const { formData, draftStepData, updateStepData } = useFormData();
  const loanType = formData.loanType?.loanType;
  const loanAmount = Number(formData.loanType?.loanAmount || 0);
  const savedData = { ...formData.kyc, ...draftStepData?.kyc };
  const showPassport = loanType === 'Home' && loanAmount > 5000000;
  const schema = useMemo(() => buildStep3Schema(loanType), [loanType]);
  const [verificationAttempted, setVerificationAttempted] = useState(false);

  const {
    control,
    formState: { errors },
    getValues,
    handleSubmit,
    register,
    setFocus,
  } = useForm({
    resolver: zodResolver(schema),
    mode: 'onBlur',
    shouldFocusError: true,
    defaultValues: {
      panNumber: savedData.panNumber || '',
      aadhaarNumber: savedData.aadhaarNumber || '',
      aadhaarConsent: savedData.aadhaarConsent || false,
      voterID: savedData.voterID || '',
      passport: showPassport ? savedData.passport || '' : '',
    },
  });

  const panValue = useWatch({ control, name: 'panNumber' });
  const aadhaarValue = useWatch({ control, name: 'aadhaarNumber' });
  const panVerification = useVerification(panValue, 'PAN');
  const aadhaarVerification = useVerification(aadhaarValue, 'AADHAAR');

  useEffect(() => {
    setFocus('panNumber');
  }, [setFocus]);

  useEffect(() => {
    if (panVerification.isVerified) {
      updateStepData('kyc', {
        ...getValues(),
        panVerified: true,
      });
    }
  }, [getValues, panVerification.isVerified, updateStepData]);

  const submitVerifiedData = useCallback((data) => {
    setVerificationAttempted(true);
    if (!panVerification.isVerified || !aadhaarVerification.isVerified) {
      return false;
    }

    updateStepData('kyc', {
      ...data,
      panVerified: true,
      aadhaarVerified: true,
    });
    return true;
  }, [aadhaarVerification.isVerified, panVerification.isVerified, updateStepData]);

  useImperativeHandle(ref, () => ({
    getDirtyValues: () => getValues(),
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
  }), [getValues, handleSubmit, submitVerifiedData]);

  const panError = errors.panNumber?.message
    || panVerification.error
    || (verificationAttempted && !panVerification.isVerified
      ? VERIFICATION_PENDING_MESSAGE
      : undefined);
  const aadhaarError = errors.aadhaarNumber?.message
    || aadhaarVerification.error
    || (verificationAttempted && !aadhaarVerification.isVerified
      ? VERIFICATION_PENDING_MESSAGE
      : undefined);

  return (
    <form onSubmit={handleSubmit(submitVerifiedData)} noValidate className="space-y-5">
      <h3 className="text-xl font-semibold text-primary">Identity Verification</h3>

      <Controller
        name="panNumber"
        control={control}
        render={({ field }) => (
          <MaskedInput
            {...field}
            label="PAN Number"
            maxLength={10}
            maskAfterLength={10}
            autoComplete="off"
            error={panError}
            isVerifying={panVerification.isVerifying}
            verified={panVerification.isVerified}
            data-testid="kyc-panNumber"
            verificationTestId="pan-verified-badge"
            onChange={(event) => {
              const nextValue = event.target.value.toUpperCase();
              field.onChange(nextValue);
              if (formData.kyc?.panVerified) {
                updateStepData('kyc', { panNumber: nextValue, panVerified: false });
              }
            }}
            required
          />
        )}
      />

      <Controller
        name="aadhaarNumber"
        control={control}
        render={({ field }) => (
          <MaskedInput
            {...field}
            label="Aadhaar Number"
            inputMode="numeric"
            maxLength={12}
            maskAfterLength={12}
            autoComplete="off"
            error={aadhaarError}
            isVerifying={aadhaarVerification.isVerifying}
            verified={aadhaarVerification.isVerified}
            data-testid="kyc-aadhaarNumber"
            verificationTestId="aadhaar-verified-badge"
            onChange={(event) => {
              field.onChange(event.target.value.replace(/\D/g, '').slice(0, 12));
            }}
            required
          />
        )}
      />

      <Checkbox
        label={CONSENT_TEXT}
        error={errors.aadhaarConsent?.message}
        required
        data-testid="kyc-aadhaarConsent"
        {...register('aadhaarConsent')}
      />

      <Input
        label="Voter ID"
        maxLength={10}
        autoComplete="off"
        error={errors.voterID?.message}
        data-testid="kyc-voterID"
        {...register('voterID', {
          onChange: (event) => {
            event.target.value = event.target.value.toUpperCase();
          },
        })}
      />

      {showPassport && (
        <Input
          label="Passport Number"
          maxLength={8}
          autoComplete="off"
          error={errors.passport?.message}
          data-testid="kyc-passport"
          {...register('passport', {
            onChange: (event) => {
              event.target.value = event.target.value.toUpperCase();
            },
          })}
        />
      )}
    </form>
  );
});

export default Step3KYC;
