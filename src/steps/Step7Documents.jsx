import { forwardRef, useCallback, useImperativeHandle, useMemo, useRef, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import FileUpload from '../components/common/FileUpload';
import SignatureCanvas from '../components/common/SignatureCanvas';
import { useFormData } from '../components/wizard/FormDataContext';
import { isCoApplicantStepVisible } from '../components/wizard/stepRegistry';
import { buildStep7Schema, getDocumentRequirements } from '../schemas/step7Schema';

function toMetadata(entries) {
  return entries.map((entry) => ({
    name: entry.name || entry.file?.name || 'Uploaded file',
    size: entry.compressedSize ?? entry.file?.size ?? 0,
    type: entry.type || entry.file?.type || 'application/octet-stream',
  }));
}

function restoredEntries(metadata = []) {
  return metadata.map((entry) => ({
    name: entry.name,
    type: entry.type,
    preview: '',
    originalSize: entry.size,
    compressedSize: entry.size,
  }));
}

function initialFileEntries(savedDocuments, documentId) {
  const activeEntries = savedDocuments.documentFiles?.[documentId];
  if (activeEntries?.every((entry) => entry.file instanceof Blob)) return activeEntries;
  return restoredEntries(savedDocuments[documentId]);
}

const Step7Documents = forwardRef(function Step7Documents(_props, ref) {
  const { formData, draftStepData, updateStepData } = useFormData();
  const savedDocuments = useMemo(() => ({
    ...formData.documents,
    ...draftStepData?.documents,
  }), [draftStepData?.documents, formData.documents]);
  const documentRequirements = useMemo(() => getDocumentRequirements(formData), [formData]);
  const schema = useMemo(() => buildStep7Schema(formData), [formData]);
  const showCoApplicantSignature = isCoApplicantStepVisible(formData);
  const applicantSignatureRef = useRef(null);
  const coApplicantSignatureRef = useRef(null);
  const [documentFiles, setDocumentFiles] = useState(() => Object.fromEntries(
    documentRequirements.map(({ id }) => [
      id,
      initialFileEntries(savedDocuments, id),
    ]),
  ));

  const defaultValues = useMemo(() => ({
    ...Object.fromEntries(documentRequirements.map(({ id }) => [id, savedDocuments[id] || []])),
    applicantSignature: savedDocuments.applicantSignature || '',
    ...(showCoApplicantSignature
      ? { coApplicantSignature: savedDocuments.coApplicantSignature || '' }
      : {}),
  }), [documentRequirements, savedDocuments, showCoApplicantSignature]);

  const {
    control,
    formState: { errors },
    getValues,
    handleSubmit,
    setValue,
  } = useForm({
    resolver: zodResolver(schema),
    mode: 'onBlur',
    shouldFocusError: true,
    defaultValues,
  });
  const values = useWatch({ control });

  const updateDocuments = useCallback((documentId, entries) => {
    setDocumentFiles((current) => ({ ...current, [documentId]: entries }));
    setValue(documentId, toMetadata(entries), { shouldDirty: true, shouldValidate: true });
  }, [setValue]);

  const onValid = useCallback((data) => {
    updateStepData('documents', { ...data, documentFiles });
    if (showCoApplicantSignature) {
      updateStepData('coApplicant', { coApplicantSignature: data.coApplicantSignature });
    }
  }, [documentFiles, showCoApplicantSignature, updateStepData]);

  useImperativeHandle(ref, () => ({
    getDirtyValues: () => ({ ...getValues(), documentFiles }),
    async validateAndSubmit() {
      let isValid = false;
      await handleSubmit(
        (data) => {
          onValid(data);
          isValid = true;
        },
        () => { isValid = false; },
      )();
      return isValid;
    },
  }), [documentFiles, getValues, handleSubmit, onValid]);

  return (
    <form onSubmit={handleSubmit(onValid)} noValidate className="space-y-7">
      <div>
        <h3 className="text-xl font-semibold text-primary">Document Upload &amp; E-Signature</h3>
        <p className="mt-1 text-sm text-gray-600">Upload clear copies of the documents listed below.</p>
      </div>

      <section className="rounded-lg border border-gray-200 bg-gray-50 p-4" aria-labelledby="document-checklist-heading">
        <h4 id="document-checklist-heading" className="font-semibold text-gray-900">Required document checklist</h4>
        <ul className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
          {documentRequirements.filter(({ required }) => required).map(({ id, label }) => {
            const uploaded = (values[id]?.length || 0) > 0;
            return (
              <li key={id} className="flex items-center gap-2">
                <span className={uploaded ? 'text-green-700' : 'text-gray-400'} aria-hidden="true">{uploaded ? '✓' : '○'}</span>
                <span>{label}: <strong className={uploaded ? 'text-green-700' : 'text-gray-500'}>{uploaded ? 'Uploaded' : 'Pending'}</strong></span>
              </li>
            );
          })}
        </ul>
      </section>

      <div className="space-y-6">
        {documentRequirements.map((document) => (
          <FileUpload
            key={document.id}
            label={`${document.label} (${document.required ? 'Required' : 'Optional'})`}
            required={document.required}
            accept={document.accept}
            maxSizeMB={document.maxSizeMB}
            maxFiles={document.maxFiles}
            value={documentFiles[document.id] || []}
            onChange={(entries) => updateDocuments(document.id, entries)}
            error={errors[document.id]?.message}
            testId={`upload-${document.id}`}
          />
        ))}
      </div>

      <section className="space-y-6 border-t border-gray-200 pt-6" aria-labelledby="signature-heading">
        <h4 id="signature-heading" className="text-lg font-semibold text-gray-900">E-Signatures</h4>
        <SignatureCanvas
          ref={applicantSignatureRef}
          label="Applicant Signature"
          required
          error={errors.applicantSignature?.message}
          testId="signature-canvas-applicant"
          onChange={(signature) => setValue('applicantSignature', signature, { shouldDirty: true, shouldValidate: true })}
        />
        {showCoApplicantSignature && (
          <SignatureCanvas
            ref={coApplicantSignatureRef}
            label="Co-Applicant Signature"
            required
            error={errors.coApplicantSignature?.message}
            testId="signature-canvas-coApplicant"
            onChange={(signature) => setValue('coApplicantSignature', signature, { shouldDirty: true, shouldValidate: true })}
          />
        )}
      </section>
    </form>
  );
});

export default Step7Documents;
