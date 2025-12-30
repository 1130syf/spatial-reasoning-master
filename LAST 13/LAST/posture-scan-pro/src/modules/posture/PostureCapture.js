import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import * as poseDetection from '@mediapipe/pose';
import { Camera } from '@mediapipe/camera_utils';
import { FaVideo } from 'react-icons/fa';
import api from '../../api';

import './PostureCapture.css';
import AnalysisPanel from './components/AnalysisPanel';
import SettingsPanel from './components/SettingsPanel';
import CaptureToolbar from './components/CaptureToolbar';
import { drawCanvas } from './drawingUtils';
import { calculatePosture, getPostureAdvice } from './postureCalculator';

const initialPostureData = {
  sagittalAngles: { head: { value: 0 }, neck: { value: 0 }, trunk: { value: 0 }, pelvis: { value: 0 } },
  coronalAngles: { head: { value: 0 }, shoulders: { value: 0 }, pelvis: { value: null }, knees: { value: null } },
  transverseAngles: { shoulders: { value: 0 }, pelvis: { value: null } },
  plumbLine: { head: { value: 0 }, shoulders: { value: 0 }, hips: { value: null }, knees: { value: null }, ankles: { value: null } },
  balanceIndex: { overall: { value: 100 }, sagittal: { value: 100 }, coronal: { value: 100 }, transverse: { value: 100 } },
};

const PostureCapture = () => {
  const navigate = useNavigate();
  const { patientId } = useParams();
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const poseRef = useRef(null);
  const cameraRef = useRef(null);
  const fileInputRef = useRef(null);
  const postureDataRef = useRef(initialPostureData);
  const isMountedRef = useRef(true); // 跟踪组件是否已挂载

  const [postureData, setPostureData] = useState(initialPostureData);
  const [poseResults, setPoseResults] = useState(null);
  const [poseDetected, setPoseDetected] = useState(false);
  const [alerts, setAlerts] = useState({});
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const [isCalibrating, setIsCalibrating] = useState(false);
  const [capturedFrames, setCapturedFrames] = useState([]);
  const [errorMessage, setErrorMessage] = useState('');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [settings, setSettings] = useState({
    flipHorizontal: true,
    showSkeleton: true,
    showPoints: true,
    showAngles: false,
    showBalanceGrid: true,
    showIdealLines: true,
    showDebugInfo: false,
  });

  useEffect(() => {
    postureDataRef.current = postureData;
  }, [postureData]);

  const onResults = useCallback((results) => {
    setPoseResults(results);
    if (results.poseLandmarks) {
      setPoseDetected(true);
      const { newPostureData, newAlerts } = calculatePosture(results.poseLandmarks, postureDataRef.current);
      setPostureData(newPostureData);
      setAlerts(newAlerts);
    } else {
      setPoseDetected(false);
    }
  }, []);

  useEffect(() => {
    isMountedRef.current = true;

    // 检查WebGL支持
    const checkWebGLSupport = () => {
      try {
        const canvas = document.createElement('canvas');
        const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
        if (!gl) {
          console.warn('WebGL不支持，将使用CPU模式');
          setErrorMessage('WebGL不支持，姿态检测性能可能较慢');
          return false;
        }
        return true;
      } catch (e) {
        console.error('WebGL检查失败:', e);
        return false;
      }
    };

    const hasWebGL = checkWebGLSupport();

    // 创建Pose实例
    const pose = new poseDetection.Pose({
      locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/pose@0.5.1675469404/${file}`,
      // 添加WebGL配置选项
      runtime: hasWebGL ? 'tfjs' : 'tfjs-wasm'
    });

    pose.setOptions({
      modelComplexity: 1,
      smoothLandmarks: true,
      enableSegmentation: false,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5,
      // 添加更多兼容性选项
      enableSmoothing: true,
      staticImageMode: false,
      maxNumFaces: 1
    });

    pose.onResults(onResults);
    poseRef.current = pose;

    return () => {
      isMountedRef.current = false;
      // 先停止摄像头，确保不再发送帧
      if (cameraRef.current) {
        cameraRef.current.stop();
        cameraRef.current = null;
      }
      // 延迟关闭 pose 对象，确保所有异步操作完成
      setTimeout(() => {
        poseRef.current?.close();
      }, 100);
    };
  }, [onResults]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    drawCanvas(ctx, videoRef.current, poseResults, settings, { isCalibrating, isCapturing }, postureData);
  }, [poseResults, settings, isCalibrating, isCapturing, postureData]);

  const setupCamera = () => {
    const video = videoRef.current;
    if (!video) return;
    cameraRef.current = new Camera(video, {
      onFrame: async () => {
        // 检查组件是否仍然挂载且 pose 对象存在
        if (!isMountedRef.current || !poseRef.current) return;
        if (video.readyState >= 2 && video.videoWidth > 0) {
          try {
            await poseRef.current.send({ image: video });
          } catch (error) {
            // 忽略组件卸载后的错误
            if (isMountedRef.current) {
              console.error('Pose detection error:', error);
            }
          }
        }
      },
      width: 1280,
      height: 720,
    });
    cameraRef.current.start();
  };

  const startCamera = async () => {
    if (isCameraActive) {
      stopCamera();
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { width: { ideal: 1280 }, height: { ideal: 720 } } });
      const video = videoRef.current;
      video.srcObject = stream;
      video.onloadedmetadata = () => {
        video.play();
        setIsCameraActive(true);
        setupCamera();
      };
    } catch (err) {
      setErrorMessage("无法访问摄像头，请检查权限。");
    }
  };

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;
    stopCamera();
    const url = URL.createObjectURL(file);
    const video = videoRef.current;
    video.srcObject = null;
    video.src = url;
    video.loop = true;
    video.onloadedmetadata = () => {
      video.play();
      setIsCameraActive(true);
      setupCamera();
    };
  };

  const stopCamera = () => {
    if (cameraRef.current) {
      cameraRef.current.stop();
      cameraRef.current = null;
    }
    if (videoRef.current && videoRef.current.srcObject) {
      videoRef.current.srcObject.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
  };

  const handleCapture = () => {
    if (!poseDetected) {
      setErrorMessage('未检测到姿态!');
      return;
    }
    setIsCapturing(true);
    const captureData = {
      timestamp: new Date(),
      screenshot: canvasRef.current.toDataURL('image/png'),
      // 使用深拷贝确保捕获的数据不会被后续实时更新影响
      postureData: JSON.parse(JSON.stringify(postureData)),
    };
    setCapturedFrames(prev => [...prev, captureData]);
    setTimeout(() => setIsCapturing(false), 300);
  };

  const handleCalibrate = () => {
    if (!poseDetected) {
      setErrorMessage('未检测到姿态，无法校准!');
      return;
    }
    setIsCalibrating(true);
    setTimeout(() => {
      const { newPostureData } = calculatePosture(poseResults.poseLandmarks, postureData, true);
      setPostureData(newPostureData);
      setIsCalibrating(false);
      setErrorMessage('校准完成!');
    }, 3000);
  };

  const handleSave = async () => {
    if (capturedFrames.length === 0) {
      setErrorMessage('请先至少进行一次“手动捕获”！');
      setTimeout(() => setErrorMessage(''), 3000);
      return;
    }
    if (!patientId) {
      setErrorMessage('错误：未关联任何人员！无法保存。');
      setTimeout(() => setErrorMessage(''), 3000);
      return;
    }
    try {
      const lastCapture = capturedFrames[capturedFrames.length - 1];
      setErrorMessage('正在保存到数据库...');
      await api.addAssessment({
        patientId: parseInt(patientId, 10),
        assessmentData: lastCapture.postureData,
        screenshot: lastCapture.screenshot,
      });
      setErrorMessage('报告已成功保存！');
      // 保存成功后先停止摄像头，再导航
      stopCamera();
      setTimeout(() => {
        if (isMountedRef.current) {
          setErrorMessage('');
          navigate('/reports');
        }
      }, 2000);
    } catch (error) {
      console.error("Failed to save assessment:", error);
      setErrorMessage(`保存失败: ${error.message}`);
      setTimeout(() => setErrorMessage(''), 3000);
    }
  };

  const handleSettingsChange = (newSettings) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  };

  const toggleFullscreen = () => {
    // Implementation for fullscreen
  };

  return (
    <div className={`capture-container ${isFullscreen ? 'fullscreen' : ''}`}>
      <div className="main-view">
        <video ref={videoRef} autoPlay playsInline muted className="video-feed" style={{ display: 'none' }} />
        <canvas ref={canvasRef} className="output-canvas" width="1280" height="720" />
        {!isCameraActive && (
          <div className="placeholder">
            <div className="placeholder-content">
              <FaVideo size={80} />
              <h2>姿态捕捉</h2>
              <p>请启动摄像头或上传视频文件开始分析</p>
            </div>
          </div>
        )}
        {errorMessage && <div className="error-toast">{errorMessage}</div>}
      </div>
      <AnalysisPanel data={postureData} isDetecting={poseDetected} advice={getPostureAdvice(postureData, alerts)} />
      <SettingsPanel settings={settings} onSettingsChange={handleSettingsChange} />
      <CaptureToolbar
        isCameraActive={isCameraActive}
        isFullscreen={isFullscreen}
        onStartCamera={startCamera}
        onFileUploadClick={() => fileInputRef.current.click()}
        onToggleFullscreen={toggleFullscreen}
        onCalibrate={handleCalibrate}
        onCapture={handleCapture}
        onSave={handleSave}
        isCapturing={isCapturing || isCalibrating}
        captureDisabled={!poseDetected}
      />
      <input
        type="file"
        ref={fileInputRef}
        style={{ display: 'none' }}
        accept="video/*,image/*"
        onChange={handleFileUpload}
      />
    </div>
  );
};

export default PostureCapture;
