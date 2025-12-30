// bicepCurlUtils.js

export const calculateAngle = (a, b, c) => {
  if (!a || !b || !c) {
    console.log('⚠️ calculateAngle: 关键点缺失', { a: !!a, b: !!b, c: !!c });
    return 0;
  }

  // 详细的输入数据验证和调试 - 只在前几次计算时输出
  if (!window.angleCalculationCount) window.angleCalculationCount = 0;
  window.angleCalculationCount++;

  if (window.angleCalculationCount <= 10 || window.angleCalculationCount % 60 === 0) {
    console.log('🧮 角度计算输入:', {
      a: { x: a.x?.toFixed(4), y: a.y?.toFixed(4), z: a.z?.toFixed(4) },
      b: { x: b.x?.toFixed(4), y: b.y?.toFixed(4), z: b.z?.toFixed(4) },
      c: { x: c.x?.toFixed(4), y: c.y?.toFixed(4), z: c.z?.toFixed(4) }
    });
  }

  // 计算向量 BA 和 BC
  const BA = { x: a.x - b.x, y: a.y - b.y };
  const BC = { x: c.x - b.x, y: c.y - b.y };

  // 计算向量长度
  const BA_length = Math.sqrt(BA.x * BA.x + BA.y * BA.y);
  const BC_length = Math.sqrt(BC.x * BC.x + BC.y * BC.y);

  // 如果任何向量的长度接近零，返回一个默认值
  if (BA_length < 0.001 || BC_length < 0.001) {
    console.log('⚠️ calculateAngle: 向量长度过小', { BA_length, BC_length });
    return 180; // 默认为伸展状态
  }

  // 计算点积
  const dotProduct = BA.x * BC.x + BA.y * BC.y;

  // 计算夹角（弧度）
  const cosAngle = dotProduct / (BA_length * BC_length);
  const clampedCosAngle = Math.max(-1, Math.min(1, cosAngle)); // 防止数值误差
  const radians = Math.acos(clampedCosAngle);

  // 转换为角度
  let angle = radians * 180.0 / Math.PI;

  // 角度范围验证
  if (isNaN(angle) || !isFinite(angle)) {
    console.log('❌ calculateAngle: 计算结果异常', { angle, cosAngle, clampedCosAngle, radians });
    return 180;
  }

  if (window.angleCalculationCount <= 10 || window.angleCalculationCount % 60 === 0) {
    console.log('🧮 角度计算结果:', {
      angle: angle.toFixed(2),
      radians: radians.toFixed(4),
      cosAngle: cosAngle.toFixed(4),
      BA_length: BA_length.toFixed(4),
      BC_length: BC_length.toFixed(4)
    });
  }

  return angle;
};

export const analyzeBicepCurlPerformance = (frames, params) => {
  // Use a very low frame requirement to allow for fast movements.
  if (frames.length < 3) { 
    return {
      isValid: false,
      report: ['动作幅度太小或太快，未计入有效次数。'],
    };
  }

  // --- FORCE RELAXED PARAMETERS ---
  // Ignore database values and use very lenient standards to ensure user success.
  const depthThreshold = 65;     // VERY LENIENT: Was 45 in DB. User only needs to bend past 65 degrees.
  const extensionThreshold = 145;  // VERY LENIENT: Was 170 in DB. Arm doesn't need to be fully straight.
  const stabilityTolerance = 0.3;  // EVEN MORE LENIENT: Allow for 30% movement of upper arm length.

  let minElbowAngle = 180;
  let maxElbowAngle = 0;
  let maxElbowMovement = 0;

  const firstFrame = frames[0];
  if (!firstFrame.shoulder || !firstFrame.elbow) {
      return {
          isValid: false,
          report: ['无法获取手臂关键点，请确保身体在画面内。']
      }
  }
  const armLength = Math.hypot(firstFrame.shoulder.x - firstFrame.elbow.x, firstFrame.shoulder.y - firstFrame.elbow.y);
  const stabilityPixelThreshold = armLength * stabilityTolerance;

  for (const frame of frames) {
    if (frame.elbowAngle < minElbowAngle) minElbowAngle = frame.elbowAngle;
    if (frame.elbowAngle > maxElbowAngle) maxElbowAngle = frame.elbowAngle;

    if (frame.elbow) {
        const elbowMovement = Math.hypot(frame.elbow.x - firstFrame.elbow.x, frame.elbow.y - firstFrame.elbow.y);
        if (elbowMovement > maxElbowMovement) maxElbowMovement = elbowMovement;
    }
  }

  const report = [];
  let isValid = true;

  // --- Stage 1: Range of Motion Analysis (with new relaxed thresholds) ---
  if (maxElbowAngle < extensionThreshold) {
    report.push(`❌ 手臂未充分伸展 (起始 ${maxElbowAngle.toFixed(0)}°)，目标需大于 ${extensionThreshold}°。`);
    isValid = false;
  } else {
    report.push(`✅ 手臂伸展达标 (起始 ${maxElbowAngle.toFixed(0)}°)。`);
  }
  
  if (minElbowAngle > depthThreshold) {
    report.push(`❌ 弯举高度不足 (顶峰 ${minElbowAngle.toFixed(0)}°)，目标需低于 ${depthThreshold}°。`);
    isValid = false;
  } else {
    report.push(`✅ 弯举高度达标 (顶峰 ${minElbowAngle.toFixed(0)}°)。`);
  }

  // --- Stage 2: Stability Analysis (with new relaxed threshold) ---
  if (maxElbowMovement > stabilityPixelThreshold) {
    report.push(`❌ 大臂不稳定，请将肘部固定在身体两侧。`);
    isValid = false;
  } else {
    report.push(`✅ 大臂稳定性良好。`);
  }

  // --- Final Verdict ---
  if (isValid) {
    report.unshift('✔️ 动作标准！计为有效次数。');
  } else {
    report.unshift('⚠️ 动作不标准，请根据提示调整。');
  }

  return { isValid, report };
};
