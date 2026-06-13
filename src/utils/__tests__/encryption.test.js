import { describe, expect, it } from 'vitest';
import {
  decryptData,
  encryptData,
  LENDSWIFT_PASSPHRASE,
} from '../encryption';

describe('encryption utilities', () => {
  it('round-trips plaintext through AES-GCM encryption', async () => {
    const plaintext = JSON.stringify({ applicant: 'Aarav', step: 'address' });
    const encrypted = await encryptData(plaintext, LENDSWIFT_PASSPHRASE);

    expect(encrypted).not.toContain('Aarav');
    await expect(decryptData(encrypted, LENDSWIFT_PASSPHRASE)).resolves.toBe(plaintext);
  });

  it('rejects tampered ciphertext', async () => {
    const encrypted = await encryptData('sensitive draft', LENDSWIFT_PASSPHRASE);
    const replacement = encrypted.at(-1) === 'A' ? 'B' : 'A';
    const tampered = `${encrypted.slice(0, -1)}${replacement}`;

    await expect(decryptData(tampered, LENDSWIFT_PASSPHRASE)).rejects.toThrow();
  });

  it('produces different ciphertext for the same plaintext using random IVs', async () => {
    const first = await encryptData('same value', LENDSWIFT_PASSPHRASE);
    const second = await encryptData('same value', LENDSWIFT_PASSPHRASE);

    expect(first).not.toBe(second);
    await expect(decryptData(first, LENDSWIFT_PASSPHRASE)).resolves.toBe('same value');
    await expect(decryptData(second, LENDSWIFT_PASSPHRASE)).resolves.toBe('same value');
  });

  it('rejects decryption with the wrong passphrase', async () => {
    const encrypted = await encryptData('draft', LENDSWIFT_PASSPHRASE);
    await expect(decryptData(encrypted, 'wrong-passphrase')).rejects.toThrow();
  });
});
