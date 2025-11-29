import { useIDEStore } from '@/store/useIDEStore';

export function StatusBar() {
  const { currentFile, currentBranch } = useIDEStore();

  return (
    <div className="statusbar flex items-center justify-between px-4 py-1 bg-blue-600 text-white text-xs">
      <div className="statusbar-left flex items-center gap-4">
        <span className="status-item">🔗 {currentBranch || 'No branch'}</span>
        {currentFile && (
          <span className="status-item">📄 {currentFile}</span>
        )}
      </div>
      <div className="statusbar-right">
        <span className="status-item">Browser IDE v2.0</span>
      </div>
    </div>
  );
}
