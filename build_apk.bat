@echo off
title Build PK Keyboard CS APK
echo ========================================================
echo   BUILDING PK KEYBOARD CS ANDROID APK (v1.1)
echo ========================================================
echo.

set "JAVA_HOME=C:\Program Files\Android\Android Studio\jbr"
set "ANDROID_HOME=C:\Users\IT\AppData\Local\Android\Sdk"
set "PATH=%JAVA_HOME%\bin;%PATH%"

cd /d "%~dp0android-pk-keyboard"
call gradlew.bat assembleDebug

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [ERROR] Build APK Gagal! Periksa koneksi atau error di atas.
    pause
    exit /b %ERRORLEVEL%
)

copy /y "app\build\outputs\apk\debug\app-debug.apk" "..\PK_Keyboard_CS.apk"
echo.
echo ========================================================
echo   BUILD SUKSES! 
echo   File APK telah diperbarui di: 
echo   PK_Keyboard_CS.apk (di folder utama)
echo ========================================================
echo.
pause
