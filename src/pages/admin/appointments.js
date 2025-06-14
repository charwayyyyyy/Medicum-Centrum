import React, { useEffect, useState } from 'react';
import axios from 'axios';

const Appointments = () => {
  const [appointments, setAppointments] = useState([]);

  useEffect(() => {
    const fetchAppointments = async () => {
      try {
        const response = await axios.get('/api/admin/appointments');
        setAppointments(response.data);
      } catch (error) {
        console.error('Error fetching appointments:', error);
      }
    };

    fetchAppointments();
  }, []);

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <h1 className="text-4xl font-bold text-blue-600 mb-6">Manage Appointments</h1>
      <div className="bg-white shadow-md rounded p-6">
        {appointments.length > 0 ? (
          <ul>
            {appointments.map((appointment, index) => (
              <li key={index} className="mb-4">
                <p><strong>Patient:</strong> {appointment.patient.name}</p>
                <p><strong>Doctor:</strong> {appointment.doctor.name}</p>
                <p><strong>Date:</strong> {new Date(appointment.date).toLocaleDateString()}</p>
                <p><strong>Status:</strong> {appointment.status}</p>
              </li>
            ))}
          </ul>
        ) : (
          <p>No appointments available.</p>
        )}
      </div>
    </div>
  );
};

export default Appointments;
