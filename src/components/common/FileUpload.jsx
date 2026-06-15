import { useEffect, useId, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { useDropzone } from 'react-dropzone';
import { compressImage } from '../../utils/imageCompression';
import ErrorMessage from './ErrorMessage';

const MIME_LABELS = {
  'application/pdf': 'PDF',
  'image/jpeg': 'JPG',
  'image/png': 'PNG',
};

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function entryName(entry) {
  return entry.name || entry.file?.name || 'Uploaded file';
}

function DefaultPreview({ entry, onRemove, testId, index }) {
  const name = entryName(entry);
  const isImage = entry.type?.startsWith('image/') || entry.file?.type?.startsWith('image/');
  return (
    <li data-testid={`preview-${testId}`} className="flex items-center gap-3 rounded-md border border-gray-200 p-3">
      {isImage && entry.preview ? (
        <img src={entry.preview} alt={`Preview of ${name}`} className="h-20 w-20 rounded object-cover" />
      ) : (
        <svg aria-hidden="true" viewBox="0 0 24 24" className="h-10 w-10 shrink-0 text-primary" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M6 2.75h7l5 5V21.25H6z" />
          <path d="M13 2.75v5h5" />
          <path d="M8.5 15.5h7M8.5 18h5" />
        </svg>
      )}
      <div className="min-w-0 flex-1 text-sm">
        <p className="truncate font-medium text-gray-800">{name}</p>
        <p data-testid={`compression-info-${testId}`} className="text-gray-500">
          {entry.originalSize !== entry.compressedSize
            ? `${formatBytes(entry.originalSize)} -> ${formatBytes(entry.compressedSize)}`
            : formatBytes(entry.compressedSize)}
        </p>
      </div>
      <button
        type="button"
        onClick={onRemove}
        aria-label={`Remove ${name}`}
        data-testid={`remove-${testId}-${index}`}
        className="min-h-[44px] min-w-[44px] rounded-md border border-gray-500 text-xl text-gray-700"
      >
        &times;
      </button>
    </li>
  );
}

DefaultPreview.propTypes = {
  entry: PropTypes.shape({
    file: PropTypes.instanceOf(Blob),
    name: PropTypes.string,
    type: PropTypes.string,
    preview: PropTypes.string,
    originalSize: PropTypes.number.isRequired,
    compressedSize: PropTypes.number.isRequired,
  }).isRequired,
  onRemove: PropTypes.func.isRequired,
  testId: PropTypes.string.isRequired,
  index: PropTypes.number.isRequired,
};

export default function FileUpload({
  label,
  error,
  required,
  accept,
  maxSizeMB,
  maxFiles,
  value,
  onChange,
  renderPreview,
  testId,
}) {
  const generatedId = useId();
  const errorId = `${generatedId}-error`;
  const previewTestId = testId?.replace('upload-', '') || generatedId;
  const [localError, setLocalError] = useState('');
  const [status, setStatus] = useState('');
  const ownedPreviews = useRef(new Set());
  const acceptedLabels = accept.map((type) => MIME_LABELS[type] || type);

  useEffect(() => () => {
    ownedPreviews.current.forEach((preview) => URL.revokeObjectURL(preview));
    ownedPreviews.current.clear();
  }, []);

  useEffect(() => {
    const activePreviews = new Set(value.map((entry) => entry.preview).filter(Boolean));
    ownedPreviews.current.forEach((preview) => {
      if (!activePreviews.has(preview)) {
        URL.revokeObjectURL(preview);
        ownedPreviews.current.delete(preview);
      }
    });
  }, [value]);

  const processFiles = async (selectedFiles) => {
    setLocalError('');
    const files = Array.from(selectedFiles);
    const unsupported = files.find((file) => !accept.includes(file.type));
    if (unsupported) {
      setLocalError(`File type not supported. Accepted formats: ${acceptedLabels.join(', ')}`);
      setStatus('Upload failed');
      return;
    }
    const oversized = files.find((file) => file.size > maxSizeMB * 1024 * 1024);
    if (oversized) {
      setLocalError(`File size exceeds ${maxSizeMB}MB limit`);
      setStatus('Upload failed');
      return;
    }
    if (value.length + files.length > maxFiles) {
      setLocalError(`Maximum ${maxFiles} file(s) allowed`);
      setStatus('Upload failed');
      return;
    }

    setStatus('Compressing...');
    const entries = await Promise.all(files.map(async (file) => {
      const result = await compressImage(file);
      const preview = file.type.startsWith('image/') ? URL.createObjectURL(result.blob) : '';
      if (preview) ownedPreviews.current.add(preview);
      return {
        file: result.blob,
        name: file.name,
        type: file.type,
        preview,
        originalSize: result.originalSize,
        compressedSize: result.compressedSize,
      };
    }));
    onChange([...value, ...entries]);
    setStatus(`${entries.length} file(s) ready`);
  };

  const { getInputProps, getRootProps, isDragActive } = useDropzone({
    multiple: maxFiles > 1,
    onDrop: processFiles,
  });

  const removeEntry = (index) => {
    onChange(value.filter((_, entryIndex) => entryIndex !== index));
  };

  const displayedError = localError || error;
  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-gray-700">
        {label}
        {required && <span className="ml-1 text-error" aria-hidden="true">*</span>}
        {required && <span className="sr-only"> (required)</span>}
      </p>
      <div
        {...getRootProps({
          role: 'button',
          'aria-label': `Upload ${label}, drag and drop or click`,
          'aria-describedby': displayedError ? errorId : undefined,
        })}
        data-testid={testId}
        className={`min-h-[88px] cursor-pointer rounded-md border-2 border-dashed p-5 text-center ${displayedError ? 'border-error bg-error-light' : 'border-gray-500 hover:border-primary'} ${isDragActive ? 'bg-primary/5' : ''}`}
      >
        <input {...getInputProps({ 'aria-describedby': displayedError ? errorId : undefined })} />
        <p className="text-sm font-medium text-gray-700">Drag &amp; drop files here, or click to browse</p>
        <p className="mt-1 text-xs text-gray-500">{acceptedLabels.join(', ')} up to {maxSizeMB}MB</p>
      </div>
      <span className="sr-only" aria-live="polite">{status}</span>
      <ErrorMessage id={errorId} message={displayedError} testId={testId ? `${testId}-error` : undefined} />
      {value.length > 0 && (
        <ul className="space-y-2">
          {value.map((entry, index) => (
            renderPreview
              ? <li key={`${entryName(entry)}-${index}`}>{renderPreview(entry, () => removeEntry(index))}</li>
              : <DefaultPreview key={`${entryName(entry)}-${index}`} entry={entry} onRemove={() => removeEntry(index)} testId={previewTestId} index={index} />
          ))}
        </ul>
      )}
    </div>
  );
}

FileUpload.propTypes = {
  label: PropTypes.string.isRequired,
  error: PropTypes.string,
  required: PropTypes.bool,
  accept: PropTypes.arrayOf(PropTypes.string).isRequired,
  maxSizeMB: PropTypes.number.isRequired,
  maxFiles: PropTypes.number,
  value: PropTypes.arrayOf(PropTypes.shape({
    file: PropTypes.instanceOf(Blob),
    name: PropTypes.string,
    type: PropTypes.string,
    preview: PropTypes.string,
    originalSize: PropTypes.number.isRequired,
    compressedSize: PropTypes.number.isRequired,
  })),
  onChange: PropTypes.func.isRequired,
  renderPreview: PropTypes.func,
  testId: PropTypes.string,
};

FileUpload.defaultProps = {
  error: undefined,
  required: false,
  maxFiles: 1,
  value: [],
  renderPreview: undefined,
  testId: undefined,
};
