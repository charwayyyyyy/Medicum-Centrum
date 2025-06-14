import React from 'react';
import Link from 'next/link';

const HomePage = () => {
  return (
    <div className="min-h-screen bg-gradient-to-r from-blue-100 to-blue-300 flex flex-col items-center justify-center">
      <h1 className="text-5xl font-bold text-blue-800 mb-6">Welcome to Medicum Centrum</h1>
      <p className="text-lg text-blue-700 mb-8">Your one-stop solution for patient appointment and management.</p>
      <div className="flex space-x-4">
        <Link href="/patients/appointments" legacyBehavior>
          <a className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded shadow-lg">Patients</a>
        </Link>
        <Link href="/doctors/schedule" legacyBehavior>
          <a className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded shadow-lg">Doctors</a>
        </Link>
        <Link href="/nurses/assigned-patients" legacyBehavior>
          <a className="bg-yellow-500 hover:bg-yellow-700 text-white font-bold py-2 px-4 rounded shadow-lg">Nurses</a>
        </Link>
        <Link href="/admin/appointments" legacyBehavior>
          <a className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded shadow-lg">Admin</a>
        </Link>
      </div>
    </div>
  );
};

export default HomePage;
