export const calculateAngle = (a, b, c) => {
  if (!a || !b || !c) return 0;
  
  const radians = Math.atan2(c.y - b.y, c.x - b.x) - Math.atan2(a.y - b.y, a.x - b.x);
  let angle = Math.abs(radians * 180.0 / Math.PI);
  
  if (angle > 180.0) {
    angle = 360 - angle;
  }
  
  return angle;
};

export const analyzeSquatPerformance = (squatFrames) => {
  if (squatFrames.length < 5) {
    return {
      isValid: false,
      report: ['动作幅度太小，未计入有效次数。'],
    };
  }

  let minKneeAngle = 180;
  let backWasNotStraight = false;

  for (const frame of squatFrames) {
    const { avgKneeAngle, avgHipAngle } = frame;
    if (avgKneeAngle < minKneeAngle) minKneeAngle = avgKneeAngle;
    if (avgHipAngle < avgKneeAngle - 15) { // Increased threshold for back straightness
      backWasNotStraight = true;
    }
  }

  const report = [];
  let isValid = true;

  if (minKneeAngle > 100) {
    report.push(`深蹲深度不足 (最低 ${minKneeAngle.toFixed(0)}°)。`);
    isValid = false;
  } else {
    report.push(`深度达标 (最低 ${minKneeAngle.toFixed(0)}°)。`);
  }

  if (backWasNotStraight) {
    report.push('请注意保持背部挺直。');
  } else {
    report.push('背部姿态良好。');
  }

  return { isValid, report };
};
