import PropTypes from 'prop-types';

/**
 * Temporary placeholder used until each real step component is built
 * (Step1LoanType, Step2PersonalInfo, etc. - Days 3-9).
 */
export default function PlaceholderStep({ stepLabel }) {
  return (
    <div className="py-12 text-center">
      <h2 className="text-xl font-semibold text-primary mb-2">{stepLabel}</h2>
      <p className="text-gray-500">This step's form fields will be implemented in a later phase.</p>
    </div>
  );
}

PlaceholderStep.propTypes = {
  stepLabel: PropTypes.string.isRequired,
};
