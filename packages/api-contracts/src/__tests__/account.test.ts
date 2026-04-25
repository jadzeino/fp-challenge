import { AccountSchema, AccountListSchema } from '../v1/account';
import { accountFixtures } from '@raisin/testing';

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
