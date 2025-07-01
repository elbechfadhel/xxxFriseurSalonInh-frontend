import React from 'react';
import { Link } from 'react-router-dom';

const HomePage: React.FC = () => {
    return (
        <div className="max-w-4xl mx-auto text-center py-20 px-4">
            <h1 className="text-5xl font-bold text-gray-800 mb-6">
                Welcome to <span className="text-green-600">Nejib’s Barber Shop</span>
            </h1>
            <p className="text-lg text-gray-600 mb-8">
                Classic cuts. Modern style. Book your next visit with just a few clicks.
            </p>

            <div className="space-x-4">
                <Link
                    to="/booking"
                    className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-lg"
                >
                    Book an Appointment
                </Link>
                <Link
                    to="/services"
                    className="bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold px-6 py-3 rounded-lg"
                >
                    View Services
                </Link>
            </div>
        </div>
    );
};

export default HomePage;
