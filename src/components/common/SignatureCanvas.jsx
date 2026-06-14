import { forwardRef, useId, useImperativeHandle, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import ReactSignatureCanvas from 'react-signature-canvas';
import ErrorMessage from './ErrorMessage';

const SignatureCanvas = forwardRef(function SignatureCanvas(
  { label, error, required, onChange },
  ref,
) {
  const generatedId = useId();
  const errorId = `${generatedId}-error`;
  const padRef = useRef(null);
  const containerRef = useRef(null);
  const [obscured, setObscured] = useState(false);

  const publishSignature = () => {
    if (!padRef.current || padRef.current.isEmpty()) return;
    onChange(padRef.current.toDataURL('image/png'));
  };

  const clear = () => {
    padRef.current?.clear();
    onChange('');
  };

  useImperativeHandle(ref, () => ({
    clear,
    isEmpty: () => padRef.current?.isEmpty() ?? true,
    toDataURL: () => (padRef.current?.isEmpty() ? '' : padRef.current?.toDataURL('image/png') || ''),
  }));

  const resumeSigning = () => {
    setObscured(false);
    containerRef.current?.focus();
  };

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-gray-700">
        {label}
        {required && <span className="ml-1 text-error" aria-hidden="true">*</span>}
        {required && <span className="sr-only"> (required)</span>}
      </p>
      <div
        ref={containerRef}
        tabIndex={0}
        aria-label="Signature pad - draw your signature using mouse or touch"
        aria-describedby={error ? errorId : undefined}
        aria-invalid={Boolean(error)}
        onFocus={() => setObscured(false)}
        onBlur={() => setObscured(true)}
        className={`relative min-h-[150px] w-full overflow-hidden rounded-md border bg-white ${error ? 'border-error' : 'border-gray-300'}`}
      >
        <ReactSignatureCanvas
          ref={padRef}
          onEnd={publishSignature}
          canvasProps={{ className: 'block h-[150px] w-full touch-none' }}
        />
        {/* Basic screenshot deterrent required by the project spec; this is not DRM. */}
        {obscured && (
          <button
            type="button"
            onMouseDown={(event) => event.preventDefault()}
            onClick={resumeSigning}
            className="absolute inset-0 flex min-h-[44px] w-full items-center justify-center bg-gray-900/40 font-medium text-white"
          >
            Click to resume signing
          </button>
        )}
      </div>
      <button
        type="button"
        onClick={clear}
        className="min-h-[44px] rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
      >
        Clear
      </button>
      <ErrorMessage id={errorId} message={error} />
    </div>
  );
});

SignatureCanvas.propTypes = {
  label: PropTypes.string.isRequired,
  error: PropTypes.string,
  required: PropTypes.bool,
  onChange: PropTypes.func,
};

SignatureCanvas.defaultProps = {
  error: undefined,
  required: false,
  onChange: () => {},
};

export default SignatureCanvas;
