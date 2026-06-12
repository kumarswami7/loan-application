import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CurrencyInput from '../CurrencyInput';

describe('CurrencyInput', () => {
  it('displays an initial value formatted with Indian number grouping', () => {
    render(<CurrencyInput label="Loan Amount" id="loanAmount" name="loanAmount" value="1050000" />);
    const input = screen.getByLabelText('Loan Amount');
    expect(input.value).toBe('10,50,000');
  });

  it('shows the ₹ prefix', () => {
    render(<CurrencyInput label="Loan Amount" id="loanAmount" name="loanAmount" value="50000" />);
    expect(screen.getByText('₹')).toBeInTheDocument();
  });

  it('reformats with commas as the user types digits, and reports plain numeric value via onChange', async () => {
    const handleChange = vi.fn();
    render(
      <CurrencyInput
        label="Monthly Salary"
        id="salary"
        name="salary"
        value=""
        onChange={handleChange}
      />,
    );

    const input = screen.getByLabelText('Monthly Salary');
    await userEvent.type(input, '100000');

    // The last onChange call should carry the plain numeric string
    const lastCall = handleChange.mock.calls.at(-1)[0];
    expect(lastCall.target.value).toBe('100000');

    // The displayed value should be formatted
    expect(input.value).toBe('1,00,000');
  });

  it('rejects non-numeric characters', async () => {
    render(<CurrencyInput label="Amount" id="amount" name="amount" value="" />);
    const input = screen.getByLabelText('Amount');

    await userEvent.type(input, 'abc');
    expect(input.value).toBe('');
  });

  it('shows a validation error when provided', () => {
    render(
      <CurrencyInput
        label="Loan Amount"
        id="loanAmount"
        name="loanAmount"
        value="10000"
        error="Minimum loan amount is ₹50,000"
      />,
    );
    expect(screen.getByRole('alert')).toHaveTextContent('Minimum loan amount is ₹50,000');
  });
});
