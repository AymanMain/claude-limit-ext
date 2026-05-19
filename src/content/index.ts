import { detectOrgIdCandidates, validateOrgId } from './detectOrgId';

async function tryDetect(): Promise<void> {
  const candidates = detectOrgIdCandidates();
  for (const candidate of candidates) {
    const valid = await validateOrgId(candidate);
    if (valid) {
      chrome.runtime.sendMessage({ type: 'ORG_ID_DETECTED', orgId: candidate });
      return;
    }
  }
}

chrome.runtime.onMessage.addListener((msg: { type: string }) => {
  if (msg.type === 'DETECT_ORG_ID') {
    tryDetect();
  }
});

// Try passively on page load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => setTimeout(tryDetect, 2000));
} else {
  setTimeout(tryDetect, 2000);
}
