-- 修复MySQL认证方式问题
-- 在MySQL中执行以下命令：

ALTER USER 'root'@'localhost' IDENTIFIED WITH mysql_native_password BY 'root';
FLUSH PRIVILEGES;

-- 验证用户信息
SELECT User, Host, plugin FROM mysql.user WHERE User = 'root';