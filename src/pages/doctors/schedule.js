import React, { useEffect, useState } from 'react';
import axios from 'axios';

const Schedule = () => {
  const [schedule, setSchedule] = useState([]);

  useEffect(() => {
    const fetchSchedule = async () => {
      try {
        const response = await axios.get('/api/doctors/1/schedule'); // Replace '1' with dynamic doctor ID
        setSchedule(response.data);
      } catch (error) {
        console.error('Error fetching schedule:', error);
      }
    };

    fetchSchedule();
  }, []);

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <h1 className="text-4xl font-bold text-blue-600 mb-6">Doctor's Schedule</h1>
      <div className="bg-white shadow-md rounded p-6">
        {schedule.length > 0 ? (
          <ul>
            {schedule.map((entry, index) => (
              <li key={index} className="mb-4">
                <p><strong>Date:</strong> {new Date(entry.date).toLocaleDateString()}</p>
                <p><strong>Appointments:</strong></p>
                <ul>
                  {entry.appointments.map((appointment, idx) => (
                    <li key={idx}>
                      Patient: {appointment.patient.name} - Time: {new Date(appointment.date).toLocaleTimeString()}
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        ) : (
          <p>No schedule available.</p>
        )}
      </div>
    </div>
  );
};

export default Schedule;
