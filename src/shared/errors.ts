export type ProviderErrorCode = 'AUTH_FAILED' | 'NETWORK_ERROR' | 'INVALID_RESPONSE' | 'NO_ORG_ID';

export class ProviderError extends Error {
  constructor(
    public readonly code: ProviderErrorCode,
    message: string,
  ) {
    super(message);
    this.name = 'ProviderError';
  }
}
