import { v1 } from '@raisin/api-contracts';
import type { createRequest } from '../request';

export interface AccountsResource {
  list(): Promise<v1.AccountList>;
}

export const createAccountsResource = (
  request: ReturnType<typeof createRequest>,
): AccountsResource => ({
  list: () =>
    request({
      resource: 'accounts.list',
      path: '/v1/accounts',
      schema: v1.AccountListSchema,
    }),
});
