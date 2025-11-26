import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import Footer from './Footer';
import LanguageSwitcher from './LanguageSwitcher';
import { useTranslation } from 'react-i18next';

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { t } = useTranslation();
    const { pathname } = useLocation();

    const [isAdminOpen, setIsAdminOpen] = useState(false);
   /* const [isServicesOpen, setIsServicesOpen] = useState(false);*/
    const menuRef = useRef<HTMLDivElement | null>(null);

    const navLinkClass = (path: string) =>
        `text-white  ${
            pathname === path ? 'font-bold underline' : ''
        }`;

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                setIsAdminOpen(false);
              //  setIsServicesOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div className="flex flex-col min-h-screen bg-white text-gray-900">
            {/* Header Navigation */}
            <header className="bg-[#636A6D] shadow-sm border-b border-gray-100">
                <div className="mx-auto px-4 py-2 flex items-center justify-between">
                    {/* Left: Logo */}
                   {/* <div className="flex items-center space-x-4">
                        <img
                            src="/images/logo-xxx.png"
                            alt="XXX Friseursalon Logo"
                            className="w-[70px] h-[70px] object-contain"
                        />
                    </div>*/}

                    {/* Center: Navigation */}
                    <nav className="flex space-x-4 rtl:space-x-reverse text-sm md:text-base relative">
                        <Link to="/" className={navLinkClass('/')}>
                            {t('home')}
                        </Link>
                      {/*  <Link to="/services" className={navLinkClass('/services')}>
                            {t('services.menu')}
                        </Link>*/}
                        <Link to="/booking" className={navLinkClass('/booking')}>
                            {t('booking')}
                        </Link>
                        <Link to="/feedback" className={navLinkClass('/feedback')}>
                            {t('adminFeedbacks.title')}
                        </Link>

                        {/* Admin Dropdown */}
                        <div className="relative" ref={menuRef}>
                            <button
                                className="text-white  focus:outline-none"
                                onClick={() => setIsAdminOpen(!isAdminOpen)}
                            >
                                {t('admin')}
                            </button>

                            {/* Dropdown Menu */}
                            <div
                                className={`absolute left-0 mt-2 w-48 bg-white shadow-lg border rounded z-50 transition-all duration-200 transform origin-top ${
                                    isAdminOpen
                                        ? 'opacity-100 scale-100 visible'
                                        : 'opacity-0 scale-95 invisible'
                                }`}
                            >
                                <Link
                                    to="/admin/kioskTodayBoard"
                                    className="block px-4 py-2 hover:bg-gray-100 text-gray-800"
                                    onClick={() => setIsAdminOpen(false)}
                                >
                                    {t('adminBookings.today')}
                                </Link>

                                <Link
                                    to="/admin/bookings"
                                    className="block px-4 py-2 hover:bg-gray-100 text-gray-800"
                                    onClick={() => setIsAdminOpen(false)}
                                >
                                    {t('adminBookings.title')}
                                </Link>
                                <Link
                                    to="/admin/blocks"
                                    className="block px-4 py-2 hover:bg-gray-100 text-gray-800"
                                    onClick={() => setIsAdminOpen(false)}
                                >
                                    {t('blocks.title')}
                                </Link>
                                <Link
                                    to="/admin/employees"
                                    className="block px-4 py-2 hover:bg-gray-100 text-gray-800"
                                    onClick={() => setIsAdminOpen(false)}
                                >
                                    {t('adminEmployees.title')}
                                </Link>

                                <Link
                                    to="/admin/feedbacks"
                                    className="block px-4 py-2 hover:bg-gray-100 text-gray-800"
                                    onClick={() => setIsAdminOpen(false)}
                                >
                                    {t('adminFeedbacks.title')}
                                </Link>
                                <Link
                                    to="/admin/sms-logs"
                                    className="block px-4 py-2 hover:bg-gray-100 text-gray-800"
                                    onClick={() => setIsAdminOpen(false)}
                                >
                                    SMS-Verlauf
                                </Link>
                                <Link
                                    to="/widget"
                                    className="block px-4 py-2 hover:bg-gray-100 text-gray-800"
                                    onClick={() => setIsAdminOpen(false)}
                                >
                                    Widget
                                </Link>





                                {/* Submenu Toggle */}
                               {/* <div className="relative">
                                    <button
                                        className="w-full text-left px-4 py-2 hover:bg-gray-100 text-gray-800 flex justify-between items-center"
                                        onClick={() => setIsServicesOpen(!isServicesOpen)}
                                    >
                                        {t('adminServices.title')}
                                    </button>

                                     Submenu
                                    <div
                                        className={`absolute left-full top-0 mt-0 w-48 bg-white shadow-lg border rounded z-50 transition-all duration-200 transform origin-left ${
                                            isServicesOpen
                                                ? 'opacity-100 scale-100 visible'
                                                : 'opacity-0 scale-95 invisible'
                                        }`}
                                    >
                                        <Link
                                            to="/admin/services/hair"
                                            className="block px-4 py-2 hover:bg-gray-100 text-gray-800"
                                            onClick={() => {
                                                setIsAdminOpen(false);
                                                setIsServicesOpen(false);
                                            }}
                                        >
                                            {t('services.hair')}
                                        </Link>
                                        <Link
                                            to="/admin/services/nails"
                                            className="block px-4 py-2 hover:bg-gray-100 text-gray-800"
                                            onClick={() => {
                                                setIsAdminOpen(false);
                                                setIsServicesOpen(false);
                                            }}
                                        >
                                            {t('services.nails')}
                                        </Link>
                                    </div>
                                </div>*/}
                            </div>
                        </div>
                    </nav>

                    {/* Right: Language Switcher */}
                    <div className="flex items-center space-x-4">
                        <LanguageSwitcher />
                    </div>
                </div>
            </header>

            {/* Main content */}
            <main className="flex-grow px-4 md:px-6 py-4">{children}</main>

            {/* Footer */}
            <Footer />
        </div>
    );
};

export default Layout;
