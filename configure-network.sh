#!/bin/bash

# HealQ Network Configuration Script
# This script helps you configure the correct IP address for real device testing

echo "🏥 HealQ Network Configuration Helper"
echo "===================================="

# Function to get local IP address
get_local_ip() {
    if [[ "$OSTYPE" == "msys" || "$OSTYPE" == "win32" ]]; then
        # Windows
        ipconfig | grep "IPv4 Address" | head -n1 | awk '{print $NF}' | tr -d '\r'
    elif [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        ifconfig | grep "inet " | grep -v 127.0.0.1 | head -n1 | awk '{print $2}'
    else
        # Linux
        hostname -I | awk '{print $1}'
    fi
}

LOCAL_IP=$(get_local_ip)

echo "📍 Your computer's local IP address: $LOCAL_IP"
echo ""

# Check if backend is running
echo "🔍 Checking if backend is running..."
if curl -s "http://localhost:5000/health" > /dev/null; then
    echo "✅ Backend is running on localhost:5000"
else
    echo "❌ Backend is not running. Please start it with:"
    echo "   cd backend && npm start"
    echo ""
fi

# Check if backend is accessible from local IP
echo "🔍 Checking if backend is accessible from local network..."
if curl -s "http://$LOCAL_IP:5000/health" > /dev/null; then
    echo "✅ Backend is accessible at http://$LOCAL_IP:5000"
else
    echo "⚠️  Backend might not be accessible from other devices"
    echo "   This could be due to firewall settings"
    echo ""
fi

echo "📱 To configure your mobile app for real device testing:"
echo "1. Edit HealQMobile/src/services/api.js"
echo "2. Replace the Android IP with: $LOCAL_IP"
echo "3. The configuration should look like:"
echo ""
echo "   const getBaseURL = () => {"
echo "     if (__DEV__) {"
echo "       if (Platform.OS === 'android') {"
echo "         return 'http://$LOCAL_IP:5000/api';"
echo "       } else {"
echo "         return 'http://localhost:5000/api';"
echo "       }"
echo "     } else {"
echo "       return 'https://your-production-server.com/api';"
echo "     }"
echo "   };"
echo ""

# Test network connectivity
echo "🧪 Testing API endpoints..."
echo "Health check: http://$LOCAL_IP:5000/health"
curl -s "http://$LOCAL_IP:5000/health" || echo "❌ Health check failed"

echo ""
echo "🚀 Next steps:"
echo "1. Update the IP in your mobile app as shown above"
echo "2. Rebuild your mobile app: npx react-native run-android"
echo "3. Ensure your phone is on the same WiFi network"
echo "4. Test the app on your real device"
echo ""
echo "💡 Alternative: Use ngrok for easier testing"
echo "   npm install -g ngrok"
echo "   ngrok http 5000"
echo "   Then use the ngrok URL in your mobile app"
