import { randomUUID } from 'node:crypto';
import { logger } from './init';

/**
 * Express-shape middleware (works with http-proxy-middleware too) that:
 *   1. Reads or generates an X-Request-ID and pins it on the request
 *   2. Sets the same id on the response header
 *   3. Logs request/response with method, path, status, latency
 *
 * The request id is the spine of cross-zone correlation: the gateway
 * tags it, the apps propagate it via @raisin/api-client, and downstream
 * services log it. Search by request id and you see the full path.
 */
type ReqLike = {
  method?: string;
  url?: string;
  headers: Record<string, string | string[] | undefined>;
  requestId?: string;
};
type ResLike = {
  statusCode: number;
  setHeader: (name: string, value: string) => void;
  on: (event: 'finish' | 'close', cb: () => void) => void;
};
type Next = (err?: unknown) => void;

const HEADER = 'x-request-id';

export const requestIdMiddleware = () => (req: ReqLike, res: ResLike, next: Next): void => {
  const incoming = req.headers[HEADER];
  const id = (typeof incoming === 'string' && incoming) || randomUUID();
  req.requestId = id;
  res.setHeader('X-Request-ID', id);
  next();
};

export interface AccessLogOptions {
  /** Return true to suppress a log line. Useful in dev to skip noisy static-asset paths. */
  skip?: (req: ReqLike) => boolean;
}

export const accessLogMiddleware = (opts: AccessLogOptions = {}) =>
  (req: ReqLike, res: ResLike, next: Next): void => {
    const start = Date.now();
    res.on('finish', () => {
      if (opts.skip?.(req)) return;
      logger.info('http_access', {
        method: req.method,
        path: req.url,
        status: res.statusCode,
        latencyMs: Date.now() - start,
        requestId: req.requestId,
      });
    });
    next();
  };
