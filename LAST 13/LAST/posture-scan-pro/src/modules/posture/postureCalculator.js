// --- Angle Calculation ---
const calculateAngle3D = (p1, p2, p3) => {
  if (!p1 || !p2 || !p3) return 0;
  const v1 = { x: p1.x - p2.x, y: p1.y - p2.y, z: p1.z - p2.z };
  const v2 = { x: p3.x - p2.x, y: p3.y - p2.y, z: p3.z - p2.z };
  const dot = v1.x * v2.x + v1.y * v2.y + v1.z * v2.z;
  const mag1 = Math.sqrt(v1.x ** 2 + v1.y ** 2 + v1.z ** 2);
  const mag2 = Math.sqrt(v2.x ** 2 + v2.y ** 2 + v2.z ** 2);
  if (mag1 === 0 || mag2 === 0) return 0;
  const angleRad = Math.acos(dot / (mag1 * mag2));
  return angleRad * (180 / Math.PI);
};

// 计算倾斜角度（高度差相对于水平距离的角度）
// 返回值：正值表示左边更低，负值表示右边更低
const calculateTilt = (leftPoint, rightPoint) => {
  if (!leftPoint || !rightPoint) return 0;
  // 高度差（图像坐标y向下为正，所以 leftPoint.y - rightPoint.y > 0 表示左边更低）
  const heightDiff = leftPoint.y - rightPoint.y;
  // 水平距离（取绝对值，确保角度计算正确）
  const widthDiff = Math.abs(leftPoint.x - rightPoint.x);
  
  // 如果水平距离太小，说明可能是侧面视角，使用简化计算
  if (widthDiff < 0.05) {
    // 简化计算：高度差 * 100 作为角度估算
    const angle = heightDiff * 100;
    return Math.max(-30, Math.min(30, angle)); // 限制范围
  }
  
  // 正常计算倾斜角度
  const angle = Math.atan2(heightDiff, widthDiff) * (180 / Math.PI);
  // 限制角度范围在 -30° 到 30°，避免异常值
  return Math.max(-30, Math.min(30, angle));
};

// --- Main Calculation Function ---
export const calculatePosture = (landmarks, prevPosture, isCalibrating = false) => {
  const newPostureData = JSON.parse(JSON.stringify(prevPosture)); // Deep copy
  
  // --- Key Landmark Definitions ---
  const leftShoulder = landmarks[11];
  const rightShoulder = landmarks[12];
  const leftHip = landmarks[23];
  const rightHip = landmarks[24];
  const leftKnee = landmarks[25];
  const rightKnee = landmarks[26];
  const leftAnkle = landmarks[27];
  const rightAnkle = landmarks[28];
  const nose = landmarks[0];
  const shoulderCenter = { x: (leftShoulder.x + rightShoulder.x) / 2, y: (leftShoulder.y + rightShoulder.y) / 2, z: (leftShoulder.z + rightShoulder.z) / 2 };

  // --- Angle Calculations ---
  const coronal = newPostureData.coronalAngles;
  // 使用倾斜角度计算，而非方向角
  coronal.shoulders.value = calculateTilt(leftShoulder, rightShoulder);
  coronal.pelvis.value = calculateTilt(leftHip, rightHip);
  // 头部倾斜：相对于肩膀中心的水平偏移
  coronal.head.value = (nose.x - shoulderCenter.x) * 100; // 转换为更直观的偏移值

  const sagittal = newPostureData.sagittalAngles;
  sagittal.head.value = -Math.atan2(nose.y - shoulderCenter.y, Math.sqrt((nose.x - shoulderCenter.x)**2 + (nose.z - shoulderCenter.z)**2)) * (180 / Math.PI);

  // --- Transverse Angles (旋转角度，基于z轴深度差异) ---
  const transverse = newPostureData.transverseAngles;
  // 肩部旋转：通过左右肩的z坐标差异计算
  if (leftShoulder && rightShoulder) {
    const shoulderZDiff = (leftShoulder.z - rightShoulder.z);
    const shoulderWidth = Math.abs(leftShoulder.x - rightShoulder.x);
    transverse.shoulders.value = shoulderWidth > 0 ? Math.atan2(shoulderZDiff, shoulderWidth) * (180 / Math.PI) : 0;
  }

  // --- Plumb Line Analysis (铅垂线分析，基于水平偏移) ---
  const plumb = newPostureData.plumbLine;
  const hipCenter = { x: (leftHip.x + rightHip.x) / 2, y: (leftHip.y + rightHip.y) / 2 };
  const ankleCenter = { x: (leftAnkle.x + rightAnkle.x) / 2, y: (leftAnkle.y + rightAnkle.y) / 2 };
  
  // 以踝关节中心为基准点的偏移量（转换为厘米，假设视野宽度约100cm）
  const pixelToCm = 100; // 假设归一化坐标1.0对应约100cm
  plumb.head.value = (nose.x - ankleCenter.x) * pixelToCm;
  plumb.shoulders.value = (shoulderCenter.x - ankleCenter.x) * pixelToCm;
  plumb.hips.value = (hipCenter.x - ankleCenter.x) * pixelToCm;

  // --- Calibration (只对角度和偏移量进行校准，不对balanceIndex校准) ---
  const calibratableKeys = ['coronalAngles', 'sagittalAngles', 'transverseAngles', 'plumbLine'];
  
  if (isCalibrating) {
    calibratableKeys.forEach(key => {
      const category = newPostureData[key];
      if (category) {
        Object.values(category).forEach(item => {
          if (item && typeof item.value === 'number') {
            item.neutral = item.value;
          }
        });
      }
    });
  }
  
  // Apply calibration offset (只对可校准的类别应用)
  calibratableKeys.forEach(key => {
    const category = newPostureData[key];
    if (category) {
      Object.values(category).forEach(item => {
        if (item && typeof item.value === 'number' && typeof item.neutral === 'number') {
          item.value -= item.neutral;
        }
      });
    }
  });

  // --- Balance Index Calculation ---
  const balance = newPostureData.balanceIndex;

  // Coronal (left-right) balance
  // 肩部和骨盆的倾斜角度，正常情况下应该在 -5° 到 5° 之间
  let coronalDeviation = Math.abs(coronal.shoulders.value) + Math.abs(coronal.pelvis.value || 0);
  // 调整系数：每1°偏差减2分，而不是5分，这样更合理
  balance.coronal.value = Math.max(0, Math.min(100, 100 - coronalDeviation * 2));

  // Sagittal (front-back) balance - based on head forward posture
  let sagittalDeviation = Math.abs(sagittal.head.value);
  balance.sagittal.value = Math.max(0, 100 - sagittalDeviation * 4); // Head posture is a strong indicator

  // Overall balance - weighted average
  balance.overall.value = (balance.coronal.value * 0.6) + (balance.sagittal.value * 0.4);


  // --- Alert Calculation ---
  const newAlerts = {};
  if (Math.abs(coronal.shoulders.value) > 5) newAlerts.shoulders = "肩膀不水平";
  if (Math.abs(coronal.pelvis.value || 0) > 3) newAlerts.pelvis = "骨盆倾斜";
  if (sagittal.head.value > 15) newAlerts.head = "头部过度前倾";

  return { newPostureData, newAlerts };
};


// --- Posture Advice Generation ---
export const getPostureAdvice = (postureData, alerts) => {
    const advices = [];
    if (alerts.shoulders) advices.push(`${alerts.shoulders} (${postureData.coronalAngles.shoulders.value.toFixed(1)}°)，请调整肩部高度。`);
    if (alerts.pelvis) advices.push(`${alerts.pelvis} (${postureData.coronalAngles.pelvis.value.toFixed(1)}°)，请调整站姿。`);
    if (alerts.head) advices.push(`${alerts.head} (${postureData.sagittalAngles.head.value.toFixed(1)}°)，请收回下巴。`);
    
    return advices;
}
