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
import usePinCodeLookup from '../hooks/usePinCodeLookup';
import {
  buildStep5Schema,
  BUSINESS_TYPE_OPTIONS,
  EMPLOYMENT_TYPE_OPTIONS,
} from '../schemas/step5Schema';
import { validateGST } from '../utils/gstValidator';

const COMPANY_OPTIONS = [
  'TCS',
  'Infosys',
  'Wipro',
  'HCL Technologies',
  'Tech Mahindra',
  'HDFC Bank',
  'ICICI Bank',
  'State Bank of India',
  'Reliance Industries',
  'Adani Group',
  'Larsen & Toubro',
  'Bharti Airtel',
  'Maruti Suzuki',
  'Mahindra & Mahindra',
  'Hindustan Unilever',
];

const BRANCH_FIELDS = {
  Salaried: ['companyName', 'designation', 'monthlyNetSalary'],
  'Self-Employed': [
    'businessName',
    'businessType',
    'annualTurnover',
    'yearsInBusiness',
    'monthlyIncome',
    'officeAddress.addressLine1',
    'officeAddress.pincode',
    'officeAddress.city',
    'officeAddress.state',
  ],
  'Business Owner': [
    'businessName',
    'businessType',
    'annualTurnover',
    'yearsInBusiness',
    'gstNumber',
    'officeAddress.addressLine1',
    'officeAddress.pincode',
    'officeAddress.city',
    'officeAddress.state',
  ],
};

function OfficeAddressFields({ control, errors, setValue }) {
  const pincode = useWatch({ control, name: 'officeAddress.pincode' });
  const lookup = usePinCodeLookup(pincode);

  useEffect(() => {
    if (lookup.city && lookup.state) {
      setValue('officeAddress.city', lookup.city, { shouldValidate: true });
      setValue('officeAddress.state', lookup.state, { shouldValidate: true });
    }
  }, [lookup.city, lookup.state, setValue]);

  return (
    <fieldset className="space-y-4 rounded-md border border-gray-200 p-4">
      <legend className="px-1 text-base font-medium text-gray-800">Office Address</legend>
      <Controller
        name="officeAddress.addressLine1"
        control={control}
        render={({ field }) => (
          <Input
            {...field}
            label="Office Address Line 1"
            error={errors.officeAddress?.addressLine1?.message}
            required
          />
        )}
      />
      <Controller
        name="officeAddress.pincode"
        control={control}
        render={({ field }) => (
          <div className="space-y-1">
            <Input
              {...field}
              label="Office PIN Code"
              inputMode="numeric"
              maxLength={6}
              error={errors.officeAddress?.pincode?.message}
              onChange={(event) => field.onChange(event.target.value.replace(/\D/g, '').slice(0, 6))}
              required
            />
            {lookup.isLoading && <p role="status" className="text-sm text-gray-500">Looking up PIN code...</p>}
            {lookup.error && <p className="text-sm text-amber-700">{lookup.error}</p>}
            {lookup.postOffice && <p className="text-sm text-gray-500">Post Office: {lookup.postOffice}</p>}
          </div>
        )}
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <Controller
          name="officeAddress.city"
          control={control}
          render={({ field }) => (
            <Input {...field} label="Office City" error={errors.officeAddress?.city?.message} required />
          )}
        />
        <Controller
          name="officeAddress.state"
          control={control}
          render={({ field }) => (
            <Input {...field} label="Office State" error={errors.officeAddress?.state?.message} required />
          )}
        />
      </div>
    </fieldset>
  );
}

function BusinessFields({ control, errors, register, setValue, showMonthlyIncome, showGST }) {
  const gstNumber = useWatch({ control, name: 'gstNumber' }) || '';
  const gstValidation = gstNumber.length === 15 ? validateGST(gstNumber) : null;
  const gstHelp = gstValidation?.valid && gstValidation.stateFromGST
    ? `GST registered in: ${gstValidation.stateFromGST}`
    : undefined;

  return (
    <div className="space-y-5">
      <Input label="Business Name" error={errors.businessName?.message} required {...register('businessName')} />
      <Select
        label="Business Type"
        options={BUSINESS_TYPE_OPTIONS}
        placeholder="Select business type"
        error={errors.businessType?.message}
        required
        {...register('businessType')}
      />
      <Controller
        name="annualTurnover"
        control={control}
        render={({ field }) => (
          <CurrencyInput {...field} label="Annual Turnover" error={errors.annualTurnover?.message} required />
        )}
      />
      <Input
        label="Years in Business"
        type="number"
        min="0"
        max="50"
        error={errors.yearsInBusiness?.message}
        required
        {...register('yearsInBusiness')}
      />
      {showMonthlyIncome && (
        <Controller
          name="monthlyIncome"
          control={control}
          render={({ field }) => (
            <CurrencyInput {...field} label="Monthly Income" error={errors.monthlyIncome?.message} required />
          )}
        />
      )}
      {showGST && (
        <Controller
          name="gstNumber"
          control={control}
          render={({ field }) => (
            <Input
              {...field}
              label="GST Number"
              maxLength={15}
              autoComplete="off"
              helpText={gstHelp}
              error={errors.gstNumber?.message}
              onChange={(event) => field.onChange(event.target.value.toUpperCase())}
              required
            />
          )}
        />
      )}
      <OfficeAddressFields control={control} errors={errors} setValue={setValue} />
      <Input
        label="Total Years of Experience"
        type="number"
        min="0"
        max="50"
        error={errors.yearsOfExperience?.message}
        required
        {...register('yearsOfExperience')}
      />
    </div>
  );
}

const Step5Employment = forwardRef(function Step5Employment(_props, ref) {
  const { formData, draftStepData, updateStepData } = useFormData();
  const loanType = formData.loanType?.loanType;
  const savedData = { ...formData.employment, ...draftStepData?.employment };
  const schema = useMemo(() => buildStep5Schema(loanType), [loanType]);
  const previousEmploymentType = useRef(savedData.employmentType);

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
      employmentType: savedData.employmentType || '',
      companyName: savedData.companyName || '',
      designation: savedData.designation || '',
      monthlyNetSalary: savedData.monthlyNetSalary || '',
      businessName: savedData.businessName || '',
      businessType: savedData.businessType || '',
      annualTurnover: savedData.annualTurnover || '',
      yearsInBusiness: savedData.yearsInBusiness ?? '',
      monthlyIncome: savedData.monthlyIncome || '',
      gstNumber: savedData.gstNumber || '',
      officeAddress: {
        addressLine1: savedData.officeAddress?.addressLine1 || '',
        pincode: savedData.officeAddress?.pincode || '',
        city: savedData.officeAddress?.city || '',
        state: savedData.officeAddress?.state || '',
      },
      yearsOfExperience: savedData.yearsOfExperience ?? '',
    },
  });

  const employmentType = useWatch({ control, name: 'employmentType' });

  useEffect(() => {
    setFocus('employmentType');
  }, [setFocus]);

  useEffect(() => {
    const previous = previousEmploymentType.current;
    if (!employmentType || previous === employmentType) return;
    if (!previous) {
      previousEmploymentType.current = employmentType;
      return;
    }

    const nextFields = new Set(BRANCH_FIELDS[employmentType]);
    BRANCH_FIELDS[previous]
      .filter((fieldName) => !nextFields.has(fieldName))
      .forEach((fieldName) => setValue(fieldName, '', { shouldDirty: true }));
    previousEmploymentType.current = employmentType;
  }, [employmentType, setValue]);

  const onValid = useCallback((data) => {
    const monthlyIncomeForEMI = data.employmentType === 'Salaried'
      ? Number(data.monthlyNetSalary)
      : data.employmentType === 'Self-Employed'
        ? Number(data.monthlyIncome)
        : Number(data.annualTurnover) / 12;

    updateStepData('employment', { ...data, monthlyIncomeForEMI });
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

  return (
    <form onSubmit={handleSubmit(onValid)} noValidate className="space-y-6">
      <h3 className="text-xl font-semibold text-primary">Employment &amp; Income</h3>

      <Controller
        name="employmentType"
        control={control}
        render={({ field }) => (
          <RadioGroup
            {...field}
            label="Employment Type"
            options={EMPLOYMENT_TYPE_OPTIONS}
            layout="vertical"
            error={errors.employmentType?.message}
            required
          />
        )}
      />

      {employmentType === 'Salaried' && (
        <section className="space-y-5" aria-label="Salaried employment details">
          <Input
            label="Company Name"
            list="company-options"
            autoComplete="organization"
            error={errors.companyName?.message}
            required
            {...register('companyName')}
          />
          <datalist id="company-options">
            {COMPANY_OPTIONS.map((company) => <option key={company} value={company} />)}
          </datalist>
          <Input label="Designation" error={errors.designation?.message} required {...register('designation')} />
          <Controller
            name="monthlyNetSalary"
            control={control}
            render={({ field }) => (
              <CurrencyInput {...field} label="Monthly Net Salary" error={errors.monthlyNetSalary?.message} required />
            )}
          />
          <Input
            label="Years of Experience"
            type="number"
            min="0"
            max="50"
            error={errors.yearsOfExperience?.message}
            required
            {...register('yearsOfExperience')}
          />
        </section>
      )}

      {employmentType === 'Self-Employed' && (
        <section aria-label="Self-employed details">
          <BusinessFields
            control={control}
            errors={errors}
            register={register}
            setValue={setValue}
            showMonthlyIncome
            showGST={false}
          />
        </section>
      )}

      {employmentType === 'Business Owner' && (
        <section aria-label="Business owner details">
          <BusinessFields
            control={control}
            errors={errors}
            register={register}
            setValue={setValue}
            showMonthlyIncome={false}
            showGST
          />
        </section>
      )}
    </form>
  );
});

export default Step5Employment;
