// 题目数据 - 立体拼合真题
export const questions = [
  {
    id: 'spatial-001',
    title: '立体拼合真题 #1',
    description: '选出正确选项，使其与右上方的两块小立方体可以拼合成左上方的大立体图',

    // 目标大立体图
    targetShape: {
      blocks: [
        // 底层 (y=0) - 5个立方体
        { x: 0, y: 0, z: 0, color: '#3B82F6' },
        { x: 1, y: 0, z: 0, color: '#3B82F6' },
        { x: 2, y: 0, z: 0, color: '#3B82F6' },
        { x: 3, y: 0, z: 0, color: '#3B82F6' },
        { x: 4, y: 0, z: 0, color: '#3B82F6' },

        // 第二层 (y=1) - 5个立方体，其中2个是灰色
        { x: 0, y: 1, z: 0, color: '#3B82F6' },
        { x: 1, y: 1, z: 0, color: 'gray', isGray: true }, // 灰色方块1
        { x: 2, y: 1, z: 0, color: '#3B82F6' },
        { x: 3, y: 1, z: 0, color: 'gray', isGray: true }, // 灰色方块2
        { x: 4, y: 1, z: 0, color: '#3B82F6' },

        // 第三层 (y=2) - 4个立方体
        { x: 0, y: 2, z: 0, color: '#3B82F6' },
        { x: 1, y: 2, z: 0, color: '#3B82F6' },
        { x: 2, y: 2, z: 0, color: '#3B82F6' },
        { x: 3, y: 2, z: 0, color: '#3B82F6' },

        // 第四层 (y=3) - 1个立方体
        { x: 0, y: 3, z: 0, color: '#3B82F6' },
      ],
      totalBlocks: 15,
    },

    // 小立体图组件
    sourceShapes: [
      {
        id: 1,
        name: '小立体图 #1',
        description: '左侧阶梯结构 (7块)',
        blocks: [
          // 底层 - 4个
          { x: 0, y: 0, z: 0, color: '#60A5FA' },
          { x: 1, y: 0, z: 0, color: '#60A5FA' },
          { x: 2, y: 0, z: 0, color: '#60A5FA' },
          { x: 3, y: 0, z: 0, color: '#60A5FA' },

          // 第二层 - 2个
          { x: 2, y: 1, z: 0, color: '#60A5FA' },
          { x: 3, y: 1, z: 0, color: 'gray', isGray: true },

          // 第三层 - 1个
          { x: 3, y: 2, z: 0, color: '#60A5FA' },
        ],
        targetPosition: { x: 0, y: 0, z: 0 },
        startPosition: { x: -8, y: 0, z: 0 },
        order: 1,
      },
      {
        id: 2,
        name: '小立体图 #2',
        description: '右侧凸起结构 (5块)',
        blocks: [
          // 底层 - 4个
          { x: 0, y: 0, z: 0, color: '#34D399' },
          { x: 1, y: 0, z: 0, color: '#34D399' },
          { x: 2, y: 0, z: 0, color: '#34D399' },
          { x: 3, y: 0, z: 0, color: '#34D399' },

          // 第二层 - 1个
          { x: 1, y: 1, z: 0, color: 'gray', isGray: true },
        ],
        targetPosition: { x: 1, y: 0, z: 0 },
        startPosition: { x: 8, y: 0, z: 0 },
        order: 2,
      },
      {
        id: 3,
        name: '小立体图 #3 (选项)',
        description: '中间填补结构 (5块) - A选项',
        blocks: [
          // 底层 - 4个
          { x: 0, y: 0, z: 0, color: '#FBBF24' },
          { x: 1, y: 0, z: 0, color: 'gray', isGray: true },
          { x: 2, y: 0, z: 0, color: '#FBBF24' },
          { x: 3, y: 0, z: 0, color: '#FBBF24' },

          // 第二层 - 1个
          { x: 1, y: 1, z: 0, color: '#FBBF24' },
        ],
        targetPosition: { x: 1, y: 1, z: 0 },
        startPosition: { x: 0, y: -5, z: 0 },
        order: 3,
      },
    ],

    // 解题步骤
    steps: [
      {
        order: 0,
        title: '初始状态',
        description: '观察目标大立体图和三块小立体图',
        cameraPosition: { x: 10, y: 10, z: 10 },
      },
      {
        order: 1,
        title: '第一步: 拼合左侧阶梯结构',
        description: '将小立体图 #1 (7块) 拼合到目标位置',
        sourceShapeId: 1,
        cameraPosition: { x: 5, y: 8, z: 8 },
      },
      {
        order: 2,
        title: '第二步: 拼合右侧凸起结构',
        description: '将小立体图 #2 (5块) 拼合到目标位置',
        sourceShapeId: 2,
        cameraPosition: { x: 12, y: 8, z: 8 },
      },
      {
        order: 3,
        title: '第三步: 拼合中间填补',
        description: '将小立体图 #3 (5块) 拼合到目标位置 - 完成!',
        sourceShapeId: 3,
        cameraPosition: { x: 10, y: 10, z: 10 },
      },
    ],

    // 正确答案
    correctAnswer: 'A',

    // 解题要点
    keyPoints: [
      '大立体图共15个立方体，呈阶梯状分布',
      '灰色方块位于第二层的特定位置（左侧和右侧）',
      '小立体图 #1 贡献7块，填补左侧阶梯',
      '小立体图 #2 贡献5块，填补右侧凸起',
      '第三块需要5块，且灰色方块位置必须在底层中间',
      'A选项的灰色方块在底层中间，符合要求',
    ],
  },
]

// 导出第一题
export const currentQuestion = questions[0]
