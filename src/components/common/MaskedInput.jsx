import { forwardRef, useId, useState } from 'react';
import PropTypes from 'prop-types';
import ErrorMessage from './ErrorMessage';

/**
 * Masked input for sensitive PII fields (PAN, Aadhaar) per Section B4.4
 * Security Requirements: "All PII fields must be masked in the UI after
 * entry (show only last 4 characters)".
 *
 * Behaviour:
 * - While the field is focused, the full value is shown (so the user can
 *   verify what they typed).
 * - On blur, if the value is "complete" (matches `maskAfterLength`), it is
 *   displayed masked, e.g. "XXXXXXX1234".
 * - A "show/hide" toggle button lets the user reveal the value again
 *   (useful for double-checking before verification).
 * - The underlying form value passed to RHF is always the real,
 *   unmasked value - masking is purely a display concern.
 */
const MaskedInput = forwardRef(function MaskedInput(
  {
    label,
    error,
    helpText,
    required,
    verified,
    isVerifying,
    maskAfterLength,
    visibleChars,
    onBlur,
    className,
    ...rest
  },
  ref,
) {
  const generatedId = useId();
  const id = rest.id || generatedId;
  const errorId = `${id}-error`;
  const helpId = `${id}-help`;

  const [revealed, setRevealed] = useState(false);
  const [focused, setFocused] = useState(false);

  const rawValue = rest.value ?? '';
  const shouldMask =
    !focused && !revealed && rawValue.length >= maskAfterLength;

  const displayType = shouldMask ? 'text' : rest.type || 'text';

  const maskedValue = shouldMask
    ? 'X'.repeat(Math.max(rawValue.length - visibleChars, 0)) +
      rawValue.slice(-visibleChars)
    : rawValue;

  const describedBy = [error ? errorId : null, helpText ? helpId : null]
    .filter(Boolean)
    .join(' ') || undefined;

  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label htmlFor={id} className="text-sm font-medium text-gray-700">
          {label}
          {required && (
            <span className="text-error ml-1" aria-hidden="true">
              *
            </span>
          )}
          {required && <span className="sr-only"> (required)</span>}
        </label>
      )}

      <div className="relative">
        <input
          ref={ref}
          id={id}
          type={displayType}
          value={maskedValue}
          onFocus={() => setFocused(true)}
          onBlur={(e) => {
            setFocused(false);
            onBlur?.(e);
          }}
          // Prevent typing into the masked (read-only-looking) display;
          // real edits should happen while focused/revealed.
          readOnly={shouldMask}
          aria-invalid={!!error}
          aria-describedby={describedBy}
          aria-required={required || undefined}
          className={`w-full min-h-[44px] px-3 py-2 pr-20 rounded-md border text-base
            tracking-wider font-mono
            focus-visible:outline-2 focus-visible:outline-primary
            disabled:bg-gray-100 disabled:cursor-not-allowed
            ${error ? 'border-error bg-error-light' : 'border-gray-300 bg-white'}
            ${className || ''}`}
          {...rest}
        />

        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-2">
          {isVerifying && (
            <span
              className="inline-block w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"
              role="status"
              aria-label="Verifying"
            />
          )}
          {!isVerifying && verified && (
            <span
              className="text-accent text-sm font-medium flex items-center gap-1"
              role="status"
            >
              <span aria-hidden="true">✓</span> Verified
            </span>
          )}
          {rawValue.length >= visibleChars && (
            <button
              type="button"
              onClick={() => setRevealed((r) => !r)}
              className="text-xs text-primary underline focus-visible:outline-2 focus-visible:outline-primary px-1 min-h-[28px]"
              aria-pressed={revealed}
            >
              {revealed ? 'Hide' : 'Show'}
            </button>
          )}
        </div>
      </div>

      {helpText && !error && (
        <p id={helpId} className="text-sm text-gray-500">
          {helpText}
        </p>
      )}

      <ErrorMessage id={errorId} message={error} />
    </div>
  );
});

MaskedInput.propTypes = {
  label: PropTypes.string,
  error: PropTypes.string,
  helpText: PropTypes.string,
  required: PropTypes.bool,
  verified: PropTypes.bool,
  isVerifying: PropTypes.bool,
  /** Minimum length before masking kicks in on blur (e.g. 10 for PAN, 12 for Aadhaar) */
  maskAfterLength: PropTypes.number,
  /** Number of trailing characters to keep visible when masked */
  visibleChars: PropTypes.number,
  onBlur: PropTypes.func,
  className: PropTypes.string,
};

MaskedInput.defaultProps = {
  label: undefined,
  error: undefined,
  helpText: undefined,
  required: false,
  verified: false,
  isVerifying: false,
  maskAfterLength: 4,
  visibleChars: 4,
  onBlur: undefined,
  className: undefined,
};

export default MaskedInput;
