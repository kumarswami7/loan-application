import { useEffect, useRef } from 'react';
import PropTypes from 'prop-types';

export default function ResumeDraftModal({ loanType, onResume, onStartFresh }) {
  const resumeButtonRef = useRef(null);
  const freshButtonRef = useRef(null);

  useEffect(() => {
    resumeButtonRef.current?.focus();
  }, []);

  const handleKeyDown = (event) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      onStartFresh();
      return;
    }
    if (event.key !== 'Tab') return;

    if (event.shiftKey && document.activeElement === resumeButtonRef.current) {
      event.preventDefault();
      freshButtonRef.current?.focus();
    } else if (!event.shiftKey && document.activeElement === freshButtonRef.current) {
      event.preventDefault();
      resumeButtonRef.current?.focus();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div
        data-testid="resume-draft-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="resume-draft-heading"
        onKeyDown={handleKeyDown}
        className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl"
      >
        <h2 id="resume-draft-heading" className="text-xl font-semibold text-primary">
          Resume saved application?
        </h2>
        <p className="mt-3 text-gray-600">
          You have a saved application for {loanType || 'an unknown loan type'}. Resume or start fresh?
        </p>
        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            ref={freshButtonRef}
            type="button"
            onClick={onStartFresh}
            className="min-h-[44px] rounded-md border border-gray-300 px-4 py-2 font-medium text-gray-700"
          >
            Start Fresh
          </button>
          <button
            ref={resumeButtonRef}
            type="button"
            onClick={onResume}
            className="min-h-[44px] rounded-md bg-primary px-4 py-2 font-medium text-white"
          >
            Resume
          </button>
        </div>
      </div>
    </div>
  );
}

ResumeDraftModal.propTypes = {
  loanType: PropTypes.string,
  onResume: PropTypes.func.isRequired,
  onStartFresh: PropTypes.func.isRequired,
};

ResumeDraftModal.defaultProps = {
  loanType: undefined,
};
