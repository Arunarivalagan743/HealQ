require('dotenv').config();
const mongoose = require('mongoose');
const DoctorProfile = require('./models/DoctorProfile');

// Connect to database
const connectDB = require('./config/database');

const migrateDoctorProfiles = async () => {
  try {
    console.log('Starting doctor profile migration...');
    
    // Connect to database
    await connectDB();
    
    // Find all doctor profiles with non-offline consultation modes
    const doctorsToMigrate = await DoctorProfile.find({
      consultationMode: { $in: ['Online', 'Both'] }
    });
    
    console.log(`Found ${doctorsToMigrate.length} doctor profiles to migrate`);
    
    let migratedCount = 0;
    
    for (const doctor of doctorsToMigrate) {
      try {
        const oldMode = doctor.consultationMode;
        doctor.consultationMode = 'In-person';
        await doctor.save();
        
        console.log(`✅ Migrated doctor ${doctor.name} (${doctor.doctorId}) from '${oldMode}' to 'In-person'`);
        migratedCount++;
      } catch (error) {
        console.error(`❌ Failed to migrate doctor ${doctor.name}:`, error.message);
      }
    }
    
    console.log(`\n🎉 Migration completed! Migrated ${migratedCount} out of ${doctorsToMigrate.length} doctor profiles`);
    
    // Also check for any remaining issues
    const remainingIssues = await DoctorProfile.find({
      consultationMode: { $nin: ['In-person'] }
    });
    
    if (remainingIssues.length > 0) {
      console.log(`⚠️  Warning: ${remainingIssues.length} doctor profiles still have non-offline consultation modes`);
      remainingIssues.forEach(doctor => {
        console.log(`   - ${doctor.name} (${doctor.doctorId}): ${doctor.consultationMode}`);
      });
    } else {
      console.log('✅ All doctor profiles are now set to offline mode');
    }
    
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await mongoose.connection.close();
    console.log('Database connection closed');
    process.exit(0);
  }
};

// Run migration
migrateDoctorProfiles();
