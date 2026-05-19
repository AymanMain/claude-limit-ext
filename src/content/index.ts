import { detectOrgIdCandidates, validateOrgId, extractOrgIdFromUrl } from './detectOrgId';

// Injected into page context to intercept fetch calls before the SPA makes them.
// Uses postMessage to pass org IDs back to content script context.
const PAGE_SCRIPT = `(function() {
  if (window.__claudeOrgInterceptInstalled) return;
  window.__claudeOrgInterceptInstalled = true;
  var UUID_PAT = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;
  var ORG_PATS = [
    /\\/api\\/organizations\\/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/i,
    /\\/api\\/bootstrap\\/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})\\/current_user_access/i,
  ];
  const orig = window.fetch;
  window.fetch = function(input) {
    var url = typeof input === 'string' ? input : (input instanceof URL ? input.href : (input && input.url) || '');
    for (var i = 0; i < ORG_PATS.length; i++) {
      var m = url.match(ORG_PATS[i]);
      if (m) { window.postMessage({ __claudeOrgId: m[1] }, '*'); break; }
    }
    return orig.apply(this, arguments);
  };
})();`;

function injectPageScript(): void {
  const s = document.createElement('script');
  s.textContent = PAGE_SCRIPT;
  (document.head || document.documentElement).appendChild(s);
  s.remove();
}

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

// Inject intercept immediately, then try passive detection after load
injectPageScript();

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => setTimeout(tryDetect, 1500));
} else {
  setTimeout(tryDetect, 1500);
}
