import React from 'react';
import { Link } from 'react-router-dom';

const HomePage: React.FC = () => {
    return (
        <div className="flex items-center justify-center h-screen bg-gray-100">
            <div className="text-center p-6 bg-white rounded-lg shadow-lg w-full max-w-md">
                <h1 className="text-4xl font-bold text-gray-800 mb-4">Welcome to Our Barber Shop</h1>
                <p className="text-xl text-gray-600 mb-6">Book your next haircut appointment with us!</p>
                <div className="space-x-4">
                    <Link
                        to="/services"
                        className="inline-block bg-blue-500 text-white px-6 py-3 rounded-md text-lg hover:bg-blue-600 transition-all"
                    >
                        See our services
                    </Link>
                    <Link
                        to="/booking"
                        className="inline-block bg-green-500 text-white px-6 py-3 rounded-md text-lg hover:bg-green-600 transition-all"
                    >
                        Book an appointment
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default HomePage;
