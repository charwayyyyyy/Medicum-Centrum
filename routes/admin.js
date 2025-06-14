const express = require('express');
const router = express.Router();
const Admin = require('../models/Admin');
const Appointment = require('../models/Appointment');
const Doctor = require('../models/Doctor');
const Nurse = require('../models/Nurse');
const Patient = require('../models/Patient');

// Manage appointments
router.get('/appointments', async (req, res) => {
  try {
    const appointments = await Appointment.find().populate('patient doctor');
    res.status(200).json(appointments);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch appointments' });
  }
});

// Register new patients
router.post('/patients', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const newPatient = new Patient({ name, email, password });
    await newPatient.save();
    res.status(201).json({ message: 'Patient registered successfully', newPatient });
  } catch (error) {
    res.status(500).json({ error: 'Failed to register patient' });
  }
});

// Register new doctors
router.post('/doctors', async (req, res) => {
  try {
    const { name, email, password, specialization } = req.body;
    const newDoctor = new Doctor({ name, email, password, specialization });
    await newDoctor.save();
    res.status(201).json({ message: 'Doctor registered successfully', newDoctor });
  } catch (error) {
    res.status(500).json({ error: 'Failed to register doctor' });
  }
});
// Register new nurses
router.post('/nurses', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const newNurse = new Nurse({ name, email, password });
    await newNurse.save();
    res.status(201).json({ message: 'Nurse registered successfully', newNurse });
  } catch (error) {
    res.status(500).json({ error: 'Failed to register nurse' });
  }
});
// View all registered patients
router.get('/patients', async (req, res) => {
  try {
    const patients = await Patient.find();
    res.status(200).json(patients);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch patients' });
  }
});
// View all registered doctors
router.get('/doctors', async (req, res) => {
  try {
    const doctors = await Doctor.find();
    res.status(200).json(doctors);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch doctors' });
  }
});
// View all registered nurses
router.get('/nurses', async (req, res) => {
  try {
    const nurses = await Nurse.find();
    res.status(200).json(nurses);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch nurses' });
  }
});
// Delete a patient
router.delete('/patients/:id', async (req, res) => {
  try {
    const patient = await Patient.findByIdAndDelete(req.params.id);
    if (!patient) {
      return res.status(404).json({ error: 'Patient not found' });
    }
    res.status(200).json({ message: 'Patient deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete patient' });
  }
});
// Delete a doctor
router.delete('/doctors/:id', async (req, res) => {
  try {
    const doctor = await Doctor.findByIdAndDelete(req.params.id);
    if (!doctor) {
      return res.status(404).json({ error: 'Doctor not found' });
    }
    res.status(200).json({ message: 'Doctor deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete doctor' });
  }
});
// Delete a nurse
router.delete('/nurses/:id', async (req, res) => {
  try {
    const nurse = await Nurse.findByIdAndDelete(req.params.id);
    if (!nurse) {
      return res.status(404).json({ error: 'Nurse not found' });
    }
    res.status(200).json({ message: 'Nurse deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete nurse' });
  }
});

// View all appointments
router.get('/appointments', async (req, res) => {
  try {
    const appointments = await Appointment.find().populate('patient doctor');
    res.status(200).json(appointments);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch appointments' });
  }
});
// Cancel an appointment
router.delete('/appointments/:id', async (req, res) => {
  try {
    const appointment = await Appointment.findByIdAndDelete(req.params.id);
    if (!appointment) {
      return res.status(404).json({ error: 'Appointment not found' });
    }
    res.status(200).json({ message: 'Appointment cancelled successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to cancel appointment' });
  }
});
const { check, validationResult } = require('express-validator');
// Admin login
router.post('/login', [
  check('email').isEmail().withMessage('Invalid email format'),
  check('password').notEmpty().withMessage('Password is required')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { email, password } = req.body;
  try {
    const admin = await Admin.findOne({ email, password });
    if (!admin) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    res.status(200).json({ message: 'Login successful', admin });
  } catch (error) {
    res.status(500).json({ error: 'Failed to login' });
  }
});
const { check, validationResult } = require('express-validator');

module.exports = router;
