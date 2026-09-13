@echo off
title PK Matrix - Perfect Keyboard Vault Server
echo ========================================================
echo    PK MATRIX - MOBILE ANDROID SERVER LAUNCHER
echo ========================================================
echo.
echo Menjalankan web server lokal pada port 8088...
echo.
echo CARA BUKA DI HP ANDROID:
echo 1. Pastikan HP dan Laptop/PC terhubung ke WiFi yang sama.
echo 2. Cek alamat IP lokal Anda di bawah (contoh: http://192.168.1.X:8088).
echo 3. Buka browser Chrome di Android, lalu ketik alamat tersebut.
echo.
ipconfig | findstr /i "IPv4"
echo.
echo Membuka di browser komputer default...
start http://localhost:8088
python -m http.server 8088
pause
