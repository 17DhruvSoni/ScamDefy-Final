import React, { useRef, useState } from 'react';
import { LoadingSpinner } from '../ui/LoadingSpinner';

export function AudioUploader({
  onFile, loading, progress
}: { onFile: (f: File) => void; loading: boolean; progress: number }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [fileName, setFileName] = useState('');

  const handle = (file: File) => { setFileName(file.name); onFile(file); };

  return (
    <div
      onDragOver={e => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={e => { e.preventDefault(); setDragging(false); const f = e.dataTransfer.files[0]; if (f) handle(f); }}
      onClick={() => !loading && inputRef.current?.click()}
      style={{
        background: dragging ? '#6366f115' : '#111827',
        border: `2px dashed ${dragging ? '#6366f1' : '#1e293b'}`,
        borderRadius: 16, padding: '32px 20px',
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12,
        cursor: loading ? 'not-allowed' : 'pointer',
        transition: 'all 0.2s', textAlign: 'center',
      }}>
      <input ref={inputRef} type="file" accept=".wav,.mp3,.ogg,.m4a,.webm"
        style={{ display: 'none' }}
        onChange={e => { const f = e.target.files?.[0]; if (f) handle(f); }}
      />
      {loading ? (
        <>
          <LoadingSpinner size="lg" />
          <p style={{ color: '#6366f1', fontSize: 14, margin: 0 }}>Analyzing voice... {progress}%</p>
          <div style={{ width: '100%', height: 4, background: '#1e293b', borderRadius: 9999, overflow: 'hidden' }}>
            <div style={{
              height: '100%', width: `${progress}%`, background: '#6366f1',
              transition: 'width 0.4s', borderRadius: 9999,
            }} />
          </div>
        </>
      ) : (
        <>
          <span style={{ fontSize: 44 }}>🎙️</span>
          <div>
            <p style={{ color: '#f1f5f9', fontSize: 15, fontWeight: 600, margin: 0, fontFamily: 'Syne' }}>
              {fileName || 'Upload Voice Recording'}
            </p>
            <p style={{ color: '#94a3b8', fontSize: 12, margin: '6px 0 0', lineHeight: 1.6 }}>
              Drop a WAV, MP3, OGG, or M4A file here<br />
              Detects AI-generated or cloned voices
            </p>
          </div>
          <button style={{
            background: '#6366f1', color: '#fff', border: 'none',
            borderRadius: 8, padding: '8px 20px', fontSize: 13, fontWeight: 600, cursor: 'pointer',
          }}>
            Choose File
          </button>
        </>
      )}
    </div>
  );
}
