import React, { useEffect, useState } from 'react';
import axios from 'axios';

const PatientDetails = () => {
  const [patientDetails, setPatientDetails] = useState(null);

  useEffect(() => {
    const fetchPatientDetails = async () => {
      try {
        const response = await axios.get('/api/patients/1'); // Replace '1' with dynamic patient ID
        setPatientDetails(response.data);
      } catch (error) {
        console.error('Error fetching patient details:', error);
      }
    };

    fetchPatientDetails();
  }, []);

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <h1 className="text-4xl font-bold text-blue-600 mb-6">Patient Details</h1>
      <div className="bg-white shadow-md rounded p-6">
        {patientDetails ? (
          <div>
            <p><strong>Name:</strong> {patientDetails.name}</p>
            <p><strong>Email:</strong> {patientDetails.email}</p>
            <p><strong>Medical History:</strong></p>
            <ul>
              {patientDetails.medicalHistory.map((entry, index) => (
                <li key={index}>
                  <p>Date: {new Date(entry.visitDate).toLocaleDateString()}</p>
                  <p>Diagnosis: {entry.diagnosis}</p>
                  <p>Prescriptions: {entry.prescriptions.join(', ')}</p>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <p>Loading patient details...</p>
        )}
      </div>
    </div>
  );
};

export default PatientDetails;
