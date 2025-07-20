import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import Footer from './Footer';

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { pathname } = useLocation();

    const navLinkClass = (path: string) =>
        `text-white hover:text-orange-400 transition ${
            pathname === path ? 'text-orange-400 font-semibold underline' : ''
        }`;

    return (
        <div className="flex flex-col min-h-screen bg-white text-gray-900">
            {/* Header Navigation */}
            <header className="bg-[#636A6D] text-white py-4 shadow">
                <div className="max-w-6xl mx-auto px-6 flex justify-between items-center">
                    <h1 className="text-2xl font-bold">
                        <span className="text-orange-500">XXXFriseursalon Inh. </span>Najib Neffati
                    </h1>
                    <nav className="space-x-6 text-sm">
                        <Link to="/" className={navLinkClass('/')}>Home</Link>
                        <Link to="/services" className={navLinkClass('/services')}>Services</Link>
                        <Link to="/booking" className={navLinkClass('/booking')}>Booking</Link>
                        <Link to="/admin" className={navLinkClass('/admin')}>Admin</Link>
                    </nav>
                </div>
            </header>

            {/* Main content */}
            <main className="flex-grow px-6 py-8">{children}</main>

            {/* Footer */}
            <Footer />
        </div>
    );
};

export default Layout;
