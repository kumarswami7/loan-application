import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Input from '../Input';

describe('Input', () => {
  it('renders a label linked to the input via htmlFor/id', () => {
    render(<Input label="Full Name" id="fullName" />);
    const input = screen.getByLabelText('Full Name');
    expect(input).toBeInTheDocument();
    expect(input.tagName).toBe('INPUT');
  });

  it('shows the required indicator and exposes aria-required', () => {
    render(<Input label="Email" id="email" required />);
    const input = screen.getByLabelText(/Email/);
    expect(input).toHaveAttribute('aria-required', 'true');
    expect(screen.getByText('*')).toBeInTheDocument();
  });

  it('displays an error message with role="alert" and links it via aria-describedby', () => {
    render(<Input label="PAN" id="pan" error="PAN must be 10 characters" />);
    const input = screen.getByLabelText('PAN');
    const error = screen.getByRole('alert');

    expect(error).toHaveTextContent('PAN must be 10 characters');
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(input.getAttribute('aria-describedby')).toContain('pan-error');
  });

  it('calls onChange when the user types', async () => {
    const handleChange = vi.fn();
    render(<Input label="Mobile" id="mobile" onChange={handleChange} />);

    await userEvent.type(screen.getByLabelText('Mobile'), '9876543210');
    expect(handleChange).toHaveBeenCalled();
  });

  it('forwards ref to the underlying input element', () => {
    let refValue;
    function Wrapper() {
      return (
        <Input
          label="Test"
          id="test"
          ref={(el) => {
            refValue = el;
          }}
        />
      );
    }
    render(<Wrapper />);
    expect(refValue).toBeInstanceOf(HTMLInputElement);
  });
});
