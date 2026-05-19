import { normalizeUsageResponse } from '../core/normalizeUsage';
import type { ClaudeUsageState } from '../core/usageModel';
import { ProviderError } from '../shared/errors';
import { USAGE_ENDPOINT } from '../shared/constants';

export async function fetchUsage(orgId: string): Promise<ClaudeUsageState> {
  let response: Response;
  try {
    response = await fetch(USAGE_ENDPOINT(orgId), {
      method: 'GET',
      credentials: 'include',
      headers: { accept: 'application/json' },
    });
  } catch (err) {
    throw new ProviderError('NETWORK_ERROR', `Network request failed: ${String(err)}`);
  }

  if (response.status === 401 || response.status === 403) {
    throw new ProviderError('AUTH_FAILED', `HTTP ${response.status}: Authentication required`);
  }

  if (!response.ok) {
    throw new ProviderError('NETWORK_ERROR', `HTTP ${response.status}`);
  }

  let body: unknown;
  try {
    body = await response.json();
  } catch {
    throw new ProviderError('INVALID_RESPONSE', 'Response is not valid JSON');
  }

  return normalizeUsageResponse(body, response.status);
}
