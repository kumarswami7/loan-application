import { getDocumentRequirements } from '../schemas/step7Schema';

export { getDocumentRequirements };

export function getMissingDocumentRequirements(formData) {
  const documents = formData?.documents || {};
  return getDocumentRequirements(formData).filter((requirement) => (
    requirement.required
    && (!Array.isArray(documents[requirement.id]) || documents[requirement.id].length === 0)
  ));
}
