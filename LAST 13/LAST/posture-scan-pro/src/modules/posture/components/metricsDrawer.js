// metricsDrawer.js

/**
 * Draws a set of enhanced leader lines on the canvas with smooth bezier curves.
 * @param {CanvasRenderingContext2D} ctx The canvas context.
 * @param {Array<object>} lines An array of line objects to draw. Each object should have { startX, startY, endX, endY, color }.
 */
export function drawMetrics(ctx, lines) {
  if (!ctx || !lines || lines.length === 0) {
    return;
  }

  lines.forEach(line => {
    if (!line) return;

    const { startX, startY, endX, endY, color = '#4f46e5' } = line;
    
    // Calculate control points for smooth bezier curve
    const dx = endX - startX;
    const dy = endY - startY;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    // Create smooth S-curve for more natural connection
    const curveFactor = Math.min(distance * 0.3, 80);
    const cp1x = startX + curveFactor;
    const cp1y = startY;
    const cp2x = endX - curveFactor;
    const cp2y = endY;

    // Draw glow effect (shadow)
    ctx.save();
    ctx.shadowColor = color;
    ctx.shadowBlur = 8;
    ctx.strokeStyle = color;
    ctx.lineWidth = 3;
    ctx.globalAlpha = 0.4;
    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, endX, endY);
    ctx.stroke();
    ctx.restore();

    // Draw main line with gradient
    const gradient = ctx.createLinearGradient(startX, startY, endX, endY);
    const isHighlighted = color === '#f59e0b';
    
    if (isHighlighted) {
      gradient.addColorStop(0, 'rgba(245, 158, 11, 0.8)');
      gradient.addColorStop(0.5, 'rgba(251, 191, 36, 1)');
      gradient.addColorStop(1, 'rgba(245, 158, 11, 0.8)');
    } else {
      gradient.addColorStop(0, 'rgba(107, 114, 128, 0.6)');
      gradient.addColorStop(0.5, 'rgba(156, 163, 175, 0.9)');
      gradient.addColorStop(1, 'rgba(107, 114, 128, 0.6)');
    }

    ctx.save();
    ctx.strokeStyle = gradient;
    ctx.lineWidth = isHighlighted ? 3 : 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, endX, endY);
    ctx.stroke();
    ctx.restore();

    // Draw enhanced connection points
    drawConnectionPoint(ctx, startX, startY, color, isHighlighted, 'diagram');
    drawConnectionPoint(ctx, endX, endY, color, isHighlighted, 'landmark');
  });
}

/**
 * Draws an enhanced connection point with rings and glow effects.
 * @param {CanvasRenderingContext2D} ctx The canvas context.
 * @param {number} x X coordinate.
 * @param {number} y Y coordinate.
 * @param {string} color Point color.
 * @param {boolean} isHighlighted Whether the point is highlighted.
 * @param {string} type Type of point ('diagram' or 'landmark').
 */
function drawConnectionPoint(ctx, x, y, color, isHighlighted, type) {
  ctx.save();
  
  if (isHighlighted) {
    // Outer glow ring
    ctx.beginPath();
    ctx.arc(x, y, 12, 0, 2 * Math.PI);
    const glowGradient = ctx.createRadialGradient(x, y, 0, x, y, 12);
    glowGradient.addColorStop(0, 'rgba(251, 191, 36, 0.4)');
    glowGradient.addColorStop(1, 'rgba(245, 158, 11, 0)');
    ctx.fillStyle = glowGradient;
    ctx.fill();
    
    // Middle ring
    ctx.beginPath();
    ctx.arc(x, y, 7, 0, 2 * Math.PI);
    ctx.strokeStyle = 'rgba(251, 191, 36, 0.8)';
    ctx.lineWidth = 2;
    ctx.stroke();
  }
  
  // Main point
  ctx.beginPath();
  ctx.arc(x, y, isHighlighted ? 5 : 4, 0, 2 * Math.PI);
  
  if (type === 'landmark') {
    // Landmark point with gradient
    const pointGradient = ctx.createRadialGradient(x, y, 0, x, y, isHighlighted ? 5 : 4);
    if (isHighlighted) {
      pointGradient.addColorStop(0, '#fbbf24');
      pointGradient.addColorStop(1, '#f59e0b');
    } else {
      pointGradient.addColorStop(0, '#9ca3af');
      pointGradient.addColorStop(1, '#6b7280');
    }
    ctx.fillStyle = pointGradient;
    ctx.fill();
  } else {
    // Diagram point with solid color and border
    ctx.fillStyle = isHighlighted ? '#f59e0b' : '#6b7280';
    ctx.fill();
    ctx.strokeStyle = isHighlighted ? '#fbbf24' : '#9ca3af';
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }
  
  ctx.restore();
}
