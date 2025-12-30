/**
 * 增强摄像头设置组件
 * 用于解决摄像头黑屏问题
 */

import React, { useRef, useState, useEffect, useCallback } from 'react';
import Webcam from 'react-webcam';
import { cameraManager } from './CameraUtils';

const EnhancedCameraSetup = ({
  onCameraReady,
  onCameraError,
  onFrame,
  width = 640,
  height = 480,
  mirrored = true,
  className = ''
}) => {
  const webcamRef = useRef(null);
  const [isInitializing, setIsInitializing] = useState(false);
  const [error, setError] = useState(null);
  const [devices, setDevices] = useState([]);
  const [selectedDevice, setSelectedDevice] = useState('');
  const [cameraStatus, setCameraStatus] = useState('idle');
  const [retryCount, setRetryCount] = useState(0);

  // 获取可用设备列表
  useEffect(() => {
    const loadDevices = async () => {
      try {
        const availableDevices = await cameraManager.enumerateDevices();
        setDevices(availableDevices);

        // 如果有设备且没有选择设备，选择第一个
        if (availableDevices.length > 0 && !selectedDevice) {
          const firstDevice = availableDevices[0];
          setSelectedDevice(firstDevice.deviceId);
        }
      } catch (error) {
        console.error('加载设备列表失败:', error);
      }
    };

    loadDevices();
  }, [selectedDevice]);

  // 监听摄像头状态变化
  useEffect(() => {
    const interval = setInterval(() => {
      const status = cameraManager.getStatus();
      setCameraStatus(status.active ? 'active' : 'inactive');
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // 初始化摄像头
  const initializeCamera = useCallback(async (deviceId) => {
    if (isInitializing) return;

    setIsInitializing(true);
    setError(null);

    try {
      console.log('开始初始化摄像头，设备ID:', deviceId);

      // 选择设备
      if (deviceId) {
        cameraManager.selectDevice(deviceId);
      }

      // 初始化摄像头
      const stream = await cameraManager.initializeCamera();

      // 设置webcam的流
      if (webcamRef.current && stream) {
        webcamRef.current.video.srcObject = stream;

        // 等待视频元数据加载
        await new Promise((resolve) => {
          if (webcamRef.current) {
            webcamRef.current.video.onloadedmetadata = resolve;
          } else {
            resolve();
          }
        });

        console.log('摄像头初始化成功');
        onCameraReady?.(stream);
      }
    } catch (error) {
      console.error('摄像头初始化失败:', error);
      setError(error.message);
      onCameraError?.(error);

      // 如果初始化失败，尝试备用方法
      if (retryCount < 2) {
        console.log(`尝试备用初始化方法 (${retryCount + 1}/3)`);
        setRetryCount(prev => prev + 1);

        setTimeout(async () => {
          try {
            const fallbackStream = await cameraManager.initializeCameraFallback();
            if (webcamRef.current && fallbackStream) {
              webcamRef.current.video.srcObject = fallbackStream;
              onCameraReady?.(fallbackStream);
            }
          } catch (fallbackError) {
            console.error('备用初始化也失败:', fallbackError);
          }
        }, 1000);
      }
    } finally {
      setIsInitializing(false);
    }
  }, [isInitializing, onCameraReady, onCameraError, retryCount]);

  // 组件挂载时初始化摄像头
  useEffect(() => {
    initializeCamera(selectedDevice);
  }, [selectedDevice]); // 只在设备变化时重新初始化

  // 处理帧数据
  const handleFrame = useCallback(() => {
    if (onFrame && webcamRef.current?.video && cameraManager.isActive()) {
      try {
        onFrame(webcamRef.current.video);
      } catch (error) {
        console.error('帧处理错误:', error);
      }
    }
  }, [onFrame]);

  // 重新初始化摄像头
  const reinitializeCamera = async () => {
    try {
      await cameraManager.stopCamera();
      setRetryCount(0);
      await initializeCamera(selectedDevice);
    } catch (error) {
      console.error('重新初始化失败:', error);
      setError(error.message);
    }
  };

  // 切换设备
  const handleDeviceChange = (deviceId) => {
    setSelectedDevice(deviceId);
    setRetryCount(0);
  };

  // 组件卸载时清理
  useEffect(() => {
    return () => {
      cameraManager.stopCamera();
    };
  }, []);

  if (error) {
    return (
      <div className="camera-error-container">
        <div className="error-message">
          <h3>摄像头初始化失败</h3>
          <p>{error}</p>

          {/* 设备选择 */}
          {devices.length > 1 && (
            <div className="device-selector">
              <label>选择摄像头设备:</label>
              <select
                value={selectedDevice}
                onChange={(e) => handleDeviceChange(e.target.value)}
                className="device-select"
              >
                {devices.map(device => (
                  <option key={device.deviceId} value={device.deviceId}>
                    {device.label || `摄像头 ${devices.indexOf(device) + 1}`}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* 重试按钮 */}
          <button onClick={reinitializeCamera} className="retry-button">
            重新尝试
          </button>

          {/* 故障排除提示 */}
          <div className="troubleshooting-tips">
            <h4>故障排除建议:</h4>
            <ul>
              <li>检查浏览器地址栏左侧是否有摄像头权限请求</li>
              <li>确保没有其他应用正在使用摄像头</li>
              <li>尝试刷新页面并重新授权摄像头权限</li>
              <li>检查摄像头硬件连接是否正常</li>
              <li>尝试使用不同的浏览器（推荐Chrome、Firefox、Edge）</li>
            </ul>
          </div>
        </div>

        <style jsx>{`
          .camera-error-container {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: 20px;
            background: #f8f9fa;
            border-radius: 8px;
            border: 2px dashed #dee2e6;
            min-height: 300px;
            text-align: center;
          }

          .error-message {
            max-width: 500px;
          }

          .error-message h3 {
            color: #dc3545;
            margin-bottom: 15px;
          }

          .error-message p {
            color: #6c757d;
            margin-bottom: 20px;
          }

          .device-selector {
            margin: 20px 0;
          }

          .device-selector label {
            display: block;
            margin-bottom: 8px;
            font-weight: bold;
            color: #495057;
          }

          .device-select {
            width: 100%;
            padding: 8px 12px;
            border: 1px solid #ced4da;
            border-radius: 4px;
            font-size: 14px;
          }

          .retry-button {
            background: #007bff;
            color: white;
            border: none;
            padding: 10px 20px;
            border-radius: 4px;
            cursor: pointer;
            font-size: 14px;
            margin-bottom: 20px;
          }

          .retry-button:hover {
            background: #0056b3;
          }

          .troubleshooting-tips {
            text-align: left;
            background: #fff;
            padding: 15px;
            border-radius: 4px;
            border: 1px solid #dee2e6;
          }

          .troubleshooting-tips h4 {
            margin-top: 0;
            color: #495057;
          }

          .troubleshooting-tips ul {
            margin: 10px 0;
            padding-left: 20px;
          }

          .troubleshooting-tips li {
            margin: 8px 0;
            color: #6c757d;
            font-size: 13px;
            line-height: 1.4;
          }
        `}</style>
      </div>
    );
  }

  // 加载状态
  if (isInitializing) {
    return (
      <div className="camera-loading-container">
        <div className="loading-content">
          <div className="spinner"></div>
          <p>正在初始化摄像头...</p>
          {retryCount > 0 && (
            <p className="retry-info">正在尝试备用方法 ({retryCount}/3)</p>
          )}
        </div>

        <style jsx>{`
          .camera-loading-container {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: 20px;
            background: #f8f9fa;
            border-radius: 8px;
            min-height: 300px;
          }

          .loading-content {
            text-align: center;
          }

          .spinner {
            width: 40px;
            height: 40px;
            border: 4px solid #f3f3f3;
            border-top: 4px solid #007bff;
            border-radius: 50%;
            animation: spin 1s linear infinite;
            margin: 0 auto 15px;
          }

          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }

          .loading-content p {
            color: #6c757d;
            margin: 5px 0;
          }

          .retry-info {
            color: #ffc107;
            font-size: 14px;
          }
        `}</style>
      </div>
    );
  }

  // 正常摄像头显示
  return (
    <div className={`enhanced-camera-container ${className}`}>
      {/* 设备选择器（可选） */}
      {devices.length > 1 && (
        <div className="device-selector-top">
          <select
            value={selectedDevice}
            onChange={(e) => handleDeviceChange(e.target.value)}
            className="device-select-top"
          >
            {devices.map(device => (
              <option key={device.deviceId} value={device.deviceId}>
                {device.label || `摄像头 ${devices.indexOf(device) + 1}`}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* 摄像头组件 */}
      <Webcam
        ref={webcamRef}
        width={width}
        height={height}
        mirrored={mirrored}
        onUserMedia={() => {
          console.log('摄像头媒体流已建立');
          setCameraStatus('active');
        }}
        onUserMediaError={(error) => {
          console.error('摄像头媒体流错误:', error);
          setError(error.message);
          onCameraError?.(error);
        }}
        style={{
          width: '100%',
          height: 'auto',
          maxWidth: `${width}px`,
          display: 'block'
        }}
        videoConstraints={{
          width: { ideal: width, max: width * 2 },
          height: { ideal: height, max: height * 2 },
          facingMode: 'user',
          deviceId: selectedDevice ? { exact: selectedDevice } : undefined
        }}
      />

      {/* 状态指示器 */}
      <div className="camera-status-indicator">
        <div className={`status-dot ${cameraStatus}`}></div>
        <span className="status-text">
          {cameraStatus === 'active' ? '摄像头正常' : '摄像头未激活'}
        </span>
      </div>

      <style jsx>{`
        .enhanced-camera-container {
          position: relative;
          display: inline-block;
        }

        .device-selector-top {
          position: absolute;
          top: 10px;
          right: 10px;
          z-index: 10;
        }

        .device-select-top {
          background: rgba(0, 0, 0, 0.7);
          color: white;
          border: none;
          padding: 5px 10px;
          border-radius: 4px;
          font-size: 12px;
        }

        .camera-status-indicator {
          position: absolute;
          bottom: 10px;
          left: 10px;
          display: flex;
          align-items: center;
          background: rgba(0, 0, 0, 0.7);
          padding: 5px 10px;
          border-radius: 15px;
          z-index: 10;
        }

        .status-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          margin-right: 8px;
        }

        .status-dot.active {
          background: #28a745;
          box-shadow: 0 0 5px #28a745;
        }

        .status-dot.inactive {
          background: #dc3545;
        }

        .status-text {
          color: white;
          font-size: 12px;
        }
      `}</style>
    </div>
  );
};

export default EnhancedCameraSetup;