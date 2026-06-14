import { useRef, useState } from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { FormDataContext } from '../../components/wizard/FormDataContext';
import StepNavigation from '../../components/wizard/StepNavigation';
import { buildLoanSummary } from '../../utils/emiCalculator';
import { formatINR } from '../../utils/numberFormat';
import Step8Review from '../Step8Review';

const signature = 'data:image/png;base64,c2lnbmF0dXJl';

function completeFormData(overrides = {}) {
  return {
    loanType: { loanType: 'Personal', loanAmount: 500000, loanTenure: 36, loanPurpose: 'Education' },
    personalInfo: { fullName: 'Aarav Sharma', dateOfBirth: '1990-01-01', email: 'aarav@example.com', mobileNumber: '9876543210' },
    kyc: { panNumber: 'AAAPA1234A', aadhaarNumber: '123456789010', panVerified: true },
    address: { currentAddressLine1: '12 MG Road', currentCity: 'Bengaluru', currentState: 'Karnataka', currentPincode: '560001', residenceType: 'Owned' },
    employment: { employmentType: 'Salaried', companyName: 'Infosys', designation: 'Engineer', monthlyIncomeForEMI: 75000 },
    coApplicant: {},
    documents: {
      panCard: [],
      aadhaarFront: [{ name: 'aadhaar-front.pdf' }],
      aadhaarBack: [{ name: 'aadhaar-back.pdf' }],
      bankStatements: [{ name: 'bank.pdf' }],
      photograph: [{ name: 'photo.jpg' }],
      salarySlips: [{ name: 'salary.pdf' }],
      applicantSignature: signature,
    },
    review: {},
    ...overrides,
  };
}

function Harness({ formData = completeFormData(), goToStep = vi.fn() }) {
  const stepRef = useRef(null);
  const [ready, setReady] = useState(false);
  return (
    <FormDataContext.Provider value={{ formData, goToStep, updateStepData: vi.fn() }}>
      <Step8Review ref={stepRef} onReadinessChange={setReady} />
      <StepNavigation
        onPrevious={() => {}}
        onNext={() => stepRef.current.validateAndSubmit()}
        onSaveDraft={() => {}}
        isLastStep
        nextDisabled={!ready}
      />
    </FormDataContext.Provider>
  );
}

function checkAllConsents() {
  fireEvent.click(screen.getByLabelText(/all information and documents provided/i));
  fireEvent.click(screen.getByLabelText(/obtain and verify my credit score/i));
  fireEvent.click(screen.getByLabelText(/I have read and agree/i));
  fireEvent.click(screen.getByLabelText(/receive communications regarding/i));
}

describe('Step8Review', () => {
  it('shows the calculated pre-approval values', () => {
    const expected = buildLoanSummary('Personal', 500000, 36, 75000);
    render(<Harness />);
    expect(screen.getByText(formatINR(expected.emi))).toBeInTheDocument();
    expect(screen.getByText(formatINR(expected.totalCostOfBorrowing))).toBeInTheDocument();
    expect(screen.getByText(formatINR(expected.processingFee))).toBeInTheDocument();
  });

  it('masks PAN and Aadhaar values', () => {
    render(<Harness />);
    expect(screen.getByText('XXXXXX234A')).toBeInTheDocument();
    expect(screen.getByText('XXXXXXXX9010')).toBeInTheDocument();
    expect(screen.queryByText('AAAPA1234A')).not.toBeInTheDocument();
  });

  it('uses edit navigation for the selected section', () => {
    const goToStep = vi.fn();
    render(<Harness goToStep={goToStep} />);
    fireEvent.click(screen.getByRole('button', { name: 'Edit KYC' }));
    expect(goToStep).toHaveBeenCalledWith('kyc');
  });

  it('disables submission until all consents are checked', () => {
    render(<Harness />);
    const submit = screen.getByRole('button', { name: 'Submit Application' });
    expect(submit).toBeDisabled();
    checkAllConsents();
    expect(submit).toBeEnabled();
  });

  it('blocks high-ratio submission until affordability is acknowledged', () => {
    const formData = completeFormData({
      loanType: { loanType: 'Personal', loanAmount: 2500000, loanTenure: 12, loanPurpose: 'Education' },
      employment: { employmentType: 'Salaried', monthlyIncomeForEMI: 20000 },
    });
    render(<Harness formData={formData} />);
    expect(screen.getByText(/exceeds our recommended 50% threshold/i)).toBeInTheDocument();
    checkAllConsents();
    expect(screen.getByRole('button', { name: 'Submit Application' })).toBeDisabled();
    fireEvent.click(screen.getByLabelText(/EMI-to-income ratio exceeds 50%/i));
    expect(screen.getByRole('button', { name: 'Submit Application' })).toBeEnabled();
  });

  it('keeps submission disabled when a required document is missing', () => {
    const formData = completeFormData();
    formData.documents.bankStatements = [];
    render(<Harness formData={formData} />);
    checkAllConsents();
    expect(screen.getByRole('button', { name: 'Submit Application' })).toBeDisabled();
    expect(screen.getByText(/Upload Bank Statements/)).toBeInTheDocument();
  });

  it('shows a terminal success modal with a UUID reference', async () => {
    render(<Harness />);
    checkAllConsents();
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Submit Application' }));
    });
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i)).toBeInTheDocument();
  });
});
