import { google } from 'googleapis';
import fs from 'fs';

// OAuth2 (mismas credenciales que farandula-video-generator/insumos — reutilizadas
// a propósito para no crear un service account nuevo). El refresh token ya trae
// acceso autorizado a las carpetas compartidas.
function getAuth() {
  const { GOOGLE_OAUTH_CLIENT_ID, GOOGLE_OAUTH_CLIENT_SECRET, GOOGLE_OAUTH_REFRESH_TOKEN } = process.env;
  if (!GOOGLE_OAUTH_CLIENT_ID || !GOOGLE_OAUTH_CLIENT_SECRET || !GOOGLE_OAUTH_REFRESH_TOKEN) {
    throw new Error('GOOGLE_OAUTH_CLIENT_ID / CLIENT_SECRET / REFRESH_TOKEN no configuradas');
  }
  const client = new google.auth.OAuth2(GOOGLE_OAUTH_CLIENT_ID, GOOGLE_OAUTH_CLIENT_SECRET);
  client.setCredentials({ refresh_token: GOOGLE_OAUTH_REFRESH_TOKEN });
  return client;
}

/**
 * Sube archivo local a carpeta de Drive.
 * @param {string} filePath
 * @param {string} folderId
 * @param {string} fileName
 */
export async function uploadToDrive(filePath, folderId, fileName) {
  const auth = getAuth();
  const drive = google.drive({ version: 'v3', auth });

  const file = await drive.files.create({
    requestBody: { name: fileName, parents: [folderId] },
    media: { body: fs.createReadStream(filePath) },
    fields: 'id, webViewLink',
  });

  return { driveId: file.data.id, driveUrl: file.data.webViewLink };
}

/**
 * Reemplaza (overwrite) contenido de un archivo existente en Drive
 * manteniendo el mismo fileId — necesario para "refinar" videos ya subidos
 * sin duplicar ni romper referencias/enlaces existentes.
 * @param {string} fileId
 * @param {string} filePath
 */
export async function replaceInDrive(fileId, filePath) {
  const auth = getAuth();
  const drive = google.drive({ version: 'v3', auth });

  const file = await drive.files.update({
    fileId,
    media: { body: fs.createReadStream(filePath) },
    fields: 'id, webViewLink, modifiedTime',
  });

  return { driveId: file.data.id, driveUrl: file.data.webViewLink, modifiedTime: file.data.modifiedTime };
}

/**
 * Lista archivos de video dentro de una carpeta de Drive (para batch editing).
 * @param {string} folderId
 */
export async function listVideosInFolder(folderId) {
  const auth = getAuth();
  const drive = google.drive({ version: 'v3', auth });

  const res = await drive.files.list({
    q: `'${folderId}' in parents and mimeType contains 'video/' and trashed = false`,
    fields: 'files(id, name, mimeType, size, modifiedTime)',
    pageSize: 200,
  });

  return res.data.files || [];
}

/**
 * Descarga un archivo de Drive a disco local (para editar antes de reemplazar).
 * @param {string} fileId
 * @param {string} destPath
 */
export async function downloadFromDrive(fileId, destPath) {
  const auth = getAuth();
  const drive = google.drive({ version: 'v3', auth });

  const res = await drive.files.get({ fileId, alt: 'media' }, { responseType: 'stream' });

  return new Promise((resolve, reject) => {
    const dest = fs.createWriteStream(destPath);
    res.data.on('end', () => resolve(destPath)).on('error', reject).pipe(dest);
  });
}
