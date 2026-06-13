import { useState } from 'react';
import { decryptData, LENDSWIFT_PASSPHRASE } from '../utils/encryption';

const META_PREFIX = 'lendswift_draft_meta_';
const DRAFT_PREFIX = 'lendswift_draft_';
const MAX_DRAFT_AGE_MS = 72 * 60 * 60 * 1000;

function storageSuffix(loanType) {
  return loanType || 'unknown';
}

export function clearDraft(loanType) {
  const suffix = storageSuffix(loanType);
  localStorage.removeItem(`${DRAFT_PREFIX}${suffix}`);
  localStorage.removeItem(`${META_PREFIX}${suffix}`);
}

function inspectSavedDrafts() {
  const validDrafts = [];
  const now = Date.now();

  const metadataKeys = Array.from(
    { length: localStorage.length },
    (_, index) => localStorage.key(index),
  ).filter((key) => key?.startsWith(META_PREFIX));

  metadataKeys.forEach((key) => {
    const suffix = key.slice(META_PREFIX.length);
    try {
      const metadata = JSON.parse(localStorage.getItem(key));
      const timestamp = new Date(metadata.timestamp).getTime();
      if (!Number.isFinite(timestamp) || now - timestamp > MAX_DRAFT_AGE_MS) {
        localStorage.removeItem(key);
        localStorage.removeItem(`${DRAFT_PREFIX}${suffix}`);
      } else {
        validDrafts.push(metadata);
      }
    } catch {
      localStorage.removeItem(key);
      localStorage.removeItem(`${DRAFT_PREFIX}${suffix}`);
    }
  });

  if (validDrafts.length === 0) return { hasSavedDraft: false, draftMeta: null };
  validDrafts.sort((left, right) => new Date(right.timestamp) - new Date(left.timestamp));
  return { hasSavedDraft: true, draftMeta: validDrafts[0] };
}

function hasValidDraftShape(value) {
  return value
    && typeof value === 'object'
    && value.formData
    && typeof value.formData === 'object'
    && Object.hasOwn(value, 'currentStepId')
    && typeof value.currentStepId === 'string'
    && Object.hasOwn(value, 'loanType');
}

export async function resumeDraft(loanType) {
  const suffix = storageSuffix(loanType);
  try {
    const encrypted = localStorage.getItem(`${DRAFT_PREFIX}${suffix}`);
    if (!encrypted) return null;
    const plaintext = await decryptData(encrypted, LENDSWIFT_PASSPHRASE);
    const parsed = JSON.parse(plaintext);
    if (!hasValidDraftShape(parsed)) throw new Error('Draft shape is invalid');
    return parsed;
  } catch {
    clearDraft(loanType);
    return null;
  }
}

export default function useFormPersistence() {
  const [initialState] = useState(inspectSavedDrafts);
  return initialState;
}
