<template>
  <div id="app" class="min-h-screen">
    <!-- 顶部导航 -->
    <header class="bg-white/95 backdrop-blur-sm shadow-lg fixed top-0 left-0 right-0 z-50">
      <div class="container mx-auto px-6 py-4 flex justify-between items-center">
        <div class="flex items-center gap-3">
          <span class="text-3xl">🧩</span>
          <div>
            <h1 class="text-xl font-bold text-gray-800">行测立体拼合大师</h1>
            <p class="text-xs text-gray-500">帮助公考考生掌握立体拼合题型</p>
          </div>
        </div>
        <div class="flex items-center gap-3">
          <a
            href="https://github.com/1130syf/spatial-reasoning-master"
            target="_blank"
            class="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm text-gray-700 transition-colors"
          >
            GitHub
          </a>
        </div>
      </div>
    </header>

    <!-- 主内容区 -->
    <main class="pt-24 pb-12 px-6">
      <div class="container mx-auto">
        <!-- 演示区域 -->
        <div class="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <!-- 3D 渲染区 -->
          <div class="lg:col-span-3">
            <div class="bg-white/95 backdrop-blur-sm rounded-2xl shadow-xl p-6">
              <div class="flex justify-between items-center mb-4">
                <h2 class="text-lg font-bold text-gray-800">3D 演示区域</h2>
                <div class="flex items-center gap-2 text-sm text-gray-600">
                  <span class="px-3 py-1 bg-blue-100 text-blue-700 rounded-full">
                    题目 #1
                  </span>
                </div>
              </div>

              <!-- Three.js Canvas 容器 -->
              <div
                id="canvas-container"
                class="relative w-full aspect-video bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl overflow-hidden border-2 border-gray-200"
              >
                <canvas ref="canvasRef" class="w-full h-full"></canvas>

                <!-- 加载提示 -->
                <div
                  v-if="loading"
                  class="absolute inset-0 flex items-center justify-center bg-white/80"
                >
                  <div class="text-center">
                    <div class="animate-spin text-4xl mb-4">⏳</div>
                    <p class="text-gray-600">正在加载 3D 场景...</p>
                  </div>
                </div>
              </div>

              <!-- 进度指示 -->
              <div class="mt-4 flex items-center justify-between">
                <div class="flex items-center gap-4">
                  <span class="text-sm text-gray-600">
                    步骤: <span class="font-bold text-blue-600">{{ currentStep }}/{{ totalSteps }}</span>
                  </span>
                  <span class="text-sm text-gray-600">
                    状态: <span class="font-bold text-green-600">{{ stepDescription }}</span>
                  </span>
                </div>
                <div class="flex items-center gap-2">
                  <span class="text-xs text-gray-500">💡 提示: 可以使用鼠标拖拽旋转视角</span>
                </div>
              </div>
            </div>
          </div>

          <!-- 控制面板 -->
          <div class="lg:col-span-1">
            <div class="bg-white/95 backdrop-blur-sm rounded-2xl shadow-xl p-6 space-y-6">
              <!-- 播放控制 -->
              <div>
                <h3 class="text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
                  <span>▶️</span> 播放控制
                </h3>
                <div class="grid grid-cols-2 gap-2">
                  <button
                    @click="playAnimation"
                    :disabled="isPlaying"
                    class="px-4 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg text-sm font-medium transition-colors"
                  >
                    ▶️ 播放
                  </button>
                  <button
                    @click="pauseAnimation"
                    :disabled="!isPlaying"
                    class="px-4 py-3 bg-yellow-600 hover:bg-yellow-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg text-sm font-medium transition-colors"
                  >
                    ⏸️ 暂停
                  </button>
                  <button
                    @click="previousStep"
                    :disabled="currentStep === 0"
                    class="px-4 py-3 bg-gray-600 hover:bg-gray-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg text-sm font-medium transition-colors"
                  >
                    ⏮️ 上一步
                  </button>
                  <button
                    @click="nextStep"
                    :disabled="currentStep === totalSteps"
                    class="px-4 py-3 bg-gray-600 hover:bg-gray-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg text-sm font-medium transition-colors"
                  >
                    ⏭️ 下一步
                  </button>
                </div>
              </div>

              <!-- 视角切换 -->
              <div>
                <h3 class="text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
                  <span>👁️</span> 视角切换
                </h3>
                <div class="grid grid-cols-2 gap-2">
                  <button
                    @click="setViewMode('top')"
                    :class="viewMode === 'top' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'"
                    class="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                  >
                    🔽 俯视
                  </button>
                  <button
                    @click="setViewMode('side')"
                    :class="viewMode === 'side' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'"
                    class="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                  >
                    👁️ 侧视
                  </button>
                  <button
                    @click="setViewMode('front')"
                    :class="viewMode === 'front' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'"
                    class="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                  >
                    👀 前视
                  </button>
                  <button
                    @click="setViewMode('free')"
                    :class="viewMode === 'free' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'"
                    class="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                  >
                    🔄 自由
                  </button>
                </div>
              </div>

              <!-- 速度控制 -->
              <div>
                <h3 class="text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
                  <span>⚡</span> 播放速度
                </h3>
                <div class="flex gap-2">
                  <button
                    v-for="speed in [0.5, 1, 1.5, 2]"
                    :key="speed"
                    @click="setAnimationSpeed(speed)"
                    :class="animationSpeed === speed ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'"
                    class="flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors"
                  >
                    {{ speed }}x
                  </button>
                </div>
              </div>

              <!-- 其他选项 -->
              <div>
                <h3 class="text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
                  <span>⚙️</span> 显示选项
                </h3>
                <div class="space-y-2">
                  <label class="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      v-model="showGrid"
                      class="w-4 h-4 text-blue-600 rounded"
                    >
                    <span class="text-sm text-gray-700">显示网格</span>
                  </label>
                  <label class="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      v-model="transparentMode"
                      class="w-4 h-4 text-blue-600 rounded"
                    >
                    <span class="text-sm text-gray-700">透视模式</span>
                  </label>
                </div>
              </div>

              <!-- 重置按钮 -->
              <button
                @click="resetAnimation"
                class="w-full px-4 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors"
              >
                🔄 重置动画
              </button>
            </div>
          </div>
        </div>

        <!-- 说明区域 -->
        <div class="mt-6 bg-white/95 backdrop-blur-sm rounded-2xl shadow-xl p-6">
          <h2 class="text-lg font-bold text-gray-800 mb-4">📖 解题说明</h2>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div class="bg-blue-50 rounded-lg p-4">
              <h3 class="font-bold text-blue-800 mb-2">步骤 1: 观察目标</h3>
              <p class="text-sm text-blue-700">大立体图共15个立方体，呈阶梯状分布，注意观察灰色方块位置</p>
            </div>
            <div class="bg-green-50 rounded-lg p-4">
              <h3 class="font-bold text-green-800 mb-2">步骤 2: 分析组件</h3>
              <p class="text-sm text-green-700">两块小立体图分别有7块和5块，需要第三块5块来完成拼合</p>
            </div>
            <div class="bg-purple-50 rounded-lg p-4">
              <h3 class="font-bold text-purple-800 mb-2">步骤 3: 匹配位置</h3>
              <p class="text-sm text-purple-700">灰色方块必须在第二层的特定位置，这是解题的关键线索</p>
            </div>
          </div>
        </div>
      </div>
    </main>

    <!-- 页脚 -->
    <footer class="bg-white/95 backdrop-blur-sm py-6 text-center text-sm text-gray-600">
      <p>💖 用心为公考考生打造 | Created with Claude Code</p>
    </footer>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { currentQuestion } from './data/questions.js'
import {
  createScene,
  createShapeGroup,
  createGrid,
  setCameraPosition,
  animateToObject,
  setObjectOpacity,
  highlightObject,
} from './utils/three-helper.js'

const canvasRef = ref(null)
const loading = ref(true)
const isPlaying = ref(false)
const currentStep = ref(0)
const totalSteps = ref(3)
const stepDescription = ref('准备就绪')
const viewMode = ref('free')
const animationSpeed = ref(1)
const showGrid = ref(true)
const transparentMode = ref(false)

let scene = null
let camera = null
let renderer = null
let controls = null
let animationId = null
let shapeGroups = []
let targetShape = null
let gridHelper = null

onMounted(() => {
  initThreeJS()
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  if (animationId) {
    cancelAnimationFrame(animationId)
  }
  if (renderer) {
    renderer.dispose()
  }
})

const initThreeJS = () => {
  loading.value = true

  // 创建场景
  scene = createScene()

  // 创建相机
  const width = canvasRef.value.clientWidth
  const height = canvasRef.value.clientHeight
  camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 1000)
  camera.position.set(10, 10, 10)
  camera.lookAt(0, 0, 0)

  // 创建渲染器
  renderer = new THREE.WebGLRenderer({
    canvas: canvasRef.value,
    antialias: true,
  })
  renderer.setSize(width, height)
  renderer.setPixelRatio(window.devicePixelRatio)
  renderer.shadowMap.enabled = true

  // 添加轨道控制器
  controls = new OrbitControls(camera, renderer.domElement)
  controls.enableDamping = true
  controls.dampingFactor = 0.05

  // 创建目标大立体图（半透明）
  targetShape = createShapeGroup(currentQuestion.targetShape.blocks)
  setObjectOpacity(targetShape, 0.3)
  scene.add(targetShape)

  // 创建网格
  gridHelper = createGrid(10)
  scene.add(gridHelper)

  // 创建小立体图
  currentQuestion.sourceShapes.forEach((shape) => {
    const group = createShapeGroup(shape.blocks, shape.startPosition)
    group.userData = { ...shape }
    shapeGroups.push(group)
    scene.add(group)
  })

  // 开始渲染循环
  animate()

  setTimeout(() => {
    loading.value = false
  }, 500)
}

const animate = () => {
  animationId = requestAnimationFrame(animate)
  controls.update()
  renderer.render(scene, camera)
}

const handleResize = () => {
  if (camera && renderer && canvasRef.value) {
    const width = canvasRef.value.clientWidth
    const height = canvasRef.value.clientHeight
    camera.aspect = width / height
    camera.updateProjectionMatrix()
    renderer.setSize(width, height)
  }
}

const playAnimation = async () => {
  if (isPlaying.value) return

  isPlaying.value = true
  stepDescription.value = '正在播放...'

  // 从当前步骤继续播放
  for (let i = currentStep.value; i < totalSteps.value; i++) {
    if (!isPlaying.value) break

    await executeStep(i + 1)
    currentStep.value = i + 1
    updateStepDescription()
  }

  if (currentStep.value === totalSteps.value) {
    isPlaying.value = false
    stepDescription.value = '演示完成!'
  }
}

const executeStep = (stepNumber) => {
  return new Promise((resolve) => {
    const step = currentQuestion.steps[stepNumber]
    if (!step) {
      resolve()
      return
    }

    // 找到对应的小立体图
    const shapeGroup = shapeGroups.find(g => g.userData.id === step.sourceShapeId)
    if (!shapeGroup) {
      resolve()
      return
    }

    // 高亮显示
    highlightObject(shapeGroup, true)

    // 动画移动到目标位置
    const duration = 2 / animationSpeed.value
    animateToObject(
      shapeGroup,
      step.sourceShapeId === 1 ? { x: 0, y: 0, z: 0 } :
      step.sourceShapeId === 2 ? { x: 1, y: 0, z: 0 } :
      { x: 1, y: 1, z: 0 },
      duration,
      () => {
        highlightObject(shapeGroup, false)
        resolve()
      }
    )
  })
}

const pauseAnimation = () => {
  isPlaying.value = false
  stepDescription.value = '已暂停'
}

const previousStep = () => {
  if (currentStep.value > 0) {
    // 重置所有位置
    resetAllShapes()
    currentStep.value--

    // 执行到当前步骤
    for (let i = 1; i <= currentStep.value; i++) {
      const step = currentQuestion.steps[i]
      const shapeGroup = shapeGroups.find(g => g.userData.id === step.sourceShapeId)
      if (shapeGroup) {
        const targetPos = step.sourceShapeId === 1 ? { x: 0, y: 0, z: 0 } :
                         step.sourceShapeId === 2 ? { x: 1, y: 0, z: 0 } :
                         { x: 1, y: 1, z: 0 }
        shapeGroup.position.set(targetPos.x, targetPos.y, targetPos.z)
      }
    }

    updateStepDescription()
  }
}

const nextStep = async () => {
  if (currentStep.value < totalSteps.value) {
    await executeStep(currentStep.value + 1)
    currentStep.value++
    updateStepDescription()

    if (currentStep.value === totalSteps.value) {
      stepDescription.value = '演示完成!'
    }
  }
}

const updateStepDescription = () => {
  const step = currentQuestion.steps[currentStep.value]
  if (step) {
    stepDescription.value = step.description
  }
}

const setViewMode = (mode) => {
  viewMode.value = mode
  if (camera) {
    setCameraPosition(camera, mode)
    controls.update()
  }
}

const setAnimationSpeed = (speed) => {
  animationSpeed.value = speed
}

const resetAnimation = () => {
  isPlaying.value = false
  currentStep.value = 0
  resetAllShapes()
  updateStepDescription()
}

const resetAllShapes = () => {
  shapeGroups.forEach((group) => {
    group.position.set(
      group.userData.startPosition.x,
      group.userData.startPosition.y,
      group.userData.startPosition.z
    )
  })
}
</script>
