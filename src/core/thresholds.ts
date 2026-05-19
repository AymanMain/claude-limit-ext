import type { Severity } from './usageModel';

export function getSeverity(fiveHour: number | null, sevenDay: number | null): Severity {
  if (sevenDay !== null && sevenDay >= 95) return 'critical';
  if (fiveHour !== null && fiveHour >= 95) return 'critical';
  if (fiveHour !== null && fiveHour >= 90) return 'high';
  if (fiveHour !== null && fiveHour >= 75) return 'warning';
  if (sevenDay !== null && sevenDay >= 80) return 'warning';
  return 'safe';
}

export function getBadgeColor(severity: Severity): string {
  switch (severity) {
    case 'critical':
    case 'high':
      return '#ef4444';
    case 'warning':
      return '#f97316';
    case 'safe':
      return '#22c55e';
  }
}

export function isWeeklyDanger(sevenDay: number | null): boolean {
  return sevenDay !== null && sevenDay >= 95;
}

export function isSessionCritical(fiveHour: number | null): boolean {
  return fiveHour !== null && fiveHour >= 95;
}
