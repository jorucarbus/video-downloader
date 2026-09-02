import './env.js'; // primer import: carga .env antes que cualquier módulo lo necesite
import path from 'path';
import { fileURLToPath } from 'url';
import express from 'express';
import cors from 'cors';
import apiRoutes from './routes/api.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Sirve los videos de temp-videos/ por HTTP — el frontend web NO puede cargar
// file:// por restricciones de seguridad del navegador (solo Electron podría).
// El preview usa esta ruta en vez de file://.
app.use('/media', express.static(path.join(__dirname, 'temp-videos')));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api', apiRoutes);

// 404
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// Error handling
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({ error: err.message || 'Internal server error' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server on port ${PORT}`));

export default app;
