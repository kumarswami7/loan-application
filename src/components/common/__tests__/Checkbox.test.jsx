import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Checkbox from '../Checkbox';

describe('Checkbox', () => {
  it('renders with a clickable label linked to the checkbox', async () => {
    const handleChange = vi.fn();
    render(
      <Checkbox
        id="aadhaarConsent"
        label="I consent to Aadhaar-based verification"
        onChange={handleChange}
      />,
    );

    const checkbox = screen.getByRole('checkbox', {
      name: /I consent to Aadhaar-based verification/,
    });
    expect(checkbox).not.toBeChecked();

    // Clicking the label text should toggle the checkbox (linked label)
    await userEvent.click(screen.getByText(/I consent to Aadhaar-based verification/));
    expect(handleChange).toHaveBeenCalled();
  });

  it('marks the field as required with an asterisk', () => {
    render(<Checkbox id="terms" label="I agree to the Terms and Conditions" required />);
    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).toHaveAttribute('aria-required', 'true');
    expect(screen.getByText('*')).toBeInTheDocument();
  });

  it('shows an error message linked via aria-describedby', () => {
    render(
      <Checkbox
        id="consent"
        label="I authorise the credit check"
        error="This consent is required to proceed"
      />,
    );
    const checkbox = screen.getByRole('checkbox');
    const error = screen.getByRole('alert');

    expect(error).toHaveTextContent('This consent is required to proceed');
    expect(checkbox.getAttribute('aria-describedby')).toContain('consent-error');
    expect(checkbox).toHaveAttribute('aria-invalid', 'true');
  });
});
