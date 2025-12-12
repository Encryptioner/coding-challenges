import { useState } from 'react';
import { gitService } from '../services/git';
import { useStore } from '../store/useStore';

export function CloneDialog({ onClose }) {
  const [repoUrl, setRepoUrl] = useState('');
  const [isCloning, setIsCloning] = useState(false);
  const { settings, addRecentProject } = useStore();
  
  async function handleClone() {
    if (!repoUrl) return;
    if (!settings.githubToken) {
      alert('Please set GitHub token in settings first');
      return;
    }
    
    setIsCloning(true);
    const result = await gitService.clone(repoUrl, settings.githubToken);
    
    if (result.success) {
      addRecentProject({ url: repoUrl, name: repoUrl.split('/').pop() });
      alert('Repository cloned successfully!');
      onClose();
      window.location.reload();
    } else {
      alert('Failed to clone: ' + result.error);
    }
    setIsCloning(false);
  }
  
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2>Clone Repository</h2>
        <input
          type="text"
          placeholder="https://github.com/user/repo"
          value={repoUrl}
          onChange={(e) => setRepoUrl(e.target.value)}
          autoFocus
        />
        <div className="modal-actions">
          <button onClick={handleClone} disabled={isCloning}>
            {isCloning ? 'Cloning...' : 'Clone'}
          </button>
          <button onClick={onClose}>Cancel</button>
        </div>
      </div>
    </div>
  );
}
