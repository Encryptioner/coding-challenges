import { useStore } from '../store/useStore';

export function StatusBar() {
  const { currentFile, currentBranch } = useStore();
  
  return (
    <div className="statusbar">
      <div className="statusbar-left">
        <span className="status-item">🔗 {currentBranch || 'No branch'}</span>
        {currentFile && <span className="status-item">📄 {currentFile}</span>}
      </div>
      <div className="statusbar-right">
        <span className="status-item">Browser IDE v1.0</span>
      </div>
    </div>
  );
}
