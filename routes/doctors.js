const express = require('express');
const router = express.Router();
const Doctor = require('../models/Doctor');
const Appointment = require('../models/Appointment');

// View schedules and patient appointments
router.get('/:id/schedule', async (req, res) => {
  try {
    const doctor = await Doctor.findById(req.params.id).populate('schedule.appointments');
    res.status(200).json(doctor.schedule);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch schedule' });
  }
});

// Write prescriptions and notes
router.post('/:id/prescriptions', async (req, res) => {
  try {
    const { patientId, notes, prescriptions } = req.body;
    const patient = await Patient.findById(patientId);
    patient.medicalHistory.push({
      visitDate: new Date(),
      diagnosis: notes,
      prescriptions
    });
    await patient.save();

    res.status(201).json({ message: 'Prescription and notes added successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to add prescription and notes' });
  }
});
// View patient medical history
router.get('/:id/patient-history/:patientId', async (req, res) => {
  try {
    const patient = await Patient.findById(req.params.patientId);
    if (!patient) {
      return res.status(404).json({ error: 'Patient not found' });
    }
    res.status(200).json(patient.medicalHistory);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch patient medical history' });
  }
});
// Manage appointments
router.get('/:id/appointments', async (req, res) => {
  try {
    const appointments = await Appointment.find({ doctor: req.params.id }).populate('patient');
    res.status(200).json(appointments);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch appointments' });
  }
});
// Update appointment status
router.put('/:id/appointments/:appointmentId', async (req, res) => {
  try {
    const { status } = req.body;
    const appointment = await Appointment.findByIdAndUpdate(req.params.appointmentId, { status }, { new: true });
    if (!appointment) {
      return res.status(404).json({ error: 'Appointment not found' });
    }
    res.status(200).json({ message: 'Appointment status updated successfully', appointment });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update appointment status' });
  }
});
const Patient = require('../models/Patient');
// View patient details
router.get('/:id/patients/:patientId', async (req, res) => {
  try {
    const patient = await Patient.findById(req.params.patientId);
    if (!patient) {
      return res.status(404).json({ error: 'Patient not found' });
    }
    res.status(200).json(patient);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch patient details' });
  }
});
const Appointment = require('../models/Appointment');
// Cancel an appointment
router.delete('/:id/appointments/:appointmentId', async (req, res) => {
  try {
    const appointment = await Appointment.findByIdAndDelete(req.params.appointmentId);
    if (!appointment) {
      return res.status(404).json({ error: 'Appointment not found' });
    }
    res.status(200).json({ message: 'Appointment cancelled successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to cancel appointment' });
  }
});
const mongoose = require('mongoose');
const Doctor = require('../models/Doctor');

module.exports = router;
