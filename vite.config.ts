import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs'
import path from 'path'
import type { IncomingMessage, ServerResponse } from 'http'
import type { Plugin } from 'vite'

const MAX_BODY = 5 * 1024 * 1024;

function send(res: ServerResponse, status: number, body: object) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(body));
}

// any page open in the browser can post to localhost, so only take a write that
// comes from the dev server's own page
function isFromApp(req: IncomingMessage) {
  const origin = req.headers.origin;
  if (!origin) return false;
  try {
    return new URL(origin).host === req.headers.host;
  } catch {
    return false;
  }
}

function devSavePlugin(): Plugin {
  return {
    name: 'dev-save-locations',
    configureServer(server) {
      server.middlewares.use('/api/save-locations', (req, res) => {
        if (req.method !== 'POST') {
          send(res, 405, { error: 'Method not allowed' });
          return;
        }
        // a cross site form can only send text/plain, json forces a preflight it fails
        if (!isFromApp(req) || !req.headers['content-type']?.startsWith('application/json')) {
          send(res, 403, { error: 'Forbidden' });
          return;
        }

        let body = '';
        let tooLarge = false;
        req.on('data', (chunk: Buffer) => {
          if (tooLarge) return;
          body += chunk.toString();
          if (body.length > MAX_BODY) {
            tooLarge = true;
            send(res, 413, { error: 'Too large' });
            req.destroy();
          }
        });
        req.on('end', () => {
          if (tooLarge) return;
          try {
            const locations = JSON.parse(body);
            if (!Array.isArray(locations)) {
              send(res, 400, { error: 'Expected an array' });
              return;
            }
            const filePath = path.resolve(__dirname, 'src/data/brm5-locations.json');
            fs.writeFileSync(filePath, JSON.stringify(locations, null, 2) + '\n', 'utf-8');
            send(res, 200, { ok: true, count: locations.length });
          } catch {
            send(res, 400, { error: 'Invalid JSON' });
          }
        });
      });
    },
  };
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), devSavePlugin()],
})
