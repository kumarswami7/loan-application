import { useRef } from 'react';
import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { FormDataContext } from '../../components/wizard/FormDataContext';
import Step7Documents from '../Step7Documents';

vi.mock('../../components/common/FileUpload', () => ({
  default: ({ label, onChange }) => (
    <div>
      <span>{label}</span>
      <button
        type="button"
        onClick={() => onChange([{
          file: new File(['pdf'], 'document.pdf', { type: 'application/pdf' }),
          name: 'document.pdf',
          type: 'application/pdf',
          preview: '',
          originalSize: 3,
          compressedSize: 3,
        }])}
      >
        Upload {label}
      </button>
    </div>
  ),
}));

vi.mock('../../components/common/SignatureCanvas', async () => {
  const React = await import('react');
  return {
    default: React.forwardRef(function FakeSignature({ label, error, onChange }, ref) {
      React.useImperativeHandle(ref, () => ({ clear: vi.fn(), isEmpty: () => true, toDataURL: () => '' }));
      return (
        <div>
          <span>{label}</span>
          <button type="button" onClick={() => onChange(`data:image/png;base64,${label}`)}>Sign {label}</button>
          {error && <span role="alert">{error}</span>}
        </div>
      );
    }),
  };
});

function makeFormData(overrides = {}) {
  return {
    loanType: { loanType: 'Personal', loanAmount: 500000 },
    personalInfo: { maritalStatus: 'Single' },
    kyc: { panVerified: false },
    employment: { employmentType: 'Salaried' },
    coApplicant: {},
    documents: {},
    ...overrides,
  };
}

function Harness({ formData = makeFormData(), updateStepData = vi.fn() }) {
  const ref = useRef(null);
  return (
    <FormDataContext.Provider value={{ formData, updateStepData }}>
      <Step7Documents ref={ref} />
      <button type="button" onClick={() => ref.current.validateAndSubmit()}>Continue</button>
    </FormDataContext.Provider>
  );
}

describe('Step7Documents', () => {
  it('shows salary documents for salaried personal applicants only', () => {
    render(<Harness />);
    expect(screen.getByText('Salary Slips (Last 3 months) (Required)')).toBeInTheDocument();
    expect(screen.queryByText(/ITR \(Last 2 years\)/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Property Documents/)).not.toBeInTheDocument();
    expect(screen.queryByText(/GST Returns/)).not.toBeInTheDocument();
  });

  it('marks PAN upload optional after verification', () => {
    render(<Harness formData={makeFormData({ kyc: { panVerified: true } })} />);
    expect(screen.getByText('PAN Card Copy (Optional)')).toBeInTheDocument();
  });

  it('updates a required checklist item after upload', () => {
    render(<Harness />);
    const checklistItem = screen.getByText(/Aadhaar Card \(Front\):/).closest('li');
    expect(within(checklistItem).getByText('Pending')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Upload Aadhaar Card (Front) (Required)' }));
    expect(within(checklistItem).getByText('Uploaded')).toBeInTheDocument();
  });

  it('shows the applicant signature error on submission', async () => {
    render(<Harness />);
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Continue' }));
    });
    expect(screen.getByText('Please provide your signature')).toBeInTheDocument();
  });

  it('renders and requires a co-applicant signature when Step 6 is visible', async () => {
    const formData = makeFormData({ loanType: { loanType: 'Personal', loanAmount: 600000 } });
    render(<Harness formData={formData} />);
    expect(screen.getByText('Co-Applicant Signature')).toBeInTheDocument();
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Continue' }));
    });
    expect(screen.getByText('Please provide the co-applicant signature')).toBeInTheDocument();
  });
});
