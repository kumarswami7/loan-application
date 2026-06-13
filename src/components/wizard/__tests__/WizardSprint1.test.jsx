import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import Wizard from '../Wizard';

function change(label, value) {
  fireEvent.change(screen.getByLabelText(label), { target: { value } });
}

async function clickNext() {
  await act(async () => {
    fireEvent.click(screen.getByRole('button', { name: 'Next' }));
  });
}

describe('Wizard Sprint 1 flow', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
  });

  it('navigates through Steps 1-4 and preserves completed step data', async () => {
    render(<Wizard />);

    fireEvent.click(screen.getByRole('radio', { name: 'Personal' }));
    change(/^Loan Amount/, '500000');
    change(/^Loan Tenure/, '12');
    change(/^Loan Purpose/, 'Education');
    await clickNext();
    expect(screen.getByRole('heading', { level: 3, name: 'Personal Information' })).toBeInTheDocument();

    change(/^Full Name/, 'Aarav Sharma');
    change(/^Date of Birth/, '1990-01-01');
    fireEvent.click(screen.getByRole('radio', { name: 'Male' }));
    change(/^Marital Status/, 'Single');
    change(/^Father's Name/, 'Rohan Sharma');
    change(/^Mother's Name/, 'Meera Sharma');
    change(/^Email Address/, 'aarav@example.com');
    change(/^Mobile Number/, '9876543210');
    await clickNext();
    expect(screen.getByRole('heading', { level: 3, name: 'Identity Verification' })).toBeInTheDocument();

    change(/^PAN Number/, 'AAAPA1234A');
    change(/^Aadhaar Number/, '123456789010');
    fireEvent.click(screen.getByLabelText(/I hereby consent to LendSwift/));
    await act(async () => {
      await vi.advanceTimersByTimeAsync(2000);
    });
    await clickNext();
    expect(screen.getByRole('heading', { level: 3, name: 'Address Information' })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Previous' }));
    expect(screen.getByRole('heading', { level: 3, name: 'Identity Verification' })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Previous' }));
    expect(screen.getByRole('heading', { level: 3, name: 'Personal Information' })).toBeInTheDocument();
    expect(screen.getByLabelText(/^Full Name/)).toHaveValue('Aarav Sharma');

    fireEvent.click(screen.getByRole('button', { name: 'Previous' }));
    expect(screen.getByRole('heading', { level: 3, name: 'Loan Details' })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: 'Personal' })).toBeChecked();
    expect(screen.getByLabelText(/^Loan Tenure/)).toHaveValue('12');
    expect(screen.getByLabelText(/^Loan Purpose/)).toHaveValue('Education');
  });
});
