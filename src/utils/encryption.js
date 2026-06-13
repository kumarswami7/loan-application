// The project specification uses an application passphrase. Production should
// derive this from user/session credentials and use a unique per-user salt.
export const LENDSWIFT_PASSPHRASE = 'lendswift-auto-save-v1';

const FIXED_SALT = new Uint8Array([
  76, 101, 110, 100, 83, 119, 105, 102,
  116, 68, 114, 97, 102, 116, 86, 49,
]);
const IV_LENGTH = 12;

function bytesToBase64(bytes) {
  let binary = '';
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary);
}

function base64ToBytes(value) {
  const binary = atob(value);
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}

async function deriveEncryptionKey(passphrase) {
  const material = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(passphrase),
    'PBKDF2',
    false,
    ['deriveKey'],
  );

  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: FIXED_SALT,
      iterations: 100000,
      hash: 'SHA-256',
    },
    material,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt'],
  );
}

export async function encryptData(plaintext, passphrase) {
  const key = await deriveEncryptionKey(passphrase);
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));
  const ciphertext = new Uint8Array(await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    new TextEncoder().encode(plaintext),
  ));
  const combined = new Uint8Array(iv.length + ciphertext.length);
  combined.set(iv);
  combined.set(ciphertext, iv.length);
  return bytesToBase64(combined);
}

export async function decryptData(encryptedBase64, passphrase) {
  const combined = base64ToBytes(encryptedBase64);
  if (combined.length <= IV_LENGTH) throw new Error('Encrypted data is invalid');

  const key = await deriveEncryptionKey(passphrase);
  const plaintext = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: combined.slice(0, IV_LENGTH) },
    key,
    combined.slice(IV_LENGTH),
  );
  return new TextDecoder().decode(plaintext);
}
