import { useState } from 'react';
import { useStore } from '../store/useStore';

export function SettingsDialog({ onClose }) {
  const { settings, updateSettings } = useStore();
  const [localSettings, setLocalSettings] = useState(settings);
  
  function handleSave() {
    updateSettings(localSettings);
    alert('Settings saved!');
    onClose();
  }
  
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal large" onClick={(e) => e.stopPropagation()}>
        <h2>Settings</h2>
        <div className="settings-grid">
          <label>
            GitHub Token:
            <input
              type="password"
              value={localSettings.githubToken}
              onChange={(e) => setLocalSettings({...localSettings, githubToken: e.target.value})}
              placeholder="ghp_xxxxxxxxxxxx"
            />
          </label>
          <label>
            GitHub Username:
            <input
              type="text"
              value={localSettings.githubUsername}
              onChange={(e) => setLocalSettings({...localSettings, githubUsername: e.target.value})}
            />
          </label>
          <label>
            GitHub Email:
            <input
              type="email"
              value={localSettings.githubEmail}
              onChange={(e) => setLocalSettings({...localSettings, githubEmail: e.target.value})}
            />
          </label>
          <label>
            Anthropic API Key:
            <input
              type="password"
              value={localSettings.anthropicKey}
              onChange={(e) => setLocalSettings({...localSettings, anthropicKey: e.target.value})}
              placeholder="sk-ant-xxxxxxxxxxxx"
            />
          </label>
          <label>
            Font Size:
            <input
              type="number"
              value={localSettings.fontSize}
              onChange={(e) => setLocalSettings({...localSettings, fontSize: parseInt(e.target.value)})}
              min="10"
              max="24"
            />
          </label>
        </div>
        <div className="modal-actions">
          <button onClick={handleSave}>Save</button>
          <button onClick={onClose}>Cancel</button>
        </div>
      </div>
    </div>
  );
}
