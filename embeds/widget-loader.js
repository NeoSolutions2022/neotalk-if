(function () {
  const CURRENT_SCRIPT = document.currentScript;
  const WIDGET_BASE_URL = CURRENT_SCRIPT?.dataset?.widgetUrl || 'https://widget.seudominio.com/widget';
  const ALLOWED_ORIGIN = CURRENT_SCRIPT?.dataset?.widgetOrigin || new URL(WIDGET_BASE_URL).origin;
  const POSITION_RIGHT = CURRENT_SCRIPT?.dataset?.right || '16px';
  const POSITION_BOTTOM = CURRENT_SCRIPT?.dataset?.bottom || '16px';

  const launcher = document.createElement('button');
  launcher.type = 'button';
  launcher.textContent = 'Abrir assistente';
  launcher.setAttribute('aria-label', 'Abrir assistente virtual');
  Object.assign(launcher.style, {
    position: 'fixed',
    right: POSITION_RIGHT,
    bottom: POSITION_BOTTOM,
    zIndex: '2147483646',
    border: '0',
    borderRadius: '9999px',
    padding: '12px 16px',
    background: '#1d4ed8',
    color: '#fff',
    font: '600 14px/1.2 system-ui, sans-serif',
    boxShadow: '0 8px 24px rgba(0,0,0,.2)',
    cursor: 'pointer'
  });

  const overlay = document.createElement('div');
  overlay.setAttribute('aria-hidden', 'true');
  Object.assign(overlay.style, {
    position: 'fixed',
    inset: '0',
    background: 'rgba(0,0,0,.45)',
    zIndex: '2147483646',
    display: 'none'
  });

  const frameWrap = document.createElement('div');
  Object.assign(frameWrap.style, {
    position: 'fixed',
    right: POSITION_RIGHT,
    bottom: `calc(${POSITION_BOTTOM} + 56px)`,
    width: 'min(420px, calc(100vw - 24px))',
    height: 'min(720px, calc(100vh - 24px))',
    borderRadius: '14px',
    overflow: 'hidden',
    zIndex: '2147483647',
    display: 'none',
    boxShadow: '0 16px 40px rgba(0,0,0,.3)',
    background: '#fff'
  });

  const iframe = document.createElement('iframe');
  const hostOrigin = window.location.origin;
  const url = new URL(WIDGET_BASE_URL);
  url.searchParams.set('allowedOrigins', hostOrigin);
  url.searchParams.set('autoOpen', 'true');
  url.searchParams.set('initialState', 'start');

  iframe.src = url.toString();
  iframe.title = 'Assistente virtual';
  iframe.referrerPolicy = 'no-referrer';
  iframe.setAttribute('sandbox', 'allow-scripts allow-same-origin');
  iframe.setAttribute('allow', 'autoplay');
  Object.assign(iframe.style, {
    width: '100%',
    height: '100%',
    border: '0'
  });

  frameWrap.appendChild(iframe);
  document.body.appendChild(overlay);
  document.body.appendChild(frameWrap);
  document.body.appendChild(launcher);

  const openWidget = function () {
    overlay.style.display = 'block';
    frameWrap.style.display = 'block';
    overlay.setAttribute('aria-hidden', 'false');
  };

  const closeWidget = function () {
    overlay.style.display = 'none';
    frameWrap.style.display = 'none';
    overlay.setAttribute('aria-hidden', 'true');
  };

  launcher.addEventListener('click', openWidget);
  overlay.addEventListener('click', closeWidget);

  window.addEventListener('message', function (event) {
    if (event.origin !== ALLOWED_ORIGIN) return;
    if (event.data?.type === 'NEOTALK_WIDGET_READY') {
      iframe.contentWindow?.postMessage(
        {
          type: 'NEOTALK_WIDGET_CONFIG',
          payload: {
            autoOpen: true,
            initialState: 'start'
          }
        },
        ALLOWED_ORIGIN
      );
    }
  });
})();
