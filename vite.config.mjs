import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import path from 'path';
import { fileURLToPath } from 'url';
import { componentTagger } from 'lovable-tagger';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const normalizeAllowedHost = (value) => {
  const trimmed = String(value || '').trim();
  if (!trimmed) return null;

  try {
    const withProtocol = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
    return new URL(withProtocol).host;
  } catch {
    return null;
  }
};

const parseAllowedHosts = (raw) => {
  if (!raw) return undefined;
  const parsed = raw.split(',').map(normalizeAllowedHost).filter(Boolean);
  return parsed.length > 0 ? parsed : undefined;
};

const allowedHosts = parseAllowedHosts(process.env.WIDGET_PREVIEW_ALLOWED_HOSTS) || true;
const frameAncestors = process.env.WIDGET_FRAME_ANCESTORS || "'self'";

const widgetCsp =
  "default-src 'none'; " +
  "script-src 'self'; " +
  "style-src 'self' 'unsafe-inline'; " +
  "img-src 'self' data:; " +
  "font-src 'self' data:; " +
  "connect-src 'self'; " +
  "media-src 'self' https://player.vimeo.com https://vimeo.com; " +
  "frame-src https://player.vimeo.com https://vimeo.com; " +
  `frame-ancestors ${frameAncestors}; ` +
  "base-uri 'none'; " +
  "form-action 'none'";

const widgetHeaders = {
  'Content-Security-Policy': widgetCsp,
  'Referrer-Policy': 'no-referrer',
  'Permissions-Policy': 'accelerometer=(), autoplay=(self), camera=(), geolocation=(), gyroscope=(), microphone=(), payment=(), usb=()',
  'X-Content-Type-Options': 'nosniff'
};

const widgetHeadersPlugin = () => ({
  name: 'widget-security-headers',
  configureServer(server) {
    server.middlewares.use((req, res, next) => {
      if (req.url && req.url.startsWith('/widget')) {
        Object.entries(widgetHeaders).forEach(([key, value]) => res.setHeader(key, value));
      }
      next();
    });
  },
  configurePreviewServer(server) {
    server.middlewares.use((req, res, next) => {
      if (req.url && req.url.startsWith('/widget')) {
        Object.entries(widgetHeaders).forEach(([key, value]) => res.setHeader(key, value));
      }
      next();
    });
  }
});

export default defineConfig(({ mode }) => ({
  server: {
    host: '::',
    port: 8080,
    allowedHosts
  },
  preview: {
    allowedHosts
  },
  plugins: [react(), widgetHeadersPlugin(), mode === 'development' && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  }
}));
