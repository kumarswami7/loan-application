import { useRef } from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { FormDataContext } from '../../components/wizard/FormDataContext';
import Step5Employment from '../Step5Employment';

function StepHarness({ loanType = 'Personal', updateStepData = vi.fn() }) {
  const stepRef = useRef(null);
  const formData = {
    loanType: { loanType },
    personalInfo: {},
    kyc: {},
    address: {},
    employment: {},
  };
  return (
    <FormDataContext.Provider value={{ formData, updateStepData }}>
      <Step5Employment ref={stepRef} />
      <button type="button" onClick={() => stepRef.current.validateAndSubmit()}>
        Continue
      </button>
    </FormDataContext.Provider>
  );
}

function change(label, value) {
  fireEvent.change(screen.getByLabelText(label), { target: { value } });
}

function selectEmployment(type) {
  fireEvent.click(screen.getByRole('radio', { name: type }));
}

function fillSalaried({ salary = '50000' } = {}) {
  change(/^Company Name/, 'Infosys');
  change(/^Designation/, 'Engineer');
  change(/^Monthly Net Salary/, salary);
  change(/^Years of Experience/, '5');
}

function fillBusinessOwner() {
  change(/^Business Name/, 'Aarav Industries');
  change(/^Business Type/, 'Sole Proprietorship');
  change(/^Annual Turnover/, '2400000');
  change(/^Years in Business/, '6');
  change(/^GST Number/, '27AAAPA1234A1Z5');
  change(/^Office Address Line 1/, '12 Business Park');
  change(/^Office PIN Code/, '400001');
  change(/^Office City/, 'Mumbai');
  change(/^Office State/, 'Maharashtra');
  change(/^Total Years of Experience/, '10');
}

describe('Step5Employment', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
  });

  it('renders the sub-form for the selected employment type', () => {
    render(<StepHarness />);

    selectEmployment('Salaried');
    expect(screen.getByLabelText(/^Company Name/)).toBeInTheDocument();
    expect(screen.getByLabelText(/^Designation/)).toBeInTheDocument();
    expect(screen.getByLabelText(/^Monthly Net Salary/)).toBeInTheDocument();

    selectEmployment('Self-Employed');
    expect(screen.queryByLabelText(/^Company Name/)).not.toBeInTheDocument();
    expect(screen.getByLabelText(/^Business Name/)).toBeInTheDocument();
    expect(screen.getByLabelText(/^Annual Turnover/)).toBeInTheDocument();
    expect(screen.getByLabelText(/^Monthly Income/)).toBeInTheDocument();
  });

  it('clears salaried data after leaving and returning to the branch', () => {
    render(<StepHarness />);

    selectEmployment('Salaried');
    fillSalaried();
    expect(screen.getByLabelText(/^Company Name/)).toHaveValue('Infosys');

    selectEmployment('Self-Employed');
    selectEmployment('Salaried');

    expect(screen.getByLabelText(/^Company Name/)).toHaveValue('');
    expect(screen.getByLabelText(/^Designation/)).toHaveValue('');
    expect(screen.getByLabelText(/^Monthly Net Salary/)).toHaveValue('');
  });

  it('shows the minimum salary error below 15000', async () => {
    render(<StepHarness />);
    selectEmployment('Salaried');
    fillSalaried({ salary: '14999' });

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Continue' }));
    });

    expect(
      screen.getByText('Minimum monthly salary for salaried applicants is ₹15,000'),
    ).toBeInTheDocument();
  });

  it('rejects Salaried employment for a Business loan', async () => {
    const updateStepData = vi.fn();
    render(<StepHarness loanType="Business" updateStepData={updateStepData} />);
    selectEmployment('Salaried');
    fillSalaried();

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Continue' }));
    });

    expect(
      screen.getByText(
        'Business loans require Self-Employed or Business Owner employment type. Please change your Loan Type in Step 1, or update your employment type here.',
      ),
    ).toBeInTheDocument();
    expect(updateStepData).not.toHaveBeenCalled();
  });

  it('accepts a valid Business Owner for a Business loan and computes EMI income', async () => {
    const updateStepData = vi.fn();
    render(<StepHarness loanType="Business" updateStepData={updateStepData} />);
    selectEmployment('Business Owner');
    fillBusinessOwner();

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Continue' }));
    });

    expect(updateStepData).toHaveBeenCalledWith(
      'employment',
      expect.objectContaining({
        employmentType: 'Business Owner',
        gstNumber: '27AAAPA1234A1Z5',
        monthlyIncomeForEMI: 200000,
      }),
    );
  });

  it('shows the state derived from a valid GST number', () => {
    render(<StepHarness loanType="Business" />);
    selectEmployment('Business Owner');

    change(/^GST Number/, '27aaapa1234a1z5');

    expect(screen.getByLabelText(/^GST Number/)).toHaveValue('27AAAPA1234A1Z5');
    expect(screen.getByText('GST registered in: Maharashtra')).toBeInTheDocument();
  });
});
