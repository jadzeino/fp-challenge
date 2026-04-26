import { AccountSchema, AccountListSchema, type Account } from '../v1/account';

// Inline fixtures - duplicated intentionally (and tested) so api-contracts
// has no dev-dep on @raisin/testing (which itself depends on api-contracts).
// @raisin/testing reuses the same shape; that file doubles as proof both
// match.
const accountFixtures: readonly Account[] = [
  {
    id: 'a4d6f2e0-1c9b-4f3a-8a91-7b3e5b1e9c10',
    iban: 'DE89370400440532013000',
    holder: 'Ada Lovelace',
    balance: 12450.5,
    currency: 'EUR',
    openedAt: '2023-04-12T09:30:00.000Z',
  },
  {
    id: 'b1c0e8d2-3a44-4b8d-9b2e-cd9f1f5b0c22',
    iban: 'GB29NWBK60161331926819',
    holder: 'Alan Turing',
    balance: 8742.13,
    currency: 'GBP',
    openedAt: '2024-01-08T14:15:00.000Z',
  },
];

describe('v1.AccountSchema', () => {
  test('parses canonical fixtures', () => {
    accountFixtures.forEach((fixture) => {
      const result = AccountSchema.safeParse(fixture);
      expect(result.success).toBe(true);
    });
  });

  test('parses the full fixture list', () => {
    const result = AccountListSchema.safeParse(accountFixtures);
    expect(result.success).toBe(true);
  });

  test('rejects an unknown currency', () => {
    const bad = { ...accountFixtures[0], currency: 'XYZ' };
    expect(AccountSchema.safeParse(bad).success).toBe(false);
  });

  test('rejects a malformed IBAN', () => {
    const bad = { ...accountFixtures[0], iban: 'not-an-iban' };
    expect(AccountSchema.safeParse(bad).success).toBe(false);
  });

  test('rejects a non-UUID id', () => {
    const bad = { ...accountFixtures[0], id: '123' };
    expect(AccountSchema.safeParse(bad).success).toBe(false);
  });

  test('rejects a non-finite balance', () => {
    const bad = { ...accountFixtures[0], balance: Number.POSITIVE_INFINITY };
    expect(AccountSchema.safeParse(bad).success).toBe(false);
  });

  test('rejects a non-ISO openedAt', () => {
    const bad = { ...accountFixtures[0], openedAt: '2024/01/01' };
    expect(AccountSchema.safeParse(bad).success).toBe(false);
  });

  test('rejects an empty holder name', () => {
    const bad = { ...accountFixtures[0], holder: '' };
    expect(AccountSchema.safeParse(bad).success).toBe(false);
  });
});
