require('dotenv').config();
const mongoose = require('mongoose');
const Appointment = require('./models/Appointment');
const DoctorProfile = require('./models/DoctorProfile');
const PatientProfile = require('./models/PatientProfile');

// Connect to database
const connectDB = require('./config/database');

const debugAppointmentQueries = async () => {
  try {
    console.log('Connecting to database...');
    await connectDB();
    
    // Get the specific appointment
    const appointment = await Appointment.findOne({ appointmentId: 'APT1754700848594-3B9S5RYUJ' });
    console.log('\n=== APPOINTMENT DETAILS ===');
    console.log('Patient ID in appointment:', appointment.patientId);
    console.log('Doctor ID in appointment:', appointment.doctorId);
    
    // Get doctor profile
    const doctorProfile = await DoctorProfile.findOne({ userId: '6894c9b5dabd5449cff1b09d' });
    console.log('\n=== DOCTOR QUERY ===');
    console.log('Doctor Profile ID:', doctorProfile?._id);
    console.log('Doctor User ID:', doctorProfile?.userId);
    
    // Test doctor appointment query
    const doctorAppointments = await Appointment.find({ doctorId: doctorProfile._id });
    console.log('Doctor appointments found:', doctorAppointments.length);
    
    // Get patient profile
    const patientProfile = await PatientProfile.findOne({ userId: '6894a79d05621c2fafe8f745' });
    console.log('\n=== PATIENT QUERY ===');
    console.log('Patient Profile ID:', patientProfile?._id);
    console.log('Patient User ID:', patientProfile?.userId);
    
    // Test patient appointment query
    const patientAppointments = await Appointment.find({ patientId: patientProfile._id });
    console.log('Patient appointments found:', patientAppointments.length);
    
    console.log('\n=== COMPARISON ===');
    console.log('Appointment.patientId:', appointment.patientId.toString());
    console.log('PatientProfile._id:  ', patientProfile._id.toString());
    console.log('Match:', appointment.patientId.toString() === patientProfile._id.toString());
    
    console.log('Appointment.doctorId:', appointment.doctorId.toString());
    console.log('DoctorProfile._id:  ', doctorProfile._id.toString());
    console.log('Match:', appointment.doctorId.toString() === doctorProfile._id.toString());
    
  } catch (error) {
    console.error('Debug failed:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\nDatabase connection closed');
    process.exit(0);
  }
};

// Run debug
debugAppointmentQueries();
