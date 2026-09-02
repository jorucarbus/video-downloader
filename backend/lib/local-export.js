import fs from 'fs';
import path from 'path';
import os from 'os';

// Historial en memoria (sin DB — carpetas como "BD", per decisión de proyecto).
// Se pierde al reiniciar server; para persistencia real se puede volcar a JSON.
const recentExports = [];

function expandHome(p) {
  if (p.startsWith('~')) return path.join(os.homedir(), p.slice(1));
  return p;
}

export async function exportLocal(filePath, destPath, fileName) {
  const resolvedDest = expandHome(destPath);
  fs.mkdirSync(resolvedDest, { recursive: true });
  const finalPath = path.join(resolvedDest, fileName);
  fs.copyFileSync(filePath, finalPath);

  recentExports.unshift({
    fileName,
    dateExported: new Date().toISOString(),
    destination: 'local',
    path: finalPath,
  });

  return { saved: true, path: finalPath };
}

export function logDriveExport(fileName, driveFolder) {
  recentExports.unshift({
    fileName,
    dateExported: new Date().toISOString(),
    destination: 'drive',
    driveFolder,
  });
}

export function getRecentExports() {
  return recentExports.slice(0, 50);
}
