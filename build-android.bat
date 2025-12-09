@echo off
echo ================================================
echo    Cyber Runner 3D - Android APK Build Script
echo ================================================
echo.

echo [1/3] Building web assets...
call npm run build
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Web build failed!
    pause
    exit /b 1
)
echo.

echo [2/3] Syncing to Android project...
call npx cap sync android
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Capacitor sync failed!
    pause
    exit /b 1
)
echo.

echo [3/3] Opening Android Studio...
echo.
echo ================================================
echo BUILD INSTRUCTIONS:
echo ================================================
echo 1. Android Studio will open with the project
echo 2. Wait for Gradle sync to complete
echo 3. Go to: Build -> Build Bundle(s) / APK(s) -> Build APK(s)
echo 4. The APK will be at: android\app\build\outputs\apk\debug\app-debug.apk
echo ================================================
echo.

call npx cap open android

echo.
echo Build script complete!
pause
