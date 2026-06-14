import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { compressImage } from '../imageCompression';

// jsdom does not decode images or implement canvas encoding. These mocks test
// control flow and sizing; real visual output belongs in browser E2E coverage.
describe('compressImage', () => {
  let qualities;
  let blobSizes;
  let createdCanvas;

  beforeEach(() => {
    qualities = [];
    blobSizes = [500000];
    createdCanvas = null;
    vi.stubGlobal('Image', class FakeImage {
      set src(_value) {
        this.width = 2400;
        this.height = 1200;
        queueMicrotask(() => this.onload());
      }
    });
    vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:test-image');
    vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});
    const createElement = document.createElement.bind(document);
    vi.spyOn(document, 'createElement').mockImplementation((tagName, options) => {
      const element = createElement(tagName, options);
      if (tagName === 'canvas') createdCanvas = element;
      return element;
    });
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({ drawImage: vi.fn() });
    vi.spyOn(HTMLCanvasElement.prototype, 'toBlob').mockImplementation((callback, type, quality) => {
      qualities.push(quality);
      callback(new Blob([new Uint8Array(blobSizes.shift())], { type }));
    });
  });

  afterEach(() => vi.restoreAllMocks());

  it('passes PDF files through unchanged', async () => {
    const file = new File(['pdf'], 'statement.pdf', { type: 'application/pdf' });
    const result = await compressImage(file);
    expect(result).toEqual({ blob: file, originalSize: file.size, compressedSize: file.size });
    expect(URL.createObjectURL).not.toHaveBeenCalled();
  });

  it('scales wide images to 1200px and returns size metadata', async () => {
    const file = new File([new Uint8Array(1000)], 'photo.png', { type: 'image/png' });
    const result = await compressImage(file);
    expect(createdCanvas.width).toBe(1200);
    expect(createdCanvas.height).toBe(600);
    expect(result.originalSize).toBe(1000);
    expect(result.compressedSize).toBe(500000);
    expect(qualities).toEqual([0.7]);
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:test-image');
  });

  it('reduces quality until output is under 2MB', async () => {
    blobSizes = [3000000, 2600000, 1800000];
    const file = new File([new Uint8Array(100)], 'large.jpg', { type: 'image/jpeg' });
    const result = await compressImage(file);
    expect(qualities).toEqual([0.7, 0.6, 0.5]);
    expect(result.compressedSize).toBe(1800000);
  });

  it('stops quality fallback at 0.3 even when still over 2MB', async () => {
    blobSizes = [3000000, 2900000, 2800000, 2700000, 2600000];
    const file = new File([new Uint8Array(100)], 'huge.jpg', { type: 'image/jpeg' });
    const result = await compressImage(file);
    expect(qualities).toEqual([0.7, 0.6, 0.5, 0.4, 0.3]);
    expect(result.compressedSize).toBe(2600000);
  });
});
