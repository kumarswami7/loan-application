import { forwardRef, useCallback, useImperativeHandle, useMemo, useRef, useState } from 'react';
import SignatureCanvas from 'react-signature-canvas';
import { useFormData } from '../components/wizard/FormDataContext';
import { isCoApplicantStepVisible } from '../components/wizard/stepRegistry';
import { getDocumentRequirements } from '../utils/documentRequirements';

function signatureValue(pad, savedValue) {
  if (pad && !pad.isEmpty()) return pad.getTrimmedCanvas().toDataURL('image/png');
  return savedValue || '';
}

const Step7Documents = forwardRef(function Step7Documents(_props, ref) {
  const { formData, updateStepData } = useFormData();
  const savedDocuments = formData.documents || {};
  const requirements = useMemo(() => getDocumentRequirements(formData), [formData]);
  const needsCoApplicantSignature = isCoApplicantStepVisible(formData);
  const applicantPad = useRef(null);
  const coApplicantPad = useRef(null);
  const [documents, setDocuments] = useState(savedDocuments);
  const [errors, setErrors] = useState([]);

  const handleFiles = useCallback((id, files) => {
    const nextFiles = Array.from(files).map((file) => ({
      name: file.name,
      size: file.size,
      type: file.type,
      lastModified: file.lastModified,
    }));
    setDocuments((current) => ({ ...current, [id]: nextFiles }));
  }, []);

  const validateAndSave = useCallback(() => {
    const nextDocuments = {
      ...documents,
      applicantSignature: signatureValue(applicantPad.current, documents.applicantSignature),
      coApplicantSignature: needsCoApplicantSignature
        ? signatureValue(coApplicantPad.current, documents.coApplicantSignature)
        : '',
    };
    const missing = requirements
      .filter(({ id }) => !Array.isArray(nextDocuments[id]) || nextDocuments[id].length === 0)
      .map(({ label }) => `Upload ${label}`);
    if (!nextDocuments.applicantSignature) missing.push('Add your signature');
    if (needsCoApplicantSignature && !nextDocuments.coApplicantSignature) {
      missing.push('Add the co-applicant signature');
    }

    setErrors(missing);
    if (missing.length > 0) return false;
    updateStepData('documents', nextDocuments);
    return true;
  }, [documents, needsCoApplicantSignature, requirements, updateStepData]);

  useImperativeHandle(ref, () => ({
    async validateAndSubmit() {
      return validateAndSave();
    },
  }), [validateAndSave]);

  return (
    <section className="space-y-6">
      <h3 className="text-xl font-semibold text-primary">Document Upload &amp; E-Signature</h3>
      <p className="text-sm text-gray-600">Upload the required documents and sign inside the boxes below.</p>

      <div className="grid gap-4 sm:grid-cols-2">
        {requirements.map(({ id, label }) => (
          <label key={id} className="block rounded-md border border-gray-200 p-4 text-sm font-medium text-gray-800">
            {label} <span className="text-error" aria-hidden="true">*</span>
            <input
              type="file"
              multiple
              accept=".pdf,.png,.jpg,.jpeg"
              onChange={(event) => handleFiles(id, event.target.files)}
              className="mt-2 block w-full text-sm"
            />
            {documents[id]?.length > 0 && (
              <span className="mt-2 block text-xs text-gray-500">{documents[id].length} file(s) selected</span>
            )}
          </label>
        ))}
      </div>

      <div className="space-y-4">
        <div>
          <p className="mb-2 text-sm font-medium">Applicant Signature *</p>
          {documents.applicantSignature ? (
            <img src={documents.applicantSignature} alt="Saved applicant signature" className="h-28 w-full rounded border object-contain" />
          ) : (
            <SignatureCanvas ref={applicantPad} canvasProps={{ className: 'h-28 w-full rounded border border-gray-300' }} />
          )}
        </div>
        {needsCoApplicantSignature && (
          <div>
            <p className="mb-2 text-sm font-medium">Co-Applicant Signature *</p>
            {documents.coApplicantSignature ? (
              <img src={documents.coApplicantSignature} alt="Saved co-applicant signature" className="h-28 w-full rounded border object-contain" />
            ) : (
              <SignatureCanvas ref={coApplicantPad} canvasProps={{ className: 'h-28 w-full rounded border border-gray-300' }} />
            )}
          </div>
        )}
      </div>

      {errors.length > 0 && (
        <div role="alert" className="rounded-md bg-red-50 p-3 text-sm text-error">
          Complete the following: {errors.join(', ')}
        </div>
      )}
    </section>
  );
});

export default Step7Documents;
