// 全局变量
let currentTool = 'cube';
let currentColor = '#ff6b6b';
let currentMode = 'build';
let gridSize = 10;
let gridHeight = 5;
let showGrid = true;
let rotationAngle = 45; // 旋转角度

// 视图控制
let viewScale = 1.0; // 缩放比例
let viewOffsetX = 0; // 视图偏移X
let viewOffsetY = 0; // 视图偏移Y
let isDragging = false; // 是否正在拖动
let dragStartX = 0; // 拖动起始X
let dragStartY = 0; // 拖动起始Y
let isSpacePressed = false; // 空格键是否按下
let isRotateMode = false; // 旋转模式
let rotateStartX = 0; // 旋转起始X
let rotateStartY = 0; // 旋转起始Y
let viewRotationX = 30; // 垂直旋转角度（俯仰角）
let viewRotationY = 45; // 水平旋转角度（方位角）

// 多面体数据
let polyhedrons = [];
let currentPolyhedron = null;
let polyhedronCounter = 1;

// 网格数据
let gridData = {}; // key: "x,y,z", value: {x, y, z, color}

// Canvas相关
let buildCanvas, buildCtx;
let assembleCanvas, assembleCtx;

// 初始化函数
function init() {
    console.log('初始化3D系统...');

    buildCanvas = document.getElementById('buildCanvas');
    assembleCanvas = document.getElementById('assembleCanvas');

    if (!buildCanvas || !assembleCanvas) {
        console.error('找不到Canvas元素');
        return;
    }

    buildCtx = buildCanvas.getContext('2d');
    assembleCtx = assembleCanvas.getContext('2d');

    // 设置canvas尺寸
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // 绑定事件
    setupEventListeners();

    // 初始绘制
    drawBuildScene();
    drawAssembleScene();

    updateStatus('系统初始化完成');
    updateObjectCount();
    console.log('系统初始化成功');
}

// 调整Canvas尺寸
function resizeCanvas() {
    const buildPanel = document.getElementById('buildPanel');
    const assemblePanel = document.getElementById('assemblePanel');

    if (buildPanel && buildCanvas) {
        buildCanvas.width = buildPanel.clientWidth - 4;
        buildCanvas.height = buildPanel.clientHeight - 4;
        drawBuildScene();
    }

    if (assemblePanel && assembleCanvas) {
        assembleCanvas.width = assemblePanel.clientWidth - 4;
        assembleCanvas.height = assemblePanel.clientHeight - 4;
        drawAssembleScene();
    }
}

// 3D到2D的等轴测投影（支持360度旋转）
function project3DTo2D(x, y, z) {
    // 将角度转换为弧度
    const radY = viewRotationY * Math.PI / 180; // 水平旋转（方位角）
    const radX = viewRotationX * Math.PI / 180; // 垂直旋转（俯仰角）

    // 第一步：绕Y轴水平旋转（方位角旋转）
    const x1 = x * Math.cos(radY) - z * Math.sin(radY);
    const z1 = x * Math.sin(radY) + z * Math.cos(radY);
    const y1 = y;

    // 第二步：绕X轴垂直旋转（俯仰角旋转）
    const y2 = y1 * Math.cos(radX) - z1 * Math.sin(radX);
    const z2 = y1 * Math.sin(radX) + z1 * Math.cos(radX);
    const x2 = x1;

    // 简单的透视投影
    const isoX = x2;
    const isoY = -y2; // Y轴向上为正

    return {
        x: isoX,
        y: isoY,
        z: z2 // 保留深度用于排序
    };
}

// 应用视图变换（缩放和平移）
function applyViewTransform(x, y, canvasWidth, canvasHeight) {
    // 先缩放，再平移
    const centerX = canvasWidth / 2;
    const centerY = canvasHeight / 2;

    const scaledX = x * viewScale;
    const scaledY = y * viewScale;

    return {
        x: scaledX + viewOffsetX + centerX,
        y: scaledY + viewOffsetY + centerY
    };
}

// 绘制3D立方体（完整的六面体）
function draw3DCube(ctx, x, y, z, color, size = 30) {
    const halfSize = 0.5;

    // 计算立方体的8个顶点（世界坐标）
    const vertices3D = [
        { x: x - halfSize, y: y - halfSize, z: z - halfSize }, // 0: 左下后
        { x: x + halfSize, y: y - halfSize, z: z - halfSize }, // 1: 右下后
        { x: x + halfSize, y: y - halfSize, z: z + halfSize }, // 2: 右下前
        { x: x - halfSize, y: y - halfSize, z: z + halfSize }, // 3: 左下前
        { x: x - halfSize, y: y + halfSize, z: z - halfSize }, // 4: 左上后
        { x: x + halfSize, y: y + halfSize, z: z - halfSize }, // 5: 右上后
        { x: x + halfSize, y: y + halfSize, z: z + halfSize }, // 6: 右上前
        { x: x - halfSize, y: y + halfSize, z: z + halfSize }  // 7: 左上前
    ];

    // 投影所有顶点到2D屏幕坐标
    const vertices2D = vertices3D.map(v => {
        const projected = project3DTo2D(v.x, v.y, v.z);
        const transformed = applyViewTransform(projected.x * size, projected.y * size, buildCanvas.width, buildCanvas.height);
        return {
            x: transformed.x,
            y: transformed.y,
            z: projected.z // 保留深度值
        };
    });

    // 定义6个面（每个面由4个顶点索引组成）
    const faces = [
        { name: 'top',    indices: [4, 5, 6, 7], normal: { x: 0, y: 1, z: 0 } },  // 顶面
        { name: 'bottom', indices: [0, 1, 2, 3], normal: { x: 0, y: -1, z: 0 } }, // 底面
        { name: 'front',  indices: [3, 2, 6, 7], normal: { x: 0, y: 0, z: 1 } },  // 前面
        { name: 'back',   indices: [0, 1, 5, 4], normal: { x: 0, y: 0, z: -1 } }, // 后面
        { name: 'right',  indices: [1, 2, 6, 5], normal: { x: 1, y: 0, z: 0 } },  // 右面
        { name: 'left',   indices: [0, 3, 7, 4], normal: { x: -1, y: 0, z: 0 } }  // 左面
    ];

    // 计算视角方向（从相机指向原点）
    const radY = viewRotationY * Math.PI / 180;
    const radX = viewRotationX * Math.PI / 180;
    const viewDir = {
        x: Math.sin(radY) * Math.cos(radX),
        y: -Math.sin(radX),
        z: -Math.cos(radY) * Math.cos(radX)
    };

    // 计算每个面的平均深度，用于排序
    const facesWithDepth = faces.map(face => {
        const avgZ = face.indices.reduce((sum, idx) => sum + vertices2D[idx].z, 0) / 4;
        return { ...face, avgZ };
    });

    // 按深度排序（远的先画）
    facesWithDepth.sort((a, b) => a.avgZ - b.avgZ);

    // 绘制所有面（从远到近）
    facesWithDepth.forEach(face => {
        // 计算面法线与视角方向的点积
        const dotProduct = face.normal.x * viewDir.x + face.normal.y * viewDir.y + face.normal.z * viewDir.z;

        // 根据面的朝向调整颜色亮度
        let faceColor;
        const brightness = Math.abs(dotProduct);

        if (face.name === 'top') {
            faceColor = lightenColor(color, 20);
        } else if (face.name === 'bottom') {
            faceColor = darkenColor(color, 30);
        } else {
            // 侧面根据角度调整亮度
            if (brightness > 0.5) {
                faceColor = color;
            } else {
                faceColor = darkenColor(color, (1 - brightness) * 15);
            }
        }

        ctx.fillStyle = faceColor;
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 1;

        ctx.beginPath();
        const firstIdx = face.indices[0];
        ctx.moveTo(vertices2D[firstIdx].x, vertices2D[firstIdx].y);
        for (let i = 1; i < face.indices.length; i++) {
            const idx = face.indices[i];
            ctx.lineTo(vertices2D[idx].x, vertices2D[idx].y);
        }
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
    });

    // 计算中心点的屏幕坐标
    const centerProjected = project3DTo2D(x, y, z);
    const centerTransformed = applyViewTransform(centerProjected.x * size, centerProjected.y * size, buildCanvas.width, buildCanvas.height);

    return {
        x: centerTransformed.x,
        y: centerTransformed.y,
        z: centerProjected.z
    };
}

// 颜色变亮
function lightenColor(color, percent) {
    const num = parseInt(color.replace('#', ''), 16);
    const amt = Math.round(2.55 * percent);
    const R = (num >> 16) + amt;
    const G = (num >> 8 & 0x00FF) + amt;
    const B = (num & 0x0000FF) + amt;
    return '#' + (0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
        (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 +
        (B < 255 ? B < 1 ? 0 : B : 255))
        .toString(16).slice(1);
}

// 颜色变暗
function darkenColor(color, percent) {
    const num = parseInt(color.replace('#', ''), 16);
    const amt = Math.round(2.55 * percent);
    const R = (num >> 16) - amt;
    const G = (num >> 8 & 0x00FF) - amt;
    const B = (num & 0x0000FF) - amt;
    return '#' + (0x1000000 + (R > 0 ? R : 0) * 0x10000 +
        (G > 0 ? G : 0) * 0x100 +
        (B > 0 ? B : 0))
        .toString(16).slice(1);
}

// 绘制搭建场景
function drawBuildScene() {
    if (!buildCtx || !buildCanvas) return;

    const ctx = buildCtx;
    const width = buildCanvas.width;
    const height = buildCanvas.height;

    // 清空画布
    ctx.fillStyle = '#f0f0f0';
    ctx.fillRect(0, 0, width, height);

    // 绘制底板网格
    if (showGrid) {
        drawGridFloor(ctx);
    }

    // 收集所有方块并计算投影深度
    const cubes = Object.values(gridData).map(cube => {
        const projected = project3DTo2D(cube.x, cube.y, cube.z);
        return {
            ...cube,
            depth: projected.z
        };
    });

    // 按深度排序（远的先画）
    cubes.sort((a, b) => a.depth - b.depth);

    // 绘制所有方块
    cubes.forEach(cube => {
        draw3DCube(ctx, cube.x, cube.y, cube.z, cube.color);
    });

    // 绘制当前鼠标位置的预览
    drawPreview(ctx);
}

// 绘制网格底板
function drawGridFloor(ctx) {
    const size = 30;

    ctx.strokeStyle = '#ddd';
    ctx.lineWidth = 1;

    // 绘制网格线
    for (let i = -gridSize; i <= gridSize; i++) {
        // X方向的线
        const start1 = project3DTo2D(i, 0, -gridSize);
        const end1 = project3DTo2D(i, 0, gridSize);

        const startTransformed = applyViewTransform(start1.x * size, start1.y * size, buildCanvas.width, buildCanvas.height);
        const endTransformed = applyViewTransform(end1.x * size, end1.y * size, buildCanvas.width, buildCanvas.height);

        ctx.beginPath();
        ctx.moveTo(startTransformed.x, startTransformed.y);
        ctx.lineTo(endTransformed.x, endTransformed.y);
        ctx.stroke();

        // Z方向的线
        const start2 = project3DTo2D(-gridSize, 0, i);
        const end2 = project3DTo2D(gridSize, 0, i);

        const start2Transformed = applyViewTransform(start2.x * size, start2.y * size, buildCanvas.width, buildCanvas.height);
        const end2Transformed = applyViewTransform(end2.x * size, end2.y * size, buildCanvas.width, buildCanvas.height);

        ctx.beginPath();
        ctx.moveTo(start2Transformed.x, start2Transformed.y);
        ctx.lineTo(end2Transformed.x, end2Transformed.y);
        ctx.stroke();
    }
}

// 绘制鼠标预览
let mouseGridPos = null;
let hoveredFace = null; // 当前悬停的面信息

function drawPreview(ctx) {
    if (currentTool !== 'cube') return;

    if (hoveredFace) {
        // 如果悬停在某个面上，在该面上绘制预览
        const { x, y, z, cubeX, cubeY, cubeZ, normal } = hoveredFace;
        ctx.globalAlpha = 0.5;
        draw3DCube(ctx, x, y, z, currentColor);
        ctx.globalAlpha = 1.0;

        // 高亮显示被悬停的面（在原有方块上）
        highlightFace(ctx, hoveredFace);
    } else if (mouseGridPos) {
        // 原有逻辑：在地面网格上放置
        const { x, z } = mouseGridPos;

        // 找到该位置最高的方块
        let maxY = -1;
        for (let y = 0; y < gridHeight; y++) {
            const key = `${x},${y},${z}`;
            if (gridData[key]) {
                maxY = y;
            }
        }

        const previewY = maxY + 1;
        if (previewY >= gridHeight) return;

        // 绘制半透明预览
        ctx.globalAlpha = 0.5;
        draw3DCube(ctx, x, previewY, z, currentColor);
        ctx.globalAlpha = 1.0;
    }
}

// 高亮显示某个面
function highlightFace(ctx, faceInfo) {
    const { cubeX, cubeY, cubeZ, normal } = faceInfo;
    const halfSize = 0.5;
    const size = 30;

    // 计算面的顶点
    let faceVertices = [];
    if (normal.x === 1) { // 右面
        faceVertices = [
            { x: cubeX + halfSize, y: cubeY - halfSize, z: cubeZ - halfSize },
            { x: cubeX + halfSize, y: cubeY - halfSize, z: cubeZ + halfSize },
            { x: cubeX + halfSize, y: cubeY + halfSize, z: cubeZ + halfSize },
            { x: cubeX + halfSize, y: cubeY + halfSize, z: cubeZ - halfSize }
        ];
    } else if (normal.x === -1) { // 左面
        faceVertices = [
            { x: cubeX - halfSize, y: cubeY - halfSize, z: cubeZ + halfSize },
            { x: cubeX - halfSize, y: cubeY - halfSize, z: cubeZ - halfSize },
            { x: cubeX - halfSize, y: cubeY + halfSize, z: cubeZ - halfSize },
            { x: cubeX - halfSize, y: cubeY + halfSize, z: cubeZ + halfSize }
        ];
    } else if (normal.y === 1) { // 顶面
        faceVertices = [
            { x: cubeX - halfSize, y: cubeY + halfSize, z: cubeZ - halfSize },
            { x: cubeX + halfSize, y: cubeY + halfSize, z: cubeZ - halfSize },
            { x: cubeX + halfSize, y: cubeY + halfSize, z: cubeZ + halfSize },
            { x: cubeX - halfSize, y: cubeY + halfSize, z: cubeZ + halfSize }
        ];
    } else if (normal.y === -1) { // 底面
        faceVertices = [
            { x: cubeX - halfSize, y: cubeY - halfSize, z: cubeZ + halfSize },
            { x: cubeX + halfSize, y: cubeY - halfSize, z: cubeZ + halfSize },
            { x: cubeX + halfSize, y: cubeY - halfSize, z: cubeZ - halfSize },
            { x: cubeX - halfSize, y: cubeY - halfSize, z: cubeZ - halfSize }
        ];
    } else if (normal.z === 1) { // 前面
        faceVertices = [
            { x: cubeX - halfSize, y: cubeY - halfSize, z: cubeZ + halfSize },
            { x: cubeX + halfSize, y: cubeY - halfSize, z: cubeZ + halfSize },
            { x: cubeX + halfSize, y: cubeY + halfSize, z: cubeZ + halfSize },
            { x: cubeX - halfSize, y: cubeY + halfSize, z: cubeZ + halfSize }
        ];
    } else if (normal.z === -1) { // 后面
        faceVertices = [
            { x: cubeX + halfSize, y: cubeY - halfSize, z: cubeZ - halfSize },
            { x: cubeX - halfSize, y: cubeY - halfSize, z: cubeZ - halfSize },
            { x: cubeX - halfSize, y: cubeY + halfSize, z: cubeZ - halfSize },
            { x: cubeX + halfSize, y: cubeY + halfSize, z: cubeZ - halfSize }
        ];
    }

    // 投影并绘制高亮边框
    const points2D = faceVertices.map(v => {
        const projected = project3DTo2D(v.x, v.y, v.z);
        const transformed = applyViewTransform(projected.x * size, projected.y * size, buildCanvas.width, buildCanvas.height);
        return transformed;
    });

    ctx.strokeStyle = '#00ff00';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(points2D[0].x, points2D[0].y);
    for (let i = 1; i < points2D.length; i++) {
        ctx.lineTo(points2D[i].x, points2D[i].y);
    }
    ctx.closePath();
    ctx.stroke();
    ctx.lineWidth = 1;
}

// 绘制拼合场景
function drawAssembleScene() {
    if (!assembleCtx || !assembleCanvas) return;

    const ctx = assembleCtx;
    const width = assembleCanvas.width;
    const height = assembleCanvas.height;

    // 清空画布
    ctx.fillStyle = '#f8f9fa';
    ctx.fillRect(0, 0, width, height);

    // 绘制网格底板
    const size = 20;
    const centerX = width / 2;
    const centerY = height / 2;

    ctx.strokeStyle = '#e0e0e0';
    ctx.lineWidth = 1;

    for (let i = -15; i <= 15; i++) {
        for (let j = -15; j <= 15; j++) {
            const projected = project3DTo2D(i, 0, j);
            const x = centerX + projected.x * size;
            const y = centerY + projected.y * size;

            ctx.strokeRect(x - size/2, y - size/2, size, size);
        }
    }

    // 绘制所有多面体
    polyhedrons.forEach(poly => {
        if (poly.position) {
            drawPolyhedron3D(ctx, poly, size);
        }
    });
}

// 绘制多面体（3D）
function drawPolyhedron3D(ctx, polyhedron, size = 20) {
    const cubes = polyhedron.cubes;

    // 按深度排序
    cubes.sort((a, b) => {
        const projA = project3DTo2D(a.x, a.y, a.z);
        const projB = project3DTo2D(b.x, b.y, b.z);
        return (projA.y - projB.y) || (projA.x - projB.x);
    });

    const centerX = polyhedron.position.x;
    const centerY = polyhedron.position.y;

    // 绘制每个方块
    cubes.forEach(cube => {
        const projected = project3DTo2D(cube.x, cube.y, cube.z);
        const x = centerX + projected.x * size;
        const y = centerY + projected.y * size;

        // 简化的3D方块绘制
        const halfSize = size / 2;

        // 顶面
        ctx.fillStyle = lightenColor(cube.color, 20);
        ctx.beginPath();
        ctx.moveTo(x, y - halfSize);
        ctx.lineTo(x + halfSize, y - halfSize * 0.5);
        ctx.lineTo(x, y);
        ctx.lineTo(x - halfSize, y - halfSize * 0.5);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 1;
        ctx.stroke();

        // 右面
        ctx.fillStyle = cube.color;
        ctx.beginPath();
        ctx.moveTo(x + halfSize, y - halfSize * 0.5);
        ctx.lineTo(x + halfSize, y + halfSize * 0.5);
        ctx.lineTo(x, y + halfSize);
        ctx.lineTo(x, y);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // 左面
        ctx.fillStyle = darkenColor(cube.color, 20);
        ctx.beginPath();
        ctx.moveTo(x - halfSize, y - halfSize * 0.5);
        ctx.lineTo(x - halfSize, y + halfSize * 0.5);
        ctx.lineTo(x, y + halfSize);
        ctx.lineTo(x, y);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
    });

    // 绘制名称
    ctx.fillStyle = '#333';
    ctx.font = 'bold 14px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(polyhedron.name, centerX, centerY - 100);
}

// 设置事件监听器
function setupEventListeners() {
    if (buildCanvas) {
        buildCanvas.addEventListener('click', onBuildClick);
        buildCanvas.addEventListener('contextmenu', onBuildRightClick);
        buildCanvas.addEventListener('mousemove', onBuildMouseMove);
        buildCanvas.addEventListener('wheel', onBuildWheel);
        buildCanvas.addEventListener('mousedown', onBuildMouseDown);
        buildCanvas.addEventListener('mouseup', onBuildMouseUp);
        buildCanvas.addEventListener('mouseleave', onBuildMouseUp);
    }

    // 键盘快捷键
    document.addEventListener('keydown', (event) => {
        if (event.code === 'Space') {
            if (!isSpacePressed) {
                isSpacePressed = true;
                if (buildCanvas) {
                    buildCanvas.style.cursor = 'grab';
                }
                const spaceStatus = document.getElementById('spaceStatus');
                if (spaceStatus) {
                    spaceStatus.style.display = 'block';
                }
                console.log('空格键按下，isSpacePressed设置为true');
            }
            event.preventDefault();
            event.stopPropagation();
            return false;
        }

        switch(event.key) {
            case '1':
                if (!isSpacePressed) setTool('cube');
                break;
            case '2':
                if (!isSpacePressed) setTool('erase');
                break;
            case '3':
                if (!isSpacePressed) setTool('paint');
                break;
            case 'ArrowLeft':
                if (!isSpacePressed) {
                    viewRotationY -= 5;
                    if (viewRotationY < 0) viewRotationY += 360;
                    drawBuildScene();
                }
                break;
            case 'ArrowRight':
                if (!isSpacePressed) {
                    viewRotationY += 5;
                    if (viewRotationY >= 360) viewRotationY -= 360;
                    drawBuildScene();
                }
                break;
            case 'r':
            case 'R':
                if (isSpacePressed) {
                    // 重置视图
                    resetView();
                }
                break;
        }
    });

    document.addEventListener('keyup', (event) => {
        if (event.code === 'Space') {
            isSpacePressed = false;
            if (buildCanvas) {
                buildCanvas.style.cursor = 'crosshair';
            }
            const spaceStatus = document.getElementById('spaceStatus');
            if (spaceStatus) {
                spaceStatus.style.display = 'none';
            }
            console.log('空格键释放，isSpacePressed设置为false');
        }
    });
}

// 从屏幕坐标获取网格位置
function getGridFromScreen(screenX, screenY) {
    const size = 30;

    // 逆向应用视图变换
    const centerX = buildCanvas.width / 2;
    const centerY = buildCanvas.height / 2;

    const relX = (screenX - viewOffsetX - centerX) / viewScale;
    const relY = (screenY - viewOffsetY - centerY) / viewScale;

    // 从3D投影反推（与project3DTo2D相反）
    // project3DTo2D: isoX = x2, isoY = -y2
    // 其中: x2 = x*cos(Y) - z*sin(Y), y2 = y*cos(X) - z*sin(X)
    // 对于网格平面(y=0), y2 = -z*sin(X), z*sin(X) = -y2
    const radY = viewRotationY * Math.PI / 180;
    const radX = viewRotationX * Math.PI / 180;

    // 简化计算：假设在y=0平面上
    // isoX = x*cos(Y) - z*sin(Y)
    // isoY = z*sin(X)
    // 解这个方程组得到x和z

    const sinY = Math.sin(radY);
    const cosY = Math.cos(radY);
    const sinX = Math.sin(radX);
    const cosX = Math.cos(radX);

    // 从isoY = z*sin(X) 得到 z (考虑y2的符号)
    const z2 = -relY / size;  // 因为isoY = -y2
    const z_approx = z2 / (sinX + 0.001); // 避免除以0

    // 从isoX = x*cos(Y) - z*sin(Y) 得到 x
    const x2 = relX / size;
    const x_approx = (x2 + z_approx * sinY) / (cosY + 0.001);

    const x = Math.round(x_approx);
    const z = Math.round(z_approx);

    return { x, z };
}

// 鼠标按下事件
function onBuildMouseDown(event) {
    // 右键拖动：旋转视角
    if (event.button === 2) {
        isRotateMode = true;
        rotateStartX = event.clientX;
        rotateStartY = event.clientY;
        buildCanvas.style.cursor = 'move';
        event.preventDefault();
        event.stopPropagation();
        console.log('开始旋转视角');
        return false;
    }

    // 空格键+左键或中键：平移视图
    if (event.button === 1 || (event.button === 0 && isSpacePressed)) {
        isDragging = true;
        dragStartX = event.clientX;
        dragStartY = event.clientY;
        buildCanvas.style.cursor = 'grabbing';
        event.preventDefault();
        event.stopPropagation();
        console.log('开始平移视图');
        return false;
    }
}

// 鼠标释放事件
function onBuildMouseUp(event) {
    if (isDragging) {
        isDragging = false;
        buildCanvas.style.cursor = isSpacePressed ? 'grab' : 'crosshair';
    }

    if (isRotateMode) {
        isRotateMode = false;
        buildCanvas.style.cursor = isSpacePressed ? 'grab' : 'crosshair';
        console.log('旋转结束');
    }
}

// 鼠标移动事件（处理拖动）
function onBuildMouseMove(event) {
    // 处理旋转视角（360度旋转）
    if (isRotateMode) {
        const deltaX = event.clientX - rotateStartX;
        const deltaY = event.clientY - rotateStartY;

        // 水平移动控制水平旋转（方位角）
        viewRotationY += deltaX * 0.5;

        // 垂直移动控制垂直旋转（俯仰角），限制在-80到80度之间
        viewRotationX -= deltaY * 0.5;
        viewRotationX = Math.max(-80, Math.min(80, viewRotationX));

        // 限制水平旋转角度在0-360度之间
        if (viewRotationY >= 360) viewRotationY -= 360;
        if (viewRotationY < 0) viewRotationY += 360;

        rotateStartX = event.clientX;
        rotateStartY = event.clientY;

        drawBuildScene();
        updateStatus(`旋转: H${viewRotationY.toFixed(0)}° V${viewRotationX.toFixed(0)}°`);
        return;
    }

    // 处理平移（空格键按下或中键拖动）
    if (isDragging) {
        const deltaX = event.clientX - dragStartX;
        const deltaY = event.clientY - dragStartY;

        viewOffsetX += deltaX;
        viewOffsetY += deltaY;

        dragStartX = event.clientX;
        dragStartY = event.clientY;

        drawBuildScene();
        updateStatus(`偏移: (${viewOffsetX.toFixed(0)}, ${viewOffsetY.toFixed(0)})`);
        return;
    }

    // 如果正在按空格键但不在拖动状态，不处理其他鼠标移动
    if (isSpacePressed) {
        return;
    }

    // 原有的鼠标移动逻辑
    const rect = buildCanvas.getBoundingClientRect();
    const screenX = event.clientX - rect.left;
    const screenY = event.clientY - rect.top;

    // 检测是否悬停在某个方块的面上
    hoveredFace = detectHoveredFace(screenX, screenY);

    if (hoveredFace) {
        // 如果悬停在某个面上，清空网格位置，更新坐标显示
        mouseGridPos = null;
        const coordinatesElement = document.getElementById('coordinates');
        if (coordinatesElement) {
            coordinatesElement.textContent = `X: ${hoveredFace.x}, Y: ${hoveredFace.y}, Z: ${hoveredFace.z}`;
        }
        drawBuildScene(); // 重绘以显示预览
        return;
    }

    // 原有逻辑：检测网格位置
    const { x, z } = getGridFromScreen(screenX, screenY);

    if (x >= -gridSize/2 && x < gridSize/2 && z >= -gridSize/2 && z < gridSize/2) {
        mouseGridPos = { x, z };
        const coordinatesElement = document.getElementById('coordinates');
        if (coordinatesElement) {
            coordinatesElement.textContent = `X: ${x}, Y: 0, Z: ${z}`;
        }
        drawBuildScene(); // 重绘以显示预览
    } else {
        // 超出网格范围，清空位置
        mouseGridPos = null;
        drawBuildScene();
    }
}

// 检测鼠标是否悬停在某个方块的面上
function detectHoveredFace(screenX, screenY) {
    const cubes = Object.values(gridData);
    if (cubes.length === 0) return null;

    const size = 30;
    const halfSize = 0.5;

    // 收集所有可见面并按深度排序
    let allFaces = [];

    // 计算视角方向
    const radY = viewRotationY * Math.PI / 180;
    const radX = viewRotationX * Math.PI / 180;
    const viewDir = {
        x: Math.sin(radY) * Math.cos(radX),
        y: -Math.sin(radX),
        z: -Math.cos(radY) * Math.cos(radX)
    };

    // 对每个方块，检测其所有面（包括背面朝向的）
    for (const cube of cubes) {
        const faces = [
            { normal: { x: 0, y: 1, z: 0 }, name: 'top' },    // 顶面
            { normal: { x: 0, y: -1, z: 0 }, name: 'bottom' }, // 底面
            { normal: { x: 0, y: 0, z: 1 }, name: 'front' },  // 前面
            { normal: { x: 0, y: 0, z: -1 }, name: 'back' },   // 后面
            { normal: { x: 1, y: 0, z: 0 }, name: 'right' },  // 右面
            { normal: { x: -1, y: 0, z: 0 }, name: 'left' }    // 左面
        ];

        for (const face of faces) {
            // 计算面法线与视角方向的点积
            const dotProduct = face.normal.x * viewDir.x + face.normal.y * viewDir.y + face.normal.z * viewDir.z;
            const isFacingCamera = dotProduct < 0; // 面朝向相机

            // 跳过完全背向相机的面（只检测至少部分可见的面）
            if (dotProduct > 0.5) continue; // 完全背向，跳过

            // 计算面的四个顶点
            let faceVertices = [];
            if (face.normal.x === 1) { // 右面
                faceVertices = [
                    { x: cube.x + halfSize, y: cube.y - halfSize, z: cube.z - halfSize },
                    { x: cube.x + halfSize, y: cube.y - halfSize, z: cube.z + halfSize },
                    { x: cube.x + halfSize, y: cube.y + halfSize, z: cube.z + halfSize },
                    { x: cube.x + halfSize, y: cube.y + halfSize, z: cube.z - halfSize }
                ];
            } else if (face.normal.x === -1) { // 左面
                faceVertices = [
                    { x: cube.x - halfSize, y: cube.y - halfSize, z: cube.z + halfSize },
                    { x: cube.x - halfSize, y: cube.y - halfSize, z: cube.z - halfSize },
                    { x: cube.x - halfSize, y: cube.y + halfSize, z: cube.z - halfSize },
                    { x: cube.x - halfSize, y: cube.y + halfSize, z: cube.z + halfSize }
                ];
            } else if (face.normal.y === 1) { // 顶面
                faceVertices = [
                    { x: cube.x - halfSize, y: cube.y + halfSize, z: cube.z - halfSize },
                    { x: cube.x + halfSize, y: cube.y + halfSize, z: cube.z - halfSize },
                    { x: cube.x + halfSize, y: cube.y + halfSize, z: cube.z + halfSize },
                    { x: cube.x - halfSize, y: cube.y + halfSize, z: cube.z + halfSize }
                ];
            } else if (face.normal.y === -1) { // 底面
                faceVertices = [
                    { x: cube.x - halfSize, y: cube.y - halfSize, z: cube.z + halfSize },
                    { x: cube.x + halfSize, y: cube.y - halfSize, z: cube.z + halfSize },
                    { x: cube.x + halfSize, y: cube.y - halfSize, z: cube.z - halfSize },
                    { x: cube.x - halfSize, y: cube.y - halfSize, z: cube.z - halfSize }
                ];
            } else if (face.normal.z === 1) { // 前面
                faceVertices = [
                    { x: cube.x - halfSize, y: cube.y - halfSize, z: cube.z + halfSize },
                    { x: cube.x + halfSize, y: cube.y - halfSize, z: cube.z + halfSize },
                    { x: cube.x + halfSize, y: cube.y + halfSize, z: cube.z + halfSize },
                    { x: cube.x - halfSize, y: cube.y + halfSize, z: cube.z + halfSize }
                ];
            } else if (face.normal.z === -1) { // 后面
                faceVertices = [
                    { x: cube.x + halfSize, y: cube.y - halfSize, z: cube.z - halfSize },
                    { x: cube.x - halfSize, y: cube.y - halfSize, z: cube.z - halfSize },
                    { x: cube.x - halfSize, y: cube.y + halfSize, z: cube.z - halfSize },
                    { x: cube.x + halfSize, y: cube.y + halfSize, z: cube.z - halfSize }
                ];
            }

            // 投影到2D
            const points2D = faceVertices.map(v => {
                const projected = project3DTo2D(v.x, v.y, v.z);
                const transformed = applyViewTransform(projected.x * size, projected.y * size, buildCanvas.width, buildCanvas.height);
                return { x: transformed.x, y: transformed.y, z: projected.z };
            });

            // 计算面的中心深度
            const avgDepth = points2D.reduce((sum, p) => sum + p.z, 0) / 4;

            // 检测点是否在多边形内（使用简化的距离检测）
            // 计算面中心
            const centerX = points2D.reduce((sum, p) => sum + p.x, 0) / 4;
            const centerY = points2D.reduce((sum, p) => sum + p.y, 0) / 4;

            // 计算鼠标到面中心的距离
            const distance = Math.sqrt(Math.pow(screenX - centerX, 2) + Math.pow(screenY - centerY, 2));

            // 计算面的近似大小（用于确定检测半径）
            const faceWidth = Math.abs(points2D[1].x - points2D[0].x) + Math.abs(points2D[2].x - points2D[1].x);
            const faceHeight = Math.abs(points2D[2].y - points2D[1].y) + Math.abs(points2D[0].y - points2D[1].y);
            const avgFaceSize = (faceWidth + faceHeight) / 2;

            // 如果鼠标在面中心的一定范围内，认为是在该面上
            const maxDistance = avgFaceSize * 0.7; // 面大小的70%
            let inside = distance < maxDistance;

            if (inside) {
                // 计算新方块的位置
                const newX = cube.x + face.normal.x;
                const newY = cube.y + face.normal.y;
                const newZ = cube.z + face.normal.z;

                // 检查新位置是否在有效范围内
                if (newY >= 0 && newY < gridHeight) {
                    allFaces.push({
                        x: newX,
                        y: newY,
                        z: newZ,
                        cubeX: cube.x,
                        cubeY: cube.y,
                        cubeZ: cube.z,
                        normal: face.normal,
                        faceName: face.name,
                        depth: avgDepth,
                        distance: distance, // 保存距离用于排序
                        isFacingCamera: isFacingCamera,
                        priority: isFacingCamera ? 1 : 0 // 朝向相机的面优先
                    });
                }
            }
        }
    }

    // 按优先级、距离和深度排序
    if (allFaces.length > 0) {
        allFaces.sort((a, b) => {
            // 第一优先级：是否朝向相机
            if (a.priority !== b.priority) {
                return b.priority - a.priority;
            }
            // 第二优先级：距离（越近越好）
            const distDiff = a.distance - b.distance;
            if (Math.abs(distDiff) > 5) { // 如果距离差异超过5像素
                return distDiff;
            }
            // 第三优先级：深度（最接近观察者的在前）
            return b.depth - a.depth;
        });
        return allFaces[0];
    }

    return null;
}

// 检测点是否在多边形内（射线法 + 扩展边界）
function isPointInPolygon(x, y, polygon) {
    // 首先检查边界框，增加更大的容错范围
    const minX = Math.min(...polygon.map(p => p.x)) - 5;
    const maxX = Math.max(...polygon.map(p => p.x)) + 5;
    const minY = Math.min(...polygon.map(p => p.y)) - 5;
    const maxY = Math.max(...polygon.map(p => p.y)) + 5;

    if (x < minX || x > maxX || y < minY || y > maxY) {
        return false;
    }

    // 使用射线法检测
    let inside = false;
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
        const xi = polygon[i].x, yi = polygon[i].y;
        const xj = polygon[j].x, yj = polygon[j].y;

        const intersect = ((yi > y) !== (yj > y)) &&
            (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
        if (intersect) inside = !inside;
    }

    // 如果射线法失败，尝试点到多边形边的距离检测
    if (!inside) {
        const minDistance = pointToPolygonDistance(x, y, polygon);
        const avgSize = (maxX - minX + maxY - minY) / 4;
        if (minDistance < avgSize * 0.3) { // 如果在多边形边缘附近
            inside = true;
        }
    }

    return inside;
}

// 计算点到多边形的最短距离
function pointToPolygonDistance(px, py, polygon) {
    let minDistance = Infinity;

    for (let i = 0; i < polygon.length; i++) {
        const p1 = polygon[i];
        const p2 = polygon[(i + 1) % polygon.length];

        const distance = pointToLineSegmentDistance(px, py, p1.x, p1.y, p2.x, p2.y);
        minDistance = Math.min(minDistance, distance);
    }

    return minDistance;
}

// 计算点到线段的距离
function pointToLineSegmentDistance(px, py, x1, y1, x2, y2) {
    const A = px - x1;
    const B = py - y1;
    const C = x2 - x1;
    const D = y2 - y1;

    const dot = A * C + B * D;
    const lenSq = C * C + D * D;
    let param = -1;

    if (lenSq !== 0) {
        param = dot / lenSq;
    }

    let xx, yy;

    if (param < 0) {
        xx = x1;
        yy = y1;
    } else if (param > 1) {
        xx = x2;
        yy = y2;
    } else {
        xx = x1 + param * C;
        yy = y1 + param * D;
    }

    const dx = px - xx;
    const dy = py - yy;
    return Math.sqrt(dx * dx + dy * dy);
}

// 搭建区域点击事件
function onBuildClick(event) {
    if (currentMode !== 'build' || isDragging || isSpacePressed) return;

    // 如果悬停在某个面上，在该面上放置方块
    if (hoveredFace && currentTool === 'cube') {
        const { x, y, z } = hoveredFace;

        // 检查该位置是否已有方块
        const key = `${x},${y},${z}`;
        if (!gridData[key]) {
            gridData[key] = {
                x: x,
                y: y,
                z: z,
                color: currentColor
            };
            drawBuildScene();
            updateObjectCount();
            updateStatus('添加方块');
        }
        return;
    }

    const rect = buildCanvas.getBoundingClientRect();
    const screenX = event.clientX - rect.left;
    const screenY = event.clientY - rect.top;

    const { x, z } = getGridFromScreen(screenX, screenY);

    // 检查是否在网格范围内
    if (x < -gridSize/2 || x >= gridSize/2 || z < -gridSize/2 || z >= gridSize/2) {
        return;
    }

    if (currentTool === 'cube') {
        addCube(x, 0, z);
    } else if (currentTool === 'paint') {
        // 找到该位置的方块并涂色
        for (let y = 0; y < gridHeight; y++) {
            const key = `${x},${y},${z}`;
            if (gridData[key]) {
                gridData[key].color = currentColor;
                drawBuildScene();
                updateStatus('涂色完成');
                return;
            }
        }
    }
}

// 搭建区域右键点击事件
function onBuildRightClick(event) {
    event.preventDefault();

    if (currentMode !== 'build') return;

    const rect = buildCanvas.getBoundingClientRect();
    const screenX = event.clientX - rect.left;
    const screenY = event.clientY - rect.top;

    const { x, z } = getGridFromScreen(screenX, screenY);

    if (currentTool === 'erase' || currentTool === 'cube') {
        // 从上到下删除方块
        for (let y = gridHeight - 1; y >= 0; y--) {
            const key = `${x},${y},${z}`;
            if (gridData[key]) {
                delete gridData[key];
                drawBuildScene();
                updateObjectCount();
                updateStatus('删除方块');
                return;
            }
        }
    }
}

// 鼠标滚轮缩放
function onBuildWheel(event) {
    event.preventDefault();

    // 缩放比例
    const zoomSpeed = 0.001;
    const delta = -event.deltaY * zoomSpeed;

    const newScale = viewScale + delta;

    // 限制缩放范围
    if (newScale >= 0.2 && newScale <= 5.0) {
        // 以鼠标位置为中心进行缩放
        const rect = buildCanvas.getBoundingClientRect();
        const mouseX = event.clientX - rect.left;
        const mouseY = event.clientY - rect.top;

        const centerX = buildCanvas.width / 2;
        const centerY = buildCanvas.height / 2;

        // 计算鼠标相对于中心的偏移
        const offsetX = mouseX - centerX;
        const offsetY = mouseY - centerY;

        // 调整偏移量以实现以鼠标为中心缩放
        viewOffsetX -= offsetX * (newScale / viewScale - 1);
        viewOffsetY -= offsetY * (newScale / viewScale - 1);

        viewScale = newScale;

        drawBuildScene();
        updateStatus(`缩放: ${(viewScale * 100).toFixed(0)}%`);
    }
}

// 重置视图
function resetView() {
    viewScale = 1.0;
    viewOffsetX = 0;
    viewOffsetY = 0;
    viewRotationX = 30;
    viewRotationY = 45;

    drawBuildScene();
    updateStatus('视图已重置');
    console.log('视图已重置');
}

// 添加方块
function addCube(x, y, z) {
    // 找到该位置最高的方块
    let maxY = -1;
    for (let searchY = 0; searchY < gridHeight; searchY++) {
        const key = `${x},${searchY},${z}`;
        if (gridData[key]) {
            maxY = searchY;
        }
    }

    // 在最高方块上方添加
    const targetY = maxY + 1;

    if (targetY >= gridHeight) {
        updateStatus('该位置已堆叠到最大高度');
        return;
    }

    const key = `${x},${targetY},${z}`;
    gridData[key] = {
        x: x,
        y: targetY,
        z: z,
        color: currentColor
    };

    drawBuildScene();
    updateObjectCount();
    updateStatus('添加方块');
    console.log('添加方块:', { x, y: targetY, z, color: currentColor });
}

// 设置工具
function setTool(tool) {
    currentTool = tool;

    document.querySelectorAll('.tool-btn').forEach(btn => {
        btn.classList.remove('active');
    });

    const targetBtn = Array.from(document.querySelectorAll('.tool-btn')).find(btn =>
        btn.onclick && btn.onclick.toString().includes(tool)
    );
    if (targetBtn) {
        targetBtn.classList.add('active');
    }

    updateStatus(`切换到${tool === 'cube' ? '方块' : tool === 'erase' ? '擦除' : '涂色'}工具`);
    console.log('切换工具:', tool);
}

// 设置颜色
function setColor(color) {
    currentColor = color;

    document.querySelectorAll('.color-option').forEach(opt => {
        opt.classList.remove('selected');
    });
    event.target.classList.add('selected');

    updateStatus(`选择颜色: ${color}`);
    console.log('选择颜色:', color);
}

// 设置模式
function setMode(mode) {
    currentMode = mode;

    document.querySelectorAll('.mode-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.classList.add('active');

    const buildTools = document.getElementById('buildTools');
    if (buildTools) {
        buildTools.style.display = mode === 'build' ? 'block' : 'none';
    }

    updateStatus(`切换到${mode === 'build' ? '搭建' : '拼合'}模式`);
    console.log('切换模式:', mode);
}

// 设置网格大小
function setGridSize(size) {
    gridSize = size;

    gridData = {};
    drawBuildScene();

    document.querySelectorAll('.grid-size-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.classList.add('active');

    updateStatus(`网格大小设置为 ${size}x${size}`);
    updateObjectCount();
    console.log('网格大小:', size);
}

// 更新网格高度
function updateGridHeight() {
    const slider = document.getElementById('gridHeight');
    const value = slider.value;
    document.getElementById('gridHeightValue').textContent = value;

    gridHeight = parseInt(value);

    Object.keys(gridData).forEach(key => {
        if (gridData[key].y >= gridHeight) {
            delete gridData[key];
        }
    });

    drawBuildScene();
    updateObjectCount();
    updateStatus(`网格高度设置为 ${gridHeight}`);
    console.log('网格高度:', gridHeight);
}

// 切换网格显示
function toggleGrid() {
    const checkbox = document.getElementById('showGrid');
    showGrid = checkbox.checked;

    drawBuildScene();
    updateStatus(showGrid ? '显示网格' : '隐藏网格');
    console.log('网格显示:', showGrid);
}

// 创建新的多面体
function createNewObject() {
    if (Object.keys(gridData).length === 0) {
        updateStatus('请先创建一些方块');
        return;
    }

    const cubes = [];
    Object.keys(gridData).forEach(key => {
        const cube = gridData[key];
        cubes.push({
            x: cube.x,
            y: cube.y,
            z: cube.z,
            color: cube.color
        });
    });

    const polyhedron = {
        id: `poly${polyhedronCounter++}`,
        name: `多面体 ${polyhedronCounter - 1}`,
        cubes: cubes,
        position: {
            x: 100 + Math.random() * (assembleCanvas.width - 200),
            y: 100 + Math.random() * (assembleCanvas.height - 200)
        },
        createdAt: new Date()
    };

    polyhedrons.push(polyhedron);
    currentPolyhedron = polyhedron;

    updateObjectList();
    gridData = {};
    drawBuildScene();
    drawAssembleScene();

    updateStatus(`创建多面体: ${polyhedron.name}`);
    console.log('创建多面体:', polyhedron);
}

// 更新对象列表
function updateObjectList() {
    const list = document.getElementById('objectList');
    if (!list) return;

    list.innerHTML = '';

    if (polyhedrons.length === 0) {
        list.innerHTML = '<div style="text-align: center; color: #999; padding: 20px;">暂无多面体</div>';
        return;
    }

    polyhedrons.forEach(poly => {
        const item = document.createElement('div');
        item.className = 'object-item';
        item.dataset.id = poly.id;
        item.innerHTML = `
            <span class="object-name">${poly.name}</span>
            <div class="object-actions">
                <button class="mini-btn mini-btn-edit" onclick="editObject('${poly.id}')">编辑</button>
                <button class="mini-btn mini-btn-delete" onclick="deleteObject('${poly.id}')">删除</button>
            </div>
        `;
        list.appendChild(item);
    });

    updateObjectCount();
}

// 编辑对象
function editObject(id) {
    const polyhedron = polyhedrons.find(p => p.id === id);
    if (!polyhedron) return;

    gridData = {};

    polyhedron.cubes.forEach(cubeData => {
        const key = `${cubeData.x},${cubeData.y},${cubeData.z}`;
        gridData[key] = {
            x: cubeData.x,
            y: cubeData.y,
            z: cubeData.z,
            color: cubeData.color
        };
    });

    currentPolyhedron = polyhedron;
    drawBuildScene();
    updateStatus(`编辑多面体: ${polyhedron.name}`);
    console.log('编辑多面体:', polyhedron.id);
}

// 删除对象
function deleteObject(id) {
    const index = polyhedrons.findIndex(p => p.id === id);
    if (index === -1) return;

    const polyhedron = polyhedrons[index];
    polyhedrons.splice(index, 1);

    updateObjectList();
    drawAssembleScene();
    updateStatus(`删除多面体: ${polyhedron.name}`);
    console.log('删除多面体:', polyhedron.id);
}

// 清空工作区
function clearWorkspace() {
    if (confirm('确定要清空所有内容吗？')) {
        gridData = {};
        polyhedrons = [];
        polyhedronCounter = 1;
        currentPolyhedron = null;

        drawBuildScene();
        drawAssembleScene();
        updateObjectList();
        updateStatus('清空工作区');
        console.log('清空工作区');
    }
}

// 复制选中的对象
function duplicateSelected() {
    if (!currentPolyhedron) {
        updateStatus('请先选择一个多面体');
        return;
    }

    const newPolyhedron = {
        id: `poly${polyhedronCounter++}`,
        name: `${currentPolyhedron.name} (副本)`,
        cubes: JSON.parse(JSON.stringify(currentPolyhedron.cubes)),
        position: {
            x: 100 + Math.random() * (assembleCanvas.width - 200),
            y: 100 + Math.random() * (assembleCanvas.height - 200)
        },
        createdAt: new Date()
    };

    polyhedrons.push(newPolyhedron);
    updateObjectList();
    drawAssembleScene();

    updateStatus(`复制多面体: ${newPolyhedron.name}`);
    console.log('复制多面体:', newPolyhedron.id);
}

// 保存项目
function saveProject() {
    const projectData = {
        polyhedrons: polyhedrons,
        gridSize: gridSize,
        gridHeight: gridHeight,
        createdAt: new Date()
    };

    const dataStr = JSON.stringify(projectData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });

    const link = document.createElement('a');
    link.href = URL.createObjectURL(dataBlob);
    link.download = `polyhedron_project_${Date.now()}.json`;
    link.click();

    updateStatus('项目已保存');
    console.log('项目已保存');
}

// 加载项目
function loadProject() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';

    input.onchange = (event) => {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const projectData = JSON.parse(e.target.result);

                clearWorkspace();

                polyhedrons = projectData.polyhedrons || [];
                gridSize = projectData.gridSize || 10;
                gridHeight = projectData.gridHeight || 5;

                polyhedrons.forEach(poly => {
                    poly.position = {
                        x: 100 + Math.random() * (assembleCanvas.width - 200),
                        y: 100 + Math.random() * (assembleCanvas.height - 200)
                    };
                });

                drawBuildScene();
                drawAssembleScene();
                updateObjectList();
                updateStatus('项目加载成功');
                console.log('项目加载成功');

            } catch (error) {
                alert('加载项目失败: ' + error.message);
                console.error('加载项目失败:', error);
            }
        };

        reader.readAsText(file);
    };

    input.click();
}

// 导出模型
function exportModel() {
    updateStatus('导出功能开发中...');
}

// 显示帮助
function showHelp() {
    alert(`多面体搭建拼合系统使用指南：

🎯 搭建模式：
- 点击网格添加方块（会自动堆叠）
- 右键点击删除方块
- 使用涂色工具改变方块颜色
- 点击"新建多面体"保存当前作品

📐 视角控制：
- 鼠标右键拖动：360度旋转视角（水平+垂直旋转）
- 鼠标滚轮：缩放视图（以鼠标为中心）
- 按住空格键 + 左键拖动：平移视图
- 鼠标中键拖动：平移视图
- 空格+R：重置视图到初始状态

🎨 快捷键：
- 数字键1：方块工具
- 数字键2：擦除工具
- 数字键3：涂色工具

🧩 拼合模式：
- 将搭建好的多面体移到拼合区
- 自由组合多个多面体
- 创建复杂的立体结构

💾 项目管理：
- 保存项目到本地文件
- 加载之前的项目继续编辑

💡 提示：
- 方块会自动堆叠
- 立方体有完整的6个面
- 支持最多10层堆叠
- 缩放范围：20% - 500%
- 水平旋转：0° - 360°
- 垂直旋转：-80° - 80°`);
}

// 更新状态
function updateStatus(text) {
    const statusElement = document.getElementById('statusText');
    if (statusElement) {
        statusElement.textContent = text;
    }
    console.log('状态:', text);
}

// 更新对象计数
function updateObjectCount() {
    const cubeCount = Object.keys(gridData).length;
    const objectCount = polyhedrons.length;
    const countElement = document.getElementById('objectCount');
    if (countElement) {
        countElement.textContent = `对象: ${objectCount} | 方块: ${cubeCount}`;
    }
}

// 页面加载完成后初始化
window.addEventListener('load', init);