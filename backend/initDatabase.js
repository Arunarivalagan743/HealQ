const User = require('./models/User');
const connectDB = require('./config/database');
require('dotenv').config();

// Connect to database
connectDB();

// Create initial admin user
const createInitialAdmin = async () => {
  try {
    // Check if admin already exists
    const adminEmails = process.env.ADMIN_EMAILS?.split(',') || [];
    
    for (const email of adminEmails) {
      const existingAdmin = await User.findOne({ email: email.trim() });
      
      if (!existingAdmin) {
        const adminUser = new User({
          email: email.trim(),
          name: 'System Administrator',
          role: 'Admin',
          approved: true,
          isActive: true,
        });
        
        await adminUser.save();
        console.log(`✅ Admin user created: ${email.trim()}`);
      } else {
        console.log(`ℹ️  Admin user already exists: ${email.trim()}`);
      }
    }
    
    // Create some sample users for testing
    const sampleUsers = [
      {
        email: 'arunhari0201@gmail.com',
        name: 'John Patient',
        role: 'Patient',
      },
      {
        email: 'doctor1@example.com',
        name: 'Dr. Sarah Smith',
        role: 'Doctor',
        specialization: 'Cardiology',
      },
      {
        email: 'patient2@example.com',
        name: 'Jane Patient',
        role: 'Patient',
      },
      {
        email: 'doctor2@example.com',
        name: 'Dr. Michael Johnson',
        role: 'Doctor',
        specialization: 'Pediatrics',
      },
    ];
    
    for (const userData of sampleUsers) {
      const existingUser = await User.findOne({ email: userData.email });
      
      if (!existingUser) {
        const user = new User({
          ...userData,
          approved: true,
          isActive: true,
        });
        
        await user.save();
        console.log(`✅ Sample ${userData.role} created: ${userData.email}`);
      } else {
        console.log(`ℹ️  Sample user already exists: ${userData.email}`);
      }
    }
    
    console.log('\n🎉 Database initialization completed!');
    console.log('\n📧 Pre-approved emails for registration:');
    
    const allUsers = await User.find({});
    allUsers.forEach(user => {
      console.log(`   ${user.email} (${user.role})`);
    });
    
    console.log('\n💡 Users can now register with these emails via the mobile app.');
    
    process.exit(0);
  } catch (error) {
    console.error('Error initializing database:', error);
    process.exit(1);
  }
};

createInitialAdmin();
