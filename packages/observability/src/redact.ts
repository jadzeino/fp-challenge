/**
 * Best-effort PII redaction for structured logs. Walks the value
 * recursively; replaces known sensitive keys with the literal string
 * "[REDACTED]". Idempotent and safe on circular references.
 *
 * The list is intentionally conservative for fintech: anything that
 * could leak a customer's identity, money, or session is redacted by
 * default. Apps can extend the list via `redact(value, extraKeys)`.
 */
const DEFAULT_SENSITIVE_KEYS: ReadonlySet<string> = new Set([
  'token',
  'access_token',
  'accesstoken',
  'refresh_token',
  'refreshtoken',
  'authorization',
  'cookie',
  'set-cookie',
  'password',
  'secret',
  'api_key',
  'apikey',
  'iban',
  'bic',
  'card',
  'cardnumber',
  'cvv',
  'ssn',
  'tax_id',
  'taxid',
  'email',
  'phone',
  'dob',
  'birthdate',
]);

const REDACTED = '[REDACTED]';

const isPlainObject = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v);

export const redact = <T>(value: T, extraKeys: Iterable<string> = []): T => {
  const seen = new WeakSet<object>();
  const blocked = new Set<string>([...DEFAULT_SENSITIVE_KEYS]);
  for (const k of extraKeys) blocked.add(k.toLowerCase());

  const walk = (input: unknown): unknown => {
    if (Array.isArray(input)) return input.map(walk);
    if (!isPlainObject(input)) return input;
    if (seen.has(input)) return '[Circular]';
    seen.add(input);
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(input)) {
      out[k] = blocked.has(k.toLowerCase()) ? REDACTED : walk(v);
    }
    return out;
  };

  return walk(value) as T;
};
