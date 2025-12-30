-- 创建无密码root用户（如果需要）
-- 在MySQL中执行：

ALTER USER 'root'@'localhost' IDENTIFIED WITH mysql_native_password BY '';
FLUSH PRIVILEGES;

-- 然后更新 .env 文件为：
-- DB_PASSWORD=