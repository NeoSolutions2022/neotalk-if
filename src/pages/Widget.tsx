import React from 'react';
import Chat from '@/components/Chat';
import {
  getWidgetConfigFromQuery,
  logWidgetError,
  parseWidgetMessage,
  sanitizeOrigins,
  sanitizeWidgetConfigPatch,
  WidgetConfig
} from '@/lib/widget-security';

const Widget = () => {
  const [config, setConfig] = React.useState<WidgetConfig>(() => getWidgetConfigFromQuery(window.location.search));
  const allowedOrigins = React.useMemo(() => {
    const query = new URLSearchParams(window.location.search);
    return sanitizeOrigins(query.get('allowedOrigins'));
  }, []);

  React.useEffect(() => {
    if (!window.parent || window.parent === window || allowedOrigins.length === 0) return;

    allowedOrigins.forEach((origin) => {
      window.parent.postMessage(
        {
          type: 'NEOTALK_WIDGET_READY',
          payload: {
            version: 1,
            path: '/widget'
          }
        },
        origin
      );
    });
  }, [allowedOrigins]);

  React.useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      if (!allowedOrigins.includes(event.origin)) return;

      const parsed = parseWidgetMessage(event.data);
      if (!parsed) return;

      try {
        const patch = sanitizeWidgetConfigPatch(parsed.payload);
        setConfig((current) => ({ ...current, ...patch }));
      } catch {
        logWidgetError('invalid_message_payload', { origin: event.origin });
      }
    };

    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, [allowedOrigins]);

  return (
    <main className="h-screen w-screen overflow-hidden bg-chat-background" data-widget-root="true">
      <Chat initialState={config.initialState} autoOpen={config.autoOpen} />
    </main>
  );
};

export default Widget;
