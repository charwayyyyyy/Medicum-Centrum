const mongoose = require('mongoose');

const NurseSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  assignedPatients: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Patient'
  }]
});

module.exports = mongoose.model('Nurse', NurseSchema);
