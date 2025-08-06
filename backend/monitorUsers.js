require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

async function monitorUsers() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    console.log('📊 User Database Monitor\n');

    // Get all users
    const users = await User.find({}).select('-otp').sort({ createdAt: -1 });
    
    console.log(`👥 Total Users: ${users.length}\n`);
    
    if (users.length === 0) {
      console.log('⚠️  No users found in database');
      return;
    }

    // Group by role
    const usersByRole = users.reduce((acc, user) => {
      acc[user.role] = (acc[user.role] || 0) + 1;
      return acc;
    }, {});

    console.log('📈 Users by Role:');
    Object.entries(usersByRole).forEach(([role, count]) => {
      console.log(`   ${role}: ${count}`);
    });
    console.log();

    // Show recent activity
    console.log('📋 Recent Users:');
    users.slice(0, 10).forEach(user => {
      const lastLogin = user.lastLogin ? new Date(user.lastLogin).toLocaleString() : 'Never';
      const hasFirebase = user.firebaseUid ? '🔥' : '📧';
      const isActive = user.isActive ? '✅' : '❌';
      
      console.log(`   ${hasFirebase} ${isActive} ${user.email} (${user.role}) - Last: ${lastLogin}`);
    });

    // Check for any OTPs
    const usersWithOTP = users.filter(user => user.otp && user.otp.code);
    if (usersWithOTP.length > 0) {
      console.log('\n🔑 Users with Active OTPs:');
      usersWithOTP.forEach(user => {
        const expires = new Date(user.otp.expiresAt).toLocaleString();
        const isExpired = new Date(user.otp.expiresAt) < new Date();
        console.log(`   ${user.email} - ${isExpired ? '❌ Expired' : '✅ Valid'} until ${expires}`);
      });
    }

    console.log('\n🔍 Database Health Check:');
    console.log(`   Active Users: ${users.filter(u => u.isActive).length}`);
    console.log(`   Firebase-linked: ${users.filter(u => u.firebaseUid).length}`);
    console.log(`   Backend-only: ${users.filter(u => !u.firebaseUid && u.name).length}`);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Database connection closed');
    process.exit(0);
  }
}

monitorUsers();
