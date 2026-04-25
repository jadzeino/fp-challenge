export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogContext {
  [key: string]: unknown;
}

export interface ObservabilityProvider {
  captureException(err: unknown, ctx?: LogContext): void;
  captureMessage(msg: string, level?: LogLevel, ctx?: LogContext): void;
  setTags(tags: Record<string, string>): void;
}

export interface InitObservabilityOptions {
  app: string;
  env: 'development' | 'staging' | 'production' | 'test';
  release?: string;
  /**
   * Pluggable provider. Default is a console-based no-op suitable for
   * dev. Production wires Sentry / Datadog / OpenTelemetry by passing
   * a real provider here.
   */
  provider?: ObservabilityProvider;
}

export interface Logger {
  debug(msg: string, ctx?: LogContext): void;
  info(msg: string, ctx?: LogContext): void;
  warn(msg: string, ctx?: LogContext): void;
  error(msg: string, err?: unknown, ctx?: LogContext): void;
}
