import type { v1 } from '@raisin/api-contracts';

export const accountFixtures: v1.AccountList = [
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
  {
    id: 'd2f0a4b6-9e87-4c12-aab1-2f6c3d4e5f60',
    iban: 'FR1420041010050500013M02606',
    holder: 'Grace Hopper',
    balance: 30421.0,
    currency: 'EUR',
    openedAt: '2022-11-20T08:00:00.000Z',
  },
];
