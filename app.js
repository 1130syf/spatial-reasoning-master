// 全局变量
let buildScene, buildCamera, buildRenderer, buildControls;
let assembleScene, assembleCamera, assembleRenderer, assembleControls;
let gridHelper, raycaster, mouse;
let currentTool = 'cube';
let currentColor = '#ff6b6b';
let currentMode = 'build'; // 'build' 或 'assemble'
let gridSize = 10;
let gridHeight = 5;
let showGrid = true;
let gridHelpers = []; // 存储所有网格线

// 多面体数据
let polyhedrons = [];
let currentPolyhedron = null;
let polyhedronCounter = 1;

// 网格数据
let gridData = {};
let assembleObjects = [];

// 初始化函数
function init() {
    console.log('初始化系统...');
    try {
        initBuildScene();
        initAssembleScene();
        setupEventListeners();
        updateStatus('系统初始化完成');
        updateObjectCount();
        console.log('系统初始化成功');
    } catch (error) {
        console.error('初始化失败:', error);
        updateStatus('初始化失败: ' + error.message);
    }
}

// 初始化搭建场景
function initBuildScene() {
    console.log('初始化搭建场景...');

    const container = document.getElementById('buildCanvas');
    if (!container) {
        console.error('找不到buildCanvas容器');
        return;
    }

    container.innerHTML = '';

    // 场景设置
    buildScene = new THREE.Scene();
    buildScene.background = new THREE.Color(0xf0f0f0);

    // 相机设置
    buildCamera = new THREE.PerspectiveCamera(
        75,
        container.clientWidth / container.clientHeight,
        0.1,
        1000
    );
    buildCamera.position.set(15, 15, 15);
    buildCamera.lookAt(0, 0, 0);

    // 渲染器设置
    buildRenderer = new THREE.WebGLRenderer({ antialias: true });
    buildRenderer.setSize(container.clientWidth, container.clientHeight);
    buildRenderer.shadowMap.enabled = true;
    buildRenderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(buildRenderer.domElement);

    // 检查OrbitControls是否可用
    if (typeof THREE.OrbitControls !== 'undefined') {
        buildControls = new THREE.OrbitControls(buildCamera, buildRenderer.domElement);
        buildControls.enableDamping = true;
        buildControls.dampingFactor = 0.1;
    } else {
        console.warn('OrbitControls未加载，使用基础控制');
        setupBasicControls(buildRenderer.domElement, buildCamera);
    }

    // 灯光
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    buildScene.add(ambientLight);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.4);
    directionalLight.position.set(10, 20, 10);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    buildScene.add(directionalLight);

    // 创建地板
    createBuildFloor();

    // 网格
    createBuildGrid();

    // 射线投射器
    raycaster = new THREE.Raycaster();
    mouse = new THREE.Vector2();

    // 事件监听
    buildRenderer.domElement.addEventListener('click', onBuildClick);
    buildRenderer.domElement.addEventListener('contextmenu', onBuildRightClick);
    buildRenderer.domElement.addEventListener('mousemove', onBuildMouseMove);

    console.log('搭建场景初始化完成');
    animateBuild();
}

// 初始化拼合场景
function initAssembleScene() {
    console.log('初始化拼合场景...');

    const container = document.getElementById('assembleCanvas');
    if (!container) {
        console.error('找不到assembleCanvas容器');
        return;
    }

    container.innerHTML = '';

    // 场景设置
    assembleScene = new THREE.Scene();
    assembleScene.background = new THREE.Color(0xf8f9fa);

    // 相机设置
    assembleCamera = new THREE.PerspectiveCamera(
        75,
        container.clientWidth / container.clientHeight,
        0.1,
        1000
    );
    assembleCamera.position.set(20, 20, 20);
    assembleCamera.lookAt(0, 0, 0);

    // 渲染器设置
    assembleRenderer = new THREE.WebGLRenderer({ antialias: true });
    assembleRenderer.setSize(container.clientWidth, container.clientHeight);
    assembleRenderer.shadowMap.enabled = true;
    assembleRenderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(assembleRenderer.domElement);

    // 检查OrbitControls是否可用
    if (typeof THREE.OrbitControls !== 'undefined') {
        assembleControls = new THREE.OrbitControls(assembleCamera, assembleRenderer.domElement);
        assembleControls.enableDamping = true;
        assembleControls.dampingFactor = 0.1;
    } else {
        console.warn('OrbitControls未加载，使用基础控制');
        setupBasicControls(assembleRenderer.domElement, assembleCamera);
    }

    // 灯光
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    assembleScene.add(ambientLight);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.4);
    directionalLight.position.set(10, 20, 10);
    directionalLight.castShadow = true;
    assembleScene.add(directionalLight);

    // 地板网格
    createAssembleFloor();

    console.log('拼合场景初始化完成');
    animateAssemble();
}

// 创建搭建地板
function createBuildFloor() {
    // 创建地板平面
    const floorGeometry = new THREE.PlaneGeometry(gridSize, gridSize);
    const floorMaterial = new THREE.MeshStandardMaterial({
        color: 0xf5f5f5,
        transparent: true,
        opacity: 0.3
    });
    const floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = 0;
    floor.receiveShadow = true;
    floor.userData.isFloor = true;
    buildScene.add(floor);

    // 创建点击检测用的隐形平面
    const clickPlaneGeometry = new THREE.PlaneGeometry(gridSize * 2, gridSize * 2);
    const clickPlaneMaterial = new THREE.MeshBasicMaterial({ visible: false });
    const clickPlane = new THREE.Mesh(clickPlaneGeometry, clickPlaneMaterial);
    clickPlane.rotation.x = -Math.PI / 2;
    clickPlane.userData.isClickPlane = true;
    buildScene.add(clickPlane);
}

// 创建拼合地板
function createAssembleFloor() {
    // 地板网格
    const gridHelper = new THREE.GridHelper(30, 30, 0x888888, 0xcccccc);
    assembleScene.add(gridHelper);

    // 地板
    const floorGeometry = new THREE.PlaneGeometry(30, 30);
    const floorMaterial = new THREE.MeshStandardMaterial({
        color: 0xf5f5f5,
        transparent: true,
        opacity: 0.5
    });
    const floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -0.01;
    floor.receiveShadow = true;
    assembleScene.add(floor);
}

// 创建搭建网格
function createBuildGrid() {
    // 清除现有网格
    gridHelpers.forEach(helper => {
        buildScene.remove(helper);
    });
    gridHelpers = [];

    if (showGrid) {
        // 主网格（地面）
        const mainGrid = new THREE.GridHelper(gridSize, gridSize, 0x888888, 0xcccccc);
        gridHelpers.push(mainGrid);
        buildScene.add(mainGrid);

        // 高度网格线
        for (let i = 1; i <= gridHeight; i++) {
            const gridLines = new THREE.GridHelper(gridSize, gridSize, 0x666666, 0x999999);
            gridLines.position.y = i * 0.5;
            gridLines.material.opacity = 0.3 - (i * 0.05);
            gridLines.material.transparent = true;
            gridHelpers.push(gridLines);
            buildScene.add(gridLines);
        }
    }

    console.log(`网格创建完成: 大小${gridSize}x${gridSize}, 高度${gridHeight}`);
}

// 基础控制（当OrbitControls不可用时）
function setupBasicControls(element, camera) {
    let isRotating = false;
    let isPanning = false;
    let previousMousePosition = { x: 0, y: 0 };

    element.addEventListener('mousedown', (e) => {
        if (e.button === 0) { // 左键
            isRotating = true;
        } else if (e.button === 2) { // 右键
            isPanning = true;
        }
        previousMousePosition = { x: e.clientX, y: e.clientY };
    });

    element.addEventListener('mousemove', (e) => {
        if (isRotating) {
            const deltaMove = {
                x: e.clientX - previousMousePosition.x,
                y: e.clientY - previousMousePosition.y
            };

            // 旋转相机位置
            const spherical = new THREE.Spherical();
            spherical.setFromVector3(camera.position);
            spherical.theta -= deltaMove.x * 0.01;
            spherical.phi += deltaMove.y * 0.01;
            spherical.phi = Math.max(0.1, Math.min(Math.PI - 0.1, spherical.phi));
            camera.position.setFromSpherical(spherical);
            camera.lookAt(0, 0, 0);
        } else if (isPanning) {
            const deltaMove = {
                x: e.clientX - previousMousePosition.x,
                y: e.clientY - previousMousePosition.y
            };

            // 平移相机
            const right = new THREE.Vector3();
            const up = new THREE.Vector3(0, 1, 0);
            right.crossVectors(camera.getWorldDirection(new THREE.Vector3()), up).normalize();

            camera.position.add(right.multiplyScalar(-deltaMove.x * 0.05));
            camera.position.add(up.multiplyScalar(deltaMove.y * 0.05));
        }

        previousMousePosition = { x: e.clientX, y: e.clientY };
    });

    element.addEventListener('mouseup', () => {
        isRotating = false;
        isPanning = false;
    });

    element.addEventListener('wheel', (e) => {
        e.preventDefault();
        const distance = camera.position.length();
        const newDistance = distance + e.deltaY * 0.01;
        const clampedDistance = Math.max(5, Math.min(50, newDistance));

        camera.position.multiplyScalar(clampedDistance / distance);
    });

    element.addEventListener('contextmenu', (e) => {
        e.preventDefault();
    });
}

// 搭建场景点击事件
function onBuildClick(event) {
    if (currentMode !== 'build') return;

    const rect = buildRenderer.domElement.getBoundingClientRect();
    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    raycaster.setFromCamera(mouse, buildCamera);

    if (currentTool === 'cube') {
        // 寻找点击平面
        const intersectableObjects = buildScene.children.filter(child =>
            child.userData.isClickPlane || child.userData.isFloor
        );

        const intersects = raycaster.intersectObjects(intersectableObjects);
        console.log('点击相交对象数量:', intersects.length);

        if (intersects.length > 0) {
            const point = intersects[0].point;
            console.log('点击位置:', point);

            // 计算网格坐标
            const x = Math.floor(point.x + gridSize/2);
            const z = Math.floor(point.z + gridSize/2);
            const y = 0; // 默认放在地面上

            console.log('网格坐标:', { x, y, z });
            addCube(x, y, z);
        }
    } else if (currentTool === 'paint') {
        const intersectableObjects = buildScene.children.filter(child => child.userData.isCube);
        const intersects = raycaster.intersectObjects(intersectableObjects);

        if (intersects.length > 0) {
            const cube = intersects[0].object;
            cube.material.color.set(currentColor);
            cube.userData.color = currentColor;
            updateStatus('涂色完成');
        }
    }
}

// 搭建场景右键点击事件
function onBuildRightClick(event) {
    event.preventDefault();

    if (currentMode !== 'build') return;

    const rect = buildRenderer.domElement.getBoundingClientRect();
    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    raycaster.setFromCamera(mouse, buildCamera);

    if (currentTool === 'erase' || currentTool === 'cube') {
        const intersectableObjects = buildScene.children.filter(child => child.userData.isCube);
        const intersects = raycaster.intersectObjects(intersectableObjects);

        if (intersects.length > 0) {
            const cube = intersects[0].object;
            const key = `${cube.userData.gridX},${cube.userData.gridY},${cube.userData.gridZ}`;

            delete gridData[key];
            buildScene.remove(cube);
            updateObjectCount();
            updateStatus('删除方块');
        }
    }
}

// 搭建场景鼠标移动事件
function onBuildMouseMove(event) {
    const rect = buildRenderer.domElement.getBoundingClientRect();
    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    raycaster.setFromCamera(mouse, buildCamera);

    // 计算鼠标位置对应的网格坐标
    const intersectableObjects = buildScene.children.filter(child =>
        child.userData.isClickPlane || child.userData.isFloor
    );

    const intersects = raycaster.intersectObjects(intersectableObjects);

    if (intersects.length > 0) {
        const point = intersects[0].point;
        const x = Math.floor(point.x + gridSize/2);
        const z = Math.floor(point.z + gridSize/2);

        document.getElementById('coordinates').textContent = `X: ${x}, Y: 0, Z: ${z}`;
    }
}

// 添加方块
function addCube(x, y, z) {
    // 检查位置是否已被占用
    const key = `${x},${y},${z}`;
    if (gridData[key]) {
        updateStatus('该位置已有方块');
        return;
    }

    // 检查是否在网格范围内
    if (x < 0 || x >= gridSize || z < 0 || z >= gridSize || y < 0 || y >= gridHeight) {
        updateStatus('超出网格范围');
        return;
    }

    // 创建方块
    const geometry = new THREE.BoxGeometry(0.9, 0.9, 0.9);
    const material = new THREE.MeshStandardMaterial({
        color: currentColor,
        transparent: true,
        opacity: 0.9
    });

    const cube = new THREE.Mesh(geometry, material);
    cube.position.set(x - gridSize/2 + 0.5, y + 0.5, z - gridSize/2 + 0.5);
    cube.castShadow = true;
    cube.receiveShadow = true;

    // 添加边框
    const edges = new THREE.EdgesGeometry(geometry);
    const lineMaterial = new THREE.LineBasicMaterial({ color: 0x000000, linewidth: 1 });
    const wireframe = new THREE.LineSegments(edges, lineMaterial);
    cube.add(wireframe);

    // 存储网格信息
    cube.userData.isCube = true;
    cube.userData.gridX = x;
    cube.userData.gridY = y;
    cube.userData.gridZ = z;
    cube.userData.color = currentColor;

    gridData[key] = cube;
    buildScene.add(cube);

    console.log('添加方块:', { x, y, z, color: currentColor });
    updateObjectCount();
    updateStatus('添加方块');
}

// 设置工具
function setTool(tool) {
    currentTool = tool;

    // 更新UI
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

    // 更新UI
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

    // 更新UI
    document.querySelectorAll('.mode-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.classList.add('active');

    // 显示/隐藏搭建工具
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

    // 清空现有方块
    clearGrid();

    // 重新创建网格
    createBuildFloor();
    createBuildGrid();

    // 更新UI
    document.querySelectorAll('.grid-size-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.classList.add('active');

    updateStatus(`网格大小设置为 ${size}x${size}`);
    console.log('网格大小:', size);
}

// 更新网格高度
function updateGridHeight() {
    const slider = document.getElementById('gridHeight');
    const value = slider.value;
    document.getElementById('gridHeightValue').textContent = value;

    gridHeight = parseInt(value);

    // 重新创建网格
    createBuildGrid();

    updateStatus(`网格高度设置为 ${gridHeight}`);
    console.log('网格高度:', gridHeight);
}

// 切换网格显示
function toggleGrid() {
    const checkbox = document.getElementById('showGrid');
    showGrid = checkbox.checked;

    createBuildGrid();
    updateStatus(showGrid ? '显示网格' : '隐藏网格');
    console.log('网格显示:', showGrid);
}

// 创建新的多面体
function createNewObject() {
    if (Object.keys(gridData).length === 0) {
        updateStatus('请先创建一些方块');
        return;
    }

    // 收集当前搭建的方块
    const cubes = [];
    Object.keys(gridData).forEach(key => {
        const cube = gridData[key];
        cubes.push({
            x: cube.userData.gridX,
            y: cube.userData.gridY,
            z: cube.userData.gridZ,
            color: cube.userData.color
        });
    });

    // 创建多面体数据
    const polyhedron = {
        id: `poly${polyhedronCounter++}`,
        name: `多面体 ${polyhedronCounter - 1}`,
        cubes: cubes,
        createdAt: new Date()
    };

    polyhedrons.push(polyhedron);
    currentPolyhedron = polyhedron;

    // 在拼合场景中创建多面体
    addPolyhedronToAssembleScene(polyhedron);

    // 更新UI
    updateObjectList();
    clearGrid();

    updateStatus(`创建多面体: ${polyhedron.name}`);
    console.log('创建多面体:', polyhedron);
}

// 添加多面体到拼合场景
function addPolyhedronToAssembleScene(polyhedron) {
    const group = new THREE.Group();

    polyhedron.cubes.forEach(cubeData => {
        const geometry = new THREE.BoxGeometry(0.9, 0.9, 0.9);
        const material = new THREE.MeshStandardMaterial({
            color: cubeData.color,
            transparent: true,
            opacity: 0.9
        });

        const cube = new THREE.Mesh(geometry, material);
        cube.position.set(
            cubeData.x - gridSize/2 + 0.5,
            cubeData.y + 1,
            cubeData.z - gridSize/2 + 0.5
        );
        cube.castShadow = true;
        cube.receiveShadow = true;

        // 添加边框
        const edges = new THREE.EdgesGeometry(geometry);
        const lineMaterial = new THREE.LineBasicMaterial({ color: 0x000000, linewidth: 1 });
        const wireframe = new THREE.LineSegments(edges, lineMaterial);
        cube.add(wireframe);

        group.add(cube);
    });

    // 设置随机位置
    group.position.set(
        (Math.random() - 0.5) * 15,
        0,
        (Math.random() - 0.5) * 15
    );

    group.userData.polyhedronId = polyhedron.id;
    group.userData.isDraggable = true;

    assembleScene.add(group);
    assembleObjects.push(group);

    console.log('添加多面体到拼合场景:', polyhedron.id);
}

// 更新对象列表
function updateObjectList() {
    const list = document.getElementById('objectList');
    if (!list) return;

    list.innerHTML = '';

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

    // 清空当前网格
    clearGrid();

    // 在搭建场景中显示多面体
    polyhedron.cubes.forEach(cubeData => {
        const key = `${cubeData.x},${cubeData.y},${cubeData.z}`;
        if (!gridData[key]) {
            currentColor = cubeData.color;
            addCube(cubeData.x, cubeData.y, cubeData.z);
        }
    });

    currentPolyhedron = polyhedron;
    updateStatus(`编辑多面体: ${polyhedron.name}`);
    console.log('编辑多面体:', polyhedron.id);
}

// 删除对象
function deleteObject(id) {
    const index = polyhedrons.findIndex(p => p.id === id);
    if (index === -1) return;

    const polyhedron = polyhedrons[index];

    // 从拼合场景中删除
    const objectToRemove = assembleObjects.find(obj => obj.userData.polyhedronId === id);
    if (objectToRemove) {
        assembleScene.remove(objectToRemove);
        assembleObjects = assembleObjects.filter(obj => obj.userData.polyhedronId !== id);
    }

    // 从数据中删除
    polyhedrons.splice(index, 1);

    updateObjectList();
    updateStatus(`删除多面体: ${polyhedron.name}`);
    console.log('删除多面体:', polyhedron.id);
}

// 清空网格
function clearGrid() {
    Object.keys(gridData).forEach(key => {
        buildScene.remove(gridData[key]);
    });
    gridData = {};
    updateObjectCount();
    console.log('清空网格');
}

// 清空工作区
function clearWorkspace() {
    if (confirm('确定要清空所有内容吗？')) {
        clearGrid();

        // 清空拼合场景
        assembleObjects.forEach(obj => {
            assembleScene.remove(obj);
        });
        assembleObjects = [];

        // 清空多面体数据
        polyhedrons = [];
        polyhedronCounter = 1;
        currentPolyhedron = null;

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
        createdAt: new Date()
    };

    polyhedrons.push(newPolyhedron);
    addPolyhedronToAssembleScene(newPolyhedron);
    updateObjectList();

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

                // 清空现有数据
                clearWorkspace();

                // 加载数据
                polyhedrons = projectData.polyhedrons || [];
                gridSize = projectData.gridSize || 10;
                gridHeight = projectData.gridHeight || 5;

                // 重新创建网格
                createBuildFloor();
                createBuildGrid();

                // 更新UI
                polyhedrons.forEach(poly => {
                    addPolyhedronToAssembleScene(poly);
                });

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
- 点击网格添加方块
- 右键点击删除方块
- 使用涂色工具改变方块颜色
- 点击"新建多面体"保存当前作品

🧩 拼合模式：
- 将搭建好的多面体拖动到拼合区
- 自由组合多个多面体
- 创建复杂的立体结构

💾 项目管理：
- 保存项目到本地文件
- 加载之前的项目继续编辑
- 导出模型分享给他人

快捷键：
- 左键拖动：旋转视角
- 右键拖动：平移视角
- 滚轮：缩放视图

如果遇到问题，请检查浏览器控制台的错误信息。`);
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

// 设置事件监听器
function setupEventListeners() {
    // 窗口大小调整
    window.addEventListener('resize', () => {
        if (buildCamera && buildRenderer) {
            const container = buildRenderer.domElement.parentElement;
            if (container) {
                buildCamera.aspect = container.clientWidth / container.clientHeight;
                buildCamera.updateProjectionMatrix();
                buildRenderer.setSize(container.clientWidth, container.clientHeight);
            }
        }

        if (assembleCamera && assembleRenderer) {
            const container = assembleRenderer.domElement.parentElement;
            if (container) {
                assembleCamera.aspect = container.clientWidth / container.clientHeight;
                assembleCamera.updateProjectionMatrix();
                assembleRenderer.setSize(container.clientWidth, container.clientHeight);
            }
        }
    });

    // 键盘快捷键
    document.addEventListener('keydown', (event) => {
        switch(event.key) {
            case '1':
                setTool('cube');
                break;
            case '2':
                setTool('erase');
                break;
            case '3':
                setTool('paint');
                break;
            case 'Delete':
                if (currentTool === 'erase' || currentMode === 'build') {
                    // 可以添加删除选中对象的功能
                }
                break;
        }
    });
}

// 动画循环
function animateBuild() {
    requestAnimationFrame(animateBuild);

    if (buildControls) {
        buildControls.update();
    }

    if (buildRenderer && buildScene && buildCamera) {
        buildRenderer.render(buildScene, buildCamera);
    }
}

function animateAssemble() {
    requestAnimationFrame(animateAssemble);

    if (assembleControls) {
        assembleControls.update();
    }

    if (assembleRenderer && assembleScene && assembleCamera) {
        assembleRenderer.render(assembleScene, assembleCamera);
    }
}

// 页面加载完成后初始化
window.addEventListener('load', init);