const express = require('express');
const router = express.Router();
const Nurse = require('../models/Nurse');
const Patient = require('../models/Patient');

// View assigned patients
router.get('/:id/assigned-patients', async (req, res) => {
  try {
    const nurse = await Nurse.findById(req.params.id).populate('assignedPatients');
    res.status(200).json(nurse.assignedPatients);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch assigned patients' });
  }
});

// Record patient vitals
router.post('/:id/vitals', async (req, res) => {
  try {
    const { patientId, vitals } = req.body;
    const patient = await Patient.findById(patientId);
    patient.medicalHistory.push({
      visitDate: new Date(),
      diagnosis: 'Vitals recorded',
      prescriptions: [],
      labResults: vitals
    });
    await patient.save();

    res.status(201).json({ message: 'Vitals recorded successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to record vitals' });
  }
});
// Assist in patient care
router.post('/:id/assist', async (req, res) => {
  try {
    const { patientId, notes } = req.body;
    const patient = await Patient.findById(patientId);
    patient.medicalHistory.push({
      visitDate: new Date(),
      diagnosis: notes,
      prescriptions: [],
      labResults: []
    });
    await patient.save();

    res.status(201).json({ message: 'Assistance recorded successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to record assistance' });
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
// Update patient details
router.put('/:id/patients/:patientId', async (req, res) => {
  try {
    const { name, email, phone } = req.body;
    const patient = await Patient.findByIdAndUpdate(req.params.patientId, { name, email, phone }, { new: true });
    if (!patient) {
      return res.status(404).json({ error: 'Patient not found' });
    }
    res.status(200).json({ message: 'Patient details updated successfully', patient });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update patient details' });
  }
});
const Nurse = require('../models/Nurse');

module.exports = router;
