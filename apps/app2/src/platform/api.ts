import { createApiClient, type ApiClient } from '@raisin/api-client';
import { createAuthClient, createDefaultStorage, type AuthClient } from '@raisin/auth-client';
import { logger } from '@raisin/observability';

let _auth: AuthClient | null = null;
let _api: ApiClient | null = null;

const APP_NAME = 'app2';

export const getAuth = (): AuthClient => {
  if (!_auth) {
    // Default storage is localStorage in the browser - same key as app1,
    // so the session is shared across zones once the gateway lands.
    _auth = createAuthClient({ storage: createDefaultStorage(), mode: 'demo' });
  }
  return _auth;
};

export const getApi = (): ApiClient => {
  if (!_api) {
    _api = createApiClient({
      baseUrl: process.env.NEXT_PUBLIC_API_BASE_URL ?? '/api',
      auth: getAuth(),
      onError: (err) =>
        logger.error('api_request_failed', err, {
          app: APP_NAME,
          resource: err.resource,
          status: err.status,
          requestId: err.requestId,
        }),
    });
  }
  return _api;
};
