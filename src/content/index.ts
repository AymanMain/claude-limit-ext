import { detectOrgIdCandidates, validateOrgId, extractOrgIdFromUrl } from './detectOrgId';

let savedOrgId: string | null = null;

async function saveOrgId(orgId: string): Promise<void> {
  if (savedOrgId === orgId) return;
  savedOrgId = orgId;
  chrome.runtime.sendMessage({ type: 'ORG_ID_DETECTED', orgId });
}

async function tryDetect(): Promise<void> {
  const candidates = detectOrgIdCandidates();
  for (const candidate of candidates) {
    const valid = await validateOrgId(candidate);
    if (valid) {
      await saveOrgId(candidate);
      return;
    }
  }
}

// Listen for org IDs intercepted from the page's own fetch calls
window.addEventListener('message', (e) => {
  if (e.source !== window) return;
  const orgId = e.data?.__claudeOrgId;
  if (typeof orgId === 'string' && orgId.length === 36) {
    saveOrgId(orgId);
  }
});

// Also catch org ID from any URL the content script itself can see
document.addEventListener('click', () => {
  const fromUrl = extractOrgIdFromUrl(location.href);
  if (fromUrl) saveOrgId(fromUrl);
}, { capture: true, passive: true });

chrome.runtime.onMessage.addListener((msg: { type: string }) => {
  if (msg.type === 'DETECT_ORG_ID') {
    tryDetect();
  }
});

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => setTimeout(tryDetect, 1500));
} else {
  setTimeout(tryDetect, 1500);
}
