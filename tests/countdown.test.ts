import { describe, it, expect, vi, afterEach } from 'vitest';
import { msUntilReset, formatCountdown, formatResetDay } from '../src/core/countdown';

afterEach(() => vi.useRealTimers());

describe('msUntilReset', () => {
  it('returns 0 for null', () => {
    expect(msUntilReset(null)).toBe(0);
  });

  it('returns 0 for past timestamps', () => {
    const past = new Date(Date.now() - 10_000).toISOString();
    expect(msUntilReset(past)).toBe(0);
  });

  it('returns ms remaining for future timestamp', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-05-19T10:00:00Z'));
    const future = '2026-05-19T10:05:00Z';
    expect(msUntilReset(future)).toBe(5 * 60 * 1000);
  });
});

describe('formatCountdown', () => {
  it('formats minutes under 60', () => {
    expect(formatCountdown(30 * 60 * 1000)).toBe('30m');
    expect(formatCountdown(1 * 60 * 1000)).toBe('1m');
  });

  it('formats hours and minutes', () => {
    expect(formatCountdown(90 * 60 * 1000)).toBe('1h 30m');
    expect(formatCountdown(120 * 60 * 1000)).toBe('2h');
  });

  it('returns 0m for zero ms', () => {
    expect(formatCountdown(0)).toBe('0m');
  });

  it('rounds up partial minutes', () => {
    expect(formatCountdown(30_001)).toBe('1m');
  });
});

describe('formatResetDay', () => {
  it('returns — for null', () => {
    expect(formatResetDay(null)).toBe('—');
  });

  it('returns day + time for valid ISO string', () => {
    // Thursday 2026-05-21T03:00:00Z
    const result = formatResetDay('2026-05-21T03:00:00Z');
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(3);
  });
});
