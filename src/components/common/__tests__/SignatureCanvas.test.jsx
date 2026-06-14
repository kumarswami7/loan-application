import { createRef } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import SignatureCanvas from '../SignatureCanvas';

const clear = vi.fn();
const isEmpty = vi.fn(() => true);
const toDataURL = vi.fn(() => 'data:image/png;base64,test');

// Drawing events are unreliable in jsdom, so the third-party pad is replaced
// with a ref-compatible fake. Real pointer/touch behavior belongs in Cypress.
vi.mock('react-signature-canvas', async () => {
  const React = await import('react');
  return {
    default: React.forwardRef(function FakePad({ onEnd }, ref) {
      React.useImperativeHandle(ref, () => ({ clear, isEmpty, toDataURL }));
      return <canvas data-testid="signature-canvas" onMouseUp={onEnd} />;
    }),
  };
});

describe('SignatureCanvas', () => {
  beforeEach(() => {
    clear.mockClear();
    isEmpty.mockReset().mockReturnValue(true);
    toDataURL.mockClear();
  });

  it('renders its label and accessible signature pad', () => {
    render(<SignatureCanvas label="Applicant Signature" required />);
    expect(screen.getByText('Applicant Signature')).toBeInTheDocument();
    expect(screen.getByLabelText(/Signature pad - draw your signature/)).toBeInTheDocument();
  });

  it('exposes an initially empty imperative API', () => {
    const ref = createRef();
    render(<SignatureCanvas ref={ref} label="Signature" />);
    expect(ref.current.isEmpty()).toBe(true);
    expect(ref.current.toDataURL()).toBe('');
  });

  it('clears the underlying pad and publishes an empty value', () => {
    const onChange = vi.fn();
    render(<SignatureCanvas label="Signature" onChange={onChange} />);
    fireEvent.click(screen.getByRole('button', { name: 'Clear' }));
    expect(clear).toHaveBeenCalledOnce();
    expect(onChange).toHaveBeenCalledWith('');
  });

  it('shows the privacy overlay after focus leaves the pad', () => {
    render(<SignatureCanvas label="Signature" />);
    const pad = screen.getByLabelText(/Signature pad - draw your signature/);
    fireEvent.focus(pad);
    fireEvent.blur(pad);
    expect(screen.getByRole('button', { name: 'Click to resume signing' })).toBeInTheDocument();
  });
});
