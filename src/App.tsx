import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import ServicesPage from './pages/ServicesPage';
import BookingPage from './pages/BookingPage';
import { Toaster } from 'react-hot-toast';

const App: React.FC = () => {
    return (
        <Router>
            {/* Notification system root */}
            <Toaster position="top-center" toastOptions={{ duration: 4000 }} />

            <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/services" element={<ServicesPage />} />
                <Route path="/booking" element={<BookingPage />} />
            </Routes>
        </Router>
    );
}

export default App;
