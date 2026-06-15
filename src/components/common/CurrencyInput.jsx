import { forwardRef, useId, useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import ErrorMessage from './ErrorMessage';
import { formatIndianNumber, unformatNumber } from '../../utils/numberFormat';

/**
 * Currency input that displays values using the Indian numbering system
 * (e.g. "10,50,000") while keeping the underlying form value as a plain
 * number string (e.g. "1050000") for Zod validation.
 *
 * Designed to work with React Hook Form's `register()`: it intercepts
 * onChange to strip formatting before calling the registered onChange,
 * and reformats on blur for clean display.
 */
const CurrencyInput = forwardRef(function CurrencyInput(
  { label, error, helpText, required, onChange, onBlur, name, value, className, errorTestId, ...rest },
  ref,
) {
  const generatedId = useId();
  const id = rest.id || generatedId;
  const errorId = `${id}-error`;
  const helpId = `${id}-help`;

  // Local display state holds the formatted string ("10,50,000").
  const [displayValue, setDisplayValue] = useState(() =>
    value ? formatIndianNumber(unformatNumber(value)) : '',
  );

  // Keep display in sync if the external (RHF) value changes,
  // e.g. on form reset or programmatic setValue.
  useEffect(() => {
    const raw = unformatNumber(value);
    if (raw !== unformatNumber(displayValue)) {
      setDisplayValue(raw ? formatIndianNumber(raw) : '');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  const handleChange = (e) => {
    const raw = unformatNumber(e.target.value);

    // Only allow digits (currency has no decimals in this form per spec)
    if (raw !== '' && !/^\d+$/.test(raw)) return;

    setDisplayValue(raw ? formatIndianNumber(raw) : '');

    // Propagate the plain numeric string to RHF
    onChange?.({ target: { name, value: raw } });
  };

  const handleBlur = (e) => {
    onBlur?.(e);
  };

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
        <span
          className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 select-none"
          aria-hidden="true"
        >
          ₹
        </span>
        <input
          ref={ref}
          id={id}
          name={name}
          type="text"
          inputMode="numeric"
          value={displayValue}
          onChange={handleChange}
          onBlur={handleBlur}
          aria-invalid={!!error}
          aria-describedby={describedBy}
          aria-required={required || undefined}
          className={`w-full min-h-[44px] pl-7 pr-3 py-2 rounded-md border text-base
            focus-visible:outline-2 focus-visible:outline-primary
            disabled:bg-gray-100 disabled:cursor-not-allowed
            ${error ? 'border-error bg-error-light' : 'border-gray-500 bg-white'}
            ${className || ''}`}
          {...rest}
        />
      </div>

      {helpText && !error && (
        <p id={helpId} className="text-sm text-gray-500">
          {helpText}
        </p>
      )}

      <ErrorMessage id={errorId} message={error} testId={errorTestId} />
    </div>
  );
});

CurrencyInput.propTypes = {
  label: PropTypes.string,
  error: PropTypes.string,
  helpText: PropTypes.string,
  required: PropTypes.bool,
  name: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  onChange: PropTypes.func,
  onBlur: PropTypes.func,
  className: PropTypes.string,
  errorTestId: PropTypes.string,
};

CurrencyInput.defaultProps = {
  label: undefined,
  error: undefined,
  helpText: undefined,
  required: false,
  value: '',
  onChange: undefined,
  onBlur: undefined,
  className: undefined,
  errorTestId: undefined,
};

export default CurrencyInput;
