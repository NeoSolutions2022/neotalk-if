const ALLOWED_HOSTS = process.env.WIDGET_PREVIEW_ALLOWED_HOSTS
  ?.split(",")
  .map((host) => host.trim())
  .filter(Boolean);
const WIDGET_HEADERS: Record<string, string> = {
  "Content-Security-Policy": [
    "default-src 'none'",
    "script-src 'self'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data:",
    "font-src 'self' data:",
    "connect-src 'self'",
    "media-src 'self' https://player.vimeo.com https://vimeo.com",
    "frame-src https://player.vimeo.com https://vimeo.com",
    `frame-ancestors ${WIDGET_ALLOWED_FRAME_ANCESTORS}`,
    "base-uri 'none'",
    "form-action 'none'"
  ].join('; '),
  "Referrer-Policy": "no-referrer",
  "Permissions-Policy": "accelerometer=(), autoplay=(self), camera=(), geolocation=(), gyroscope=(), microphone=(), payment=(), usb=()",
  "X-Content-Type-Options": "nosniff"
};

const widgetHeadersPlugin = (): Plugin => ({
  name: 'widget-security-headers',
  configureServer(server) {
    server.middlewares.use((req, res, next) => {
      if (req.url?.startsWith('/widget')) {
        Object.entries(WIDGET_HEADERS).forEach(([key, value]) => res.setHeader(key, value));
      }
      next();
    });
  },
  configurePreviewServer(server) {
    server.middlewares.use((req, res, next) => {
      if (req.url?.startsWith('/widget')) {
        Object.entries(WIDGET_HEADERS).forEach(([key, value]) => res.setHeader(key, value));
      }
      next();
    });
  }
});

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    widgetHeadersPlugin(),
    mode === 'development' &&
    componentTagger(),
  ].filter(Boolean),
  test: {
    environment: "jsdom",
    setupFiles: "./src/test/setup.ts",
    globals: true
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
