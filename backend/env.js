// Debe ser el PRIMER import de server.js (y de cualquier script standalone que
// use env vars) — en ESM los imports se evalúan en orden de aparición, así que
// esto corre antes que cualquier módulo que lea process.env.
//
// 'dotenv/config' por sí solo busca .env en process.cwd(), que varía según cómo
// se lance el proceso (npm workspaces cambia cwd a backend/, doble-click, etc.).
// Acá se apunta explícito a la raíz del proyecto.
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '..', '.env') });
