import { useRef } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FormDataContext } from '../../components/wizard/FormDataContext';
import Step1LoanType from '../Step1LoanType';

function StepHarness({ formData = { loanType: {}, personalInfo: {} } }) {
  const stepRef = useRef(null);
  return (
    <FormDataContext.Provider value={{ formData, updateStepData: vi.fn() }}>
      <Step1LoanType ref={stepRef} />
      <button type="button" onClick={() => stepRef.current.validateAndSubmit()}>
        Continue
      </button>
    </FormDataContext.Provider>
  );
}

describe('Step1LoanType', () => {
  it('shows a loan type error when the empty form is submitted', async () => {
    const user = userEvent.setup();
    render(<StepHarness />);

    await user.click(screen.getByRole('button', { name: 'Continue' }));

    expect(await screen.findByText('Please select a loan type')).toBeInTheDocument();
  });

  it('shows the Personal Loan maximum amount error', async () => {
    const user = userEvent.setup();
    render(<StepHarness />);

    await user.click(screen.getByRole('radio', { name: 'Personal' }));
    await user.type(screen.getByLabelText(/^Loan Amount/), '50000000');
    await user.click(screen.getByRole('button', { name: 'Continue' }));

    expect(await screen.findByText(/Maximum amount for Personal Loans/)).toBeInTheDocument();
  });

  it('resets an invalid tenure when the loan type changes', async () => {
    const user = userEvent.setup();
    render(<StepHarness />);

    await user.click(screen.getByRole('radio', { name: 'Personal' }));
    const tenure = screen.getByLabelText(/^Loan Tenure/);
    await user.selectOptions(tenure, '12');
    expect(tenure).toHaveValue('12');

    await user.click(screen.getByRole('radio', { name: 'Home' }));

    expect(tenure).toHaveValue('');
    expect(screen.queryByRole('option', { name: '12 months' })).not.toBeInTheDocument();
    expect(screen.getByRole('option', { name: '120 months' })).toBeInTheDocument();
  });
});
