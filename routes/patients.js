const express = require('express');
const router = express.Router();
const Patient = require('../models/Patient');
const Appointment = require('../models/Appointment');

// Book an appointment
router.post('/appointments', async (req, res) => {
  try {
    const { patientId, doctorId, date } = req.body;
    const appointment = new Appointment({ patient: patientId, doctor: doctorId, date });
    await appointment.save();

    // Link appointment to patient
    const patient = await Patient.findById(patientId);
    patient.appointments.push(appointment._id);
    await patient.save();

    res.status(201).json({ message: 'Appointment booked successfully', appointment });
  } catch (error) {
    res.status(500).json({ error: 'Failed to book appointment' });
  }
});

// View personal medical history
router.get('/:id/medical-history', async (req, res) => {
  try {
    const patient = await Patient.findById(req.params.id);
    res.status(200).json(patient.medicalHistory);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch medical history' });
  }
});
// Update personal information
router.put('/:id', async (req, res) => {
  try {
    const { name, email } = req.body;
    const updatedPatient = await Patient.findByIdAndUpdate(req.params.id, { name, email }, { new: true });
    res.status(200).json({ message: 'Patient information updated successfully', updatedPatient });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update patient information' });
  }
});
// View all appointments
router.get('/:id/appointments', async (req, res) => {
  try {
    const appointments = await Appointment.find({ patient: req.params.id }).populate('doctor');
    res.status(200).json(appointments);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch appointments' });
  }
});
// Cancel an appointment
router.delete('/:id/appointments/:appointmentId', async (req, res) => {
  try {
    const appointment = await Appointment.findByIdAndDelete(req.params.appointmentId);
    if (!appointment) {
      return res.status(404).json({ error: 'Appointment not found' });
    }

    // Remove appointment from patient's appointments
    const patient = await Patient.findById(req.params.id);
    patient.appointments = patient.appointments.filter(app => app.toString() !== appointment._id.toString());
    await patient.save();

    res.status(200).json({ message: 'Appointment cancelled successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to cancel appointment' });
  }
});
const { check, validationResult } = require('express-validator');

module.exports = router;
