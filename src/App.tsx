import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import BookingPage from './pages/BookingPage';
import ServicesPage from './pages/ServicesPage';
import AdminBookings from './admin/AdminBookings';
import Layout from './components/Layout';
import { Toaster } from 'react-hot-toast';
import AdminLogin from "@/admin/AdminLogin.tsx";
import ProtectedRoute from './pages/ProtectedRoute';
import AdminEmployees from "@/admin/AdminEmployees.tsx";

const App: React.FC = () => {
    return (
        <Router>
            <Toaster position="top-center" toastOptions={{ duration: 4000 }} />
            <Layout>
                <Routes>
                    <Route path="/" element={<HomePage />} />
                    <Route path="/services" element={<ServicesPage />} />
                    <Route path="/booking" element={<BookingPage />} />
                    <Route path="/admin/login" element={<AdminLogin />} /> {/* ✅ add this */}
                    <Route
                        path="/admin/bookings"
                        element={<ProtectedRoute><AdminBookings /></ProtectedRoute>}
                    />
                    <Route
                        path="/admin/employees"
                        element={<ProtectedRoute><AdminEmployees /></ProtectedRoute>}
                    />
                   {/* <Route
                        path="/admin/services/*"
                        element={<ProtectedRoute><AdminServices /></ProtectedRoute>}
                    />*/}
                </Routes>
            </Layout>
        </Router>
    );
};

export default App;
