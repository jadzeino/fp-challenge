import type { z } from 'zod';
import { apiError, type ApiClientOptions, type ApiError } from './types';

const defaultRequestId = (): string => Math.random().toString(36).slice(2, 10);

export interface RequestArgs<T> {
  resource: string;
  path: string;
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
  schema: z.ZodType<T>;
}

export const createRequest = (opts: ApiClientOptions) => {
  const { baseUrl, auth, fetchImpl = fetch, requestId = defaultRequestId, onError } = opts;

  const callOnce = async <T>(
    args: RequestArgs<T>,
    rid: string,
    forceRefresh: boolean,
  ): Promise<{ res: Response; raw: unknown }> => {
    const token = forceRefresh
      ? await auth.refreshIfExpiring(Number.POSITIVE_INFINITY)
      : await auth.refreshIfExpiring();

    const headers: Record<string, string> = {
      Accept: 'application/json',
      'X-Request-ID': rid,
    };
    if (token) headers.Authorization = `Bearer ${token}`;
    if (args.body !== undefined) headers['Content-Type'] = 'application/json';

    const res = await fetchImpl(`${baseUrl}${args.path}`, {
      method: args.method ?? 'GET',
      headers,
      body: args.body !== undefined ? JSON.stringify(args.body) : undefined,
    });

    const text = await res.text();
    const raw: unknown = text ? JSON.parse(text) : null;
    return { res, raw };
  };

  return async <T>(args: RequestArgs<T>): Promise<T> => {
    const rid = requestId();
    let attempt: { res: Response; raw: unknown };
    try {
      attempt = await callOnce(args, rid, false);
      // Single retry on 401 with a forced token refresh — covers the
      // common case of a token expiring between refreshIfExpiring and
      // the actual request landing at the API.
      if (attempt.res.status === 401) {
        attempt = await callOnce(args, rid, true);
      }
    } catch (cause) {
      const err = apiError('network error', args.resource, rid, undefined, cause);
      onError?.(err);
      throw err;
    }

    if (!attempt.res.ok) {
      const err = apiError(
        `request failed (${attempt.res.status})`,
        args.resource,
        rid,
        attempt.res.status,
      );
      onError?.(err);
      throw err;
    }

    const parsed = args.schema.safeParse(attempt.raw);
    if (!parsed.success) {
      const err: ApiError = apiError(
        'response failed contract validation',
        args.resource,
        rid,
        attempt.res.status,
        parsed.error,
      );
      onError?.(err);
      throw err;
    }
    return parsed.data;
  };
};
