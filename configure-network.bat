@echo off
echo.
echo 🏥 HealQ Network Configuration Helper
echo ====================================
echo.

REM Get local IP address
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr "IPv4 Address"') do (
    set "LOCAL_IP=%%a"
    goto :found
)
:found
set LOCAL_IP=%LOCAL_IP: =%

echo 📍 Your computer's local IP address: %LOCAL_IP%
echo.

REM Check if backend is running
echo 🔍 Checking if backend is running...
curl -s http://localhost:5000/health >nul 2>&1
if %errorlevel% == 0 (
    echo ✅ Backend is running on localhost:5000
) else (
    echo ❌ Backend is not running. Please start it with:
    echo    cd backend ^&^& npm start
    echo.
)

REM Check if backend is accessible from local IP
echo 🔍 Checking if backend is accessible from local network...
curl -s http://%LOCAL_IP%:5000/health >nul 2>&1
if %errorlevel% == 0 (
    echo ✅ Backend is accessible at http://%LOCAL_IP%:5000
) else (
    echo ⚠️  Backend might not be accessible from other devices
    echo    This could be due to firewall settings
    echo.
)

echo 📱 To configure your mobile app for real device testing:
echo 1. Edit HealQMobile/src/services/api.js
echo 2. Replace the Android IP with: %LOCAL_IP%
echo 3. The configuration should look like:
echo.
echo    const getBaseURL = ^(^) =^> ^{
echo      if ^(__DEV__^) ^{
echo        if ^(Platform.OS === 'android'^) ^{
echo          return 'http://%LOCAL_IP%:5000/api';
echo        ^} else ^{
echo          return 'http://localhost:5000/api';
echo        ^}
echo      ^} else ^{
echo        return 'https://your-production-server.com/api';
echo      ^}
echo    ^};
echo.

echo 🧪 Testing API endpoints...
echo Health check: http://%LOCAL_IP%:5000/health
curl -s http://%LOCAL_IP%:5000/health || echo ❌ Health check failed

echo.
echo 🚀 Next steps:
echo 1. Update the IP in your mobile app as shown above
echo 2. Rebuild your mobile app: npx react-native run-android
echo 3. Ensure your phone is on the same WiFi network
echo 4. Test the app on your real device
echo.
echo 💡 Alternative: Use ngrok for easier testing
echo    npm install -g ngrok
echo    ngrok http 5000
echo    Then use the ngrok URL in your mobile app
echo.
pause
