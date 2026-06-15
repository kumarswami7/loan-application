import PropTypes from 'prop-types';

/**
 * Bottom navigation bar for the wizard: Previous / Save Draft / Next (or Submit).
 * Buttons meet the 44x44px minimum touch target requirement (WCAG 2.1 AA / B4.2).
 */
export default function StepNavigation({
  onPrevious,
  onNext,
  onSaveDraft,
  isFirstStep,
  isLastStep,
  isSubmitting,
  nextDisabled,
}) {
  return (
    <div className="flex flex-col sm:flex-row justify-between gap-3 mt-8 pt-6 border-t border-gray-200">
      <button
        data-testid="wizard-prev"
        type="button"
        onClick={onPrevious}
        disabled={isFirstStep}
        className="min-h-[44px] px-6 py-2 rounded-md border border-gray-500 text-gray-700
                   font-medium hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed
                   focus-visible:outline-primary order-3 sm:order-1"
      >
        Previous
      </button>

      <button
        data-testid="wizard-save-draft"
        type="button"
        onClick={onSaveDraft}
        className="min-h-[44px] px-6 py-2 rounded-md border border-primary text-primary
                   font-medium hover:bg-primary/5 focus-visible:outline-primary order-2"
      >
        Save Draft
      </button>

      <button
        data-testid={isLastStep ? 'submit-button' : 'wizard-next'}
        type="button"
        onClick={onNext}
        disabled={nextDisabled || isSubmitting}
        className="min-h-[44px] px-6 py-2 rounded-md bg-primary text-white font-medium
                   hover:bg-primary-dark disabled:opacity-50 disabled:cursor-not-allowed
                   focus-visible:outline-accent order-1 sm:order-3"
      >
        {isSubmitting ? 'Submitting…' : isLastStep ? 'Submit Application' : 'Next'}
      </button>
    </div>
  );
}

StepNavigation.propTypes = {
  onPrevious: PropTypes.func.isRequired,
  onNext: PropTypes.func.isRequired,
  onSaveDraft: PropTypes.func.isRequired,
  isFirstStep: PropTypes.bool,
  isLastStep: PropTypes.bool,
  isSubmitting: PropTypes.bool,
  nextDisabled: PropTypes.bool,
};

StepNavigation.defaultProps = {
  isFirstStep: false,
  isLastStep: false,
  isSubmitting: false,
  nextDisabled: false,
};
