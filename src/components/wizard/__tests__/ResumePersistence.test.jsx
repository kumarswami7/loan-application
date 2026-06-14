import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import ResumeDraftModal from '../ResumeDraftModal';
import Wizard from '../Wizard';
import { encryptData, LENDSWIFT_PASSPHRASE } from '../../../utils/encryption';

const restoredFormData = {
  loanType: {
    loanType: 'Personal',
    loanAmount: 500000,
    loanTenure: 12,
    loanPurpose: 'Education',
    referralCode: '',
  },
  personalInfo: { fullName: 'Aarav Sharma' },
  kyc: {},
  address: {},
  employment: {},
  coApplicant: {},
  documents: {},
  review: {},
};

async function storeDraft() {
  const payload = {
    formData: restoredFormData,
    currentStepId: 'personalInfo',
    loanType: 'Personal',
  };
  const encrypted = await encryptData(JSON.stringify(payload), LENDSWIFT_PASSPHRASE);
  localStorage.setItem('lendswift_draft_Personal', encrypted);
  localStorage.setItem('lendswift_draft_meta_Personal', JSON.stringify({
    version: '1.0',
    timestamp: new Date().toISOString(),
    step: 'personalInfo',
    loanType: 'Personal',
  }));
}

describe('resume draft experience', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('moves focus into the modal and treats Escape as Start Fresh', () => {
    const onStartFresh = vi.fn();
    render(
      <ResumeDraftModal
        loanType="Home"
        onResume={vi.fn()}
        onStartFresh={onStartFresh}
      />,
    );

    expect(screen.getByRole('button', { name: 'Resume' })).toHaveFocus();
    fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' });
    expect(onStartFresh).toHaveBeenCalledOnce();
  });

  it('restores saved form data and current step', async () => {
    await storeDraft();
    render(<Wizard />);

    expect(screen.getByRole('dialog')).toHaveTextContent('Personal');
    fireEvent.click(screen.getByRole('button', { name: 'Resume' }));

    await waitFor(() => {
      expect(screen.getByRole('heading', { level: 3, name: 'Personal Information' })).toBeInTheDocument();
    });
    expect(screen.getByLabelText(/^Full Name/)).toHaveValue('Aarav Sharma');
  });

  it('clears storage and starts at Step 1 when Start Fresh is selected', async () => {
    await storeDraft();
    render(<Wizard />);

    fireEvent.click(screen.getByRole('button', { name: 'Start Fresh' }));

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 3, name: 'Loan Details' })).toBeInTheDocument();
    expect(localStorage.getItem('lendswift_draft_Personal')).toBeNull();
    expect(localStorage.getItem('lendswift_draft_meta_Personal')).toBeNull();
  });

  it('manual Save Draft writes encrypted storage and shows a toast', async () => {
    render(<Wizard />);
    fireEvent.click(screen.getByRole('button', { name: 'Save Draft' }));

    await waitFor(() => {
      expect(localStorage.getItem('lendswift_draft_unknown')).toBeTruthy();
    });
    expect(screen.getByRole('status')).toHaveTextContent(/^Draft saved at/);
    expect(screen.getByText('×', { selector: '[aria-hidden="true"]' })).toBeInTheDocument();
  });
});
