const mongoose = require('mongoose');
const User = require('./models/User');

mongoose.connect('mongodb+srv://arun:hari@cluster0.o8e9fw0.mongodb.net/healq?retryWrites=true&w=majority');

mongoose.connection.once('open', async () => {
  console.log('Connected to MongoDB');
  
  const users = await User.find({});
  console.log('\nCurrent users in database:');
  console.log('=========================');
  
  users.forEach(user => {
    console.log(`- Email: ${user.email}`);
    console.log(`  Role: ${user.role}`);
    console.log(`  Name: ${user.name || 'Not set'}`);
    console.log(`  Firebase UID: ${user.firebaseUid ? 'Yes' : 'No'}`);
    console.log(`  Last Login: ${user.lastLogin || 'Never'}`);
    console.log('  ---');
  });
  
  mongoose.disconnect();
});
