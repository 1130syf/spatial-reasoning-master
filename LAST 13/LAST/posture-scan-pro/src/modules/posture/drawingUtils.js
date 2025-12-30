import * as mpDrawing from '@mediapipe/drawing_utils';
import * as mpPose from '@mediapipe/pose';

// 身体部位颜色编码配置
const BODY_PART_COLORS = {
  // 头部连接 - 红色系
  HEAD: {
    primary: '#dc2626',   // 红色
    secondary: '#ef4444', // 浅红色
    gradient: ['#dc2626', '#ef4444']
  },
  // 躯干连接 - 紫色系
  TORSO: {
    primary: '#9333ea',   // 紫色
    secondary: '#a855f7', // 浅紫色
    gradient: ['#9333ea', '#a855f7']
  },
  // 上肢连接 - 橙色系
  UPPER_LIMBS: {
    primary: '#ea580c',   // 橙色
    secondary: '#fb923c', // 浅橙色
    gradient: ['#ea580c', '#fb923c']
  },
  // 下肢连接 - 绿色系
  LOWER_LIMBS: {
    primary: '#16a34a',   // 绿色
    secondary: '#4ade80', // 浅绿色
    gradient: ['#16a34a', '#4ade80']
  }
};

// MediaPipe Pose 连接的身体部位分类
const CONNECTION_BODY_PARTS = {
  // 头部连接 (0-10)
  [mpPose.POSE_LANDMARKS_LEFT.HIP]: 'LOWER_LIMBS',
  [mpPose.POSE_LANDMARKS_LEFT.KNEE]: 'LOWER_LIMBS',
  [mpPose.POSE_LANDMARKS_LEFT.ANKLE]: 'LOWER_LIMBS',
  [mpPose.POSE_LANDMARKS_LEFT.HEEL]: 'LOWER_LIMBS',
  [mpPose.POSE_LANDMARKS_LEFT.FOOT_INDEX]: 'LOWER_LIMBS',
  [mpPose.POSE_LANDMARKS_RIGHT.HIP]: 'LOWER_LIMBS',
  [mpPose.POSE_LANDMARKS_RIGHT.KNEE]: 'LOWER_LIMBS',
  [mpPose.POSE_LANDMARKS_RIGHT.ANKLE]: 'LOWER_LIMBS',
  [mpPose.POSE_LANDMARKS_RIGHT.HEEL]: 'LOWER_LIMBS',
  [mpPose.POSE_LANDMARKS_RIGHT.FOOT_INDEX]: 'LOWER_LIMBS'
};

// 根据连接索引判断身体部位
const getBodyPartForConnection = (startIdx, endIdx) => {
  // 头部区域连接
  if ((startIdx >= 0 && startIdx <= 10) || (endIdx >= 0 && endIdx <= 10)) {
    return 'HEAD';
  }

  // 躯干连接 (肩膀到髋部的中心线)
  if ((startIdx === 11 && endIdx === 12) || (startIdx === 12 && endIdx === 11) || // 肩膀连线
      (startIdx === 11 && endIdx === 23) || (startIdx === 12 && endIdx === 24) || // 肩膀到髋部
      (startIdx === 23 && endIdx === 24) || (startIdx === 24 && endIdx === 23)) { // 髋部连线
    return 'TORSO';
  }

  // 上肢连接 (手臂)
  if ((startIdx >= 11 && startIdx <= 16 && startIdx !== 23) ||
      (endIdx >= 11 && endIdx <= 16 && endIdx !== 23)) {
    return 'UPPER_LIMBS';
  }

  // 下肢连接 (腿部)
  if ((startIdx >= 23 && startIdx <= 32) || (endIdx >= 23 && endIdx <= 32)) {
    return 'LOWER_LIMBS';
  }

  // 默认返回躯干
  return 'TORSO';
};

// 角度偏差状态评估函数
const getAngleStatus = (angle, type) => {
  if (type === 'knee') {
    // 深蹲角度范围：90-110度为正常
    if (angle >= 90 && angle <= 110) return { status: 'good', color: '#10b981' };
    if (angle >= 85 && angle <= 115) return { status: 'warning', color: '#f59e0b' };
    return { status: 'bad', color: '#ef4444' };
  } else {
    // 其他角度偏差：±5度为正常
    const absAngle = Math.abs(angle);
    if (absAngle <= 5) return { status: 'good', color: '#10b981' };
    if (absAngle <= 10) return { status: 'warning', color: '#f59e0b' };
    return { status: 'bad', color: '#ef4444' };
  }
};

// 获取角度连接线的状态和颜色
const getConnectionColor = (landmarks, connection, postureData) => {
  if (!postureData) {
    return { status: 'good', color: '#4f46e5' };
  }

  const startIdx = connection[0];
  const endIdx = connection[1];

  // 根据连接的起点和终点判断身体部位
  let angleValue = 0;
  let angleType = 'general';

  // 肩部水平线
  if ((startIdx === 11 && endIdx === 12) || (startIdx === 12 && endIdx === 11)) {
    angleValue = Math.abs(postureData.coronalAngles.shoulders.value || 0);
    angleType = 'shoulders';
  }

  // 躯干连接
  else if ((startIdx === 11 && endIdx === 23) || (startIdx === 12 && endIdx === 24)) {
    angleValue = Math.abs(postureData.sagittalAngles.trunk.value || 0);
    angleType = 'trunk';
  }

  // 髋部连接
  else if ((startIdx === 23 && endIdx === 24) || (startIdx === 24 && endIdx === 23)) {
    angleValue = Math.abs(postureData.coronalAngles.pelvis.value || 0);
    angleType = 'pelvis';
  }

  // 膝盖连接
  else if ((startIdx === 25 && endIdx === 27) || (startIdx === 26 && endIdx === 28) ||
           (startIdx === 23 && endIdx === 25) || (startIdx === 24 && endIdx === 26)) {
    angleValue = 90; // 膝盖角度默认值
    angleType = 'knee';
  }

  // 手臂连接
  else if ((startIdx === 11 && endIdx === 13) || (startIdx === 12 && endIdx === 14) ||
           (startIdx === 13 && endIdx === 15) || (startIdx === 14 && endIdx === 16)) {
    angleValue = 0; // 手臂角度暂不评估
    angleType = 'arm';
  }

  return getAngleStatus(angleValue, angleType);
};

const drawBalanceGrid = (ctx, width, height) => {
  ctx.save();
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
  ctx.lineWidth = 1;
  ctx.setLineDash([5, 5]);
  ctx.beginPath();
  ctx.moveTo(width / 2, 0);
  ctx.lineTo(width / 2, height);
  ctx.moveTo(0, height / 2);
  ctx.lineTo(width, height / 2);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.restore();
};

const drawIdealLines = (ctx, width, height) => {
    ctx.save();
    ctx.strokeStyle = 'rgba(0, 255, 100, 0.3)';
    ctx.lineWidth = 2;
    ctx.setLineDash([10, 10]);
    ctx.beginPath();
    ctx.moveTo(0, height * 0.3);
    ctx.lineTo(width, height * 0.3);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, height * 0.5);
    ctx.lineTo(width, height * 0.5);
    ctx.stroke();
    ctx.restore();
}

const drawOverlay = (ctx, width, height, text, color) => {
    ctx.save();
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, width, height);
    ctx.fillStyle = 'white';
    ctx.font = 'bold 30px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(text, width / 2, height / 2);
    ctx.restore();
}

export const drawCanvas = (ctx, videoElement, poseResults, settings, overlays, postureData = null) => {
  const { width, height } = ctx.canvas;
  ctx.save(); // Save the original context state
  ctx.clearRect(0, 0, width, height);

  // Apply horizontal flip if enabled. This will affect ALL subsequent drawing.
  if (settings.flipHorizontal) {
    ctx.translate(width, 0);
    ctx.scale(-1, 1);
  }

  // 1. Draw video feed (now it will be flipped if the setting is on)
  if (videoElement && videoElement.readyState >= 2) {
      ctx.drawImage(videoElement, 0, 0, width, height);
  }

  // 2. Draw overlays and landmarks (they will also be flipped correctly)
  if (poseResults && poseResults.poseLandmarks) {
    const landmarks = poseResults.poseLandmarks;

    if (settings.showBalanceGrid) drawBalanceGrid(ctx, width, height);
    if (settings.showIdealLines) drawIdealLines(ctx, width, height);

    // 带颜色编码的骨骼绘制
    if (settings.showSkeleton) {
      // 逐条绘制连接线，根据身体部位使用不同颜色
      mpPose.POSE_CONNECTIONS.forEach(connection => {
        const startIdx = connection[0];
        const endIdx = connection[1];

        if (startIdx < landmarks.length && endIdx < landmarks.length) {
          const start = landmarks[startIdx];
          const end = landmarks[endIdx];

          // 获取身体部位类型
          const bodyPart = getBodyPartForConnection(startIdx, endIdx);
          const bodyPartColors = BODY_PART_COLORS[bodyPart];

          // 获取连接线的状态和颜色
          let lineColor = bodyPartColors.primary; // 默认使用身体部位主色
          let lineWidth = 4;

          let connectionStatus = { status: 'good', color: bodyPartColors.primary };
          if (postureData) {
            connectionStatus = getConnectionColor(landmarks, connection, postureData);
            // 如果有姿态数据异常，优先使用状态颜色；否则使用身体部位颜色
            lineColor = connectionStatus.status === 'good' ? bodyPartColors.primary : connectionStatus.color;

            // 异常状态使用更粗的线条
            if (connectionStatus.status === 'warning') {
              lineWidth = 5;
            } else if (connectionStatus.status === 'bad') {
              lineWidth = 6;
            }
          }

          // 创建渐变效果（仅在正常状态下使用身体部位渐变）
          if (!postureData || connectionStatus.status === 'good') {
            const gradient = ctx.createLinearGradient(
              start.x * width, start.y * height,
              end.x * width, end.y * height
            );
            gradient.addColorStop(0, bodyPartColors.primary);
            gradient.addColorStop(1, bodyPartColors.secondary);
            lineColor = gradient;
          }

          // 绘制连接线
          ctx.beginPath();
          ctx.moveTo(start.x * width, start.y * height);
          ctx.lineTo(end.x * width, end.y * height);
          ctx.strokeStyle = lineColor;
          ctx.lineWidth = lineWidth;
          ctx.lineCap = 'round';
          ctx.stroke();

          // 异常状态添加发光效果
          if (postureData && (connectionStatus.status === 'warning' || connectionStatus.status === 'bad')) {
            ctx.save();
            ctx.strokeStyle = connectionStatus.color;
            ctx.lineWidth = lineWidth + 2;
            ctx.globalAlpha = 0.5;
            ctx.shadowColor = connectionStatus.color;
            ctx.shadowBlur = 8;
            ctx.stroke();
            ctx.restore();
          }
        }
      });
    }

    // 关键点也根据身体部位类型着色
    if (settings.showPoints) {
      landmarks.forEach((landmark, idx) => {
        // 获取关键点对应的身体部位
        let bodyPart = 'TORSO'; // 默认躯干
        let pointRadius = 6;

        // 根据关键点索引判断身体部位
        if (idx >= 0 && idx <= 10) {
          bodyPart = 'HEAD'; // 头部
        } else if ((idx >= 11 && idx <= 16 && idx !== 23)) {
          bodyPart = 'UPPER_LIMBS'; // 上肢
        } else if (idx >= 23 && idx <= 32) {
          bodyPart = 'LOWER_LIMBS'; // 下肢
        }

        const bodyPartColors = BODY_PART_COLORS[bodyPart];
        let pointColor = bodyPartColors.primary; // 默认使用身体部位主色

        if (postureData) {
          // 如果有姿态数据，优先使用状态颜色
          const pointStatus = getPointStatus(idx, landmarks, postureData);
          pointColor = pointStatus.status === 'good' ? bodyPartColors.primary : pointStatus.color;

          if (pointStatus.status === 'warning') {
            pointRadius = 7;
          } else if (pointStatus.status === 'bad') {
            pointRadius = 8;
          }
        }

        // 绘制关键点
        ctx.beginPath();
        ctx.arc(landmark.x * width, landmark.y * height, pointRadius, 0, 2 * Math.PI);
        ctx.fillStyle = pointColor;
        ctx.fill();

        // 添加白色边框
        ctx.strokeStyle = 'white';
        ctx.lineWidth = 2;
        ctx.stroke();
      });
    }
  }

  // Restore the context to its original state (un-flipped) to draw non-flipped UI elements
  ctx.restore();

  // 3. Draw capturing/calibrating overlays on top (these should not be flipped)
  if (overlays.isCapturing) {
      drawOverlay(ctx, width, height, '捕获中...', 'rgba(255, 0, 0, 0.3)');
  }
  if (overlays.isCalibrating) {
      drawOverlay(ctx, width, height, '校准中...请保持站立', 'rgba(0, 150, 255, 0.3)');
  }
};

// 获取关键点状态的简化函数
const getPointStatus = (pointIdx, landmarks, postureData) => {
  // 基于关键点索引判断相关身体部位
  const pointTypes = {
    11: 'shoulders', 12: 'shoulders', // 肩部
    13: 'elbow', 14: 'elbow',       // 手肘
    15: 'wrist', 16: 'wrist',       // 手腕
    23: 'hip', 24: 'hip',           // 髋部
    25: 'knee', 26: 'knee',         // 膝盖
    27: 'ankle', 28: 'ankle'        // 脚踝
  };

  const pointType = pointTypes[pointIdx];
  if (!pointType) return { status: 'good', color: '#818cf8' };

  let angleValue = 0;
  if (pointType === 'shoulders') {
    angleValue = postureData.coronalAngles.shoulders.value || 0;
  } else if (pointType === 'hip' || pointType === 'pelvis') {
    angleValue = postureData.coronalAngles.pelvis.value || 0;
  } else if (pointType === 'knee') {
    angleValue = 90; // 膝盖默认值
  }

  return getAngleStatus(angleValue, pointType === 'knee' ? 'knee' : 'general');
};
