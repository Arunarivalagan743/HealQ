/**
 * Script to create test appointments in the database
 * Run with: node scripts/createTestAppointments.js
 */

const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');
const { connectDB } = require('../config/database');
const Appointment = require('../models/Appointment');
const DoctorProfile = require('../models/DoctorProfile');
const PatientProfile = require('../models/PatientProfile');

async function createTestAppointments() {
  try {
    // Connect to database
    await connectDB();
    console.log('Connected to database');

    // Get doctor profile
    const doctorProfile = await DoctorProfile.findOne();
    if (!doctorProfile) {
      console.error('No doctor profile found');
      process.exit(1);
    }
    
    console.log(`Found doctor: ${doctorProfile.name} (${doctorProfile._id})`);

    // Get patient profile
    const patientProfile = await PatientProfile.findOne();
    if (!patientProfile) {
      console.error('No patient profile found');
      process.exit(1);
    }
    
    console.log(`Found patient: ${patientProfile.name} (${patientProfile._id})`);

    // Create appointment dates - one for today and one for yesterday
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    // Format the dates (to ensure consistent date handling)
    const todayFormatted = formatDate(today);
    const yesterdayFormatted = formatDate(yesterday);

    // Create appointments
    const appointments = [
      // Today's appointment (completed, needs prescription)
      {
        appointmentId: `AP-${uuidv4().substring(0, 8)}`,
        patientId: patientProfile._id,
        patientName: patientProfile.name,
        patientEmail: patientProfile.email,
        patientPhone: patientProfile.phoneNumber,
        doctorId: doctorProfile._id,
        doctorName: doctorProfile.name,
        doctorSpecialization: doctorProfile.specialization,
        appointmentDate: today,
        timeSlot: {
          start: '10:00',
          end: '10:30'
        },
        consultationType: 'In-person',
        consultationFee: doctorProfile.consultationFee,
        status: 'completed',
        tokenNumber: 5,
        queueToken: 5,
        queuePosition: 0,
        queueStatus: 'completed',
        reasonForVisit: 'Regular checkup',
        paymentStatus: 'paid',
        paymentMethod: 'cash',
      },
      // Yesterday's appointment (finished with prescription)
      {
        appointmentId: `AP-${uuidv4().substring(0, 8)}`,
        patientId: patientProfile._id,
        patientName: patientProfile.name,
        patientEmail: patientProfile.email,
        patientPhone: patientProfile.phoneNumber,
        doctorId: doctorProfile._id,
        doctorName: doctorProfile.name,
        doctorSpecialization: doctorProfile.specialization,
        appointmentDate: yesterday,
        timeSlot: {
          start: '14:00',
          end: '14:30'
        },
        consultationType: 'In-person',
        consultationFee: doctorProfile.consultationFee,
        status: 'finished',
        tokenNumber: 8,
        queueToken: 8,
        queuePosition: 0,
        queueStatus: 'completed',
        reasonForVisit: 'Fever and headache',
        paymentStatus: 'paid',
        paymentMethod: 'cash',
        medicalRecord: {
          diagnosis: 'Common cold with mild fever',
          prescription: [
            {
              medicationName: 'Paracetamol',
              dosage: '500mg',
              frequency: 'Every 6 hours',
              duration: '3 days',
              instructions: 'Take after food'
            },
            {
              medicationName: 'Vitamin C',
              dosage: '500mg',
              frequency: 'Once daily',
              duration: '7 days',
              instructions: 'Take with breakfast'
            }
          ]
        }
      }
    ];

    // Insert appointments
    await Appointment.insertMany(appointments);
    
    console.log(`Created ${appointments.length} test appointments`);
    console.log('Today appointment:', todayFormatted);
    console.log('Yesterday appointment:', yesterdayFormatted);

    // Disconnect
    await mongoose.disconnect();
    console.log('Disconnected from database');
    
  } catch (error) {
    console.error('Error creating test appointments:', error);
    process.exit(1);
  }
}

// Helper function to format date as YYYY-MM-DD
function formatDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Run the function
createTestAppointments();
