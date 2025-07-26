import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './locales/en.json';
import de from './locales/de.json';
import ar from './locales/ar.json';

i18n.use(initReactI18next).init({
    resources: {
        en: {
            translation: en,
        },
        de: {
            translation: de,
        },
        ar: {
            translation: ar,
        },
    },
    lng: 'de', // Default language
    fallbackLng: 'en', // Fallback language
    interpolation: {
        escapeValue: false,
    },
});

export default i18n;
