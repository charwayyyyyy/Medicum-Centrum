import React from 'react';

const Footer = () => {
  return (
    <footer className="bg-gray-800 text-white py-4 mt-8">
      <div className="max-w-7xl mx-auto px-4 text-center">
        <p>&copy; 2025 Medicum Centrum. All rights reserved.</p>
        <p>Designed with care for healthcare professionals and patients.</p>
        <div className="mt-2">
          <a href="/privacy-policy" className="text-gray-400 hover:text-white">Privacy Policy</a> | 
          <a href="/terms-of-service" className="text-gray-400 hover:text-white ml-2">Terms of Service</a>
        </div>
        <div className="mt-2">
          <a href="/contact" className="text-gray-400 hover:text-white">Contact Us</a>
        </div>
        <div className="bg-gray-700 text-gray-300 py-2 mt-4 rounded">
          <p>Follow us on:</p>
          <div className="flex justify-center space-x-4">
            <a href="#" className="hover:text-white">Facebook</a>
            <a href="#" className="hover:text-white">Twitter</a>
            <a href="#" className="hover:text-white">LinkedIn</a>
          </div>
        </div>
        <div className="bg-gray-800 text-gray-300 py-2 mt-4 rounded">
          <p>Subscribe to our newsletter:</p>
          <form className="flex justify-center mt-2">
            <input
              type="email"
              placeholder="Enter your email"
              className="px-4 py-2 rounded-l-md focus:outline-none"
            />
            <button className="bg-blue-600 text-white px-4 py-2 rounded-r-md hover:bg-blue-700">
              Subscribe
            </button>
          </form>
        </div>
      </div>
      
    </footer>
  );
};

export default Footer;

// This Footer component can be imported and used in your main application layout or specific pages.
// It provides a consistent footer across your application with links to privacy policy, terms of service, contact information, and social media links.