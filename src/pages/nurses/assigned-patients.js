import React, { useEffect, useState } from 'react';
import axios from 'axios';

const AssignedPatients = () => {
  const [patients, setPatients] = useState([]);

  useEffect(() => {
    const fetchAssignedPatients = async () => {
      try {
        const response = await axios.get('/api/nurses/1/assigned-patients'); // Replace '1' with dynamic nurse ID
        setPatients(response.data);
      } catch (error) {
        console.error('Error fetching assigned patients:', error);
      }
    };

    fetchAssignedPatients();
  }, []);

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <h1 className="text-4xl font-bold text-blue-600 mb-6">Assigned Patients</h1>
      <div className="bg-white shadow-md rounded p-6">
        {patients.length > 0 ? (
          <ul>
            {patients.map((patient, index) => (
              <li key={index} className="mb-4">
                <p><strong>Name:</strong> {patient.name}</p>
                <p><strong>Email:</strong> {patient.email}</p>
              </li>
            ))}
          </ul>
        ) : (
          <p>No assigned patients available.</p>
        )}
      </div>
    </div>
  );
};

export default AssignedPatients;
