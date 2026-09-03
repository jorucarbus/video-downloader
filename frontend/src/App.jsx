import { useState } from 'react';
import { useVideoEditor } from './hooks/useVideoEditor.js';
import DownloadPanel from './components/DownloadPanel.jsx';
import TimelineEditor from './components/TimelineEditor.jsx';
import CanvasEditor from './components/CanvasEditor.jsx';
import ShapesPanel from './components/ShapesPanel.jsx';
import StickersPanel from './components/StickersPanel.jsx';
import AIAnalyzer from './components/AIAnalyzer.jsx';
import OrientationConverter from './components/OrientationConverter.jsx';
import ExportDialog from './components/ExportDialog.jsx';
import FileManager from './components/FileManager.jsx';
import BatchEditor from './components/BatchEditor.jsx';

const TABS = [
  { id: 'edit', label: 'Editor' },
  { id: 'batch', label: 'Batch Refine (Drive)' },
  { id: 'history', label: 'Historial' },
];

export default function App() {
  const [tab, setTab] = useState('edit');
  const {
    videoPath,
    previewUrl,
    metadata,
    edits,
    loadVideo,
    updateTrim,
    updateCrop,
    updateEffect,
    addShape,
    removeShape,
    updateShapePosition,
    addSticker,
    removeSticker,
  } = useVideoEditor();

  return (
    <div className="app">
      <header className="app-header">
        <h1>🎬 Video Downloader &amp; Editor</h1>
        <nav>
          {TABS.map((t) => (
            <button key={t.id} className={tab === t.id ? 'active' : ''} onClick={() => setTab(t.id)}>
              {t.label}
            </button>
          ))}
        </nav>
      </header>

      {tab === 'edit' && (
        <main className="editor-grid">
          <DownloadPanel onDownloaded={loadVideo} />
          <TimelineEditor metadata={metadata} edits={edits} onUpdateTrim={updateTrim} />
          <CanvasEditor
            videoPath={videoPath}
            previewUrl={previewUrl}
            metadata={metadata}
            edits={edits}
            onUpdateEffect={updateEffect}
            onUpdateCrop={updateCrop}
            onUpdateShapePosition={updateShapePosition}
            onRemoveShape={removeShape}
          />
          <ShapesPanel edits={edits} onAddShape={addShape} onRemoveShape={removeShape} />
          <StickersPanel edits={edits} onAddSticker={addSticker} onRemoveSticker={removeSticker} />
          <AIAnalyzer videoPath={videoPath} previewUrl={previewUrl} />
          <OrientationConverter videoPath={videoPath} onUpdateCrop={updateCrop} />
          <ExportDialog videoPath={videoPath} edits={edits} />
        </main>
      )}

      {tab === 'batch' && (
        <main className="editor-grid">
          <BatchEditor edits={edits} />
        </main>
      )}

      {tab === 'history' && (
        <main className="editor-grid">
          <FileManager />
        </main>
      )}
    </div>
  );
}
