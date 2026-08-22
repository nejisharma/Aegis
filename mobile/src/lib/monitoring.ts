import * as Sentry from '@sentry/react-native';

const DSN = process.env.EXPO_PUBLIC_SENTRY_DSN;

/** Crash + error reporting. Silent no-op until EXPO_PUBLIC_SENTRY_DSN is set (see README NEEDS-CONFIG). */
export function initMonitoring() {
  if (!DSN) return;
  Sentry.init({
    dsn: DSN,
    enabled: !__DEV__,
    debug: false,
    tracesSampleRate: 0.1,
    // No PII: we never have any, but be explicit for the privacy policy.
    sendDefaultPii: false,
    beforeSend(event) {
      if (event.user) delete event.user;
      return event;
    },
  });
}

export const monitoringEnabled = !!DSN;

/** Wrap the root component so render errors are captured (identity when disabled). */
export const wrapRoot = <T extends React.ComponentType<Record<string, unknown>>>(component: T): T => (DSN ? (Sentry.wrap(component) as T) : component);

export function captureError(err: unknown, context?: Record<string, unknown>) {
  if (!DSN) return;
  Sentry.captureException(err, context ? { extra: context } : undefined);
}
