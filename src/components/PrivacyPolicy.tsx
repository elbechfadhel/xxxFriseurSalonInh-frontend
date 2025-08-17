import React from 'react';
import { useTranslation } from 'react-i18next';

const PrivacyPolicy: React.FC = () => {
    const { t } = useTranslation();

    return (
        <div className="max-w-3xl mx-auto py-8">
            <h1 className="text-2xl font-bold mb-4">{t('privacyPolicy.title')}</h1>
            <p className="mb-2">{t('privacyPolicy.intro')}</p>

            <h2 className="text-xl font-semibold mt-4 mb-2">{t('privacyPolicy.section1Title')}</h2>
            <p>{t('privacyPolicy.section1Text')}</p>

            <h2 className="text-xl font-semibold mt-4 mb-2">{t('privacyPolicy.section2Title')}</h2>
            <p>{t('privacyPolicy.section2Text')}</p>

            <h2 className="text-xl font-semibold mt-4 mb-2">{t('privacyPolicy.section3Title')}</h2>
            <p>{t('privacyPolicy.section3Text')}</p>

            <h2 className="text-xl font-semibold mt-4 mb-2">{t('privacyPolicy.section4Title')}</h2>
            <p>{t('privacyPolicy.section4Text')}</p>

            <h2 className="text-xl font-semibold mt-4 mb-2">{t('privacyPolicy.section5Title')}</h2>
            <p>{t('privacyPolicy.section5Text')}</p>
        </div>
    );
};

export default PrivacyPolicy;
