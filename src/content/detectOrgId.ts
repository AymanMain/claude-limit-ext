const UUID_RE = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi;

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

export function detectOrgIdCandidates(): string[] {
  const all = [
    ...scanFromUrl(),
    ...scanFromScripts(),
    ...scanFromLinks(),
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
