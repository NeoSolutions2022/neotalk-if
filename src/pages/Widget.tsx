import { useEffect, useMemo, useState } from 'react';
import Chat from '@/components/Chat';
import {
  getWidgetConfigFromQuery,
  logWidgetError,
  parseWidgetMessage,
  sanitizeOrigins,
  sanitizeWidgetConfigPatch,
  type WidgetConfig
} from '@/lib/widget-security';

const Widget = () => {
  const [config, setConfig] = useState<WidgetConfig>(() => getWidgetConfigFromQuery(window.location.search));

  const allowedOrigins = useMemo(
    () => sanitizeOrigins(new URLSearchParams(window.location.search).get('allowedOrigins')),
    []
  );

  useEffect(() => {
    if (window.parent === window) return;

    const readyMessage = {
      type: 'NEOTALK_WIDGET_READY',
      payload: {
        version: 1
      }
    };

    if (allowedOrigins.length === 0) {
      window.parent.postMessage(readyMessage, '*');
      return;
    }

    allowedOrigins.forEach((origin) => {
      window.parent.postMessage(readyMessage, origin);
    });
  }, [allowedOrigins]);

  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      if (!allowedOrigins.includes(event.origin)) return;
      if (event.source !== window.parent) return;

      const parsed = parseWidgetMessage(event.data);
      if (!parsed) {
        logWidgetError('invalid_widget_message', { origin: event.origin, type: typeof event.data });
        return;
      }

      const patch = sanitizeWidgetConfigPatch(parsed.payload);
      setConfig((prev) => ({ ...prev, ...patch }));
    };

    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, [allowedOrigins]);

  return <Chat autoOpen={config.autoOpen} initialState={config.initialState} />;
};

export default Widget;
