import { createRequest } from './request';
import { createAccountsResource, type AccountsResource } from './resources/accounts';
import type { ApiClientOptions } from './types';

export interface ApiClient {
  accounts: AccountsResource;
}

export const createApiClient = (opts: ApiClientOptions): ApiClient => {
  const request = createRequest(opts);
  return {
    accounts: createAccountsResource(request),
  };
};
