-- 创建PostureScan Pro专用用户 - 完整版本
-- 在MySQL中执行：

-- 1. 确保数据库存在
CREATE DATABASE IF NOT EXISTS posture_scan_pro_db;

-- 2. 删除可能存在的旧用户
DROP USER IF EXISTS 'posturescan'@'localhost';
DROP USER IF EXISTS 'posturescan'@'127.0.0.1';

-- 3. 创建新用户并设置密码
CREATE USER 'posturescan'@'localhost' IDENTIFIED BY 'posturescan123';
CREATE USER 'posturescan'@'127.0.0.1' IDENTIFIED BY 'posturescan123';

-- 4. 设置认证方式为mysql_native_password
ALTER USER 'posturescan'@'localhost' IDENTIFIED WITH mysql_native_password BY 'posturescan123';
ALTER USER 'posturescan'@'127.0.0.1' IDENTIFIED WITH mysql_native_password BY 'posturescan123';

-- 5. 授予权限
GRANT ALL PRIVILEGES ON posture_scan_pro_db.* TO 'posturescan'@'localhost';
GRANT ALL PRIVILEGES ON posture_scan_pro_db.* TO 'posturescan'@'127.0.0.1';

-- 6. 刷新权限
FLUSH PRIVILEGES;

-- 7. 测试连接命令（在命令行中执行）
-- mysql -u posturescan -pposturescan123 -D posture_scan_pro_db -e "SHOW TABLES;"

-- 8. 验证用户信息
SELECT User, Host, plugin FROM mysql.user WHERE User = 'posturescan';

-- 9. 更新.env文件内容：
-- DB_USER=posturescan
-- DB_PASSWORD=posturescan123