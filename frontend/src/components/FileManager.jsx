import { useState, useEffect } from 'react';
import api from '../utils/api.js';

export default function FileManager() {
  const [exports, setExports] = useState([]);

  useEffect(() => {
    api
      .get('/recent-exports')
      .then(({ data }) => setExports(data))
      .catch(() => setExports([]));
  }, []);

  return (
    <div className="panel file-manager">
      <h3>Historial de Exportaciones</h3>
      <ul>
        {exports.map((e, i) => (
          <li key={i}>
            {e.fileName} — {e.destination} — {new Date(e.dateExported).toLocaleString()}
          </li>
        ))}
        {exports.length === 0 && <li className="hint">Sin exportaciones aún.</li>}
      </ul>
    </div>
  );
}
