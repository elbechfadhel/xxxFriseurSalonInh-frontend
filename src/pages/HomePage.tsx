import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CalendarDays, Clock, Scissors, Smile } from 'lucide-react';
import { useTranslation } from 'react-i18next'; // Import useTranslation

const HomePage: React.FC = () => {
    const { t } = useTranslation(); // Get the translation function

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
                        {t('welcomeTitle')} <span className="text-orange-500">{t('barberShopName')}</span>
                    </h1>
                    <p className="text-xl text-gray-600 mb-8">
                        {t('heroDescription')}
                    </p>

                    {/* CTA Buttons */}
                    <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
                        <Link
                            to="/booking"
                            className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-semibold px-6 py-3 rounded-lg transition"
                        >
                            <CalendarDays className="w-5 h-5" />
                            {t('bookAppointment')}
                        </Link>
                        <Link
                            to="/services"
                            className="inline-flex items-center gap-2 bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold px-6 py-3 rounded-lg transition"
                        >
                            <Scissors className="w-5 h-5" />
                            {t('viewServices')}
                        </Link>
                    </div>
                </div>

                {/* Why Choose Us */}
                <section className="mt-20 max-w-3xl">
                    <motion.h2
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                        className="text-2xl font-semibold text-gray-800 mb-4"
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
                            <Scissors className="w-5 h-5 text-orange-500" />
                            <span>{t('expertBarbers')}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Clock className="w-5 h-5 text-orange-500" />
                            <span>{t('fastAppointments')}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Smile className="w-5 h-5 text-orange-500" />
                            <span>{t('friendlyAtmosphere')}</span>
                        </div>
                    </motion.div>
                </section>
            </div>
        </motion.div>
    );
};

export default HomePage;
