import React, { useEffect, useState } from 'react';
import 'react-datepicker/dist/react-datepicker.css';
import 'react-calendar/dist/Calendar.css';
import TimeSlotSelection from '@/components/TimeSlotSelection';
import ReCAPTCHA from 'react-google-recaptcha';
import { useTranslation } from 'react-i18next';
import {CheckCircle, Info, XCircle} from "lucide-react";
import {de, enUS} from "date-fns/locale";
import DatePicker from "react-datepicker"; // Import useTranslation

interface Employee {
    id: string;
    name: string;
}

const BookingPage: React.FC = () => {
    const { t, i18n } = useTranslation(); // Get the translation function
    const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
    const [selectedDateTime, setSelectedDateTime] = useState<string | null>(null);
    const [selectedEmployee, setSelectedEmployee] = useState<string | null>(null);
    const [resetTrigger, setResetTrigger] = useState(0);
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [customerName, setCustomerName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [codeSent, setCodeSent] = useState(false);
    const [emailCode, setEmailCode] = useState('');
    const [captchaToken, setCaptchaToken] = useState<string | null>(null);
    const [notification, setNotification] = useState<string | null>(null); // State for notification
    const [notificationType, setNotificationType] = useState<'success' | 'error' | 'info' | null>(null); // Type of notification (success, error, info)
    const API_BASE = import.meta.env.VITE_API_URL;


    const getLocale = () => {
        switch (i18n.language) {
            case 'de': // German
                return de;  // Return the `de` locale from date-fns
            case 'en': // English
            default:
                return enUS; // Return the `enUS` locale from date-fns
        }
    };


    useEffect(() => {
        const fetchEmployees = async () => {
            try {
                const res = await fetch(`${API_BASE}/employees`);
                const data = await res.json();
                setEmployees(data);
            } catch (err) {
                setNotification(t('failedLoadEmployees')); // Show error notification
                setNotificationType('error');
            }
        };
        fetchEmployees();
    }, []);

    const isValidEmail = (value: string) =>
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

    const isValidGermanPhone = (number: string) =>
        /^[1-9][0-9]{9}$/.test(number);

    const handleSendEmailCode = async () => {
        if (!isValidEmail(email)) {
            setNotification(t('invalidEmail'));
            setNotificationType('error');
            return;
        }

        if (!captchaToken) {
            setNotification(t('completeCaptcha'));
            setNotificationType('error');
            return;
        }

        try {
            const res = await fetch(`${API_BASE}/verify-email/send-code`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, captchaToken }),
            });

            if (!res.ok) throw new Error('Failed to send verification email');

            setNotification(t('verificationCodeSent'));
            setNotificationType('success');
            setCodeSent(true);
        } catch (err) {
            setNotification(t('sendEmailError'));
            setNotificationType('error');
        }
    };

    const handleVerifyCodeAndBook = async () => {
        try {
            const verifyRes = await fetch(`${API_BASE}/verify-email/confirm-code`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, code: emailCode }),
            });

            if (!verifyRes.ok) throw new Error('Invalid verification code');

            setNotification(t('emailVerified'));
            setNotificationType('success');

            const bookingRes = await fetch(`${API_BASE}/reservations`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    customerName,
                    email,
                    phone: phone ? `+49${phone}` : null,
                    service: "Haircut",
                    date: selectedDateTime,
                    employeeId: selectedEmployee,
                }),
            });

            if (!bookingRes.ok) throw new Error("Failed to book");

            setNotification(t('bookingConfirmed'));
            setNotificationType('success');
            setCustomerName('');
            setEmail('');
            setPhone('');
            setEmailCode('');
            setCodeSent(false);
            setCaptchaToken(null);
            setSelectedDateTime(null);
            setResetTrigger(prev => prev + 1);
        } catch (err) {
            setNotification(t('bookingError'));
            setNotificationType('error');
        }
    };

    const isBookingInfoValid =
        selectedDateTime &&
        selectedEmployee &&
        customerName.trim() &&
        isValidEmail(email);

    return (
        <div className="px-4 py-10">
            <div className="text-center mb-12">
                <h1 className="text-4xl font-extrabold text-gray-800 mb-4">
                    {t('welcome')} <span className="text-orange-500">{t('barberShop')}</span>
                </h1>
                <p className="text-lg text-gray-600">
                    {t('bookAppointmentDesc')}
                </p>
            </div>

            <div className="max-w-5xl mx-auto bg-white grid grid-cols-1 md:grid-cols-3 gap-6 g p-6">
                {/* Calendar */}
                <div className="col-span-1 text-left">  {/* Add text-left to align the content to the left */}
                    <h2 className="text-lg font-semibold text-gray-700 mb-2">{t('pickDate')}</h2>
                    <DatePicker
                        selected={selectedDate}
                        onChange={(date: Date | null) => setSelectedDate(date)}  // Accept Date | null
                        locale={getLocale()}  // Pass locale dynamically
                        dateFormat="P"  // Date format (you can customize this)
                        className="rounded-lg border shadow-md p-2 w-full"  // Add w-full to make DatePicker full width
                        inline
                        minDate={new Date()}
                    />
                </div>

                {/* Right Panel */}
                <div className="col-span-2">
                    <h2 className="text-lg font-semibold text-gray-700 mb-4 text-center">{t('pickTime')}</h2>


                    <div className="mb-6">
                        <label className="block text-sm font-medium text-gray-700 mb-1">{t('chooseBarber')}</label>
                        <select
                            value={selectedEmployee ?? ''}
                            onChange={(e) => {
                                setSelectedEmployee(e.target.value);
                                setResetTrigger(prev => prev + 1);
                            }}
                            className="w-full border rounded px-3 py-2"
                        >
                            <option value="" disabled>{t('selectBarber')}</option>
                            {employees.map(emp => (
                                <option key={emp.id} value={emp.id}>{emp.name}</option>
                            ))}
                        </select>
                    </div>

                    <TimeSlotSelection
                        selectedDate={selectedDate || new Date()}
                        selectedEmployeeId={selectedEmployee}
                        onSlotSelected={setSelectedDateTime}
                        resetTrigger={resetTrigger}
                    />

                    {/* Customer Info */}
                    <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">{t('fullName')}</label>
                            <input
                                type="text"
                                value={customerName}
                                onChange={(e) => setCustomerName(e.target.value)}
                                placeholder={t('fullNamePlaceholder')}
                                className={`w-full border rounded px-3 py-2 shadow-sm ${!customerName.trim() ? 'border-red-500' : ''}`}
                            />
                            {!customerName.trim() && (
                                <p className="text-red-500 text-sm mt-1">{t('nameRequired')}</p>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">{t('phoneNumber')}</label>
                            <div className="flex items-center border rounded px-3 py-2 shadow-sm">
                                <img
                                    src="https://flagcdn.com/w40/de.png"
                                    alt="Germany"
                                    className="w-5 h-4 mr-2"
                                />
                                <span className="mr-2 text-sm text-gray-700">+49</span>
                                <input
                                    type="tel"
                                    value={phone}
                                    onChange={(e) => setPhone(e.target.value)}
                                    placeholder={t('phonePlaceholder')}
                                    className="flex-1 outline-none"
                                />
                            </div>
                            {!isValidGermanPhone(phone) && phone && (
                                <p className="text-sm text-red-500 mt-1">{t('invalidPhone')}</p>
                            )}
                        </div>

                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">{t('email')}</label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder={t('emailPlaceholder')}
                                className={`w-full border rounded px-3 py-2 shadow-sm ${!isValidEmail(email) && email ? 'border-red-500' : ''}`}
                            />
                            {!isValidEmail(email) && email && (
                                <p className="text-sm text-red-500 mt-1">{t('invalidEmailFormat')}</p>
                            )}
                        </div>
                    </div>

                    {/* CAPTCHA */}
                    <div className="mt-6 mb-2">
                        <ReCAPTCHA
                            sitekey="6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI" // test site key from Google
                            onChange={(token: any) => setCaptchaToken(token)}
                        />
                    </div>

                    {/* Display notification here */}
                    {notification && (
                        <div
                            className={`mb-6 p-4 font-normal border ${notificationType === 'success' ? 'border-green-500 text-green-500' : notificationType === 'error' ? 'border-red-500 text-red-500' : 'border-blue-500 text-blue-500'}`}>
                            <div className="flex items-center gap-3">
                                {/* Display the icon based on notificationType */}
                                {notificationType === 'success' && <CheckCircle className="w-6 h-6"/>}
                                {notificationType === 'error' && <XCircle className="w-6 h-6"/>}
                                {notificationType === 'info' && <Info className="w-6 h-6"/>}

                                <span>{notification}</span>
                            </div>
                        </div>
                    )}

                    {/* Send code / verify code */}
                    <div className="mt-6 mb-2">
                        {!codeSent ? (
                            <button
                                onClick={handleSendEmailCode}
                                disabled={!isBookingInfoValid || !captchaToken}
                                className={`w-full py-3 rounded-lg text-lg font-semibold 
                                    ${!isBookingInfoValid
                                    ? 'bg-gray-200 text-gray-500 border border-gray-300 shadow-inner cursor-not-allowed'
                                    : 'bg-orange-500 hover:bg-orange-600 text-white'}`}
                            >
                                {t('sendVerificationCode')}
                            </button>
                        ) : (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mt-2">{t('enterCode')}</label>
                                <input
                                    type="text"
                                    value={emailCode}
                                    onChange={(e) => setEmailCode(e.target.value)}
                                    placeholder={t('codePlaceholder')}
                                    className="w-full border rounded px-3 py-2 shadow-sm mt-1"
                                />
                                <button
                                    onClick={handleVerifyCodeAndBook}
                                    className="w-full mt-3 bg-orange-500 hover:bg-orange-600 text-white py-2 rounded font-semibold"
                                >
                                    {t('verifyAndBook')}
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BookingPage;
