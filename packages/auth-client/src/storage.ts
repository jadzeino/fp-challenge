import type { AuthSession, AuthStorage } from './types';

const LS_KEY = 'raisin.auth.session';

type Listener = (session: AuthSession | null) => void;

const isBrowser = (): boolean => typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';

export const createMemoryStorage = (): AuthStorage => {
  let session: AuthSession | null = null;
  const listeners = new Set<Listener>();
  return {
    get: () => session,
    set: (next) => {
      session = next;
      listeners.forEach((l) => l(next));
    },
    subscribe: (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
  };
};

export const createLocalStorageStorage = (): AuthStorage => {
  const memory = createMemoryStorage();
  // Hydrate from localStorage on construction.
  if (isBrowser()) {
    const raw = window.localStorage.getItem(LS_KEY);
    if (raw) {
      try {
        memory.set(JSON.parse(raw) as AuthSession);
      } catch {
        window.localStorage.removeItem(LS_KEY);
      }
    }
    // Cross-tab sync: listen to storage events from other tabs.
    window.addEventListener('storage', (e) => {
      if (e.key !== LS_KEY) return;
      memory.set(e.newValue ? (JSON.parse(e.newValue) as AuthSession) : null);
    });
  }
  return {
    get: memory.get,
    set: (next) => {
      memory.set(next);
      if (!isBrowser()) return;
      if (next) {
        window.localStorage.setItem(LS_KEY, JSON.stringify(next));
      } else {
        window.localStorage.removeItem(LS_KEY);
      }
    },
    subscribe: memory.subscribe,
  };
};

/**
 * Auto-selects localStorage in the browser, memory on the server.
 * This is what most apps want; SSR safety is handled transparently.
 */
export const createDefaultStorage = (): AuthStorage =>
  (isBrowser() ? createLocalStorageStorage() : createMemoryStorage());
