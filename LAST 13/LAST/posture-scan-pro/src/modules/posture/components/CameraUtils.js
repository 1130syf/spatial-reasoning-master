/**
 * 摄像头工具模块 - 解决摄像头黑屏问题
 * 包含摄像头初始化、权限检查、设备选择等功能
 */

export class CameraManager {
  constructor() {
    this.stream = null;
    this.constraints = {
      video: {
        width: { ideal: 640, max: 1280 },
        height: { ideal: 480, max: 720 },
        facingMode: 'user', // 明确指定前置摄像头
        frameRate: { ideal: 30, max: 60 }
      }
    };
    this.devices = [];
    this.selectedDeviceId = null;
  }

  /**
   * 检查摄像头权限
   */
  async checkPermission() {
    try {
      const permission = await navigator.permissions.query({ name: 'camera' });
      return permission.state;
    } catch (error) {
      console.warn('权限API不支持:', error);
      return 'unknown';
    }
  }

  /**
   * 请求摄像头权限
   */
  async requestPermission() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true
      });
      // 立即关闭测试流
      stream.getTracks().forEach(track => track.stop());
      return true;
    } catch (error) {
      console.error('摄像头权限请求失败:', error);
      throw error;
    }
  }

  /**
   * 枚举可用的摄像头设备
   */
  async enumerateDevices() {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      this.devices = devices.filter(device => device.kind === 'videoinput');
      return this.devices;
    } catch (error) {
      console.error('设备枚举失败:', error);
      return [];
    }
  }

  /**
   * 选择特定的摄像头设备
   */
  selectDevice(deviceId) {
    this.selectedDeviceId = deviceId;
    if (deviceId) {
      this.constraints.video.deviceId = { exact: deviceId };
    } else {
      delete this.constraints.video.deviceId;
    }
  }

  /**
   * 获取优化的摄像头约束
   */
  getOptimizedConstraints() {
    // 根据设备能力调整约束
    const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    const isTablet = /iPad|Android(?!.*Mobile)/i.test(navigator.userAgent);

    const optimizedConstraints = { ...this.constraints };

    if (isMobile || isTablet) {
      // 移动设备使用较低分辨率以提升性能
      optimizedConstraints.video.width = { ideal: 480, max: 640 };
      optimizedConstraints.video.height = { ideal: 360, max: 480 };
      optimizedConstraints.video.frameRate = { ideal: 24, max: 30 };
    }

    return optimizedConstraints;
  }

  /**
   * 初始化摄像头
   */
  async initializeCamera() {
    try {
      // 停止现有流
      await this.stopCamera();

      // 首先尝试获取权限
      await this.requestPermission();

      // 使用优化的约束
      const constraints = this.getOptimizedConstraints();
      console.log('使用摄像头约束:', constraints);

      // 获取摄像头流
      this.stream = await navigator.mediaDevices.getUserMedia(constraints);

      // 检查流状态
      const videoTrack = this.stream.getVideoTracks()[0];
      if (videoTrack) {
        const settings = videoTrack.getSettings();
        console.log('摄像头设置:', settings);

        // 验证实际的分辨率和帧率
        if (settings.width < 320 || settings.height < 240) {
          console.warn('摄像头分辨率较低，可能影响识别效果');
        }

        if (settings.frameRate < 15) {
          console.warn('摄像头帧率较低，可能影响实时性');
        }

        // 监听轨道状态
        videoTrack.addEventListener('ended', () => {
          console.log('摄像头轨道已结束');
          this.stream = null;
        });

        videoTrack.addEventListener('mute', () => {
          console.warn('摄像头轨道已静音');
        });

        videoTrack.addEventListener('unmute', () => {
          console.log('摄像头轨道已取消静音');
        });
      }

      return this.stream;
    } catch (error) {
      console.error('摄像头初始化失败:', error);

      // 根据错误类型提供具体建议
      switch (error.name) {
        case 'NotAllowedError':
          throw new Error('摄像头权限被拒绝。请在浏览器中允许摄像头访问。');
        case 'NotFoundError':
          throw new Error('未找到摄像头设备。请检查摄像头是否正确连接。');
        case 'NotReadableError':
          throw new Error('摄像头被其他应用占用。请关闭其他使用摄像头的应用。');
        case 'OverconstrainedError':
          throw new Error('摄像头不支持当前设置。正在尝试备用设置...');
        case 'SecurityError':
          throw new Error('安全限制导致无法访问摄像头。请确保使用HTTPS或localhost访问。');
        default:
          throw new Error(`摄像头访问失败: ${error.message}`);
      }
    }
  }

  /**
   * 备用初始化方法（使用更宽松的约束）
   */
  async initializeCameraFallback() {
    console.log('尝试使用备用摄像头设置...');

    const fallbackConstraints = {
      video: {
        width: { ideal: 320, max: 640 },
        height: { ideal: 240, max: 480 },
        facingMode: 'user'
      }
    };

    try {
      await this.stopCamera();
      this.stream = await navigator.mediaDevices.getUserMedia(fallbackConstraints);
      console.log('备用摄像头设置成功');
      return this.stream;
    } catch (error) {
      console.error('备用摄像头设置也失败:', error);
      throw new Error('无法初始化摄像头，请检查设备和权限设置。');
    }
  }

  /**
   * 停止摄像头
   */
  async stopCamera() {
    if (this.stream) {
      try {
        const tracks = this.stream.getTracks();
        tracks.forEach(track => {
          track.stop();
        });
        this.stream = null;
        console.log('摄像头已停止');
      } catch (error) {
        console.error('停止摄像头时出错:', error);
      }
    }
  }

  /**
   * 获取当前流
   */
  getStream() {
    return this.stream;
  }

  /**
   * 检查摄像头是否活动
   */
  isActive() {
    return this.stream && this.stream.active;
  }

  /**
   * 获取摄像头状态信息
   */
  getStatus() {
    if (!this.stream) {
      return { active: false, devices: 0 };
    }

    const videoTrack = this.stream.getVideoTracks()[0];
    if (videoTrack) {
      const settings = videoTrack.getSettings();
      const capabilities = videoTrack.getCapabilities?.() || {};

      return {
        active: videoTrack.enabled,
        muted: videoTrack.muted,
        settings: {
          width: settings.width,
          height: settings.height,
          frameRate: settings.frameRate,
          facingMode: settings.facingMode
        },
        capabilities: {
          width: capabilities.width,
          height: capabilities.height,
          frameRate: capabilities.frameRate
        },
        devices: this.devices.length
      };
    }

    return { active: false, devices: this.devices.length };
  }

  /**
   * 重新初始化摄像头（用于错误恢复）
   */
  async reinitialize() {
    try {
      await this.stopCamera();
      await new Promise(resolve => setTimeout(resolve, 1000)); // 等待1秒
      return await this.initializeCamera();
    } catch (error) {
      console.error('重新初始化摄像头失败:', error);
      // 尝试备用方法
      return await this.initializeCameraFallback();
    }
  }
}

// 创建全局单例实例
export const cameraManager = new CameraManager();

/**
 * React Hook: 使用摄像头管理器
 */
export function useCamera() {
  const [status, setStatus] = React.useState('idle');
  const [error, setError] = React.useState(null);
  const [cameraStatus, setCameraStatus] = React.useState(null);

  React.useEffect(() => {
    const updateStatus = () => {
      setCameraStatus(cameraManager.getStatus());
    };

    const interval = setInterval(updateStatus, 1000);
    updateStatus();

    return () => clearInterval(interval);
  }, []);

  const initialize = async (deviceId) => {
    setStatus('initializing');
    setError(null);

    try {
      if (deviceId) {
        cameraManager.selectDevice(deviceId);
      }

      const stream = await cameraManager.initializeCamera();
      setStatus('active');
      return stream;
    } catch (err) {
      setError(err.message);
      setStatus('error');
      throw err;
    }
  };

  const stop = async () => {
    try {
      await cameraManager.stopCamera();
      setStatus('idle');
      setError(null);
    } catch (err) {
      setError(err.message);
      setStatus('error');
    }
  };

  const reinitialize = async () => {
    setStatus('reinitializing');
    try {
      const stream = await cameraManager.reinitialize();
      setStatus('active');
      return stream;
    } catch (err) {
      setError(err.message);
      setStatus('error');
      throw err;
    }
  };

  return {
    status,
    error,
    cameraStatus,
    initialize,
    stop,
    reinitialize,
    manager: cameraManager
  };
}

export default cameraManager;