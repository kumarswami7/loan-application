import { forwardRef, useCallback, useImperativeHandle } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Input from '../components/common/Input';
import RadioGroup from '../components/common/RadioGroup';
import Select from '../components/common/Select';
import { useFormData } from '../components/wizard/FormDataContext';
import step2Schema, {
  GENDER_OPTIONS,
  MARITAL_STATUS_OPTIONS,
} from '../schemas/step2Schema';

const Step2PersonalInfo = forwardRef(function Step2PersonalInfo(_props, ref) {
  const { formData, draftStepData, updateStepData } = useFormData();
  const savedData = { ...formData.personalInfo, ...draftStepData?.personalInfo };

  const {
    control,
    formState: { errors },
    getValues,
    handleSubmit,
    register,
  } = useForm({
    resolver: zodResolver(step2Schema),
    mode: 'onBlur',
    shouldFocusError: true,
    defaultValues: {
      fullName: savedData.fullName || '',
      dateOfBirth: savedData.dateOfBirth || '',
      gender: savedData.gender || '',
      maritalStatus: savedData.maritalStatus || '',
      fatherName: savedData.fatherName || '',
      motherName: savedData.motherName || '',
      email: savedData.email || '',
      mobileNumber: savedData.mobileNumber || '',
      alternateMobile: savedData.alternateMobile || '',
    },
  });

  const onValid = useCallback((data) => {
    updateStepData('personalInfo', data);
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
    <form onSubmit={handleSubmit(onValid)} noValidate className="space-y-5">
      <h3 className="text-xl font-semibold text-primary">Personal Information</h3>

      <Input
        label="Full Name"
        autoComplete="name"
        error={errors.fullName?.message}
        required
        {...register('fullName')}
      />

      <div className="grid gap-5 sm:grid-cols-2">
        <Input
          label="Date of Birth"
          type="date"
          autoComplete="bday"
          error={errors.dateOfBirth?.message}
          required
          {...register('dateOfBirth')}
        />

        <Select
          label="Marital Status"
          options={MARITAL_STATUS_OPTIONS}
          placeholder="Select marital status"
          error={errors.maritalStatus?.message}
          required
          {...register('maritalStatus')}
        />
      </div>

      <Controller
        name="gender"
        control={control}
        render={({ field }) => (
          <RadioGroup
            {...field}
            label="Gender"
            options={GENDER_OPTIONS}
            error={errors.gender?.message}
            required
          />
        )}
      />

      <div className="grid gap-5 sm:grid-cols-2">
        <Input
          label="Father's Name"
          error={errors.fatherName?.message}
          required
          {...register('fatherName')}
        />

        <Input
          label="Mother's Name"
          error={errors.motherName?.message}
          required
          {...register('motherName')}
        />
      </div>

      <Input
        label="Email Address"
        type="email"
        autoComplete="email"
        error={errors.email?.message}
        required
        {...register('email')}
      />

      <div className="grid gap-5 sm:grid-cols-2">
        <Input
          label="Mobile Number"
          type="tel"
          inputMode="numeric"
          autoComplete="tel"
          maxLength={10}
          error={errors.mobileNumber?.message}
          required
          {...register('mobileNumber')}
        />

        <Input
          label="Alternate Mobile Number"
          type="tel"
          inputMode="numeric"
          autoComplete="tel"
          maxLength={10}
          error={errors.alternateMobile?.message}
          {...register('alternateMobile')}
        />
      </div>
    </form>
  );
});

export default Step2PersonalInfo;
