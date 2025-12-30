import React from 'react';
import { 
  FaCamera, 
  FaStopCircle, 
  FaUpload, 
  FaSave, 
  FaSync, 
  FaExpand, 
  FaCompress,
  FaCameraRetro
} from 'react-icons/fa';
import './CaptureToolbar.css';

const CaptureToolbar = ({
  isCameraActive,
  isFullscreen,
  onStartCamera,
  onFileUploadClick,
  onToggleFullscreen,
  onCalibrate,
  onCapture,
  onSave,
  isCapturing,
  captureDisabled,
}) => {
  return (
    <div className="capture-toolbar">
      <div className="toolbar-group">
        <button className={`toolbar-button ${isCameraActive ? 'active' : ''}`} onClick={onStartCamera}>
          {isCameraActive ? <FaStopCircle /> : <FaCamera />}
          <span>{isCameraActive ? '停止摄像头' : '启动摄像头'}</span>
        </button>
        <button className="toolbar-button" onClick={onFileUploadClick}>
          <FaUpload />
          <span>上传文件</span>
        </button>
      </div>
      <div className="toolbar-group">
        <button className="toolbar-button primary" onClick={onCapture} disabled={isCapturing || captureDisabled}>
          <FaCameraRetro />
          <span>{isCapturing ? '捕获中...' : '手动捕获'}</span>
        </button>
        <button className="toolbar-button primary" onClick={onCalibrate} disabled={isCapturing || captureDisabled}>
          <FaSync />
          <span>{isCapturing ? '校准中...' : '校准'}</span>
        </button>
        <button className="toolbar-button primary" onClick={onSave} disabled={isCapturing}>
          <FaSave />
          <span>保存</span>
        </button>
      </div>
      <div className="toolbar-group">
        <button className="toolbar-button" onClick={onToggleFullscreen}>
          {isFullscreen ? <FaCompress /> : <FaExpand />}
          <span>{isFullscreen ? '退出全屏' : '全屏模式'}</span>
        </button>
      </div>
    </div>
  );
};

export default CaptureToolbar;
