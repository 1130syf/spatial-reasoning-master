-- =====================================================
-- PostureScan Pro 完整数据库初始化脚本
-- 版本: 1.0.0
-- 创建时间: 2025-12-20
-- 说明: 创建PostureScan Pro所需的所有数据库表和初始数据
-- =====================================================

-- 创建数据库（如果不存在）
CREATE DATABASE IF NOT EXISTS `posture_scan_pro_db`
DEFAULT CHARACTER SET utf8mb4
DEFAULT COLLATE utf8mb4_unicode_ci;

-- 使用数据库
USE `posture_scan_pro_db`;

-- =====================================================
-- 1. 患者信息表 (patients)
-- =====================================================
CREATE TABLE IF NOT EXISTS `patients` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL COMMENT '患者姓名',
  `gender` enum('男','女','其他') DEFAULT '男' COMMENT '性别',
  `age` int DEFAULT NULL COMMENT '年龄',
  `height` decimal(5,2) DEFAULT NULL COMMENT '身高(cm)',
  `weight` decimal(5,2) DEFAULT NULL COMMENT '体重(kg)',
  `lastCapture` date DEFAULT NULL COMMENT '最后捕获日期',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  INDEX `idx_gender` (`gender`),
  INDEX `idx_age` (`age`),
  INDEX `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='患者信息表';

-- =====================================================
-- 2. 姿态评估表 (assessments)
-- =====================================================
CREATE TABLE IF NOT EXISTS `assessments` (
  `id` int NOT NULL AUTO_INCREMENT,
  `patient_id` int NOT NULL COMMENT '患者ID',
  `assessment_data` json DEFAULT NULL COMMENT '姿态评估数据(JSON格式)',
  `screenshot` longtext COMMENT '评估截图(base64)',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT '评估时间',
  PRIMARY KEY (`id`),
  KEY `idx_patient_id` (`patient_id`),
  KEY `idx_created_at` (`created_at`),
  CONSTRAINT `fk_assessments_patient` FOREIGN KEY (`patient_id`) REFERENCES `patients` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='姿态评估记录表';

-- =====================================================
-- 3. 运动分类表 (exercise_categories)
-- =====================================================
CREATE TABLE IF NOT EXISTS `exercise_categories` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL COMMENT '分类名称',
  `description` text COMMENT '分类描述',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_category_name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='运动分类表';

-- =====================================================
-- 4. 运动项目表 (exercises)
-- =====================================================
CREATE TABLE IF NOT EXISTS `exercises` (
  `id` int NOT NULL AUTO_INCREMENT,
  `category_id` int DEFAULT NULL COMMENT '分类ID',
  `name` varchar(100) NOT NULL COMMENT '运动名称',
  `slug` varchar(100) NOT NULL COMMENT 'URL友好标识',
  `description` text COMMENT '运动描述',
  `parameters` json DEFAULT NULL COMMENT '运动参数(JSON)',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_exercise_slug` (`slug`),
  KEY `idx_category_id` (`category_id`),
  CONSTRAINT `fk_exercises_category` FOREIGN KEY (`category_id`) REFERENCES `exercise_categories` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='运动项目表';

-- =====================================================
-- 5. 运动训练报告表 (exercise_reports)
-- =====================================================
CREATE TABLE IF NOT EXISTS `exercise_reports` (
  `id` int NOT NULL AUTO_INCREMENT,
  `patient_id` int NOT NULL COMMENT '患者ID',
  `exercise_type` enum('深蹲','二头弯举','其他') NOT NULL DEFAULT '其他' COMMENT '运动类型',
  `session_start_time` timestamp NULL DEFAULT NULL COMMENT '训练开始时间',
  `session_end_time` timestamp NULL DEFAULT NULL COMMENT '训练结束时间',
  `total_attempts` int DEFAULT 0 COMMENT '总尝试次数',
  `valid_reps` int DEFAULT 0 COMMENT '有效次数',
  `success_rate` decimal(5,2) DEFAULT 0.00 COMMENT '成功率 (%)',
  `average_score` decimal(5,2) DEFAULT 0.00 COMMENT '平均得分',
  `rep_details` json DEFAULT NULL COMMENT '每次重复的详细数据',
  `summary_data` json DEFAULT NULL COMMENT '训练总结数据',
  `screenshots` json DEFAULT NULL COMMENT '关键截图数据',
  `recommendations` text COMMENT '改善建议',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`id`),
  KEY `idx_patient_id` (`patient_id`),
  KEY `idx_exercise_type` (`exercise_type`),
  KEY `idx_created_at` (`created_at`),
  CONSTRAINT `fk_exercise_reports_patient` FOREIGN KEY (`patient_id`) REFERENCES `patients` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='运动纠正模块训练报告';

-- =====================================================
-- 6. 运动训练重复详细数据表 (exercise_rep_details)
-- =====================================================
CREATE TABLE IF NOT EXISTS `exercise_rep_details` (
  `id` int NOT NULL AUTO_INCREMENT,
  `report_id` int NOT NULL COMMENT '报告ID',
  `rep_number` int NOT NULL COMMENT '重复次数',
  `start_time` timestamp NULL DEFAULT NULL COMMENT '开始时间',
  `end_time` timestamp NULL DEFAULT NULL COMMENT '结束时间',
  `duration_ms` int DEFAULT 0 COMMENT '持续时间（毫秒）',
  `score` decimal(5,2) DEFAULT 0.00 COMMENT '本次得分',
  `is_valid` tinyint(1) DEFAULT 0 COMMENT '是否为有效重复',
  `joint_angles` json DEFAULT NULL COMMENT '关节角度数据',
  `form_analysis` json DEFAULT NULL COMMENT '动作形态分析',
  `feedback_data` json DEFAULT NULL COMMENT '实时反馈数据',
  `screenshot` longtext COMMENT '本次重复的截图',
  PRIMARY KEY (`id`),
  KEY `idx_report_id` (`report_id`),
  KEY `idx_rep_number` (`rep_number`),
  CONSTRAINT `fk_exercise_rep_details_report` FOREIGN KEY (`report_id`) REFERENCES `exercise_reports` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='运动训练重复详细数据';

-- =====================================================
-- 插入初始数据
-- =====================================================

-- 插入运动分类数据
INSERT INTO `exercise_categories` (`name`, `description`) VALUES
('力量训练', '以增强肌肉力量为主要目的的训练项目'),
('姿态纠正', '以改善身体姿态为主要目的的训练项目'),
('康复训练', '以身体机能康复为主要目的的训练项目');

-- 插入运动项目数据
INSERT INTO `exercises` (`category_id`, `name`, `slug`, `description`, `parameters`) VALUES
(2, '标准深蹲', 'squat', '深蹲动作训练，用于评估和纠正下肢姿态',
 '{"depth_threshold": 100, "back_tolerance": 15, "stability_threshold": 0.8}'),
(1, '二头弯举', 'bicep-curl', '二头肌弯举训练，用于评估上肢力量和动作标准性',
 '{"depth_threshold": 65, "extension_threshold": 145, "stability_tolerance": 0.3}'),
(2, '姿态评估', 'posture-assessment', '静态姿态评估，用于分析身体姿态健康状况',
 '{"assessment_duration": 5000, "analysis_dimensions": ["coronal", "sagittal", "transverse"]}');

-- 插入示例患者数据
INSERT INTO `patients` (`name`, `gender`, `age`, `height`, `weight`) VALUES
('张三', '男', 28, 175.00, 70.50),
('李四', '女', 25, 165.00, 55.00),
('王五', '男', 35, 180.00, 80.00);

-- 插入示例评估数据
INSERT INTO `assessments` (`patient_id`, `assessment_data`, `created_at`) VALUES
(1, '{"sagittalAngles": {"head": {"value": 15.5}, "neck": {"value": 25.3}, "trunk": {"value": 5.2}}, "balanceIndex": {"overall": {"value": 85.5}, "sagittal": {"value": 88.0}, "coronal": {"value": 83.0}}}', NOW()),
(2, '{"sagittalAngles": {"head": {"value": 12.3}, "neck": {"value": 20.1}, "trunk": {"value": 3.8}}, "balanceIndex": {"overall": {"value": 92.1}, "sagittal": {"value": 95.0}, "coronal": {"value": 89.2}}}', NOW());

-- 插入示例运动报告数据
INSERT INTO `exercise_reports` (`patient_id`, `exercise_type`, `session_start_time`, `session_end_time`, `total_attempts`, `valid_reps`, `success_rate`, `average_score`, `rep_details`, `summary_data`, `recommendations`) VALUES
(1, '深蹲', NOW(), NOW(), 12, 10, 83.33, 85.50,
 '[{"rep":1,"score":92,"valid":true,"duration":3200},{"rep":2,"score":88,"valid":true,"duration":3100},{"rep":3,"score":95,"valid":true,"duration":3300}]',
 '{"avg_duration":3150,"best_rep":3,"worst_rep":5,"improvement_trend":"upward","form_consistency":85}',
 '注意保持膝盖不要超过脚尖，下蹲深度控制在髋部低于膝盖的高度'),
(2, '二头弯举', NOW(), NOW(), 15, 13, 86.67, 78.20,
 '[{"rep":1,"score":75,"valid":true,"duration":2800},{"rep":2,"score":82,"valid":true,"duration":2900},{"rep":3,"score":80,"valid":true,"duration":2850}]',
 '{"avg_duration":2850,"elbow_stability":92,"shoulder_control":78,"rhythm_consistency":85}',
 '保持肩膀稳定，避免使用惯性，控制上举和下降的速度');

-- =====================================================
-- 数据库初始化完成
-- =====================================================

-- 显示创建的表
SHOW TABLES;

-- 显示患者数据统计
SELECT
    'patients' as table_name,
    COUNT(*) as record_count
FROM patients
UNION ALL
SELECT
    'assessments' as table_name,
    COUNT(*) as record_count
FROM assessments
UNION ALL
SELECT
    'exercise_reports' as table_name,
    COUNT(*) as record_count
FROM exercise_reports;

-- 输出成功信息
SELECT 'PostureScan Pro 数据库初始化完成！' as message;