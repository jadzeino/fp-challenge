import * as React from 'react';
import { getProvider } from './init';

interface ErrorBoundaryProps {
  fallback?: React.ReactNode | ((err: Error) => React.ReactNode);
  onError?: (err: Error, info: React.ErrorInfo) => void;
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  err: Error | null;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  override state: ErrorBoundaryState = { err: null };

  static getDerivedStateFromError(err: Error): ErrorBoundaryState {
    return { err };
  }

  override componentDidCatch(err: Error, info: React.ErrorInfo): void {
    getProvider().captureException(err, { componentStack: info.componentStack });
    this.props.onError?.(err, info);
  }

  override render(): React.ReactNode {
    const { err } = this.state;
    if (!err) return this.props.children;
    const { fallback } = this.props;
    if (typeof fallback === 'function') return fallback(err);
    if (fallback !== undefined) return fallback;
    return (
      <div role="alert" style={{ padding: 24 }}>
        <h2>Something went wrong.</h2>
        <p>The platform team has been notified.</p>
      </div>
    );
  }
}

/**
 * Convenience HOC for "wrap this whole tree in an error boundary".
 * Useful for _app.tsx wrapping.
 */
export const withErrorBoundary = <P extends object>(
  Component: React.ComponentType<P>,
  fallback?: ErrorBoundaryProps['fallback'],
): React.FC<P> => {
  const Wrapped: React.FC<P> = (props) => (
    <ErrorBoundary fallback={fallback}>
      <Component {...props} />
    </ErrorBoundary>
  );
  Wrapped.displayName = `withErrorBoundary(${
    Component.displayName ?? Component.name ?? 'Component'
  })`;
  return Wrapped;
};
