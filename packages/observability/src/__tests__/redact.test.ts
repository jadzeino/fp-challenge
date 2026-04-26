import { redact } from '../redact';

describe('redact', () => {
  test('redacts known sensitive keys at any depth', () => {
    const out = redact({
      user: { email: 'a@b.com', name: 'Ada' },
      session: { token: 'abc.def.ghi', expiresAt: 123 },
      account: { iban: 'DE89370400440532013000', balance: 100, currency: 'EUR' },
    });
    expect(out).toEqual({
      user: { email: '[REDACTED]', name: 'Ada' },
      session: { token: '[REDACTED]', expiresAt: 123 },
      account: { iban: '[REDACTED]', balance: 100, currency: 'EUR' },
    });
  });

  test('case-insensitive on key names', () => {
    const out = redact({ Authorization: 'Bearer xyz', 'Set-Cookie': 'foo=bar' });
    expect(out).toEqual({ Authorization: '[REDACTED]', 'Set-Cookie': '[REDACTED]' });
  });

  test('walks arrays', () => {
    const out = redact({ items: [{ token: 't1' }, { token: 't2' }] });
    expect(out).toEqual({ items: [{ token: '[REDACTED]' }, { token: '[REDACTED]' }] });
  });

  test('handles circular references safely', () => {
    const obj: Record<string, unknown> = { name: 'loop' };
    obj.self = obj;
    expect(() => redact(obj)).not.toThrow();
    const out = redact(obj) as Record<string, unknown>;
    expect(out.name).toBe('loop');
    expect(out.self).toBe('[Circular]');
  });

  test('accepts extra keys', () => {
    const out = redact({ kyc_id: 'foo', other: 'bar' }, ['kyc_id']);
    expect(out).toEqual({ kyc_id: '[REDACTED]', other: 'bar' });
  });
});
