import { forwardRef, useId } from 'react';
import PropTypes from 'prop-types';
import ErrorMessage from './ErrorMessage';

/**
 * Native <select> dropdown, styled consistently with Input.
 * forwardRef for React Hook Form's register().
 *
 * `options` accepts either an array of strings, or an array of
 * { value, label } objects (useful when the displayed label differs
 * from the stored value).
 */
const Select = forwardRef(function Select(
  { label, error, helpText, required, options, placeholder, className, ...rest },
  ref,
) {
  const generatedId = useId();
  const id = rest.id || generatedId;
  const errorId = `${id}-error`;
  const helpId = `${id}-help`;

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

      <select
        ref={ref}
        id={id}
        aria-invalid={!!error}
        aria-describedby={describedBy}
        aria-required={required || undefined}
        className={`min-h-[44px] px-3 py-2 rounded-md border text-base bg-white
          focus-visible:outline-2 focus-visible:outline-primary
          disabled:bg-gray-100 disabled:cursor-not-allowed
          ${error ? 'border-error bg-error-light' : 'border-gray-300'}
          ${className || ''}`}
        {...rest}
      >
        {placeholder && (
          <option value="" disabled hidden>
            {placeholder}
          </option>
        )}
        {options.map((opt) => {
          const value = typeof opt === 'string' ? opt : opt.value;
          const text = typeof opt === 'string' ? opt : opt.label;
          return (
            <option key={value} value={value}>
              {text}
            </option>
          );
        })}
      </select>

      {helpText && !error && (
        <p id={helpId} className="text-sm text-gray-500">
          {helpText}
        </p>
      )}

      <ErrorMessage id={errorId} message={error} />
    </div>
  );
});

Select.propTypes = {
  label: PropTypes.string,
  error: PropTypes.string,
  helpText: PropTypes.string,
  required: PropTypes.bool,
  placeholder: PropTypes.string,
  className: PropTypes.string,
  options: PropTypes.arrayOf(
    PropTypes.oneOfType([
      PropTypes.string,
      PropTypes.shape({
        value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
        label: PropTypes.string.isRequired,
      }),
    ]),
  ).isRequired,
};

Select.defaultProps = {
  label: undefined,
  error: undefined,
  helpText: undefined,
  required: false,
  placeholder: undefined,
  className: undefined,
};

export default Select;
