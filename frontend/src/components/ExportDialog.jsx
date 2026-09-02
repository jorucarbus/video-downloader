import { useState, useEffect, useRef } from 'react';
import api from '../utils/api.js';

export default function ExportDialog({ videoPath, edits }) {
  const [destination, setDestination] = useState('drive');
  const [driveFolder, setDriveFolder] = useState('');
  const [status, setStatus] = useState(null); // { status, progress }
  const [jobId, setJobId] = useState(null);
  const pollRef = useRef(null);

  useEffect(() => () => clearInterval(pollRef.current), []);

  const startExport = async () => {
    if (!videoPath) return;
    const { data } = await api.post('/render-final', { videoPath, edits });
    setJobId(data.jobId);
    setStatus({ status: 'rendering', progress: 0 });

    pollRef.current = setInterval(async () => {
      const { data: s } = await api.get(`/render-status/${data.jobId}`);
      setStatus(s);
      if (s.status === 'completed' || s.status === 'failed') {
        clearInterval(pollRef.current);
        if (s.status === 'completed') await deliverOutput(s.outputPath);
      }
    }, 2000);
  };

  const deliverOutput = async (outputPath) => {
    const fileName = `${Date.now()}-clip.mp4`;
    if (destination === 'drive' || destination === 'both') {
      await api.post('/upload-drive', { filePath: outputPath, destFolder: driveFolder, fileName });
    }
    if (destination === 'local' || destination === 'both') {
      await api.post('/export-local', { filePath: outputPath, destPath: '~/Descargas/Videos_Editados/', fileName });
    }
  };

  return (
    <div className="panel export-dialog">
      <h3>Exportar</h3>
      <select value={destination} onChange={(e) => setDestination(e.target.value)}>
        <option value="drive">Google Drive</option>
        <option value="local">Local</option>
        <option value="both">Ambos</option>
      </select>
      {(destination === 'drive' || destination === 'both') && (
        <input
          type="text"
          placeholder="ID carpeta Drive destino"
          value={driveFolder}
          onChange={(e) => setDriveFolder(e.target.value)}
        />
      )}
      <button onClick={startExport} disabled={!videoPath || status?.status === 'rendering'}>
        Exportar
      </button>

      {status && (
        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${status.progress}%` }} />
          <span>{status.status} ({status.progress}%)</span>
        </div>
      )}
    </div>
  );
}
