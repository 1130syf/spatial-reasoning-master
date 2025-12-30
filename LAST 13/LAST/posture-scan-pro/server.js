/**
 * Express 后端服务器 - 用于浏览器模式下的数据库访问
 */
const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');
require('dotenv').config();

const app = express();
const PORT = process.env.API_PORT || 3001;

// 中间件
app.use(cors());
app.use(express.json({ limit: '50mb' }));

// 根路由处理
app.get('/', (req, res) => {
  res.json({
    name: 'PostureScan Pro API Server',
    version: '1.0.0',
    description: '专业3D姿态评估系统后端服务',
    status: 'running',
    timestamp: new Date().toISOString(),
    endpoints: {
      health: '/api/health',
      patients: '/api/patients',
      assessments: '/api/assessments',
      reports: '/api/exercise-reports',
      statistics: '/api/statistics'
    },
    documentation: 'http://localhost:3001/api/health'
  });
});

// 健康检查端点
app.get('/api/health/database', async (req, res) => {
  try {
    // 测试数据库连接
    const [rows] = await dbPool.query('SELECT 1 as test');
    res.json({
      status: 'connected',
      message: '数据库连接正常',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('数据库健康检查失败:', error);
    res.status(500).json({
      status: 'error',
      message: '数据库连接异常',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// 创建数据库连接池
let dbPool;
try {
  dbPool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    // MySQL 8.0 兼容性配置
    charset: 'utf8mb4',
    timezone: '+00:00',
    // 添加SSL配置以避免MySQL 8.0的问题
    ssl: false,
    // 连接超时设置
    acquireTimeout: 60000,
    timeout: 60000,
    // 强制使用mysql_native_password认证
    authPlugins: ['mysql_native_password']
  });
  console.log('✅ 数据库连接池创建成功');
} catch (error) {
  console.error('❌ 数据库连接失败:', error.message);
  process.exit(1);
}

// ========== Patient APIs ==========
app.get('/api/patients', async (req, res) => {
  try {
    const [rows] = await dbPool.query('SELECT * FROM patients ORDER BY created_at DESC');
    res.json(rows);
  } catch (error) {
    console.error('获取患者列表失败:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/patients/:id', async (req, res) => {
  try {
    const [rows] = await dbPool.query('SELECT * FROM patients WHERE id = ?', [req.params.id]);
    res.json(rows[0] || null);
  } catch (error) {
    console.error('获取患者详情失败:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/patients', async (req, res) => {
  try {
    const { name, gender, age, height, weight } = req.body;
    const sql = 'INSERT INTO patients (name, gender, age, height, weight) VALUES (?, ?, ?, ?, ?)';
    const [result] = await dbPool.execute(sql, [name, gender, age, height, weight]);
    res.json({ id: result.insertId, ...req.body });
  } catch (error) {
    console.error('添加患者失败:', error);
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/patients/:id', async (req, res) => {
  try {
    const { name, gender, age, height, weight } = req.body;
    const sql = 'UPDATE patients SET name = ?, gender = ?, age = ?, height = ?, weight = ? WHERE id = ?';
    await dbPool.execute(sql, [name, gender, age, height, weight, req.params.id]);
    res.json({ id: parseInt(req.params.id), ...req.body });
  } catch (error) {
    console.error('更新患者失败:', error);
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/patients/:id', async (req, res) => {
  try {
    await dbPool.execute('DELETE FROM patients WHERE id = ?', [req.params.id]);
    res.json({ id: parseInt(req.params.id) });
  } catch (error) {
    console.error('删除患者失败:', error);
    res.status(500).json({ error: error.message });
  }
});

// ========== Assessment APIs ==========
app.get('/api/assessments', async (req, res) => {
  try {
    const sql = `
      SELECT a.id, a.patient_id, a.created_at, a.assessment_data, p.name as patientName 
      FROM assessments a
      JOIN patients p ON a.patient_id = p.id
      ORDER BY a.created_at DESC
    `;
    const [rows] = await dbPool.query(sql);
    // 提取评估类型
    const result = rows.map(row => {
      let assessmentType = '静态体态评估';
      try {
        if (row.assessment_data) {
          const data = typeof row.assessment_data === 'string' 
            ? JSON.parse(row.assessment_data) 
            : row.assessment_data;
          assessmentType = data.type || '静态体态评估';
        }
      } catch (e) {}
      return {
        id: row.id,
        patient_id: row.patient_id,
        created_at: row.created_at,
        patientName: row.patientName,
        assessmentType: assessmentType
      };
    });
    res.json(result);
  } catch (error) {
    console.error('获取评估列表失败:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/assessments/:id', async (req, res) => {
  try {
    const [rows] = await dbPool.query('SELECT * FROM assessments WHERE id = ?', [req.params.id]);
    if (rows.length > 0) {
      const [patientRows] = await dbPool.query('SELECT name FROM patients WHERE id = ?', [rows[0].patient_id]);
      res.json({ ...rows[0], patientName: patientRows[0]?.name });
    } else {
      res.json(null);
    }
  } catch (error) {
    console.error('获取评估详情失败:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/patients/:patientId/assessments', async (req, res) => {
  try {
    const sql = 'SELECT id, created_at, assessment_data FROM assessments WHERE patient_id = ? ORDER BY created_at DESC';
    const [rows] = await dbPool.query(sql, [req.params.patientId]);
    // 提取评估类型
    const result = rows.map(row => {
      let assessmentType = '静态体态评估';
      try {
        if (row.assessment_data) {
          const data = typeof row.assessment_data === 'string' 
            ? JSON.parse(row.assessment_data) 
            : row.assessment_data;
          assessmentType = data.type || '静态体态评估';
        }
      } catch (e) {}
      return {
        id: row.id,
        created_at: row.created_at,
        assessmentType: assessmentType,
        assessment_data: row.assessment_data
      };
    });
    res.json(result);
  } catch (error) {
    console.error('获取患者评估列表失败:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/assessments', async (req, res) => {
  try {
    const { patientId, assessmentData, screenshot } = req.body;
    const sql = 'INSERT INTO assessments (patient_id, assessment_data, screenshot) VALUES (?, ?, ?)';
    const [result] = await dbPool.execute(sql, [patientId, JSON.stringify(assessmentData), screenshot]);
    res.json({ id: result.insertId });
  } catch (error) {
    console.error('添加评估失败:', error);
    res.status(500).json({ error: error.message });
  }
});

// ========== Exercise APIs ==========
app.get('/api/exercises', async (req, res) => {
  try {
    const sql = `
      SELECT e.id, e.name, e.slug, e.description, ec.name as categoryName
      FROM exercises e
      JOIN exercise_categories ec ON e.category_id = ec.id
      ORDER BY ec.id, e.name
    `;
    const [rows] = await dbPool.query(sql);
    res.json(rows);
  } catch (error) {
    console.error('获取运动列表失败:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/exercises/:slug', async (req, res) => {
  try {
    const [rows] = await dbPool.query('SELECT * FROM exercises WHERE slug = ?', [req.params.slug]);
    res.json(rows[0] || null);
  } catch (error) {
    console.error('获取运动详情失败:', error);
    res.status(500).json({ error: error.message });
  }
});

// ========== Exercise Report APIs ==========
// 获取运动训练报告列表
app.get('/api/exercise-reports', async (req, res) => {
  try {
    const sql = `
      SELECT er.id, er.patient_id, er.exercise_type, er.session_start_time, er.session_end_time,
             er.total_attempts, er.valid_reps, er.success_rate, er.average_score,
             p.name as patientName, p.age, p.gender
      FROM exercise_reports er
      JOIN patients p ON er.patient_id = p.id
      ORDER BY er.created_at DESC
    `;
    const [rows] = await dbPool.query(sql);
    res.json(rows);
  } catch (error) {
    console.error('获取运动报告列表失败:', error);
    res.status(500).json({ error: error.message });
  }
});

// 获取特定患者的运动报告
app.get('/api/exercise-reports/patient/:patientId', async (req, res) => {
  try {
    const sql = `
      SELECT er.*, p.name as patientName
      FROM exercise_reports er
      JOIN patients p ON er.patient_id = p.id
      WHERE er.patient_id = ?
      ORDER BY er.created_at DESC
    `;
    const [rows] = await dbPool.query(sql, [req.params.patientId]);
    res.json(rows);
  } catch (error) {
    console.error('获取患者运动报告失败:', error);
    res.status(500).json({ error: error.message });
  }
});

// 获取运动报告详情
app.get('/api/exercise-reports/:id', async (req, res) => {
  try {
    const [reportRows] = await dbPool.query(`
      SELECT er.*, p.name as patientName, p.age, p.gender, p.height, p.weight
      FROM exercise_reports er
      JOIN patients p ON er.patient_id = p.id
      WHERE er.id = ?
    `, [req.params.id]);

    if (reportRows.length === 0) {
      return res.status(404).json({ error: '报告不存在' });
    }

    const report = reportRows[0];

    // 获取每次重复的详细数据
    const [repRows] = await dbPool.query(`
      SELECT * FROM exercise_rep_details
      WHERE report_id = ?
      ORDER BY rep_number
    `, [req.params.id]);

    res.json({
      ...report,
      repDetails: repRows
    });
  } catch (error) {
    console.error('获取运动报告详情失败:', error);
    res.status(500).json({ error: error.message });
  }
});

// 创建新的运动报告
app.post('/api/exercise-reports', async (req, res) => {
  try {
    const {
      patientId,
      exerciseType,
      sessionStartTime,
      sessionEndTime,
      totalAttempts,
      validReps,
      successRate,
      averageScore,
      repDetails,
      summaryData,
      screenshots,
      recommendations
    } = req.body;

    const sql = `
      INSERT INTO exercise_reports (
        patient_id, exercise_type, session_start_time, session_end_time,
        total_attempts, valid_reps, success_rate, average_score,
        rep_details, summary_data, screenshots, recommendations
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const [result] = await dbPool.query(sql, [
      patientId, exerciseType, sessionStartTime, sessionEndTime,
      totalAttempts, validReps, successRate, averageScore,
      JSON.stringify(repDetails), JSON.stringify(summaryData),
      JSON.stringify(screenshots), recommendations
    ]);

    // 如果有详细的重复数据，批量插入
    if (req.body.repDetailedData && Array.isArray(req.body.repDetailedData)) {
      const repData = req.body.repDetailedData.map(rep => [
        result.insertId, rep.repNumber, rep.startTime, rep.endTime,
        rep.durationMs, rep.score, rep.isValid,
        JSON.stringify(rep.jointAngles), JSON.stringify(rep.formAnalysis),
        JSON.stringify(rep.feedbackData), rep.screenshot
      ]);

      const repSql = `
        INSERT INTO exercise_rep_details (
          report_id, rep_number, start_time, end_time, duration_ms, score,
          is_valid, joint_angles, form_analysis, feedback_data, screenshot
        ) VALUES ?
      `;

      await dbPool.query(repSql, [repData]);
    }

    res.json({ id: result.insertId });
  } catch (error) {
    console.error('创建运动报告失败:', error);
    res.status(500).json({ error: error.message });
  }
});

// ========== Statistics APIs (数据展示模块) ==========
// 获取综合统计数据
app.get('/api/statistics', async (req, res) => {
  try {
    // 1. 总人数
    const [totalPatients] = await dbPool.query('SELECT COUNT(*) as count FROM patients');
    
    // 2. 总评估数
    const [totalAssessments] = await dbPool.query('SELECT COUNT(*) as count FROM assessments');
    
    // 3. 性别分布
    const [genderDist] = await dbPool.query(`
      SELECT gender, COUNT(*) as count FROM patients GROUP BY gender
    `);
    
    // 4. 年龄分布
    const [ageDist] = await dbPool.query(`
      SELECT 
        CASE 
          WHEN age < 18 THEN '18岁以下'
          WHEN age BETWEEN 18 AND 30 THEN '18-30岁'
          WHEN age BETWEEN 31 AND 45 THEN '31-45岁'
          WHEN age BETWEEN 46 AND 60 THEN '46-60岁'
          ELSE '60岁以上'
        END as ageGroup,
        COUNT(*) as count
      FROM patients
      GROUP BY ageGroup
      ORDER BY MIN(age)
    `);
    
    // 5. 评估类型分布（从assessment_data中提取type字段）
    const [typeDist] = await dbPool.query(`
      SELECT 
        COALESCE(JSON_UNQUOTE(JSON_EXTRACT(assessment_data, '$.type')), '静态体态评估') as type,
        COUNT(*) as count
      FROM assessments
      GROUP BY type
    `);
    
    // 6. 每月评估趋势（最近12个月）
    const [monthlyTrend] = await dbPool.query(`
      SELECT 
        DATE_FORMAT(created_at, '%Y-%m') as month,
        COUNT(*) as count
      FROM assessments
      WHERE created_at >= DATE_SUB(NOW(), INTERVAL 12 MONTH)
      GROUP BY month
      ORDER BY month
    `);
    
    // 7. 平均平衡指数分布
    const [balanceScores] = await dbPool.query(`
      SELECT 
        JSON_UNQUOTE(JSON_EXTRACT(assessment_data, '$.balanceIndex.overall.value')) as score
      FROM assessments
      WHERE JSON_EXTRACT(assessment_data, '$.balanceIndex.overall.value') IS NOT NULL
      LIMIT 100
    `);
    
    res.json({
      totalPatients: totalPatients[0].count,
      totalAssessments: totalAssessments[0].count,
      genderDistribution: genderDist,
      ageDistribution: ageDist,
      typeDistribution: typeDist,
      monthlyTrend: monthlyTrend,
      balanceScores: balanceScores.map(r => parseFloat(r.score) || 0).filter(s => s > 0)
    });
  } catch (error) {
    console.error('获取统计数据失败:', error);
    res.status(500).json({ error: error.message });
  }
});

// 健康检查
app.get('/api/health', async (req, res) => {
  try {
    await dbPool.query('SELECT 1');
    res.json({ status: 'ok', database: 'connected' });
  } catch (error) {
    res.status(500).json({ status: 'error', database: 'disconnected', error: error.message });
  }
});

// 启动服务器
app.listen(PORT, () => {
  console.log(`🚀 API 服务器运行在 http://localhost:${PORT}`);
  console.log(`📊 健康检查: http://localhost:${PORT}/api/health`);
});
