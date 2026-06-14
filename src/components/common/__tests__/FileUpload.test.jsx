import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import FileUpload from '../FileUpload';

vi.mock('../../../utils/imageCompression', () => ({
  compressImage: vi.fn(async (file) => ({
    blob: file,
    originalSize: file.size,
    compressedSize: file.size,
  })),
}));

const baseProps = {
  label: 'PAN Card Copy',
  accept: ['application/pdf', 'image/jpeg', 'image/png'],
  maxSizeMB: 5,
  maxFiles: 1,
  value: [],
  onChange: vi.fn(),
};

function upload(file, props = {}) {
  const onChange = vi.fn();
  render(<FileUpload {...baseProps} {...props} onChange={onChange} />);
  fireEvent.change(document.querySelector('input[type="file"]'), { target: { files: [file] } });
  return onChange;
}

describe('FileUpload', () => {
  beforeEach(() => {
    baseProps.onChange.mockClear();
    vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:preview');
    vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});
  });

  it('renders accepted formats and maximum size help', () => {
    render(<FileUpload {...baseProps} />);
    expect(screen.getByText('PDF, JPG, PNG up to 5MB')).toBeInTheDocument();
  });

  it('rejects unsupported file types', async () => {
    upload(new File(['text'], 'notes.txt', { type: 'text/plain' }));
    expect(await screen.findByText('File type not supported. Accepted formats: PDF, JPG, PNG')).toBeInTheDocument();
  });

  it('rejects files over the size limit', async () => {
    upload(new File([new Uint8Array(6 * 1024 * 1024)], 'large.pdf', { type: 'application/pdf' }));
    expect(await screen.findByText('File size exceeds 5MB limit')).toBeInTheDocument();
  });

  it('publishes a valid file entry', async () => {
    const file = new File(['pdf'], 'pan.pdf', { type: 'application/pdf' });
    const onChange = upload(file);
    await waitFor(() => expect(onChange).toHaveBeenCalledWith([
      expect.objectContaining({ file, name: 'pan.pdf', originalSize: file.size, compressedSize: file.size }),
    ]));
  });

  it('removes an existing file entry', () => {
    const onChange = vi.fn();
    const entry = { file: new File(['pdf'], 'pan.pdf', { type: 'application/pdf' }), name: 'pan.pdf', type: 'application/pdf', preview: '', originalSize: 3, compressedSize: 3 };
    render(<FileUpload {...baseProps} value={[entry]} onChange={onChange} />);
    fireEvent.click(screen.getByRole('button', { name: 'Remove pan.pdf' }));
    expect(onChange).toHaveBeenCalledWith([]);
  });
});
