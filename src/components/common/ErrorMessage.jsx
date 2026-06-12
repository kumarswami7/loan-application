import PropTypes from 'prop-types';

/**
 * Displays a field-level validation error.
 * Uses aria-live="polite" + role="alert" so screen readers announce
 * errors as they appear (WCAG 3.3.1 Error Identification, Section A2.4/B4.2).
 */
export default function ErrorMessage({ id, message }) {
  if (!message) return null;

  return (
    <p
      id={id}
      role="alert"
      aria-live="polite"
      className="mt-1 text-sm text-error flex items-start gap-1"
    >
      <span aria-hidden="true">⚠</span>
      <span>{message}</span>
    </p>
  );
}

ErrorMessage.propTypes = {
  id: PropTypes.string.isRequired,
  message: PropTypes.string,
};

ErrorMessage.defaultProps = {
  message: undefined,
};
