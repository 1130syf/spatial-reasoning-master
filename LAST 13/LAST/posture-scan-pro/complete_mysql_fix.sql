-- 完全重置MySQL root用户认证方式
-- 在MySQL中执行以下命令：

-- 1. 删除root用户
DROP USER IF EXISTS 'root'@'localhost';
DROP USER IF EXISTS 'root'@'127.0.0.1';

-- 2. 重新创建root用户
CREATE USER 'root'@'localhost' IDENTIFIED BY 'root';
CREATE USER 'root'@'127.0.0.1' IDENTIFIED BY 'root';

-- 3. 授予所有权限
GRANT ALL PRIVILEGES ON *.* TO 'root'@'localhost' WITH GRANT OPTION;
GRANT ALL PRIVILEGES ON *.* TO 'root'@'127.0.0.1' WITH GRANT OPTION;

-- 4. 设置为mysql_native_password认证
ALTER USER 'root'@'localhost' IDENTIFIED WITH mysql_native_password BY 'root';
ALTER USER 'root'@'127.0.0.1' IDENTIFIED WITH mysql_native_password BY 'root';

-- 5. 刷新权限
FLUSH PRIVILEGES;

-- 6. 验证用户信息
SELECT User, Host, plugin, authentication_string FROM mysql.user WHERE User = 'root';