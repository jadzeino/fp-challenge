import { createConsoleProvider } from './console-provider';
import { redact } from './redact';
import type {
  InitObservabilityOptions,
  LogContext,
  LogLevel,
  Logger,
  ObservabilityProvider,
} from './types';

let activeProvider: ObservabilityProvider = createConsoleProvider();
let activeAppTag: string | undefined;

export const initObservability = (opts: InitObservabilityOptions): void => {
  activeProvider = opts.provider ?? createConsoleProvider();
  activeAppTag = opts.app;
  activeProvider.setTags({
    app: opts.app,
    env: opts.env,
    ...(opts.release ? { release: opts.release } : {}),
  });
};

export const getProvider = (): ObservabilityProvider => activeProvider;

const log = (level: LogLevel, msg: string, ctx?: LogContext, err?: unknown): void => {
  const safeCtx = ctx ? redact(ctx) : undefined;
  if (err) activeProvider.captureException(err, safeCtx);
  else activeProvider.captureMessage(msg, safeCtx, level);
};

export const logger: Logger = {
  debug: (msg, ctx) => log('debug', msg, ctx),
  info: (msg, ctx) => log('info', msg, ctx),
  warn: (msg, ctx) => log('warn', msg, ctx),
  error: (msg, err, ctx) => log('error', msg, ctx, err ?? new Error(msg)),
};

/**
 * Resets internal state. For tests.
 */
export const resetObservabilityForTests = (): void => {
  activeProvider = createConsoleProvider();
  activeAppTag = undefined;
};

export const getAppTag = (): string | undefined => activeAppTag;
