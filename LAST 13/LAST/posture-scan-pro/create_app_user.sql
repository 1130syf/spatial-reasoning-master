-- 创建PostureScan Pro专用用户
-- 在MySQL中执行：

-- 1. 删除可能存在的旧用户
DROP USER IF EXISTS 'posturescan'@'localhost';

-- 2. 创建新用户
CREATE USER 'posturescan'@'localhost' IDENTIFIED WITH mysql_native_password BY 'posturescan123';

-- 3. 授予权限
GRANT ALL PRIVILEGES ON posture_scan_pro_db.* TO 'posturescan'@'localhost';

-- 4. 刷新权限
FLUSH PRIVILEGES;

-- 5. 测试连接
-- mysql -u posturescan -pposturescan123 posture_scan_pro_db