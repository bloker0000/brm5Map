import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs'
import path from 'path'
import type { Plugin } from 'vite'

function devSavePlugin(): Plugin {
  return {
    name: 'dev-save-locations',
    configureServer(server) {
      server.middlewares.use('/api/save-locations', (req, res) => {
        if (req.method !== 'POST') {
          res.statusCode = 405;
          res.end(JSON.stringify({ error: 'Method not allowed' }));
          return;
        }

        let body = '';
        req.on('data', (chunk: Buffer) => { body += chunk.toString(); });
        req.on('end', () => {
          try {
            const locations = JSON.parse(body);
            if (!Array.isArray(locations)) {
              res.statusCode = 400;
              res.end(JSON.stringify({ error: 'Expected an array' }));
              return;
            }
            const filePath = path.resolve(__dirname, 'src/data/brm5-locations.json');
            fs.writeFileSync(filePath, JSON.stringify(locations, null, 2) + '\n', 'utf-8');
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ ok: true, count: locations.length }));
          } catch {
            res.statusCode = 400;
            res.end(JSON.stringify({ error: 'Invalid JSON' }));
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
