-- 创建PostureScan Pro专用数据库用户
-- 在MySQL中执行以下命令：

-- 1. 创建数据库用户（如果不存在）
CREATE USER IF NOT EXISTS 'posturescan'@'localhost' IDENTIFIED BY 'posturescan123';

-- 2. 授予权限
GRANT ALL PRIVILEGES ON posture_scan_pro_db.* TO 'posturescan'@'localhost';

-- 3. 刷新权限
FLUSH PRIVILEGES;

-- 4. 验证用户创建成功
SELECT User, Host FROM mysql.user WHERE User = 'posturescan';

-- 提示：创建成功后，请更新 .env 文件：
-- DB_USER=posturescan
-- DB_PASSWORD=posturescan123