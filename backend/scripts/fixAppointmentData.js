const mongoose = require('mongoose');
const Appointment = require('../models/Appointment');

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb+srv://arunarivalagan743:heal123@cluster0.o8e9fw0.mongodb.net/healQ', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('MongoDB Connected for data migration');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

const fixAppointmentData = async () => {
  try {
    console.log('🔄 Starting appointment data migration...');
    
    // Find all appointments that need fixing
    const appointments = await Appointment.find({});
    
    console.log(`Found ${appointments.length} appointments to check`);
    
    let fixedCount = 0;
    
    for (const appointment of appointments) {
      let needsUpdate = false;
      const updates = {};
      
      // Fix timeSlot if it's missing or malformed
      if (!appointment.timeSlot || !appointment.timeSlot.start) {
        updates.timeSlot = {
          start: '09:00',
          end: '09:30'
        };
        needsUpdate = true;
        console.log(`Fixed timeSlot for appointment ${appointment.appointmentId}`);
      }
      
      // Fix consultationType if missing
      if (!appointment.consultationType) {
        updates.consultationType = 'In-person';
        needsUpdate = true;
        console.log(`Fixed consultationType for appointment ${appointment.appointmentId}`);
      }
      
      // Add completedAt for finished appointments
      if (appointment.status === 'finished' && !appointment.completedAt) {
        updates.completedAt = appointment.updatedAt || new Date();
        needsUpdate = true;
        console.log(`Added completedAt for appointment ${appointment.appointmentId}`);
      }
      
      if (needsUpdate) {
        await Appointment.findByIdAndUpdate(appointment._id, updates);
        fixedCount++;
      }
    }
    
    console.log(`✅ Migration completed: ${fixedCount} appointments updated`);
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
  }
};

const runMigration = async () => {
  await connectDB();
  await fixAppointmentData();
  mongoose.connection.close();
  console.log('Migration finished');
};

// Run migration if called directly
if (require.main === module) {
  runMigration();
}

module.exports = { fixAppointmentData };
