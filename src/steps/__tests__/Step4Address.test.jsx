import { useRef } from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { FormDataContext } from '../../components/wizard/FormDataContext';
import Step4Address from '../Step4Address';

function StepHarness({ updateStepData = vi.fn() }) {
  const stepRef = useRef(null);
  const formData = { loanType: {}, personalInfo: {}, kyc: {}, address: {} };
  return (
    <FormDataContext.Provider value={{ formData, updateStepData }}>
      <Step4Address ref={stepRef} />
      <button type="button" onClick={() => stepRef.current.validateAndSubmit()}>
        Continue
      </button>
    </FormDataContext.Provider>
  );
}

function change(label, value) {
  fireEvent.change(screen.getByLabelText(label), { target: { value } });
}

function fillValidBaseAddress() {
  change(/^Current Address Line 1/, '12 Market Street');
  change(/^Current PIN Code/, '110001');
  change(/^Current City/, 'New Delhi');
  change(/^Current State/, 'Delhi');
  change(/^Residence Type/, 'Owned');
  change(/^Years at Current Address/, '5');
}

describe('Step4Address', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
  });

  it('auto-fills city and state for a known PIN code', async () => {
    render(<StepHarness />);

    change(/^Current PIN Code/, '110001');
    expect(screen.getByRole('status')).toHaveTextContent('Looking up PIN code');
    await act(async () => {
      await vi.advanceTimersByTimeAsync(700);
    });

    expect(screen.getByLabelText(/^Current City/)).toHaveValue('New Delhi');
    expect(screen.getByLabelText(/^Current State/)).toHaveValue('Delhi');
    expect(screen.getByText('Post Office: Connaught Place')).toBeInTheDocument();
  });

  it('shows helper text for an unknown PIN code', async () => {
    render(<StepHarness />);

    change(/^Current PIN Code/, '999999');
    await act(async () => {
      await vi.advanceTimersByTimeAsync(700);
    });

    expect(
      screen.getByText('PIN code not found. Please verify and re-enter, or fill city/state manually.'),
    ).toBeInTheDocument();
  });

  it('reveals rent amount only for rented residences', () => {
    render(<StepHarness />);

    change(/^Residence Type/, 'Rented');
    expect(screen.getByLabelText(/^Monthly Rent Amount/)).toBeInTheDocument();

    change(/^Residence Type/, 'Owned');
    expect(screen.queryByLabelText(/^Monthly Rent Amount/)).not.toBeInTheDocument();
  });

  it('reveals previous address only when current residence is under one year', () => {
    render(<StepHarness />);

    change(/^Years at Current Address/, '0');
    expect(screen.getByRole('heading', { name: 'Previous Address' })).toBeInTheDocument();

    change(/^Years at Current Address/, '5');
    expect(screen.queryByRole('heading', { name: 'Previous Address' })).not.toBeInTheDocument();
  });

  it('requires permanent address fields when addresses differ', async () => {
    render(<StepHarness />);
    fillValidBaseAddress();

    fireEvent.click(
      screen.getByLabelText('My permanent address is the same as my current address'),
    );
    expect(screen.getByRole('heading', { name: 'Permanent Address' })).toBeInTheDocument();

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Continue' }));
    });

    expect(screen.getByText('Permanent address line 1 is required')).toBeInTheDocument();
    expect(screen.getByText('Permanent PIN code is required')).toBeInTheDocument();
    expect(screen.getByText('Permanent city is required')).toBeInTheDocument();
    expect(screen.getByText('Permanent state is required')).toBeInTheDocument();
  });

  it('shows a non-blocking state mismatch warning and still submits valid data', async () => {
    const updateStepData = vi.fn();
    render(<StepHarness updateStepData={updateStepData} />);
    fillValidBaseAddress();
    await act(async () => {
      await vi.advanceTimersByTimeAsync(700);
    });

    const stateInput = screen.getByLabelText(/^Current State/);
    fireEvent.change(stateInput, { target: { value: 'Haryana' } });
    fireEvent.blur(stateInput);

    expect(screen.getByRole('status')).toHaveTextContent(
      "The state you entered doesn't match the PIN code's registered state (Delhi). Please verify.",
    );

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Continue' }));
    });

    expect(updateStepData).toHaveBeenCalledWith(
      'address',
      expect.objectContaining({ currentState: 'Haryana' }),
    );
  });
});
