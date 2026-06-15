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
import Select from '../components/common/Select';
import { useFormData } from '../components/wizard/FormDataContext';
import usePinCodeLookup from '../hooks/usePinCodeLookup';
import { buildStep4Schema, RESIDENCE_TYPE_OPTIONS } from '../schemas/step4Schema';

function LookupStatus({ lookup }) {
  if (lookup.isLoading) {
    return <p className="text-sm text-gray-500" role="status">Looking up PIN code...</p>;
  }
  if (lookup.error) {
    return <p data-testid="pincode-not-found-message" className="text-sm text-amber-700">{lookup.error}</p>;
  }
  if (lookup.postOffice) {
    return <p className="text-sm text-gray-500">Post Office: {lookup.postOffice}</p>;
  }
  return null;
}

const Step4Address = forwardRef(function Step4Address(_props, ref) {
  const { formData, draftStepData, updateStepData } = useFormData();
  const savedData = { ...formData.address, ...draftStepData?.address };
  const [currentStateBlurred, setCurrentStateBlurred] = useState(false);

  const {
    control,
    formState: { errors },
    getValues,
    handleSubmit,
    register,
    setFocus,
    setValue,
  } = useForm({
    resolver: zodResolver(buildStep4Schema()),
    mode: 'onBlur',
    shouldFocusError: true,
    defaultValues: {
      currentAddressLine1: savedData.currentAddressLine1 || '',
      currentAddressLine2: savedData.currentAddressLine2 || '',
      currentPincode: savedData.currentPincode || '',
      currentCity: savedData.currentCity || '',
      currentState: savedData.currentState || '',
      residenceType: savedData.residenceType || '',
      rentAmount: savedData.rentAmount || '',
      yearsAtCurrentAddress: savedData.yearsAtCurrentAddress ?? '',
      previousAddressLine1: savedData.previousAddressLine1 || '',
      previousPincode: savedData.previousPincode || '',
      previousCity: savedData.previousCity || '',
      previousState: savedData.previousState || '',
      sameAsPermanentAddress: savedData.sameAsPermanentAddress ?? true,
      permanentAddressLine1: savedData.permanentAddressLine1 || '',
      permanentAddressLine2: savedData.permanentAddressLine2 || '',
      permanentPincode: savedData.permanentPincode || '',
      permanentCity: savedData.permanentCity || '',
      permanentState: savedData.permanentState || '',
    },
  });

  const currentPincode = useWatch({ control, name: 'currentPincode' });
  const previousPincode = useWatch({ control, name: 'previousPincode' });
  const permanentPincode = useWatch({ control, name: 'permanentPincode' });
  const currentState = useWatch({ control, name: 'currentState' });
  const residenceType = useWatch({ control, name: 'residenceType' });
  const yearsAtCurrentAddress = useWatch({ control, name: 'yearsAtCurrentAddress' });
  const sameAsPermanentAddress = useWatch({ control, name: 'sameAsPermanentAddress' });

  const currentLookup = usePinCodeLookup(currentPincode);
  const previousLookup = usePinCodeLookup(previousPincode);
  const permanentLookup = usePinCodeLookup(permanentPincode);
  useEffect(() => {
    setFocus('currentAddressLine1');
  }, [setFocus]);

  useEffect(() => {
    if (currentLookup.city && currentLookup.state) {
      setValue('currentCity', currentLookup.city, { shouldValidate: true });
      setValue('currentState', currentLookup.state, { shouldValidate: true });
    }
  }, [currentLookup.city, currentLookup.state, setValue]);

  useEffect(() => {
    if (previousLookup.city && previousLookup.state) {
      setValue('previousCity', previousLookup.city, { shouldValidate: true });
      setValue('previousState', previousLookup.state, { shouldValidate: true });
    }
  }, [previousLookup.city, previousLookup.state, setValue]);

  useEffect(() => {
    if (permanentLookup.city && permanentLookup.state) {
      setValue('permanentCity', permanentLookup.city, { shouldValidate: true });
      setValue('permanentState', permanentLookup.state, { shouldValidate: true });
    }
  }, [permanentLookup.city, permanentLookup.state, setValue]);

  const onValid = useCallback((data) => {
    updateStepData('address', data);
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

  const showPreviousAddress = yearsAtCurrentAddress !== ''
    && Number.isFinite(Number(yearsAtCurrentAddress))
    && Number(yearsAtCurrentAddress) < 1;
  const showPermanentAddress = sameAsPermanentAddress === false;
  const stateMismatch = currentStateBlurred
    && currentLookup.state
    && currentState
    && currentState.trim().toLowerCase() !== currentLookup.state.toLowerCase();

  const copyCurrentAddress = () => {
    setValue('permanentAddressLine1', getValues('currentAddressLine1'), { shouldDirty: true });
    setValue('permanentAddressLine2', getValues('currentAddressLine2'), { shouldDirty: true });
    setValue('permanentPincode', getValues('currentPincode'), { shouldDirty: true });
    setValue('permanentCity', getValues('currentCity'), { shouldDirty: true });
    setValue('permanentState', getValues('currentState'), { shouldDirty: true });
  };

  const numericPinChange = (field, resetWarning = false) => (event) => {
    field.onChange(event.target.value.replace(/\D/g, '').slice(0, 6));
    if (resetWarning) setCurrentStateBlurred(false);
  };

  return (
    <form onSubmit={handleSubmit(onValid)} noValidate className="space-y-6">
      <h3 className="text-xl font-semibold text-primary">Address Information</h3>

      <section className="space-y-4" aria-labelledby="current-address-heading">
        <h4 id="current-address-heading" className="text-lg font-medium text-gray-800">
          Current Address
        </h4>
        <Input
          label="Current Address Line 1"
          autoComplete="address-line1"
          error={errors.currentAddressLine1?.message}
          required
          data-testid="address-currentAddressLine1"
          {...register('currentAddressLine1')}
        />
        <Input
          label="Current Address Line 2"
          autoComplete="address-line2"
          error={errors.currentAddressLine2?.message}
          data-testid="address-currentAddressLine2"
          {...register('currentAddressLine2')}
        />
        <Controller
          name="currentPincode"
          control={control}
          render={({ field }) => (
            <div className="space-y-1">
              <Input
                {...field}
                label="Current PIN Code"
                inputMode="numeric"
                autoComplete="postal-code"
                maxLength={6}
                error={errors.currentPincode?.message}
                onChange={numericPinChange(field, true)}
                required
                data-testid="address-currentPincode"
              />
              <LookupStatus lookup={currentLookup} />
            </div>
          )}
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="Current City"
            autoComplete="address-level2"
            error={errors.currentCity?.message}
            required
            data-testid="address-currentCity"
            {...register('currentCity')}
          />
          <Controller
            name="currentState"
            control={control}
            render={({ field }) => (
              <Input
                {...field}
                label="Current State"
                autoComplete="address-level1"
                error={errors.currentState?.message}
                onBlur={(event) => {
                  field.onBlur(event);
                  setCurrentStateBlurred(true);
                }}
                required
                data-testid="address-currentState"
              />
            )}
          />
        </div>
        {stateMismatch && (
          <div role="status" className="rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-800">
            The state you entered doesn&apos;t match the PIN code&apos;s registered state ({currentLookup.state}). Please verify.
          </div>
        )}
      </section>

      <section className="space-y-4" aria-labelledby="residence-heading">
        <h4 id="residence-heading" className="text-lg font-medium text-gray-800">
          Residence Details
        </h4>
        <Select
          label="Residence Type"
          options={RESIDENCE_TYPE_OPTIONS}
          placeholder="Select residence type"
          error={errors.residenceType?.message}
          required
          data-testid="address-residenceType"
          {...register('residenceType')}
        />
        <div className="min-h-0">
          {residenceType === 'Rented' && (
            <Controller
              name="rentAmount"
              control={control}
              render={({ field }) => (
                <CurrencyInput
                  {...field}
                  label="Monthly Rent Amount"
                  error={errors.rentAmount?.message}
                  required
                  data-testid="address-rentAmount"
                />
              )}
            />
          )}
        </div>
        <Input
          label="Years at Current Address"
          type="number"
          min="0"
          max="50"
          step="0.1"
          error={errors.yearsAtCurrentAddress?.message}
          required
          data-testid="address-yearsAtCurrentAddress"
          {...register('yearsAtCurrentAddress')}
        />
      </section>

      {showPreviousAddress && (
        <section className="space-y-4 border-t border-gray-200 pt-5" aria-labelledby="previous-address-heading">
          <h4 id="previous-address-heading" className="text-lg font-medium text-gray-800">
            Previous Address
          </h4>
          <Input
            label="Previous Address Line 1"
            error={errors.previousAddressLine1?.message}
            required
            {...register('previousAddressLine1')}
          />
          <Controller
            name="previousPincode"
            control={control}
            render={({ field }) => (
              <div className="space-y-1">
                <Input
                  {...field}
                  label="Previous PIN Code"
                  inputMode="numeric"
                  maxLength={6}
                  error={errors.previousPincode?.message}
                  onChange={numericPinChange(field)}
                  required
                />
                <LookupStatus lookup={previousLookup} />
              </div>
            )}
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="Previous City" error={errors.previousCity?.message} required {...register('previousCity')} />
            <Input label="Previous State" error={errors.previousState?.message} required {...register('previousState')} />
          </div>
        </section>
      )}

      <Checkbox
        label="My permanent address is the same as my current address"
        error={errors.sameAsPermanentAddress?.message}
        data-testid="address-sameAsPermanentAddress"
        {...register('sameAsPermanentAddress')}
      />

      {showPermanentAddress && (
        <section className="space-y-4 border-t border-gray-200 pt-5" aria-labelledby="permanent-address-heading">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h4 id="permanent-address-heading" className="text-lg font-medium text-gray-800">
              Permanent Address
            </h4>
            <button
              type="button"
              onClick={copyCurrentAddress}
              className="min-h-[44px] rounded-md border border-primary px-4 py-2 text-sm font-medium text-primary hover:bg-primary/5"
            >
              Copy from current address
            </button>
          </div>
          <Input
            label="Permanent Address Line 1"
            error={errors.permanentAddressLine1?.message}
            required
            {...register('permanentAddressLine1')}
          />
          <Input
            label="Permanent Address Line 2"
            error={errors.permanentAddressLine2?.message}
            {...register('permanentAddressLine2')}
          />
          <Controller
            name="permanentPincode"
            control={control}
            render={({ field }) => (
              <div className="space-y-1">
                <Input
                  {...field}
                  label="Permanent PIN Code"
                  inputMode="numeric"
                  maxLength={6}
                  error={errors.permanentPincode?.message}
                  onChange={numericPinChange(field)}
                  required
                />
                <LookupStatus lookup={permanentLookup} />
              </div>
            )}
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="Permanent City" error={errors.permanentCity?.message} required {...register('permanentCity')} />
            <Input label="Permanent State" error={errors.permanentState?.message} required {...register('permanentState')} />
          </div>
        </section>
      )}
    </form>
  );
});

export default Step4Address;
