// 全局变量
let targetScene, targetCamera, targetRenderer;
let demoScene, demoCamera, demoRenderer;
let targetPolyhedron, demoPolyhedrons = [];
let selectedOption = null;
let isDemoPlaying = false;
let demoAnimation = null;
let stats = {
    completed: 0,
    correct: 0,
    startTime: Date.now()
};

// 题目数据
const questionData = {
    target: {
        cubes: [
            // 目标多面体的20个小正方体坐标
            [0, 0, 0], [1, 0, 0], [2, 0, 0], [0, 0, 1], [1, 0, 1], [2, 0, 1],
            [0, 1, 0], [1, 1, 0], [2, 1, 0], [0, 1, 1], [2, 1, 1],
            [0, 2, 0], [1, 2, 0], [0, 2, 1], [1, 2, 1],
            [1, 3, 0], [2, 3, 0], [1, 3, 1], [2, 3, 1], [2, 2, 1]
        ]
    },
    parts: {
        part1: {
            cubes: [[0, 0, 0], [1, 0, 0], [2, 0, 0], [0, 0, 1], [1, 0, 1], [2, 0, 1]],
            color: 0xff6b6b
        },
        part2: {
            cubes: [[0, 1, 0], [1, 1, 0], [2, 1, 0], [0, 1, 1], [2, 1, 1]],
            color: 0x4ecdc4
        }
    },
    options: {
        A: {
            cubes: [[0, 0, 0], [1, 0, 0], [0, 0, 1], [1, 0, 1], [0, 1, 0]],
            color: 0x45b7d1
        },
        B: {
            cubes: [[0, 0, 0], [1, 0, 0], [2, 0, 0], [0, 1, 0], [1, 1, 0], [2, 1, 0]],
            color: 0xf7dc6f
        },
        C: {
            cubes: [[0, 0, 0], [1, 0, 0], [0, 0, 1], [1, 0, 1], [0, 1, 0]],
            color: 0xbb8fce
        },
        D: {
            cubes: [[0, 0, 0], [1, 0, 0], [2, 0, 0], [0, 0, 1], [1, 0, 1], [2, 0, 1]],
            color: 0x85c88a
        }
    },
    correctAnswer: 'B'
};

// 初始化函数
function init() {
    initTargetCanvas();
    initDemoCanvas();
    createOptionPreviews();
    updateStats();
    startTimer();
}

// 初始化目标多面体画布
function initTargetCanvas() {
    const container = document.getElementById('targetCanvas');
    container.innerHTML = '';

    targetScene = new THREE.Scene();
    targetScene.background = new THREE.Color(0xf0f0f0);

    targetCamera = new THREE.PerspectiveCamera(
        75,
        container.clientWidth / container.clientHeight,
        0.1,
        1000
    );
    targetCamera.position.set(5, 5, 5);
    targetCamera.lookAt(0, 0, 0);

    targetRenderer = new THREE.WebGLRenderer({ antialias: true });
    targetRenderer.setSize(container.clientWidth, container.clientHeight);
    container.appendChild(targetRenderer.domElement);

    // 添加灯光
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    targetScene.add(ambientLight);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.4);
    directionalLight.position.set(5, 10, 5);
    targetScene.add(directionalLight);

    // 创建目标多面体
    targetPolyhedron = createPolyhedron(questionData.target.cubes, 0x95a5a6);
    targetScene.add(targetPolyhedron);

    // 添加网格
    const gridHelper = new THREE.GridHelper(10, 10);
    targetScene.add(gridHelper);

    // 添加鼠标控制
    addMouseControls(targetRenderer, targetScene, targetCamera);

    animateTarget();
}

// 初始化演示画布
function initDemoCanvas() {
    const container = document.getElementById('demoCanvas');
    container.innerHTML = '';

    demoScene = new THREE.Scene();
    demoScene.background = new THREE.Color(0xf8f9fa);

    demoCamera = new THREE.PerspectiveCamera(
        75,
        container.clientWidth / container.clientHeight,
        0.1,
        1000
    );
    demoCamera.position.set(8, 8, 8);
    demoCamera.lookAt(0, 0, 0);

    demoRenderer = new THREE.WebGLRenderer({ antialias: true });
    demoRenderer.setSize(container.clientWidth, container.clientHeight);
    container.appendChild(demoRenderer.domElement);

    // 添加灯光
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    demoScene.add(ambientLight);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.4);
    directionalLight.position.set(5, 10, 5);
    demoScene.add(directionalLight);

    // 创建分解的部件
    createDemoParts();

    // 添加网格
    const gridHelper = new THREE.GridHelper(10, 10);
    demoScene.add(gridHelper);

    // 添加鼠标控制
    addMouseControls(demoRenderer, demoScene, demoCamera);

    animateDemo();
}

// 创建多面体
function createPolyhedron(cubes, color) {
    const group = new THREE.Group();

    cubes.forEach(([x, y, z]) => {
        const geometry = new THREE.BoxGeometry(0.95, 0.95, 0.95);
        const material = new THREE.MeshPhongMaterial({
            color: color,
            transparent: true,
            opacity: 0.8
        });
        const cube = new THREE.Mesh(geometry, material);
        cube.position.set(x - 1.5, y, z - 1.5);

        // 添加边框
        const edges = new THREE.EdgesGeometry(geometry);
        const lineMaterial = new THREE.LineBasicMaterial({ color: 0x000000, linewidth: 2 });
        const wireframe = new THREE.LineSegments(edges, lineMaterial);
        cube.add(wireframe);

        group.add(cube);
    });

    return group;
}

// 创建演示部件
function createDemoParts() {
    demoPolyhedrons = [];

    // 创建第一个部件（分离位置）
    const part1 = createPolyhedron(questionData.parts.part1.cubes, questionData.parts.part1.color);
    part1.position.set(-3, 0, 0);
    demoScene.add(part1);
    demoPolyhedrons.push({ mesh: part1, target: [0, 0, 0], current: [-3, 0, 0] });

    // 创建第二个部件（分离位置）
    const part2 = createPolyhedron(questionData.parts.part2.cubes, questionData.parts.part2.color);
    part2.position.set(3, 0, 0);
    demoScene.add(part2);
    demoPolyhedrons.push({ mesh: part2, target: [0, 0, 0], current: [3, 0, 0] });

    // 创建第三个部件（默认为正确答案）
    const correctOption = questionData.options[questionData.correctAnswer];
    const part3 = createPolyhedron(correctOption.cubes, correctOption.color);
    part3.position.set(0, 0, 3);
    demoScene.add(part3);
    demoPolyhedrons.push({ mesh: part3, target: [0, 0, 0], current: [0, 0, 3] });
}

// 创建选项预览
function createOptionPreviews() {
    Object.keys(questionData.options).forEach(optionKey => {
        const container = document.getElementById(`option${optionKey}`);
        const scene = new THREE.Scene();
        scene.background = new THREE.Color(0xffffff);

        const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 1000);
        camera.position.set(3, 3, 3);
        camera.lookAt(0, 0, 0);

        const renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setSize(80, 80);
        container.appendChild(renderer.domElement);

        // 添加灯光
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        scene.add(ambientLight);

        // 创建选项多面体
        const optionData = questionData.options[optionKey];
        const polyhedron = createPolyhedron(optionData.cubes, optionData.color);
        scene.add(polyhedron);

        // 渲染
        renderer.render(scene, camera);
    });
}

// 添加鼠标控制
function addMouseControls(renderer, scene, camera) {
    let isRotating = false;
    let previousMousePosition = { x: 0, y: 0 };

    renderer.domElement.addEventListener('mousedown', (e) => {
        isRotating = true;
        previousMousePosition = { x: e.clientX, y: e.clientY };
    });

    renderer.domElement.addEventListener('mousemove', (e) => {
        if (!isRotating) return;

        const deltaMove = {
            x: e.clientX - previousMousePosition.x,
            y: e.clientY - previousMousePosition.y
        };

        scene.rotation.y += deltaMove.x * 0.01;
        scene.rotation.x += deltaMove.y * 0.01;

        previousMousePosition = { x: e.clientX, y: e.clientY };
    });

    renderer.domElement.addEventListener('mouseup', () => {
        isRotating = false;
    });

    renderer.domElement.addEventListener('wheel', (e) => {
        camera.position.z += e.deltaY * 0.01;
        camera.position.z = Math.max(2, Math.min(15, camera.position.z));
    });
}

// 动画函数
function animateTarget() {
    requestAnimationFrame(animateTarget);
    if (targetPolyhedron) {
        targetPolyhedron.rotation.y += 0.005;
    }
    targetRenderer.render(targetScene, targetCamera);
}

function animateDemo() {
    requestAnimationFrame(animateDemo);
    demoRenderer.render(demoScene, demoCamera);
}

// 控制函数
function rotateTarget() {
    if (targetPolyhedron) {
        targetPolyhedron.rotation.y += Math.PI / 2;
    }
}

function resetTarget() {
    if (targetPolyhedron) {
        targetPolyhedron.rotation.set(0, 0, 0);
    }
}

function startDemo() {
    if (isDemoPlaying) return;
    isDemoPlaying = true;

    // 使用当前选中的选项，如果没有选择则使用正确答案
    const optionToUse = selectedOption || questionData.correctAnswer;

    // 重新创建演示部件
    demoScene.clear();
    const gridHelper = new THREE.GridHelper(10, 10);
    demoScene.add(gridHelper);

    // 添加灯光
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    demoScene.add(ambientLight);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.4);
    directionalLight.position.set(5, 10, 5);
    demoScene.add(directionalLight);

    // 创建新的部件
    demoPolyhedrons = [];

    const part1 = createPolyhedron(questionData.parts.part1.cubes, questionData.parts.part1.color);
    part1.position.set(-3, 0, 0);
    demoScene.add(part1);
    demoPolyhedrons.push({ mesh: part1, target: [0, 0, 0], current: [-3, 0, 0] });

    const part2 = createPolyhedron(questionData.parts.part2.cubes, questionData.parts.part2.color);
    part2.position.set(3, 0, 0);
    demoScene.add(part2);
    demoPolyhedrons.push({ mesh: part2, target: [0, 0, 0], current: [3, 0, 0] });

    const optionData = questionData.options[optionToUse];
    const part3 = createPolyhedron(optionData.cubes, optionData.color);
    part3.position.set(0, 0, 3);
    demoScene.add(part3);
    demoPolyhedrons.push({ mesh: part3, target: [0, 0, 0], current: [0, 0, 3] });

    // 动画移动部件
    animateAssembly();
}

function animateAssembly() {
    const duration = 3000; // 3秒
    const startTime = Date.now();

    function animate() {
        if (!isDemoPlaying) return;

        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);

        // 使用缓动函数
        const easeProgress = 1 - Math.pow(1 - progress, 3);

        demoPolyhedrons.forEach(part => {
            part.mesh.position.x = part.current[0] + (part.target[0] - part.current[0]) * easeProgress;
            part.mesh.position.y = part.current[1] + (part.target[1] - part.current[1]) * easeProgress;
            part.mesh.position.z = part.current[2] + (part.target[2] - part.current[2]) * easeProgress;
        });

        if (progress < 1) {
            requestAnimationFrame(animate);
        } else {
            isDemoPlaying = false;
        }
    }

    animate();
}

function pauseDemo() {
    isDemoPlaying = false;
}

function resetDemo() {
    isDemoPlaying = false;
    initDemoCanvas();
}

// 选项选择函数
function selectOption(option) {
    // 移除之前的选择
    document.querySelectorAll('.option-card').forEach(card => {
        card.classList.remove('selected');
    });

    // 添加新选择
    document.querySelector(`[data-option="${option}"]`).classList.add('selected');
    selectedOption = option;

    // 更新进度条
    const progress = 25; // 选择答案后进度25%
    document.getElementById('progressBar').style.width = progress + '%';
}

// 检查答案
function checkAnswer() {
    if (!selectedOption) {
        alert('请先选择一个答案！');
        return;
    }

    stats.completed++;

    if (selectedOption === questionData.correctAnswer) {
        stats.correct++;
        alert('🎉 答案正确！你的选择是正确的。');

        // 播放正确拼合动画
        selectedOption = questionData.correctAnswer;
        startDemo();
    } else {
        alert(`❌ 答案错误。正确答案是 ${questionData.correctAnswer}。让我们看看正确的拼合过程：`);

        // 播放正确拼合动画
        selectedOption = questionData.correctAnswer;
        startDemo();
    }

    updateStats();

    // 更新进度条到100%
    document.getElementById('progressBar').style.width = '100%';
}

// 显示提示
function showHint() {
    const hint = `💡 提示：\n` +
        `1. 首先计算目标多面体的体积：20个小正方体\n` +
        `2. 计算已知两个部件的体积\n` +
        `3. 用总体积减去已知部件体积，得到所需部件的体积\n` +
        `4. 观察缺口形状，选择能够完美匹配的部件`;
    alert(hint);
}

// 下一题
function nextQuestion() {
    // 重置选择
    selectedOption = null;
    document.querySelectorAll('.option-card').forEach(card => {
        card.classList.remove('selected');
    });

    // 重置进度条
    document.getElementById('progressBar').style.width = '0%';

    // 重置演示
    resetDemo();

    // 这里可以加载新的题目数据
    alert('功能开发中，敬请期待更多题目！');
}

// 更新统计数据
function updateStats() {
    document.getElementById('completedCount').textContent = stats.completed;
    const rate = stats.completed > 0 ? Math.round((stats.correct / stats.completed) * 100) : 0;
    document.getElementById('correctRate').textContent = rate + '%';
}

// 更新学习时长
function startTimer() {
    setInterval(() => {
        const elapsed = Date.now() - stats.startTime;
        const hours = Math.floor(elapsed / (1000 * 60 * 60));
        const minutes = Math.floor((elapsed % (1000 * 60 * 60)) / (1000 * 60));
        document.getElementById('studyTime').textContent = `${hours}h${minutes}m`;
    }, 60000); // 每分钟更新一次
}

// 窗口大小调整
window.addEventListener('resize', () => {
    // 调整目标画布
    const targetContainer = document.getElementById('targetCanvas');
    if (targetCamera && targetRenderer) {
        targetCamera.aspect = targetContainer.clientWidth / targetContainer.clientHeight;
        targetCamera.updateProjectionMatrix();
        targetRenderer.setSize(targetContainer.clientWidth, targetContainer.clientHeight);
    }

    // 调整演示画布
    const demoContainer = document.getElementById('demoCanvas');
    if (demoCamera && demoRenderer) {
        demoCamera.aspect = demoContainer.clientWidth / demoContainer.clientHeight;
        demoCamera.updateProjectionMatrix();
        demoRenderer.setSize(demoContainer.clientWidth, demoContainer.clientHeight);
    }
});

// 页面加载完成后初始化
window.addEventListener('load', init);