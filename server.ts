import express from 'express';
import { createServer as createViteServer } from 'vite';
import { createProxyMiddleware } from 'http-proxy-middleware';
import path from 'path';
import { fileURLToPath } from 'url';
import { spawn, ChildProcess } from 'child_process';
import http from 'http';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.PORT || 3000;
const PYTHON_PORT = 5050;
const isProd = process.env.NODE_ENV === 'production';

let pythonProcess: ChildProcess | null = null;

function startPythonBackend() {
  console.log('[Server] Spawning Python FastAPI backend on port 8000...');
  pythonProcess = spawn('python3', ['-m', 'backend.app.main'], {
    cwd: __dirname,
    stdio: 'inherit',
    env: { ...process.env, PYTHONPATH: __dirname }
  });

  pythonProcess.on('error', (err) => {
    console.error('[Server] Failed to spawn Python backend:', err);
  });

  pythonProcess.on('exit', (code, signal) => {
    console.log(`[Server] Python backend exited with code ${code} and signal ${signal}`);
  });
}

// Start backend
startPythonBackend();

process.on('SIGTERM', () => {
  if (pythonProcess) pythonProcess.kill('SIGTERM');
  process.exit(0);
});

process.on('SIGINT', () => {
  if (pythonProcess) pythonProcess.kill('SIGINT');
  process.exit(0);
});

async function createServer() {
  const app = express();

  // Proxy to FastAPI for /api, /health, /artifacts preserving full path
  const apiProxy = createProxyMiddleware({
    target: `http://127.0.0.1:${PYTHON_PORT}`,
    changeOrigin: true,
    ws: false,
    pathRewrite: (_path, req) => (req as any).originalUrl || _path,
  });

  app.use('/api', apiProxy);
  app.use('/health', apiProxy);
  app.use('/artifacts', apiProxy);

  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, () => {
    console.log(`[Server] ShelfSherlock running on http://0.0.0.0:${PORT}`);
  });
}

createServer().catch((err) => {
  console.error('[Server] Error starting server:', err);
});
