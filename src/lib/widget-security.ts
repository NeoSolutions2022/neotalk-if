export interface WidgetConfig {
  autoOpen: boolean;
  initialState: string;
}

const DEFAULT_CONFIG: WidgetConfig = {
  autoOpen: true,
  initialState: 'start'
};

const ALLOWED_CONFIG_STATES = new Set(['start']);

const parseBoolean = (value: string | null | undefined, fallback: boolean) => {
  if (value == null) return fallback;
  if (value === 'true' || value === '1') return true;
  if (value === 'false' || value === '0') return false;
  return fallback;
};

const sanitizeState = (value: string | null | undefined) => {
  if (!value) return DEFAULT_CONFIG.initialState;
  return ALLOWED_CONFIG_STATES.has(value) ? value : DEFAULT_CONFIG.initialState;
};

const toOrigin = (value: string) => {
  try {
    const parsed = new URL(value);
    return parsed.origin;
  } catch {
    return null;
  }
};

export const sanitizeOrigins = (raw: string | null): string[] => {
  if (!raw) return [];

  return raw
    .split(',')
    .map((entry) => entry.trim())
    .map(toOrigin)
    .filter((entry): entry is string => Boolean(entry));
};

export const getWidgetConfigFromQuery = (queryString: string): WidgetConfig => {
  const query = new URLSearchParams(queryString);
  return {
    autoOpen: parseBoolean(query.get('autoOpen'), DEFAULT_CONFIG.autoOpen),
    initialState: sanitizeState(query.get('initialState'))
  };
};

interface WidgetConfigMessage {
  type: 'NEOTALK_WIDGET_CONFIG';
  payload?: {
    autoOpen?: unknown;
    initialState?: unknown;
  };
}

export const parseWidgetMessage = (value: unknown): WidgetConfigMessage | null => {
  if (!value || typeof value !== 'object') return null;

  const candidate = value as Record<string, unknown>;
  if (candidate.type !== 'NEOTALK_WIDGET_CONFIG') return null;

  return {
    type: 'NEOTALK_WIDGET_CONFIG',
    payload: typeof candidate.payload === 'object' && candidate.payload !== null
      ? {
          autoOpen: (candidate.payload as Record<string, unknown>).autoOpen,
          initialState: (candidate.payload as Record<string, unknown>).initialState
        }
      : undefined
  };
};

export const sanitizeWidgetConfigPatch = (payload: WidgetConfigMessage['payload']): Partial<WidgetConfig> => {
  if (!payload) return {};

  return {
    autoOpen: typeof payload.autoOpen === 'boolean' ? payload.autoOpen : undefined,
    initialState: typeof payload.initialState === 'string' ? sanitizeState(payload.initialState) : undefined
  };
};

export const logWidgetError = (code: string, details?: Record<string, unknown>) => {
  const safeDetails = details
    ? Object.fromEntries(
        Object.entries(details).filter(([key]) => !/(token|cookie|session|authorization|password)/i.test(key))
      )
    : undefined;

  console.error('[widget-error]', {
    code,
    timestamp: new Date().toISOString(),
    ...(safeDetails ? { details: safeDetails } : {})
  });
};
