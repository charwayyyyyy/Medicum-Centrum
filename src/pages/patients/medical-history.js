import React, { useEffect, useState } from 'react';
import axios from 'axios';

const MedicalHistory = () => {
  const [medicalHistory, setMedicalHistory] = useState([]);

  useEffect(() => {
    const fetchMedicalHistory = async () => {
      try {
        const response = await axios.get('/api/patients/1/medical-history'); // Replace '1' with dynamic patient ID
        setMedicalHistory(response.data);
      } catch (error) {
        console.error('Error fetching medical history:', error);
      }
    };

    fetchMedicalHistory();
  }, []);

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <h1 className="text-4xl font-bold text-blue-600 mb-6">Medical History</h1>
      <div className="bg-white shadow-md rounded p-6">
        {medicalHistory.length > 0 ? (
          <ul>
            {medicalHistory.map((entry, index) => (
              <li key={index} className="mb-4">
                <p><strong>Date:</strong> {new Date(entry.visitDate).toLocaleDateString()}</p>
                <p><strong>Diagnosis:</strong> {entry.diagnosis}</p>
                <p><strong>Prescriptions:</strong> {entry.prescriptions.join(', ')}</p>
                <p><strong>Lab Results:</strong> {entry.labResults.join(', ')}</p>
              </li>
            ))}
          </ul>
        ) : (
          <p>No medical history available.</p>
        )}
      </div>
    </div>
  );
};

export default MedicalHistory;
