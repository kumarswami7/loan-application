import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
} from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import CurrencyInput from '../components/common/CurrencyInput';
import Input from '../components/common/Input';
import RadioGroup from '../components/common/RadioGroup';
import Select from '../components/common/Select';
import { useFormData } from '../components/wizard/FormDataContext';
import {
  buildStep1Schema,
  LOAN_CONSTRAINTS,
  LOAN_PURPOSE_OPTIONS,
  LOAN_TYPE_VALUES,
  TENURE_OPTIONS,
} from '../schemas/step1Schema';
import { getMaxTenureMonths } from '../schemas/step2Schema';
import { toLakhCroreLabel } from '../utils/numberFormat';

const Step1LoanType = forwardRef(function Step1LoanType(_props, ref) {
  const { formData, draftStepData, updateStepData } = useFormData();
  const savedData = { ...formData.loanType, ...draftStepData?.loanType };
  const maxTenureMonths = getMaxTenureMonths(formData.personalInfo?.dateOfBirth);
  const schema = useMemo(() => buildStep1Schema(maxTenureMonths), [maxTenureMonths]);
  const previousLoanType = useRef(savedData.loanType);

  const {
    control,
    formState: { errors },
    getValues,
    handleSubmit,
    register,
    setFocus,
    setValue,
  } = useForm({
    resolver: zodResolver(schema),
    mode: 'onBlur',
    shouldFocusError: true,
    defaultValues: {
      loanType: savedData.loanType || '',
      loanAmount: savedData.loanAmount || '',
      loanTenure: savedData.loanTenure || '',
      loanPurpose: savedData.loanPurpose || '',
      referralCode: savedData.referralCode || '',
    },
  });

  const loanType = useWatch({ control, name: 'loanType' });
  const tenureOptions = (TENURE_OPTIONS[loanType] || []).map((months) => ({
    value: months,
    label: `${months} months`,
  }));
  const purposeOptions = LOAN_PURPOSE_OPTIONS[loanType] || [];

  useEffect(() => {
    setFocus('loanType');
  }, [setFocus]);

  useEffect(() => {
    if (!loanType || loanType === previousLoanType.current) return;

    const currentTenure = Number(getValues('loanTenure'));
    if (!TENURE_OPTIONS[loanType].includes(currentTenure)) {
      setValue('loanTenure', '', { shouldDirty: true });
    }
    setValue('loanPurpose', '', { shouldDirty: true });
    previousLoanType.current = loanType;
  }, [getValues, loanType, setValue]);

  const onValid = useCallback((data) => {
    updateStepData('loanType', data);
  }, [updateStepData]);

  useImperativeHandle(ref, () => ({
    getDirtyValues: () => getValues(),
    async validateAndSubmit() {
      let isValid = false;
      await handleSubmit(
        (data) => {
          onValid(data);
          isValid = true;
        },
        () => {
          isValid = false;
        },
      )();
      return isValid;
    },
  }), [getValues, handleSubmit, onValid]);

  const amountHelp = loanType
    ? `Min: ${toLakhCroreLabel(LOAN_CONSTRAINTS[loanType].min)} | Max: ${toLakhCroreLabel(LOAN_CONSTRAINTS[loanType].max)}`
    : 'Select a loan type to see the available amount range';

  return (
    <form onSubmit={handleSubmit(onValid)} noValidate className="space-y-5">
      <h3 className="text-xl font-semibold text-primary">Loan Details</h3>

      <Controller
        name="loanType"
        control={control}
        render={({ field }) => (
          <RadioGroup
            {...field}
            label="Loan Type"
            options={LOAN_TYPE_VALUES}
            testIdPrefix="loanType-loanType"
            error={errors.loanType?.message}
            required
          />
        )}
      />

      <Controller
        name="loanAmount"
        control={control}
        render={({ field }) => (
          <CurrencyInput
            {...field}
            label="Loan Amount"
            error={errors.loanAmount?.message}
            helpText={amountHelp}
            data-testid="loanType-loanAmount"
            required
          />
        )}
      />

      <div className="grid gap-5 sm:grid-cols-2">
        <Select
          label="Loan Tenure"
          options={tenureOptions}
          placeholder="Select tenure"
          error={errors.loanTenure?.message}
          disabled={!loanType}
          required
          data-testid="loanType-loanTenure"
          {...register('loanTenure')}
        />

        <Select
          label="Loan Purpose"
          options={purposeOptions}
          placeholder="Select purpose"
          error={errors.loanPurpose?.message}
          disabled={!loanType}
          required
          data-testid="loanType-loanPurpose"
          {...register('loanPurpose')}
        />
      </div>

      <Input
        label="Referral Code"
        error={errors.referralCode?.message}
        autoComplete="off"
        data-testid="loanType-referralCode"
        {...register('referralCode')}
      />
    </form>
  );
});

export default Step1LoanType;
