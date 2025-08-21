import React from "react";
import "keen-slider/keen-slider.min.css";

import { useTranslation } from 'react-i18next'; // Import useTranslation





const ServicesPage: React.FC = () => {
    const { t } = useTranslation(); // Get the translation function



    return (
        <div className="max-w-5xl mx-auto px-4 py-12">
            <h1 className="text-5xl font-extrabold text-gray-900 mb-4">
                {t('ourServices')} {/* Translate the title */}
            </h1>

                {/* Navigation Arrows */}


        </div>
    );
};

export default ServicesPage;
