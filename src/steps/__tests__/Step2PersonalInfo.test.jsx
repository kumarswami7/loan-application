import { useRef } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FormDataContext } from '../../components/wizard/FormDataContext';
import Step2PersonalInfo from '../Step2PersonalInfo';

function StepHarness() {
  const stepRef = useRef(null);
  const formData = { loanType: {}, personalInfo: {} };
  return (
    <FormDataContext.Provider value={{ formData, updateStepData: vi.fn() }}>
      <Step2PersonalInfo ref={stepRef} />
      <button type="button" onClick={() => stepRef.current.validateAndSubmit()}>
        Continue
      </button>
    </FormDataContext.Provider>
  );
}

async function fillRequiredFields(user, overrides = {}) {
  const values = {
    fullName: 'Aarav Sharma',
    dateOfBirth: '1990-01-01',
    fatherName: 'Rohan Sharma',
    motherName: 'Meera Sharma',
    email: 'aarav@example.com',
    mobileNumber: '9876543210',
    alternateMobile: '',
    ...overrides,
  };

  await user.type(screen.getByLabelText(/^Full Name/), values.fullName);
  await user.type(screen.getByLabelText(/^Date of Birth/), values.dateOfBirth);
  await user.click(screen.getByRole('radio', { name: 'Male' }));
  await user.selectOptions(screen.getByLabelText(/^Marital Status/), 'Single');
  await user.type(screen.getByLabelText(/^Father's Name/), values.fatherName);
  await user.type(screen.getByLabelText(/^Mother's Name/), values.motherName);
  await user.type(screen.getByLabelText(/^Email Address/), values.email);
  await user.type(screen.getByLabelText(/^Mobile Number/), values.mobileNumber);
  if (values.alternateMobile) {
    await user.type(screen.getByLabelText('Alternate Mobile Number'), values.alternateMobile);
  }
}

describe('Step2PersonalInfo', () => {
  it('shows required errors when the empty form is submitted', async () => {
    const user = userEvent.setup();
    render(<StepHarness />);

    await user.click(screen.getByRole('button', { name: 'Continue' }));

    expect(await screen.findByText('Full name is required')).toBeInTheDocument();
    expect(screen.getByText('Date of birth is required')).toBeInTheDocument();
    expect(screen.getByText('Mobile number is required')).toBeInTheDocument();
  });

  it('rejects an applicant who is 20 years old', async () => {
    const user = userEvent.setup();
    const birthday = new Date();
    birthday.setFullYear(birthday.getFullYear() - 20);
    const dob = [
      birthday.getFullYear(),
      String(birthday.getMonth() + 1).padStart(2, '0'),
      String(birthday.getDate()).padStart(2, '0'),
    ].join('-');
    render(<StepHarness />);

    await fillRequiredFields(user, { dateOfBirth: dob });
    await user.click(screen.getByRole('button', { name: 'Continue' }));

    expect(await screen.findByText('Applicant must be between 21 and 60 years old')).toBeInTheDocument();
  });

  it('rejects matching primary and alternate mobile numbers', async () => {
    const user = userEvent.setup();
    render(<StepHarness />);

    await fillRequiredFields(user, { alternateMobile: '9876543210' });
    await user.click(screen.getByRole('button', { name: 'Continue' }));

    expect(
      await screen.findByText('Alternate mobile number must be different from mobile number'),
    ).toBeInTheDocument();
  });
});
