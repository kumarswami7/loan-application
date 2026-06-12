import { forwardRef, useId } from 'react';
import PropTypes from 'prop-types';
import ErrorMessage from './ErrorMessage';

/**
 * Base text input component.
 *
 * Supports the Compound Component Pattern via Input.Label, Input.Field,
 * Input.Error, Input.HelpText (Section C2.2) for advanced layouts, while
 * the default export below provides a convenient all-in-one field for
 * the common case (label + input + error + help text in one go).
 *
 * Uses React.forwardRef so it works with React Hook Form's `register()`.
 */
const Input = forwardRef(function Input(
  {
    label,
    error,
    helpText,
    required,
    type,
    autoComplete,
    className,
    ...rest
  },
  ref,
) {
  const generatedId = useId();
  const id = rest.id || generatedId;
  const errorId = `${id}-error`;
  const helpId = `${id}-help`;

  // Build aria-describedby from whichever of error/help text are present.
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

      <input
        ref={ref}
        id={id}
        type={type}
        autoComplete={autoComplete}
        aria-invalid={!!error}
        aria-describedby={describedBy}
        aria-required={required || undefined}
        className={`min-h-[44px] px-3 py-2 rounded-md border text-base
          focus-visible:outline-2 focus-visible:outline-primary
          disabled:bg-gray-100 disabled:cursor-not-allowed
          ${error ? 'border-error bg-error-light' : 'border-gray-300 bg-white'}
          ${className || ''}`}
        {...rest}
      />

      {helpText && !error && (
        <p id={helpId} className="text-sm text-gray-500">
          {helpText}
        </p>
      )}

      <ErrorMessage id={errorId} message={error} />
    </div>
  );
});

Input.propTypes = {
  label: PropTypes.string,
  error: PropTypes.string,
  helpText: PropTypes.string,
  required: PropTypes.bool,
  type: PropTypes.string,
  autoComplete: PropTypes.string,
  className: PropTypes.string,
};

Input.defaultProps = {
  label: undefined,
  error: undefined,
  helpText: undefined,
  required: false,
  type: 'text',
  autoComplete: undefined,
  className: undefined,
};

// --- Compound sub-components (Section C2.2) ---
// Allow consumers to compose custom layouts:
//   <Input.Label htmlFor="x">Name</Input.Label>
//   <Input.Field ref={ref} id="x" {...register('name')} />
//   <Input.Error message={errors.name?.message} />

function Label({ children, ...props }) {
  return (
    <label className="text-sm font-medium text-gray-700" {...props}>
      {children}
    </label>
  );
}
Label.propTypes = { children: PropTypes.node.isRequired };

const Field = forwardRef(function Field({ error, className, ...rest }, ref) {
  return (
    <input
      ref={ref}
      aria-invalid={!!error}
      className={`min-h-[44px] px-3 py-2 rounded-md border text-base
        focus-visible:outline-2 focus-visible:outline-primary
        ${error ? 'border-error bg-error-light' : 'border-gray-300 bg-white'}
        ${className || ''}`}
      {...rest}
    />
  );
});
Field.propTypes = { error: PropTypes.bool, className: PropTypes.string };
Field.defaultProps = { error: false, className: undefined };

function HelpText({ children }) {
  return <p className="text-sm text-gray-500">{children}</p>;
}
HelpText.propTypes = { children: PropTypes.node.isRequired };

Input.Label = Label;
Input.Field = Field;
Input.Error = ErrorMessage;
Input.HelpText = HelpText;

export default Input;
