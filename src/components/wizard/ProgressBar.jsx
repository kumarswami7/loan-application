import PropTypes from 'prop-types';

/**
 * Visual + accessible progress indicator for the multi-step wizard.
 * Conveys step position to screen readers via aria-label (WCAG 2.1 AA).
 */
export default function ProgressBar({ steps, currentIndex }) {
  const total = steps.length;
  const current = currentIndex + 1;
  const percent = Math.round((current / total) * 100);

  return (
    <div className="w-full mb-6" role="group" aria-label={`Step ${current} of ${total}`}>
      <div className="mb-2 flex flex-wrap items-center justify-between gap-1">
        <span className="min-w-0 text-sm font-semibold text-primary">
          Step {current} of {total}: {steps[currentIndex]?.label}
        </span>
        <span className="text-sm text-gray-700">{percent}% complete</span>
      </div>

      <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
        <div
          className="h-full bg-accent transition-all duration-300 ease-out"
          style={{ width: `${percent}%` }}
          role="progressbar"
          aria-valuenow={percent}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`Application progress: ${percent}% complete`}
        />
      </div>

      {/* Step dots - hidden on small screens to save space */}
      <ol className="hidden sm:flex justify-between mt-3" aria-hidden="true">
        {steps.map((step, idx) => (
          <li
            key={step.id}
            className={`flex flex-col items-center text-xs flex-1 ${
              idx <= currentIndex ? 'text-primary font-medium' : 'text-gray-600'
            }`}
          >
            <span
              className={`w-6 h-6 rounded-full flex items-center justify-center mb-1 text-[11px] ${
                idx < currentIndex
                  ? 'bg-accent text-white'
                  : idx === currentIndex
                    ? 'bg-primary text-white'
                    : 'bg-gray-200 text-gray-700'
              }`}
            >
              {idx < currentIndex ? '✓' : idx + 1}
            </span>
            <span className="truncate max-w-[64px] text-center">{step.shortLabel}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}

ProgressBar.propTypes = {
  steps: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired,
      shortLabel: PropTypes.string.isRequired,
    }),
  ).isRequired,
  currentIndex: PropTypes.number.isRequired,
};
