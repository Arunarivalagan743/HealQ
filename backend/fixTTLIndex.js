require('dotenv').config();
const mongoose = require('mongoose');

async function fixTTLIndex() {
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const db = mongoose.connection.db;
    const collection = db.collection('users');

    // List all indexes to see what exists
    console.log('📋 Current indexes on users collection:');
    const indexes = await collection.listIndexes().toArray();
    indexes.forEach(index => {
      console.log(`  - ${index.name}:`, index.key);
      if (index.expireAfterSeconds !== undefined) {
        console.log(`    ⚠️  TTL Index! Expires after ${index.expireAfterSeconds} seconds`);
      }
    });

    // Check if the problematic TTL index exists
    const ttlIndex = indexes.find(index => 
      index.key && index.key['otp.expiresAt'] && index.expireAfterSeconds !== undefined
    );

    if (ttlIndex) {
      console.log(`\n❌ Found problematic TTL index: ${ttlIndex.name}`);
      console.log('🔧 Dropping the TTL index...');
      
      await collection.dropIndex(ttlIndex.name);
      console.log('✅ TTL index dropped successfully!');
      console.log('🎉 Users will no longer be automatically deleted');
    } else {
      console.log('\n✅ No problematic TTL index found');
    }

    // Show remaining indexes
    console.log('\n📋 Remaining indexes:');
    const remainingIndexes = await collection.listIndexes().toArray();
    remainingIndexes.forEach(index => {
      console.log(`  - ${index.name}:`, index.key);
    });

    console.log('\n🔍 Checking current user count...');
    const userCount = await collection.countDocuments();
    console.log(`📊 Total users in database: ${userCount}`);

    if (userCount === 0) {
      console.log('\n⚠️  WARNING: No users found in database!');
      console.log('You may need to re-run the database initialization script');
      console.log('Run: npm run init-db');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
    process.exit(0);
  }
}

// Run the fix
fixTTLIndex();
