import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import Wizard from '../Wizard';
import { getVisibleSteps } from '../stepRegistry';

function change(label, value) {
  fireEvent.change(screen.getByLabelText(label), { target: { value } });
}

async function completeStep1(amount = '500000') {
  fireEvent.click(screen.getByRole('radio', { name: 'Personal' }));
  change(/^Loan Amount/, amount);
  change(/^Loan Tenure/, '36');
  change(/^Loan Purpose/, 'Education');
  await act(async () => {
    fireEvent.click(screen.getByRole('button', { name: 'Next' }));
  });
}

describe('Wizard navigation edge cases', () => {
  beforeEach(() => localStorage.clear());
  afterEach(() => {
    localStorage.clear();
    history.replaceState(null, '', '/');
  });

  it('preserves partially entered values after Previous and forward navigation', async () => {
    render(<Wizard />);
    await completeStep1();
    change(/^Full Name/, 'Partially Entered Name');

    fireEvent.click(screen.getByRole('button', { name: 'Previous' }));
    expect(screen.getByRole('heading', { level: 3, name: 'Loan Details' })).toBeInTheDocument();

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Next' }));
    });
    expect(screen.getByLabelText(/^Full Name/)).toHaveValue('Partially Entered Name');
  });

  it('adds Step 6 only after the Personal Loan amount crosses the threshold', () => {
    const lowAmount = { loanType: { loanType: 'Personal', loanAmount: 300000 }, coApplicant: {} };
    expect(getVisibleSteps(lowAmount).map(({ id }) => id)).not.toContain('coApplicant');

    const highAmount = { ...lowAmount, loanType: { loanType: 'Personal', loanAmount: 800000 } };
    expect(getVisibleSteps(highAmount).map(({ id }) => id)).toContain('coApplicant');
    expect(highAmount.coApplicant).toEqual({});
  });

  it('pushes step history and handles browser popstate as Previous', async () => {
    render(<Wizard />);
    await completeStep1();
    expect(window.location.hash).toBe('#personalInfo');

    act(() => window.dispatchEvent(new PopStateEvent('popstate', { state: { step: 'loanType' } })));
    expect(screen.getByRole('heading', { level: 3, name: 'Loan Details' })).toBeInTheDocument();
  });
});
