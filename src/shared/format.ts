export function formatAgo(isoString: string | null): string {
  if (!isoString) return 'never';
  const ms = Date.now() - new Date(isoString).getTime();
  const mins = Math.floor(ms / 60_000);
  if (mins < 1) return 'just now';
  if (mins === 1) return '1m ago';
  if (mins < 60) return `${mins}m ago`;
  const h = Math.floor(mins / 60);
  return `${h}h ago`;
}

export function formatPct(n: number | null): string {
  if (n === null) return '—';
  return `${Math.round(n)}%`;
}

export function formatDay(isoString: string | null): string {
  if (!isoString) return '—';
  const d = new Date(isoString);
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const time = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  return `${days[d.getDay()]} ${time}`;
}
