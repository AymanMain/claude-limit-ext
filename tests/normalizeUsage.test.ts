import { describe, it, expect } from 'vitest';
import { normalizeUsageResponse, getResponseShape } from '../src/core/normalizeUsage';
import { ProviderError } from '../src/shared/errors';

describe('normalizeUsageResponse', () => {
  it('normalizes a full valid response', () => {
    const raw = {
      five_hour: { utilization: 64, resets_at: '2026-05-19T10:50:00.000Z' },
      seven_day: { utilization: 40, resets_at: '2026-05-21T03:00:00.000Z' },
      extra_usage: {
        is_enabled: false,
        monthly_limit: null,
        used_credits: null,
        utilization: null,
        currency: null,
      },
    };

    const result = normalizeUsageResponse(raw, 200);

    expect(result.fiveHour.utilization).toBe(64);
    expect(result.fiveHour.resetsAt).toBe('2026-05-19T10:50:00.000Z');
    expect(result.sevenDay.utilization).toBe(40);
    expect(result.sevenDay.resetsAt).toBe('2026-05-21T03:00:00.000Z');
    expect(result.extraUsage.enabled).toBe(false);
    expect(result.source).toBe('web-api');
    expect(result.lastStatusCode).toBe(200);
    expect(result.lastError).toBeNull();
  });

  it('handles null utilization fields', () => {
    const raw = {
      five_hour: { utilization: null, resets_at: null },
      seven_day: { utilization: null, resets_at: null },
    };
    const result = normalizeUsageResponse(raw, 200);
    expect(result.fiveHour.utilization).toBeNull();
    expect(result.sevenDay.utilization).toBeNull();
  });

  it('handles missing extra_usage', () => {
    const raw = {
      five_hour: { utilization: 50, resets_at: null },
      seven_day: { utilization: 20, resets_at: null },
    };
    const result = normalizeUsageResponse(raw, 200);
    expect(result.extraUsage.enabled).toBe(false);
    expect(result.extraUsage.utilization).toBeNull();
  });

  it('throws on non-object response', () => {
    expect(() => normalizeUsageResponse('string', 200)).toThrow(ProviderError);
    expect(() => normalizeUsageResponse(null, 200)).toThrow(ProviderError);
    expect(() => normalizeUsageResponse(42, 200)).toThrow(ProviderError);
  });

  it('throws when expected fields are missing', () => {
    expect(() => normalizeUsageResponse({ other: true }, 200)).toThrow(ProviderError);
  });
});

describe('getResponseShape', () => {
  it('returns correct shape flags', () => {
    const raw = { five_hour: {}, seven_day: {}, extra_usage: {} };
    const shape = getResponseShape(raw);
    expect(shape.five_hour).toBe(true);
    expect(shape.seven_day).toBe(true);
    expect(shape.extra_usage).toBe(true);
  });

  it('returns false for missing keys', () => {
    const shape = getResponseShape({ five_hour: {} });
    expect(shape.seven_day).toBe(false);
    expect(shape.extra_usage).toBe(false);
  });
});
