const UUID_RE = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi;
const ORG_PATH_RES = [
  /\/api\/organizations\/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/i,
  /\/api\/bootstrap\/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})\/current_user_access/i,
];

function extractUUIDs(text: string): string[] {
  return [...new Set(text.match(UUID_RE) ?? [])];
}

function scanFromUrl(): string[] {
  return extractUUIDs(location.href);
}

function scanFromScripts(): string[] {
  const uuids: string[] = [];
  for (const s of document.querySelectorAll('script')) {
    if (s.src) uuids.push(...extractUUIDs(s.src));
    if (s.textContent) uuids.push(...extractUUIDs(s.textContent));
  }
  return [...new Set(uuids)];
}

function scanFromLinks(): string[] {
  const uuids: string[] = [];
  for (const a of document.querySelectorAll('a[href]')) {
    uuids.push(...extractUUIDs((a as HTMLAnchorElement).href));
  }
  return [...new Set(uuids)];
}

function scanFromMeta(): string[] {
  const uuids: string[] = [];
  for (const m of document.querySelectorAll('meta[content]')) {
    uuids.push(...extractUUIDs(m.getAttribute('content') ?? ''));
  }
  return [...new Set(uuids)];
}

function scanFromStorage(): string[] {
  const uuids: string[] = [];
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key) continue;
      uuids.push(...extractUUIDs(localStorage.getItem(key) ?? ''));
    }
  } catch {
    // localStorage inaccessible in restricted browsing contexts
  }
  try {
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i);
      if (!key) continue;
      uuids.push(...extractUUIDs(sessionStorage.getItem(key) ?? ''));
    }
  } catch {
    // sessionStorage inaccessible in restricted browsing contexts
  }
  return [...new Set(uuids)];
}

function scanFromWindowData(): string[] {
  const uuids: string[] = [];
  try {
    const nextData = (window as unknown as Record<string, unknown>).__NEXT_DATA__;
    if (nextData) uuids.push(...extractUUIDs(JSON.stringify(nextData)));
  } catch {
    // __NEXT_DATA__ access may throw in sandboxed contexts
  }
  return [...new Set(uuids)];
}

export function detectOrgIdCandidates(): string[] {
  const all = [
    ...scanFromUrl(),
    ...scanFromStorage(),
    ...scanFromWindowData(),
    ...scanFromLinks(),
    ...scanFromScripts(),
    ...scanFromMeta(),
  ];
  return [...new Set(all)];
}

export async function validateOrgId(orgId: string): Promise<boolean> {
  try {
    const res = await fetch(`https://claude.ai/api/organizations/${orgId}/usage`, {
      method: 'GET',
      credentials: 'include',
      headers: { accept: 'application/json' },
    });
    if (!res.ok) return false;
    const body = await res.json();
    return (
      typeof body === 'object' &&
      body !== null &&
      ('five_hour' in body || 'seven_day' in body)
    );
  } catch {
    return false;
  }
}

export function extractOrgIdFromUrl(url: string): string | null {
  for (const re of ORG_PATH_RES) {
    const m = url.match(re);
    if (m) return m[1];
  }
  return null;
}
