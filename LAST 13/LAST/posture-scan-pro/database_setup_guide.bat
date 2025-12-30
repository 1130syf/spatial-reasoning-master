@echo off
echo ========================================
echo PostureScan Pro 数据库配置指南
echo ========================================
echo.
echo 请按照以下步骤配置数据库：
echo.
echo 1. 打开命令提示符（管理员模式）
echo 2. 启动MySQL服务：net start mysql80
echo 3. 登录MySQL：mysql -u root -p
echo 4. 输入您的MySQL root密码
echo 5. 创建数据库和用户：
echo.

echo -- 在MySQL命令行中执行以下SQL命令：
echo CREATE DATABASE IF NOT EXISTS posture_scan_pro_db DEFAULT CHARACTER SET utf8mb4 DEFAULT COLLATE utf8mb4_unicode_ci;
echo CREATE USER IF NOT EXISTS 'posturescan'@'localhost' IDENTIFIED WITH mysql_native_password BY 'posturescan123';
echo GRANT ALL PRIVILEGES ON posture_scan_pro_db.* TO 'posturescan'@'localhost';
echo FLUSH PRIVILEGES;
echo EXIT;
echo.

echo 6. 然后执行数据表初始化：
echo mysql -u posturescan -pposturescan123 posture_scan_pro_db ^< setup.sql
echo.
echo ========================================
echo.
echo 如果您需要修改数据库连接信息，请编辑 .env 文件：
echo 当前配置：
echo DB_HOST=localhost
echo DB_USER=posturescan
echo DB_PASSWORD=posturescan123
echo DB_DATABASE=posture_scan_pro_db
echo.
pause