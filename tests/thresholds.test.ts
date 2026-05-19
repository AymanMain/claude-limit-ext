import { describe, it, expect } from 'vitest';
import { getSeverity, getBadgeColor, isWeeklyDanger, isSessionCritical } from '../src/core/thresholds';

describe('getSeverity', () => {
  it('returns critical when sevenDay >= 95', () => {
    expect(getSeverity(40, 95)).toBe('critical');
    expect(getSeverity(40, 100)).toBe('critical');
  });

  it('returns critical when fiveHour >= 95', () => {
    expect(getSeverity(95, 40)).toBe('critical');
    expect(getSeverity(100, 0)).toBe('critical');
  });

  it('returns high when fiveHour >= 90 and < 95', () => {
    expect(getSeverity(90, 40)).toBe('high');
    expect(getSeverity(93, 40)).toBe('high');
  });

  it('returns warning when fiveHour >= 75 and < 90', () => {
    expect(getSeverity(75, 40)).toBe('warning');
    expect(getSeverity(85, 40)).toBe('warning');
  });

  it('returns warning when sevenDay >= 80', () => {
    expect(getSeverity(40, 80)).toBe('warning');
    expect(getSeverity(40, 90)).toBe('warning');
  });

  it('returns safe otherwise', () => {
    expect(getSeverity(50, 50)).toBe('safe');
    expect(getSeverity(null, null)).toBe('safe');
    expect(getSeverity(0, 0)).toBe('safe');
  });
});

describe('getBadgeColor', () => {
  it('returns red for critical/high', () => {
    expect(getBadgeColor('critical')).toBe('#ef4444');
    expect(getBadgeColor('high')).toBe('#ef4444');
  });

  it('returns orange for warning', () => {
    expect(getBadgeColor('warning')).toBe('#f97316');
  });

  it('returns green for safe', () => {
    expect(getBadgeColor('safe')).toBe('#22c55e');
  });
});

describe('isWeeklyDanger', () => {
  it('true when >= 95', () => {
    expect(isWeeklyDanger(95)).toBe(true);
    expect(isWeeklyDanger(100)).toBe(true);
  });

  it('false when < 95 or null', () => {
    expect(isWeeklyDanger(94)).toBe(false);
    expect(isWeeklyDanger(null)).toBe(false);
  });
});

describe('isSessionCritical', () => {
  it('true when >= 95', () => {
    expect(isSessionCritical(95)).toBe(true);
  });

  it('false when < 95 or null', () => {
    expect(isSessionCritical(94)).toBe(false);
    expect(isSessionCritical(null)).toBe(false);
  });
});
