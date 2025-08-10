require('dotenv').config();
const mongoose = require('mongoose');
const Appointment = require('./models/Appointment');
const DoctorProfile = require('./models/DoctorProfile');
const PatientProfile = require('./models/PatientProfile');

// Connect to database
const connectDB = require('./config/database');

const checkAppointments = async () => {
  try {
    console.log('Connecting to database...');
    await connectDB();
    
    console.log('\n=== CHECKING APPOINTMENTS ===');
    
    // Get all appointments
    const allAppointments = await Appointment.find({}).sort({ createdAt: -1 }).limit(5);
    console.log(`\nTotal appointments found: ${allAppointments.length}`);
    
    if (allAppointments.length > 0) {
      console.log('\nRecent appointments:');
      allAppointments.forEach((apt, index) => {
        console.log(`${index + 1}. Appointment ID: ${apt.appointmentId}`);
        console.log(`   Patient: ${apt.patientName}`);
        console.log(`   Doctor ID: ${apt.doctorId}`);
        console.log(`   Date: ${apt.appointmentDate}`);
        console.log(`   Status: ${apt.status}`);
        console.log(`   Queue Token: ${apt.queueToken}`);
        console.log(`   Created: ${apt.createdAt}`);
        console.log('');
      });
    }
    
    // Check today's appointments
    const today = new Date();
    const startOfDay = new Date(today.setHours(0, 0, 0, 0));
    const endOfDay = new Date(today.setHours(23, 59, 59, 999));
    
    const todayAppointments = await Appointment.find({
      appointmentDate: { $gte: startOfDay, $lte: endOfDay }
    });
    
    console.log(`\nToday's appointments: ${todayAppointments.length}`);
    
    // Check doctor profiles
    console.log('\n=== CHECKING DOCTOR PROFILES ===');
    const doctors = await DoctorProfile.find({}).limit(3);
    console.log(`Total doctors: ${doctors.length}`);
    
    doctors.forEach((doc, index) => {
      console.log(`${index + 1}. Name: ${doc.name}`);
      console.log(`   Doctor ID: ${doc._id}`);
      console.log(`   User ID: ${doc.userId}`);
      console.log(`   Specialization: ${doc.specialization}`);
      console.log('');
    });
    
    // Check patient profiles
    console.log('\n=== CHECKING PATIENT PROFILES ===');
    const patients = await PatientProfile.find({}).limit(3);
    console.log(`Total patients: ${patients.length}`);
    
    patients.forEach((pat, index) => {
      console.log(`${index + 1}. Name: ${pat.name}`);
      console.log(`   Patient ID: ${pat._id}`);
      console.log(`   User ID: ${pat.userId}`);
      console.log('');
    });
    
  } catch (error) {
    console.error('Check failed:', error);
  } finally {
    await mongoose.connection.close();
    console.log('Database connection closed');
    process.exit(0);
  }
};

// Run check
checkAppointments();
