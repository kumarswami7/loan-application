import { forwardRef, useId } from 'react';
import PropTypes from 'prop-types';
import ErrorMessage from './ErrorMessage';

/**
 * A single checkbox with a linked label (clicking label toggles the box).
 * Used for consent checkboxes (Aadhaar consent, T&C, etc.) which must be
 * individually labelled per RBI's explicit-consent mandate (Section A3.1) -
 * no pre-ticked or bundled checkboxes.
 */
const Checkbox = forwardRef(function Checkbox(
  { label, error, required, className, errorTestId, ...rest },
  ref,
) {
  const generatedId = useId();
  const id = rest.id || generatedId;
  const errorId = `${id}-error`;

  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="flex items-start gap-3 cursor-pointer min-h-[44px] py-1">
        <input
          ref={ref}
          id={id}
          type="checkbox"
          aria-invalid={!!error}
          aria-describedby={error ? errorId : undefined}
          aria-required={required || undefined}
          className={`mt-0.5 w-5 h-5 shrink-0 accent-primary rounded
            focus-visible:outline-2 focus-visible:outline-primary
            ${error ? 'outline outline-1 outline-error' : ''}
            ${className || ''}`}
          {...rest}
        />
        <span className="text-sm text-gray-800 leading-snug">
          {label}
          {required && (
            <span className="text-error ml-1" aria-hidden="true">
              *
            </span>
          )}
          {required && <span className="sr-only"> (required)</span>}
        </span>
      </label>

      <ErrorMessage id={errorId} message={error} testId={errorTestId} />
    </div>
  );
});

Checkbox.propTypes = {
  label: PropTypes.node.isRequired,
  error: PropTypes.string,
  required: PropTypes.bool,
  className: PropTypes.string,
  errorTestId: PropTypes.string,
};

Checkbox.defaultProps = {
  error: undefined,
  required: false,
  className: undefined,
  errorTestId: undefined,
};

export default Checkbox;
