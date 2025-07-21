import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Globe } from 'lucide-react';
import enFlag from '../assets/en.svg'; // Import English flag
import deFlag from '../assets/de.svg'; // Import German flag

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
    };

    // Helper function to check if the language is active
    const isActiveLanguage = (lng: string) => i18n.language === lng;

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                className="bg-gray-700 text-white py-2 px-4 rounded-lg hover:bg-gray-600 transition-all"
                onClick={() => setIsOpen((prev) => !prev)}
            >
                <Globe className="inline-block mr-2" />
                Language
            </button>

            {isOpen && (
                <div
                    id="language-dropdown"
                    className="absolute right-0 mt-2 w-40 bg-white border border-gray-300 rounded-lg shadow-lg"
                >
                    <ul className="text-sm">

                        <li>
                            <button
                                onClick={() => changeLanguage('de')}
                                className={`flex items-center px-4 py-2 ${isActiveLanguage('de') ? 'bg-gray-300 text-gray-900 font-semibold' : 'text-gray-900'} hover:bg-gray-200 w-full text-left`}
                            >
                                <img src={deFlag} alt="German Flag"
                                     className="mr-2 w-6 h-4"/> {/* Display the German flag */}
                                Deutsch
                            </button>
                        </li>
                        <li>
                            <button
                                onClick={() => changeLanguage('en')}
                                className={`flex items-center px-4 py-2 ${isActiveLanguage('en') ? 'bg-gray-300 text-gray-900 font-semibold' : 'text-gray-900'} hover:bg-gray-200 w-full text-left`}
                            >
                                <img src={enFlag} alt="English Flag"
                                     className="mr-2 w-6 h-4"/> {/* Display the English flag */}
                                English
                            </button>
                        </li>

                    </ul>
                </div>
            )}
        </div>
    );
};

export default LanguageSwitcher;
