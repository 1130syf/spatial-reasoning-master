/**
 * 运动数据修复脚本
 * 确保数据库中有必要的运动标准和参数
 */

const mysql = require('mysql2/promise');
require('dotenv').config();

async function fixExerciseData() {
    let connection;

    try {
        // 创建数据库连接
        connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'posturescan',
            password: process.env.DB_PASSWORD || 'posturescan123',
            database: process.env.DB_DATABASE || 'posture_scan_pro_db',
            charset: 'utf8mb4',
            timezone: '+00:00'
        });

        console.log('🔗 数据库连接成功');

        // 检查现有运动数据
        const [exercises] = await connection.execute('SELECT slug, name, parameters FROM exercises');
        console.log('📋 现有运动数据:');
        exercises.forEach(ex => {
            console.log(`  - ${ex.slug}: ${ex.name}`);
            if (ex.parameters) {
                try {
                    const params = typeof ex.parameters === 'string' ? JSON.parse(ex.parameters) : ex.parameters;
                    console.log(`    参数: ${JSON.stringify(params, null, 2)}`);
                } catch (e) {
                    console.log(`    参数解析失败`);
                }
            } else {
                console.log(`    参数: 无`);
            }
        });

        // 更新深蹲运动参数
        const squatParams = {
            phases: {
                down: {
                    kneeAngleThreshold: 100,  // 下蹲阈值（膝盖角度小于100度认为深蹲）
                    description: "下蹲阶段阈值"
                },
                up: {
                    kneeAngleThreshold: 160,   // 站起阈值（膝盖角度大于160度认为站立）
                    description: "站起阶段阈值"
                }
            },
            thresholds: {
                depth: 100,      // 深度阈值
                backTolerance: 15, // 背部容差
                stability: 0.8   // 稳定性阈值
            },
            tips: [
                "保持背部挺直",
                "膝盖不要超过脚尖",
                "深蹲至大腿与地面平行",
                "控制动作节奏"
            ]
        };

        await connection.execute(
            'UPDATE exercises SET parameters = ? WHERE slug = ?',
            [JSON.stringify(squatParams), 'squat']
        );
        console.log('✅ 深蹲运动参数已更新');

        // 更新二头弯举运动参数
        const bicepCurlParams = {
            phases: {
                down: {
                    elbowAngleThreshold: 65,   // 弯举峰值（手肘角度小于65度认为完全弯曲）
                    description: "弯举峰值阶段"
                },
                up: {
                    elbowAngleThreshold: 145,  // 伸展阈值（手肘角度大于145度认为完全伸展）
                    description: "伸展阶段"
                }
            },
            thresholds: {
                extension: 145,     // 伸展阈值
                stability: 0.3,     // 稳定性容差
                shoulderControl: 0.8 // 肩膀控制阈值
            },
            tips: [
                "保持肩膀稳定",
                "避免使用惯性",
                "控制上举和下降速度",
                "确保二头肌完全收缩"
            ]
        };

        await connection.execute(
            'UPDATE exercises SET parameters = ? WHERE slug = ?',
            [JSON.stringify(bicepCurlParams), 'bicep-curl']
        );
        console.log('✅ 二头弯举运动参数已更新');

        // 验证更新结果
        const [updatedExercises] = await connection.execute(
            'SELECT slug, name, parameters FROM exercises WHERE slug IN ("squat", "bicep-curl")'
        );

        console.log('📋 更新后的运动数据:');
        updatedExercises.forEach(ex => {
            console.log(`  - ${ex.slug}: ${ex.name}`);
            try {
                const params = typeof ex.parameters === 'string' ? JSON.parse(ex.parameters) : ex.parameters;
                console.log(`    参数包含phases: ${!!params.phases}`);
                if (params.phases) {
                    console.log(`    down阈值: ${params.phases.down?.elbowAngleThreshold || params.phases.down?.kneeAngleThreshold}`);
                    console.log(`    up阈值: ${params.phases.up?.elbowAngleThreshold || params.phases.up?.kneeAngleThreshold}`);
                }
            } catch (e) {
                console.log(`    参数解析失败: ${e.message}`);
            }
        });

        console.log('🎉 运动数据修复完成！');

    } catch (error) {
        console.error('❌ 修复运动数据时出错:', error);

        // 如果数据库连接失败，提供解决建议
        if (error.code === 'ECONNREFUSED') {
            console.log('\n💡 数据库连接失败的解决方案:');
            console.log('1. 确保MySQL服务正在运行');
            console.log('2. 检查.env文件中的数据库配置');
            console.log('3. 运行以下命令启动MySQL: net start mysql80');
            console.log('4. 或运行数据库初始化脚本: setup_database.bat');
        }

    } finally {
        if (connection) {
            await connection.end();
            console.log('🔌 数据库连接已关闭');
        }
    }
}

// 如果直接运行此脚本
if (require.main === module) {
    console.log('🚀 开始修复运动数据...');
    fixExerciseData();
}

module.exports = { fixExerciseData };