import { useRef } from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { FormDataContext } from '../../components/wizard/FormDataContext';
import Step6CoApplicant from '../Step6CoApplicant';

function StepHarness({ maritalStatus = 'Single', updateStepData = vi.fn() }) {
  const stepRef = useRef(null);
  const formData = {
    loanType: { loanType: 'Home', loanAmount: 5000000 },
    personalInfo: { maritalStatus },
    employment: { monthlyIncomeForEMI: 75000 },
    coApplicant: {},
  };
  return (
    <FormDataContext.Provider value={{ formData, updateStepData }}>
      <Step6CoApplicant ref={stepRef} />
      <button type="button" onClick={() => stepRef.current.validateAndSubmit()}>
        Continue
      </button>
    </FormDataContext.Provider>
  );
}

function change(label, value) {
  fireEvent.change(screen.getByLabelText(label), { target: { value } });
}

async function fillValidFields({ includeConsent = true } = {}) {
  change(/^Co-Applicant Name/, 'Meera Sharma');
  change(/^Relationship/, 'Spouse');
  change(/^Co-Applicant PAN/, 'AAAPA1234A');
  change(/^Co-Applicant Monthly Income/, '50000');
  if (includeConsent) {
    fireEvent.click(screen.getByLabelText(/I, as co-applicant, consent/));
  }
  await act(async () => {
    await vi.advanceTimersByTimeAsync(2000);
  });
}

describe('Step6CoApplicant', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
  });

  it('renders all co-applicant fields and the signature placeholder', () => {
    render(<StepHarness />);

    expect(screen.getByLabelText(/^Co-Applicant Name/)).toBeInTheDocument();
    expect(screen.getByLabelText(/^Relationship/)).toBeInTheDocument();
    expect(screen.getByLabelText(/^Co-Applicant PAN/)).toBeInTheDocument();
    expect(screen.getByLabelText(/^Co-Applicant Monthly Income/)).toBeInTheDocument();
    expect(screen.getByText('E-signature capture will be added in the Documents step')).toBeInTheDocument();
  });

  it('blocks submission when consent is missing', async () => {
    render(<StepHarness />);
    await fillValidFields({ includeConsent: false });

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Continue' }));
    });

    expect(screen.getByText('Co-applicant consent is required to proceed')).toBeInTheDocument();
  });

  it('defaults relationship to Spouse for married applicants', () => {
    render(<StepHarness maritalStatus="Married" />);
    expect(screen.getByLabelText(/^Relationship/)).toHaveValue('Spouse');
  });

  it('shows an invalid PAN error and no verified badge', () => {
    render(<StepHarness />);
    change(/^Co-Applicant PAN/, 'BADPAN');

    expect(screen.getByText('PAN must be 10 characters in format AAAAA9999A')).toBeInTheDocument();
    expect(screen.queryByText('Verified')).not.toBeInTheDocument();
  });

  it('submits with the signature stub and combined monthly income', async () => {
    const updateStepData = vi.fn();
    render(<StepHarness updateStepData={updateStepData} />);
    await fillValidFields();

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Continue' }));
    });

    expect(updateStepData).toHaveBeenCalledWith(
      'coApplicant',
      expect.objectContaining({
        coApplicantSignature: 'PENDING_SIGNATURE',
        combinedMonthlyIncomeForEMI: 125000,
      }),
    );
  });
});
