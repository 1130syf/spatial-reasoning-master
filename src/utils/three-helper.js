import * as THREE from 'three'

/**
 * 创建单个立方体
 * @param {Object} position - {x, y, z}
 * @param {string} color - 颜色值
 * @param {boolean} isGray - 是否为灰色方块
 * @returns {THREE.Mesh}
 */
export function createCube(position, color = '#3B82F6', isGray = false) {
  const geometry = new THREE.BoxGeometry(1, 1, 1)

  let material
  if (isGray) {
    // 灰色方块使用特殊材质
    material = new THREE.MeshPhongMaterial({
      color: 0x808080,
      shininess: 100,
      specular: 0x404040,
    })
  } else {
    // 普通方块
    material = new THREE.MeshPhongMaterial({
      color: new THREE.Color(color),
      shininess: 30,
    })
  }

  const cube = new THREE.Mesh(geometry, material)
  cube.position.set(position.x, position.y, position.z)

  // 添加边框线条，使立体感更强
  const edges = new THREE.EdgesGeometry(geometry)
  const lineMaterial = new THREE.LineBasicMaterial({
    color: 0x000000,
    opacity: 0.3,
    transparent: true,
  })
  const wireframe = new THREE.LineSegments(edges, lineMaterial)
  cube.add(wireframe)

  return cube
}

/**
 * 创建一组立方体（小立体图）
 * @param {Array} blocks - 方块数据数组
 * @param {Object} offset - 整体偏移量 {x, y, z}
 * @returns {THREE.Group}
 */
export function createShapeGroup(blocks, offset = { x: 0, y: 0, z: 0 }) {
  const group = new THREE.Group()

  blocks.forEach((block) => {
    const cube = createCube(
      {
        x: block.x + offset.x,
        y: block.y + offset.y,
        z: block.z + offset.z,
      },
      block.color,
      block.isGray
    )
    group.add(cube)
  })

  return group
}

/**
 * 创建网格辅助线
 * @param {number} size - 网格大小
 * @returns {THREE.GridHelper}
 */
export function createGrid(size = 10) {
  const gridHelper = new THREE.GridHelper(size, size, 0x888888, 0xcccccc)
  gridHelper.position.y = -0.5
  return gridHelper
}

/**
 * 设置相机位置（视角切换）
 * @param {THREE.Camera} camera - 相机对象
 * @param {string} mode - 视角模式: 'top', 'side', 'front', 'free'
 * @param {number} distance - 距离
 */
export function setCameraPosition(camera, mode, distance = 15) {
  switch (mode) {
    case 'top':
      camera.position.set(0, distance, 0)
      camera.lookAt(0, 0, 0)
      break
    case 'side':
      camera.position.set(distance, 2, 0)
      camera.lookAt(0, 0, 0)
      break
    case 'front':
      camera.position.set(0, 2, distance)
      camera.lookAt(0, 0, 0)
      break
    case 'free':
    default:
      camera.position.set(10, 10, 10)
      camera.lookAt(0, 0, 0)
      break
  }
}

/**
 * 创建场景
 * @returns {THREE.Scene}
 */
export function createScene() {
  const scene = new THREE.Scene()
  scene.background = new THREE.Color(0xf0f0f0)

  // 添加环境光
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.6)
  scene.add(ambientLight)

  // 添加平行光
  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8)
  directionalLight.position.set(10, 20, 10)
  scene.add(directionalLight)

  // 添加点光源
  const pointLight = new THREE.PointLight(0xffffff, 0.5)
  pointLight.position.set(-10, 10, -10)
  scene.add(pointLight)

  return scene
}

/**
 * 动画移动对象到目标位置
 * @param {THREE.Object3D} object - 要移动的对象
 * @param {Object} targetPosition - 目标位置 {x, y, z}
 * @param {number} duration - 动画持续时间（秒）
 * @param {Function} onComplete - 完成回调
 */
export function animateToObject(object, targetPosition, duration = 2, onComplete = null) {
  const startPosition = {
    x: object.position.x,
    y: object.position.y,
    z: object.position.z,
  }

  const startTime = Date.now()

  function update() {
    const elapsed = (Date.now() - startTime) / 1000
    const progress = Math.min(elapsed / duration, 1)

    // 使用 ease-in-out 缓动函数
    const easeProgress = progress < 0.5
      ? 2 * progress * progress
      : 1 - Math.pow(-2 * progress + 2, 2) / 2

    object.position.x = startPosition.x + (targetPosition.x - startPosition.x) * easeProgress
    object.position.y = startPosition.y + (targetPosition.y - startPosition.y) * easeProgress
    object.position.z = startPosition.z + (targetPosition.z - startPosition.z) * easeProgress

    if (progress < 1) {
      requestAnimationFrame(update)
    } else if (onComplete) {
      onComplete()
    }
  }

  update()
}

/**
 * 设置对象透明度
 * @param {THREE.Object3D} object - 3D对象
 * @param {number} opacity - 透明度 (0-1)
 */
export function setObjectOpacity(object, opacity = 0.5) {
  object.traverse((child) => {
    if (child.isMesh && child.material) {
      child.material.transparent = true
      child.material.opacity = opacity
    }
  })
}

/**
 * 高亮显示对象
 * @param {THREE.Object3D} object - 3D对象
 * @param {boolean} highlight - 是否高亮
 */
export function highlightObject(object, highlight = true) {
  object.traverse((child) => {
    if (child.isMesh && child.material) {
      if (highlight) {
        child.material.emissive = new THREE.Color(0x444444)
      } else {
        child.material.emissive = new THREE.Color(0x000000)
      }
    }
  })
}

/**
 * 计算场景中心点
 * @param {THREE.Scene} scene - 场景对象
 * @returns {THREE.Vector3}
 */
export function getSceneCenter(scene) {
  const box = new THREE.Box3()
  scene.traverse((child) => {
    if (child.isMesh) {
      box.expandByObject(child)
    }
  })
  return box.getCenter(new THREE.Vector3())
}
