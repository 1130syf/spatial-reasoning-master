-- 运动纠正模块训练报告表
CREATE TABLE IF NOT EXISTS `exercise_reports` (
  `id` int NOT NULL AUTO_INCREMENT,
  `patient_id` int NOT NULL,
  `exercise_type` enum('深蹲','二头弯举','其他') NOT NULL DEFAULT '其他',
  `session_start_time` timestamp NULL DEFAULT NULL,
  `session_end_time` timestamp NULL DEFAULT NULL,
  `total_attempts` int DEFAULT 0 COMMENT '总尝试次数',
  `valid_reps` int DEFAULT 0 COMMENT '有效次数',
  `success_rate` decimal(5,2) DEFAULT 0.00 COMMENT '成功率 (%)',
  `average_score` decimal(5,2) DEFAULT 0.00 COMMENT '平均得分',
  `rep_details` json DEFAULT NULL COMMENT '每次重复的详细数据',
  `summary_data` json DEFAULT NULL COMMENT '训练总结数据',
  `screenshots` json DEFAULT NULL COMMENT '关键截图数据',
  `recommendations` text COMMENT '改善建议',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `patient_id` (`patient_id`),
  KEY `exercise_type` (`exercise_type`),
  KEY `created_at` (`created_at`),
  CONSTRAINT `exercise_reports_ibfk_1` FOREIGN KEY (`patient_id`) REFERENCES `patients` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='运动纠正模块训练报告';

-- 运动报告详细数据表（每次重复的数据）
CREATE TABLE IF NOT EXISTS `exercise_rep_details` (
  `id` int NOT NULL AUTO_INCREMENT,
  `report_id` int NOT NULL,
  `rep_number` int NOT NULL COMMENT '重复次数',
  `start_time` timestamp NULL DEFAULT NULL,
  `end_time` timestamp NULL DEFAULT NULL,
  `duration_ms` int DEFAULT 0 COMMENT '持续时间（毫秒）',
  `score` decimal(5,2) DEFAULT 0.00 COMMENT '本次得分',
  `is_valid` tinyint(1) DEFAULT 0 COMMENT '是否为有效重复',
  `joint_angles` json DEFAULT NULL COMMENT '关节角度数据',
  `form_analysis` json DEFAULT NULL COMMENT '动作形态分析',
  `feedback_data` json DEFAULT NULL COMMENT '实时反馈数据',
  `screenshot` longtext COMMENT '本次重复的截图',
  PRIMARY KEY (`id`),
  KEY `report_id` (`report_id`),
  KEY `rep_number` (`rep_number`),
  CONSTRAINT `exercise_rep_details_ibfk_1` FOREIGN KEY (`report_id`) REFERENCES `exercise_reports` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='运动训练重复详细数据';

-- 插入示例数据
INSERT INTO `exercise_reports` (`patient_id`, `exercise_type`, `session_start_time`, `session_end_time`, `total_attempts`, `valid_reps`, `success_rate`, `average_score`, `rep_details`, `summary_data`, `recommendations`) VALUES
(4, '深蹲', NOW(), NOW(), 12, 10, 83.33, 85.50,
'[{"rep":1,"score":92,"valid":true,"duration":3200},{"rep":2,"score":88,"valid":true,"duration":3100},{"rep":3,"score":95,"valid":true,"duration":3300}]',
'{"avg_duration":3150,"best_rep":3,"worst_rep":5,"improvement_trend":"upward","form_consistency":85}',
'注意保持膝盖不要超过脚尖，下蹲深度控制在髋部低于膝盖的高度');

INSERT INTO `exercise_reports` (`patient_id`, `exercise_type`, `session_start_time`, `session_end_time`, `total_attempts`, `valid_reps`, `success_rate`, `average_score`, `rep_details`, `summary_data`, `recommendations`) VALUES
(5, '二头弯举', NOW(), NOW(), 15, 13, 86.67, 78.20,
'[{"rep":1,"score":75,"valid":true,"duration":2800},{"rep":2,"score":82,"valid":true,"duration":2900},{"rep":3,"score":80,"valid":true,"duration":2850}]',
'{"avg_duration":2850,"elbow_stability":92,"shoulder_control":78,"rhythm_consistency":85}',
'保持肩膀稳定，避免使用惯性，控制上举和下降的速度');