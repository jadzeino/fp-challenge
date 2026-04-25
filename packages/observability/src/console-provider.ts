import type { LogContext, LogLevel, ObservabilityProvider } from './types';

/**
 * Default provider: emits to console with consistent shape so log
 * pipelines can ingest it as JSON. Replace in production by passing
 * a Sentry/Datadog/OTel provider to initObservability.
 */
export const createConsoleProvider = (): ObservabilityProvider => {
  let tags: Record<string, string> = {};

  const emit = (level: LogLevel, payload: object): void => {
    const line = JSON.stringify({ ...payload, ...tags, level, ts: new Date().toISOString() });
    if (level === 'error') console.error(line);
    else if (level === 'warn') console.warn(line);
    else console.log(line);
  };

  return {
    captureException(err, ctx) {
      emit('error', {
        kind: 'exception',
        message: err instanceof Error ? err.message : String(err),
        stack: err instanceof Error ? err.stack : undefined,
        ctx,
      });
    },
    captureMessage(msg, level = 'info', ctx) {
      emit(level, { kind: 'message', message: msg, ctx });
    },
    setTags(next) {
      tags = { ...tags, ...next };
    },
  };
};
