import { useState } from 'react';
import api from '../utils/api.js';

export default function DownloadPanel({ onDownloaded }) {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleDownload = async () => {
    if (!url) return;
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.post('/download', { url });
      onDownloaded(data.videoPath, data.metadata, data.previewUrl);
    } catch (err) {
      setError(err?.response?.data?.error || 'Error al descargar video');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="panel download-panel">
      <h3>Descargar Video</h3>
      <input
        type="text"
        placeholder="Pega URL (YouTube, TikTok, IG, etc.)"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
      />
      <button onClick={handleDownload} disabled={loading || !url}>
        {loading ? 'Descargando...' : 'Descargar'}
      </button>
      {error && <p className="error">{error}</p>}
    </div>
  );
}
