import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CalendarDays, Clock, Scissors, Smile } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import ServicesGrid from "./ServicesGrid";

const HomePage: React.FC = () => {
    const { t } = useTranslation();






    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="flex flex-col px-4 sm:px-6 w-full"
        >
            {/* Hero Section */}
            <div className="max-w-6xl mx-auto mt-4">
                <div className="grid gap-8 md:grid-cols-12 items-start">
                    {/* Left Text Content — wider via col-span */}
                    <div className="md:col-span-8 lg:col-span-9 text-center md:text-left min-w-0">
                        <h1 className="text-1xl sm:text-1xl md:text-2xl font-extrabold text-gray-900 mb-4">
                            {t('welcomeTitle')}
                            <span className="text-[#4e9f66]"> {t('barberShopName')}</span>
                        </h1>
                        <p className="text-lg sm:text-xl text-gray-600 mb-6">
                            {t('heroDescription')}
                        </p>

                        {/* CTA Buttons */}
                        <div className="flex flex-col sm:flex-row justify-center md:justify-start items-center gap-4">
                            <Link
                                to="/booking"
                                className="inline-flex items-center gap-2 bg-[#4e9f66] hover:bg-[#3e8455] text-white font-semibold px-6 py-3 rounded-lg shadow transition"
                            >
                                <CalendarDays className="w-5 h-5"/>
                                {t('bookAppointment')}
                            </Link>

                        </div>
                    </div>

                    {/* Right: Random Highlight Grid */}
                    <div className="md:col-span-4 lg:col-span-3 place-self-center md:place-self-auto">
                        <img
                            src="/images/logo-xxx.png"
                            alt="Barbershop Logo"
                            className="w-[150px] md:w-[180px] lg:w-[220px] h-auto opacity-90"
                        />
                    </div>
                </div>
            </div>

            {/* SERVICES SECTION (using ServicesGrid) */}
            <section className="px-4 sm:px-6 mt-0">
                <div className="max-w-6xl mx-auto">

                    <div className="max-w-5xl mx-auto">
                        <ServicesGrid />
                    </div>

                </div>
            </section>

            {/* TESTIMONIALS */}



            {/* Why Choose Us */}
            <section className="mt-8 max-w-3xl mx-auto text-center">
                <motion.h2
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="text-2xl sm:text-3xl font-semibold text-gray-800 mb-6"
                >
                    {t('whyChooseUs')}
                </motion.h2>

                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    className="flex justify-center gap-8 flex-wrap text-gray-700 text-lg"
                >
                    <div className="flex items-center gap-2">
                        <Scissors className="w-5 h-5 text-[#4e9f66]" />
                        <span>{t('expertBarbers')}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Clock className="w-5 h-5 text-[#4e9f66]" />
                        <span>{t('fastAppointments')}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Smile className="w-5 h-5 text-[#4e9f66]" />
                        <span>{t('friendlyAtmosphere')}</span>
                    </div>
                </motion.div>
            </section>
        </motion.div>
    );
};

export default HomePage;
