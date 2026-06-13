import { useRef } from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { FormDataContext } from '../../components/wizard/FormDataContext';
import Step3KYC from '../Step3KYC';

const VALID_PAN = 'AAAPA1234A';
const VALID_AADHAAR = '123456789010';

function StepHarness({
  formData = {
    loanType: { loanType: 'Personal', loanAmount: 500000 },
    personalInfo: {},
    kyc: {},
  },
}) {
  const stepRef = useRef(null);
  return (
    <FormDataContext.Provider value={{ formData, updateStepData: vi.fn() }}>
      <Step3KYC ref={stepRef} />
      <button type="button" onClick={() => stepRef.current.validateAndSubmit()}>
        Continue
      </button>
    </FormDataContext.Provider>
  );
}

describe('Step3KYC', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
  });

  it('shows an error for an invalid PAN format', async () => {
    render(<StepHarness />);

    fireEvent.change(screen.getByLabelText(/^PAN Number/), { target: { value: 'BADPAN' } });

    expect(screen.getByText('PAN must be 10 characters in format AAAAA9999A')).toBeInTheDocument();
  });

  it('shows verification progress and a verified badge for valid PAN', async () => {
    render(<StepHarness />);

    fireEvent.change(screen.getByLabelText(/^PAN Number/), {
      target: { value: VALID_PAN.toLowerCase() },
    });
    expect(screen.getByLabelText(/^PAN Number/)).toHaveValue(VALID_PAN);

    act(() => vi.advanceTimersByTime(500));
    expect(screen.getByRole('status', { name: 'Verifying' })).toBeInTheDocument();

    act(() => vi.advanceTimersByTime(1500));
    expect(screen.getByRole('status')).toHaveTextContent('Verified');
  });

  it('shows the Personal Loan entity-type error for a company PAN', async () => {
    render(<StepHarness />);

    const panInput = screen.getByLabelText(/^PAN Number/);
    fireEvent.change(panInput, { target: { value: 'AAACA1234A' } });
    await act(async () => {
      fireEvent.blur(panInput);
    });

    expect(
      screen.getByText(
        "Only individual PAN (4th character 'P') is accepted for Personal and Home loans",
      ),
    ).toBeInTheDocument();
  });

  it('blocks submission when Aadhaar consent is missing', async () => {
    render(<StepHarness />);

    fireEvent.change(screen.getByLabelText(/^PAN Number/), { target: { value: VALID_PAN } });
    fireEvent.change(screen.getByLabelText(/^Aadhaar Number/), {
      target: { value: VALID_AADHAAR },
    });
    act(() => vi.advanceTimersByTime(2000));
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Continue' }));
    });

    expect(
      screen.getByText('You must provide consent to proceed with Aadhaar verification'),
    ).toBeInTheDocument();
  });

  it('verifies a checksum-valid Aadhaar number', async () => {
    render(<StepHarness />);

    fireEvent.change(screen.getByLabelText(/^Aadhaar Number/), {
      target: { value: VALID_AADHAAR },
    });
    act(() => vi.advanceTimersByTime(500));
    expect(screen.getByRole('status', { name: 'Verifying' })).toBeInTheDocument();

    act(() => vi.advanceTimersByTime(1500));
    expect(screen.getByRole('status')).toHaveTextContent('Verified');
  });

  it('renders passport only for Home loans above 50 lakh', () => {
    const qualifyingData = {
      loanType: { loanType: 'Home', loanAmount: 5000001 },
      personalInfo: {},
      kyc: {},
    };
    const nonQualifyingData = {
      loanType: { loanType: 'Home', loanAmount: 5000000 },
      personalInfo: {},
      kyc: {},
    };

    const { unmount } = render(<StepHarness formData={qualifyingData} />);
    expect(screen.getByLabelText('Passport Number')).toBeInTheDocument();

    unmount();
    render(<StepHarness formData={nonQualifyingData} />);
    expect(screen.queryByLabelText('Passport Number')).not.toBeInTheDocument();
  });
});
