export function msUntilReset(resetsAt: string | null): number {
  if (!resetsAt) return 0;
  return Math.max(0, new Date(resetsAt).getTime() - Date.now());
}

export function formatCountdown(ms: number): string {
  if (ms <= 0) return '0m';
  const mins = Math.ceil(ms / 60_000);
  if (mins < 60) return `${mins}m`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

export function formatResetDay(resetsAt: string | null): string {
  if (!resetsAt) return '—';
  const d = new Date(resetsAt);
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const time = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  return `${days[d.getDay()]} ${time}`;
}
