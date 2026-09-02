import { useState, useCallback } from 'react';
import api from '../utils/api.js';

/**
 * Batch refine: listar videos de una carpeta Drive, editarlos, y
 * reemplazarlos en el mismo lugar (mismo fileId, sin duplicar).
 */
export function useDriveSync() {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);

  const listFolder = useCallback(async (folderId) => {
    setLoading(true);
    try {
      const { data } = await api.get(`/drive-folder/${folderId}/videos`);
      setFiles(data.files);
      return data.files;
    } finally {
      setLoading(false);
    }
  }, []);

  const downloadForEdit = useCallback(async (fileId, destPath) => {
    const { data } = await api.post('/download-drive', { fileId, destPath });
    return data.path;
  }, []);

  const replaceOnDrive = useCallback(async (fileId, filePath) => {
    const { data } = await api.post('/replace-drive', { fileId, filePath });
    return data;
  }, []);

  return { files, loading, listFolder, downloadForEdit, replaceOnDrive };
}
