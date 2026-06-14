export function getDocumentRequirements(formData) {
  const employmentType = formData?.employment?.employmentType;
  const requirements = [
    { id: 'identityProof', label: 'Identity Proof' },
    { id: 'addressProof', label: 'Address Proof' },
    { id: 'bankStatements', label: 'Bank Statements' },
  ];

  if (employmentType === 'Salaried') {
    requirements.push({ id: 'salarySlips', label: 'Salary Slips' });
  } else if (employmentType) {
    requirements.push({ id: 'incomeTaxReturns', label: 'Income Tax Returns' });
  }

  return requirements;
}

export function getMissingDocumentRequirements(formData) {
  const documents = formData?.documents || {};
  return getDocumentRequirements(formData).filter((requirement) => (
    !Array.isArray(documents[requirement.id]) || documents[requirement.id].length === 0
  ));
}
