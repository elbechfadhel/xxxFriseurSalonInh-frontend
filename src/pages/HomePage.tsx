import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CalendarDays, Scissors } from 'lucide-react';

const HomePage: React.FC = () => {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="flex flex-col items-center justify-start px-6 text-center w-full"
        >
            <div className="max-w-4xl py-20">
                {/* Hero Section */}
                <div>
                    <h1 className="text-5xl font-extrabold text-gray-900 mb-4">
                        Welcome to <span className="text-green-600">Nejib’s Barber Shop</span>
                    </h1>
                    <p className="text-xl text-gray-600 mb-8">
                        Classic cuts. Modern style. Book your next visit with just a few clicks.
                    </p>

                    {/* CTA Buttons */}
                    <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
                        <Link
                            to="/booking"
                            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-lg transition"
                        >
                            <CalendarDays className="w-5 h-5" />
                            Book an Appointment
                        </Link>
                        <Link
                            to="/services"
                            className="inline-flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold px-6 py-3 rounded-lg transition"
                        >
                            <Scissors className="w-5 h-5" />
                            View Services
                        </Link>
                    </div>
                </div>

                {/* Why Choose Us */}
                <section className="mt-20">
                    <motion.h2
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                        className="text-2xl font-semibold text-gray-800 mb-4"
                    >
                        Why Choose Us?
                    </motion.h2>
                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.5 }}
                        className="text-gray-600 text-lg"
                    >
                        ✂️ Expert barbers &mdash; 🕒 Fast appointments &mdash; 💈 Friendly atmosphere
                    </motion.p>
                </section>
            </div>
        </motion.div>
    );
};

export default HomePage;
