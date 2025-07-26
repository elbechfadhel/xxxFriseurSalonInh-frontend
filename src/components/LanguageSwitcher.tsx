import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import enFlag from '../assets/en.svg';
import deFlag from '../assets/de.svg';
import arFlag from '../assets/ar.svg'; // Add Arabic flag icon

const LanguageSwitcher = () => {
    const { i18n } = useTranslation();
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('click', handleClickOutside);
        return () => document.removeEventListener('click', handleClickOutside);
    }, []);

    const changeLanguage = (lng: string) => {
        i18n.changeLanguage(lng);
        setIsOpen(false);

        // For RTL support
        if (lng === 'ar') {
            document.documentElement.dir = 'rtl';
        } else {
            document.documentElement.dir = 'ltr';
        }
    };

    const isActiveLanguage = (lng: string) => i18n.language === lng;

    // Show flag and label based on selected language
    const currentLanguage = i18n.language;
    const currentFlag = currentLanguage === 'de' ? deFlag : currentLanguage === 'ar' ? arFlag : enFlag;
    const currentLabel =
        currentLanguage === 'de' ? 'Deutsch' : currentLanguage === 'ar' ? 'العربية' : 'English';

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                className="text-sm text-white py-2 px-4 rounded-lg transition-all flex items-center"
                onClick={() => setIsOpen((prev) => !prev)}
            >
                <img src={currentFlag} alt={currentLabel} className="w-5 h-4 mr-2" />
                {currentLabel}
            </button>

            {isOpen && (
                <div
                    id="language-dropdown"
                    className="absolute right-0 mt-2 w-40 border border-gray-300 rounded-lg shadow-lg bg-white"
                >
                    <ul className="text-sm">
                        <li>
                            <button
                                onClick={() => changeLanguage('de')}
                                className={`flex items-center px-4 py-2 ${
                                    isActiveLanguage('de') ? 'bg-gray-300 text-gray-900 font-semibold' : 'text-gray-900'
                                } hover:bg-gray-200 w-full text-left`}
                            >
                                <img src={deFlag} alt="German Flag" className="mr-2 w-6 h-4" />
                                Deutsch
                            </button>
                        </li>
                        <li>
                            <button
                                onClick={() => changeLanguage('en')}
                                className={`flex items-center px-4 py-2 ${
                                    isActiveLanguage('en') ? 'bg-gray-300 text-gray-900 font-semibold' : 'text-gray-900'
                                } hover:bg-gray-200 w-full text-left`}
                            >
                                <img src={enFlag} alt="English Flag" className="mr-2 w-6 h-4" />
                                English
                            </button>
                        </li>
                        <li>
                            <button
                                onClick={() => changeLanguage('ar')}
                                className={`flex items-center px-4 py-2 ${
                                    isActiveLanguage('ar') ? 'bg-gray-300 text-gray-900 font-semibold' : 'text-gray-900'
                                } hover:bg-gray-200 w-full text-left`}
                            >
                                <img src={arFlag} alt="Arabic Flag" className="mr-2 w-6 h-4" />
                                العربية
                            </button>
                        </li>
                    </ul>
                </div>
            )}
        </div>
    );
};

export default LanguageSwitcher;
