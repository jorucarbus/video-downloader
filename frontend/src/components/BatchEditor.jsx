import { useState } from 'react';
import { useDriveSync } from '../hooks/useDriveSync.js';
import api from '../utils/api.js';

/**
 * Batch refine: edita en lote videos ya subidos a Drive y los reemplaza
 * (mismo fileId, sin duplicar carpeta). Aplica el mismo set de `edits`
 * a todos los archivos seleccionados.
 */
export default function BatchEditor({ edits }) {
  const { files, loading, listFolder, downloadForEdit, replaceOnDrive } = useDriveSync();
  const [folderId, setFolderId] = useState('');
  const [selected, setSelected] = useState(new Set());
  const [processing, setProcessing] = useState(false);
  const [log, setLog] = useState([]);

  const toggleSelect = (id) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const runBatch = async () => {
    setProcessing(true);
    setLog([]);
    for (const fileId of selected) {
      const file = files.find((f) => f.id === fileId);
      try {
        const localPath = await downloadForEdit(fileId, `./backend/temp-videos/${fileId}.mp4`);
        const { data: renderJob } = await api.post('/render-final', { videoPath: localPath, edits });

        // poll simple hasta completar
        let renderStatus;
        do {
          await new Promise((r) => setTimeout(r, 2000));
          const { data } = await api.get(`/render-status/${renderJob.jobId}`);
          renderStatus = data;
        } while (renderStatus.status === 'rendering');

        if (renderStatus.status === 'completed') {
          await replaceOnDrive(fileId, renderStatus.outputPath);
          setLog((prev) => [...prev, `✅ ${file.name} reemplazado`]);
        } else {
          setLog((prev) => [...prev, `❌ ${file.name}: ${renderStatus.error}`]);
        }
      } catch (err) {
        setLog((prev) => [...prev, `❌ ${file.name}: ${err.message}`]);
      }
    }
    setProcessing(false);
  };

  return (
    <div className="panel batch-editor">
      <h3>Batch Refine (Drive)</h3>
      <input
        type="text"
        placeholder="ID carpeta Drive"
        value={folderId}
        onChange={(e) => setFolderId(e.target.value)}
      />
      <button onClick={() => listFolder(folderId)} disabled={!folderId || loading}>
        {loading ? 'Listando...' : 'Listar videos'}
      </button>

      <ul className="batch-file-list">
        {files.map((f) => (
          <li key={f.id}>
            <label>
              <input type="checkbox" checked={selected.has(f.id)} onChange={() => toggleSelect(f.id)} />
              {f.name}
            </label>
          </li>
        ))}
      </ul>

      <button onClick={runBatch} disabled={selected.size === 0 || processing}>
        {processing ? 'Procesando...' : `Aplicar edits + reemplazar (${selected.size})`}
      </button>

      <p className="hint">
        Se aplican los mismos ajustes activos (crop, efectos, recuadros, stickers) a cada video
        seleccionado y se sobreescribe el archivo original en Drive.
      </p>

      <ul className="batch-log">
        {log.map((l, i) => (
          <li key={i}>{l}</li>
        ))}
      </ul>
    </div>
  );
}
