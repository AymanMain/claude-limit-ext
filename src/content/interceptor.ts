export {};

const ORG_PATS = [
  /\/api\/organizations\/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/i,
  /\/api\/bootstrap\/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})\/current_user_access/i,
];

declare global {
  interface Window {
    __claudeOrgInterceptInstalled?: boolean;
  }
}

if (!window.__claudeOrgInterceptInstalled) {
  window.__claudeOrgInterceptInstalled = true;
  const orig = window.fetch;
  window.fetch = function (input, init) {
    const url =
      typeof input === 'string'
        ? input
        : input instanceof URL
          ? input.href
          : (input as Request).url ?? '';
    for (const pat of ORG_PATS) {
      const m = url.match(pat);
      if (m) {
        window.postMessage({ __claudeOrgId: m[1] }, '*');
        break;
      }
    }
    return orig.call(this, input as RequestInfo, init);
  };
}
