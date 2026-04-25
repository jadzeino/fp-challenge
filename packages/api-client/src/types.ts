import type { AuthClient } from '@raisin/auth-client';

export interface ApiClientOptions {
  baseUrl: string;
  auth: AuthClient;
  /** Override fetch (for tests, server-side). Defaults to global fetch. */
  fetchImpl?: typeof fetch;
  /** Generator for X-Request-ID. Defaults to a short random string. */
  requestId?: () => string;
  /** Optional hook called on every request error; used by observability. */
  onError?: (err: ApiError) => void;
}

export interface ApiError extends Error {
  status?: number;
  resource: string;
  requestId: string;
  cause?: unknown;
}

export const apiError = (
  message: string,
  resource: string,
  requestId: string,
  status?: number,
  cause?: unknown,
): ApiError => Object.assign(new Error(message), { resource, requestId, status, cause });
