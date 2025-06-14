const express = require('express');
const mongoose = require('mongoose');
const Patient = require('./models/Patient');
const Doctor = require('./models/Doctor');
const Appointment = require('./models/Appointment');
const Admin = require('./models/Admin');
const Nurse = require('./models/Nurse');
const patientsRoute = require('./routes/patients');
const doctorsRoute = require('./routes/doctors');
const nursesRoute = require('./routes/nurses');
const adminRoute = require('./routes/admin');

const app = express();
const port = 3001;

// Middleware
app.use(express.json());

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/medicum_centrum', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useCreateIndex: true
}).then(() => {
  console.log('Connected to MongoDB');
}).catch((err) => {
  console.error('Error connecting to MongoDB:', err);
});

// Routes
app.use('/api/patients', patientsRoute);
app.use('/api/doctors', doctorsRoute);
app.use('/api/nurses', nursesRoute);
app.use('/api/admin', adminRoute);

// Example route
app.get('/', (req, res) => {
  res.send('Backend server is running');
});

// Start the server
app.listen(port, () => {
  console.log(`Backend server is running on http://localhost:${port}`);
});
