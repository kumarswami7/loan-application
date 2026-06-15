import { forwardRef, useId } from 'react';
import PropTypes from 'prop-types';
import ErrorMessage from './ErrorMessage';

/**
 * A group of radio buttons with a shared name, rendered as a fieldset
 * for proper grouping semantics (WCAG 1.3.1 Info and Relationships).
 *
 * forwardRef is attached to the *first* radio input so React Hook Form's
 * register() can still call .focus() on validation errors; RHF's register
 * spreads {name, onChange, onBlur, ref} onto each individual radio.
 */
const RadioGroup = forwardRef(function RadioGroup(
  { label, error, options, required, layout, name, onChange, onBlur, value, testIdPrefix, ...rest },
  ref,
) {
  const generatedId = useId();
  const groupId = `${generatedId}-group`;
  const errorId = `${groupId}-error`;

  return (
    <fieldset
      className="flex flex-col gap-2"
      aria-invalid={!!error}
      aria-describedby={error ? errorId : undefined}
    >
      {label && (
        <legend className="text-sm font-medium text-gray-700 mb-1">
          {label}
          {required && (
            <span className="text-error ml-1" aria-hidden="true">
              *
            </span>
          )}
          {required && <span className="sr-only"> (required)</span>}
        </legend>
      )}

      <div className={`flex gap-4 ${layout === 'vertical' ? 'flex-col' : 'flex-row flex-wrap'}`}>
        {options.map((opt, idx) => {
          const optValue = typeof opt === 'string' ? opt : opt.value;
          const optLabel = typeof opt === 'string' ? opt : opt.label;
          const inputId = `${groupId}-${optValue}`;

          return (
            <label
              key={optValue}
              htmlFor={inputId}
              className="flex items-center gap-2 cursor-pointer min-h-[44px] px-1"
            >
              <input
                ref={idx === 0 ? ref : undefined}
                id={inputId}
                type="radio"
                name={name}
                value={optValue}
                checked={value === optValue}
                onChange={onChange}
                onBlur={onBlur}
                className="w-5 h-5 accent-primary focus-visible:outline-2 focus-visible:outline-primary"
                {...rest}
                data-testid={testIdPrefix ? `${testIdPrefix}-${optValue}` : rest['data-testid']}
              />
              <span className="text-sm text-gray-800">{optLabel}</span>
            </label>
          );
        })}
      </div>

      <ErrorMessage id={errorId} message={error} />
    </fieldset>
  );
});

RadioGroup.propTypes = {
  label: PropTypes.string,
  error: PropTypes.string,
  required: PropTypes.bool,
  layout: PropTypes.oneOf(['horizontal', 'vertical']),
  name: PropTypes.string.isRequired,
  value: PropTypes.string,
  onChange: PropTypes.func,
  onBlur: PropTypes.func,
  testIdPrefix: PropTypes.string,
  options: PropTypes.arrayOf(
    PropTypes.oneOfType([
      PropTypes.string,
      PropTypes.shape({
        value: PropTypes.string.isRequired,
        label: PropTypes.string.isRequired,
      }),
    ]),
  ).isRequired,
};

RadioGroup.defaultProps = {
  label: undefined,
  error: undefined,
  required: false,
  layout: 'horizontal',
  value: undefined,
  onChange: undefined,
  onBlur: undefined,
  testIdPrefix: undefined,
};

export default RadioGroup;
