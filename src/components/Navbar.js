import React from 'react';
import Link from 'next/link';
import { FaUserMd, FaUserNurse, FaUser, FaTools } from 'react-icons/fa';

const Navbar = () => {
  return (
    <nav className="bg-white shadow-lg fixed top-0 w-full z-10">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <div className="text-2xl font-bold text-blue-600">Medicum Centrum</div>
          <div className="flex space-x-4">
            <Link href="/patients/appointments" legacyBehavior>
              <a className="flex items-center text-blue-600 hover:text-blue-800">
                <FaUser className="mr-2" /> Patients
              </a>
            </Link>
            <Link href="/doctors/schedule" legacyBehavior>
              <a className="flex items-center text-green-600 hover:text-green-800">
                <FaUserMd className="mr-2" /> Doctors
              </a>
            </Link>
            <Link href="/nurses/assigned-patients" legacyBehavior>
              <a className="flex items-center text-yellow-600 hover:text-yellow-800">
                <FaUserNurse className="mr-2" /> Nurses
              </a>
            </Link>
            <Link href="/admin/appointments" legacyBehavior>
              <a className="flex items-center text-red-600 hover:text-red-800">
                <FaTools className="mr-2" /> Admin
              </a>
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
