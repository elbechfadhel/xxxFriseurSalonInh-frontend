import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import Footer from './Footer'; // ⬅️ Import the Footer component

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { pathname } = useLocation();

    return (
        <div className="flex flex-col min-h-screen">
            {/* Header Navigation */}
            <header className="bg-gray-800 text-white py-4 shadow">
                <div className="max-w-6xl mx-auto px-6 flex justify-between items-center">
                    <h1 className="text-xl font-bold">Barber Shop</h1>
                    <nav className="space-x-4">
                        <Link to="/" className={pathname === '/' ? 'underline font-semibold' : ''}>
                            Home
                        </Link>
                        <Link to="/services" className={pathname === '/services' ? 'underline font-semibold' : ''}>
                            Services
                        </Link>
                        <Link to="/booking" className={pathname === '/booking' ? 'underline font-semibold' : ''}>
                            Booking
                        </Link>
                        <Link to="/admin" className={pathname === '/admin' ? 'underline font-semibold' : ''}>
                            Admin
                        </Link>
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
