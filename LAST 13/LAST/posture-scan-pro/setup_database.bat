@echo off
echo ========================================
echo PostureScan Pro 数据库自动建立脚本
echo ========================================
echo.

echo 正在连接 MySQL 数据库...
echo 请输入您的 MySQL root 密码:
echo.

mysql -u root -p < setup.sql

if %ERRORLEVEL% == 0 (
    echo.
    echo ✅ 数据库建立成功！
    echo 数据库名称: posture_scan_pro_db
    echo.
    echo 现在可以启动 PostureScan Pro 了！
) else (
    echo.
    echo ❌ 数据库建立失败！
    echo 请检查 MySQL 是否已启动以及密码是否正确
)

echo.
pause