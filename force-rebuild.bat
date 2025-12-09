@echo off
echo ==========================================
echo CYBER RUNNER - FORCE REBUILD SCRIPT
echo ==========================================
echo.
echo This will:
echo 1. Stop any running dev server
echo 2. Clear Vite cache
echo 3. Restart dev server
echo.
pause

echo.
echo [Step 1] Stopping any running processes...
taskkill /F /IM node.exe 2>nul
timeout /t 2 >nul

echo.
echo [Step 2] Clearing Vite cache...
if exist "node_modules\.vite" (
    rmdir /S /Q "node_modules\.vite"
    echo ✅ Vite cache cleared
) else (
    echo ℹ️  No Vite cache found
)

if exist "dist" (
    rmdir /S /Q "dist"
    echo ✅ Dist folder cleared
) else (
    echo ℹ️  No dist folder found
)

echo.
echo [Step 3] Starting dev server...
echo.
echo ⚠️  IMPORTANT: After server starts:
echo    1. Open browser to http://localhost:5173
echo    2. Press Ctrl+Shift+R to hard refresh
echo    3. Check if character is animated (not T-pose)
echo    4. Check if buttons have gradients
echo.
echo Starting server now...
echo.

npm run dev
