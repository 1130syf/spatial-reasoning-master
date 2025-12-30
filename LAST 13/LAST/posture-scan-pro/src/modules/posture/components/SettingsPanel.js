import React from 'react';
import './SettingsPanel.css';

const ToggleSwitch = ({ label, checked, onChange }) => (
  <div className="setting-item">
    <label>{label}</label>
    <label className="switch">
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
      />
      <span className="slider round"></span>
    </label>
  </div>
);

const SettingsPanel = ({ settings, onSettingsChange }) => {
  const handleToggle = (key) => {
    onSettingsChange({ [key]: !settings[key] });
  };

  return (
    <aside className="settings-panel">
      <div className="panel-header">
        <h3>显示设置</h3>
      </div>
      <div className="settings-list">
        <ToggleSwitch 
          label="水平翻转" 
          checked={settings.flipHorizontal} 
          onChange={() => handleToggle('flipHorizontal')} 
        />
        <ToggleSwitch 
          label="显示骨骼" 
          checked={settings.showSkeleton} 
          onChange={() => handleToggle('showSkeleton')} 
        />
        <ToggleSwitch 
          label="显示关键点" 
          checked={settings.showPoints} 
          onChange={() => handleToggle('showPoints')} 
        />
        <ToggleSwitch 
          label="显示角度" 
          checked={settings.showAngles} 
          onChange={() => handleToggle('showAngles')} 
        />
        <ToggleSwitch 
          label="显示平衡网格" 
          checked={settings.showBalanceGrid} 
          onChange={() => handleToggle('showBalanceGrid')} 
        />
        <ToggleSwitch 
          label="显示理想线条" 
          checked={settings.showIdealLines} 
          onChange={() => handleToggle('showIdealLines')} 
        />
        <ToggleSwitch 
          label="显示调试信息" 
          checked={settings.showDebugInfo} 
          onChange={() => handleToggle('showDebugInfo')} 
        />
      </div>
    </aside>
  );
};

export default SettingsPanel;
