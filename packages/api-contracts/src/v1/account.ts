import { z } from 'zod';

export const CurrencyCodeSchema = z.enum(['EUR', 'GBP', 'USD']);
export type CurrencyCode = z.infer<typeof CurrencyCodeSchema>;

export const AccountSchema = z.object({
  id: z.string().uuid(),
  iban: z
    .string()
    .min(15)
    .max(34)
    .regex(/^[A-Z]{2}[0-9]{2}[A-Z0-9]+$/, 'IBAN must start with two letters, two digits, then alphanumerics'),
  holder: z.string().min(1).max(120),
  balance: z.number().finite(),
  currency: CurrencyCodeSchema,
  openedAt: z.string().datetime(),
});
export type Account = z.infer<typeof AccountSchema>;

export const AccountListSchema = z.array(AccountSchema);
export type AccountList = z.infer<typeof AccountListSchema>;
