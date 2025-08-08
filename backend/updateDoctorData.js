const mongoose = require('mongoose');
const DoctorProfile = require('./models/DoctorProfile');
require('dotenv').config();

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB Connected');
  } catch (error) {
    console.error('❌ MongoDB Connection Error:', error);
    process.exit(1);
  }
};

const updateDoctorData = async () => {
  try {
    await connectDB();
    
    // Find the doctor with ID DR015108848 (Dr. Ramji from the image)
    const doctor = await DoctorProfile.findOne({ doctorId: 'DR015108848' });
    
    if (doctor) {
      console.log('Found doctor:', doctor.name);
      
      // Update working hours and clinic address
      await DoctorProfile.findByIdAndUpdate(doctor._id, {
        workingHours: {
          start: '09:00',
          end: '17:00'
        },
        clinicAddress: '123 Healthcare Plaza, Medical District, Chennai - 600001',
        breakTimes: [{
          start: '13:00',
          end: '14:00'
        }],
        bio: 'Experienced cardiologist with 5 years of practice in interventional cardiology and heart disease management.',
        consultationMode: 'Both'
      });
      
      console.log('✅ Doctor data updated successfully');
    } else {
      console.log('❌ Doctor not found');
    }
    
    mongoose.connection.close();
  } catch (error) {
    console.error('❌ Error updating doctor data:', error);
    mongoose.connection.close();
  }
};

updateDoctorData();
