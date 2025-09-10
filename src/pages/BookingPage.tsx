import React, { useEffect, useState } from 'react';
import 'react-datepicker/dist/react-datepicker.css';
import 'react-calendar/dist/Calendar.css';
import TimeSlotSelection from '@/components/TimeSlotSelection';
import { useTranslation } from 'react-i18next';
import { de, enUS } from 'date-fns/locale';
import DatePicker from 'react-datepicker';
import EmployeeSelector from '@/pages/EmployeeSelector.tsx';

interface Employee {
    id: string;
    name: string;
}

const BookingPage: React.FC = () => {
    const { t, i18n } = useTranslation();
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
    const [notification, setNotification] = useState<string | null>(null);
    const [notificationType, setNotificationType] = useState<'success' | 'error' | 'info' | null>(null);
    const API_BASE = import.meta.env.VITE_API_URL;

    const getLocale = () => (i18n.language === 'de' ? de : enUS);

    useEffect(() => {
        const fetchEmployees = async () => {
            try {
                const res = await fetch(`${API_BASE}/employees`);
                const data = await res.json();
                setEmployees(data);
            } catch (err) {
                setNotification(t('failedLoadEmployees'));
                setNotificationType('error');
            }
        };
        fetchEmployees();
    }, []);

    const isValidEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
    const isValidGermanPhone = (number: string) => /^[1-9][0-9]{9}$/.test(number);

    const handleSendEmailCode = async () => {
        if (!isValidEmail(email)) {
            setNotification(t('invalidEmail'));
            setNotificationType('error');
            return;
        }
     /*   if (!captchaToken) {
            setNotification(t('completeCaptcha'));
            setNotificationType('error');
            return;
        }*/
        try {
            const res = await fetch(`${API_BASE}/verify-email/send-code`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, captchaToken, lang: i18n.language?.startsWith("de") ? "de" : "en" }),
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
                body: JSON.stringify({ email, code: emailCode, lang: i18n.language.startsWith("de") ? "de" : "en" }),
            });
            if (!verifyRes.ok) throw new Error('Invalid verification code');

            setNotification(t('emailVerified'));
            setNotificationType('success');

            const bookingRes = await fetch(`${API_BASE}/reservations`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    customerName,
                    email,
                    phone: phone ? `+49${phone}` : null,
                    service: 'Haircut',
                    date: selectedDateTime,
                    employeeId: selectedEmployee,
                }),
            });

            if (!bookingRes.ok) throw new Error('Failed to book');

            setNotification(t('bookingConfirmed'));
            setNotificationType('success');
            setCustomerName('');
            setEmail('');
            setPhone('');
            setEmailCode('');
            setCodeSent(false);
            setCaptchaToken(null);
            setSelectedDateTime(null);
            setResetTrigger((prev) => prev + 1);
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
        <div className="px-4 py-8">
            {/* Heading Section */}
            <div className="w-full flex flex-col items-center text-center mb-8">
                <h1 className="text-2xl md:text-3xl font-semibold text-gray-800 mb-2">
                    {t('bookAppointmentTitle')}
                </h1>
                <p className="text-base md:text-lg text-gray-600 max-w-2xl">
                    {t('bookAppointmentDesc')}
                </p>
            </div>

            {/* Container */}
            <div className="max-w-6xl bg-white rounded-lg shadow-md flex flex-col md:flex-row gap-6 p-6 mx-auto">
                {/* Left panel - Date Picker */}
                <div className="w-full md:w-[320px] shrink-0 text-left">
                    <label className="block text-sm font-medium text-gray-700 mb-2">{t('pickDate')}</label>
                    <DatePicker
                        selected={selectedDate}
                        onChange={(date: Date | null) => setSelectedDate(date)}
                        locale={getLocale()}
                        dateFormat="P"
                        className="rounded-lg border shadow-md p-2 w-full"
                        inline
                        minDate={new Date()}
                    />
                </div>

                {/* Right panel */}
                <div className="flex-1">
                {/* Employee Selector */}
                    <div className="mb-6">
                        <label className="block text-sm font-medium text-gray-700 mb-1">{t('chooseBarber')}</label>
                        <div className="flex gap-4 flex-nowrap overflow-x-auto">
                            <EmployeeSelector
                                employees={employees}
                                selectedEmployee={selectedEmployee}
                                onChange={(id) => {
                                    setSelectedEmployee(id);
                                    setResetTrigger((prev) => prev + 1);
                                }}
                                apiBase={API_BASE}
                            />
                        </div>
                    </div>

                    {/* Time Slots */}
                    <label className="block text-sm font-medium text-gray-700 mb-2">{t('pickTime')}</label>
                    <TimeSlotSelection
                        selectedDate={selectedDate || new Date()}
                        selectedEmployeeId={selectedEmployee}
                        onSlotSelected={setSelectedDateTime}
                        resetTrigger={resetTrigger}
                    />

                    {/* Customer Info */}
                    <div className="mt-6 mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* Full Name */}
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

                        {/* Phone */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">{t('phoneNumber')}</label>
                            <div className="flex items-center border rounded px-3 py-2 shadow-sm">
                                <img src="https://flagcdn.com/w40/de.png" alt="Germany" className="w-5 h-4 mr-2" />
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

                        {/* Email */}
                        <div>
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

                    {/* Notifications */}
                    {notification && (
                        <div
                            className={`mb-6 p-2 font-bold border ${
                                notificationType === 'success'
                                    ? 'border-green-500 text-green-500'
                                    : notificationType === 'error'
                                        ? 'border-red-500 text-red-500'
                                        : 'border-blue-500 text-blue-500'
                            }`}
                        >
                            <div className="flex items-center gap-3">
                                <span className="ml-2 text-sm">{notification}</span>
                            </div>
                        </div>
                    )}

                    {/* Send code / verify code */}
                    <div className="mt-6 mb-2">
                        {!codeSent ? (
                            <button
                                onClick={handleSendEmailCode}
                                disabled={!isBookingInfoValid}
                                className={`w-full py-3 rounded-lg text-lg font-semibold 
                                    ${
                                    !isBookingInfoValid
                                        ? 'bg-gray-200 text-gray-500 border border-gray-300 shadow-inner cursor-not-allowed'
                                        : 'bg-[#4e9f66] hover:bg-[#3e8455] text-white'
                                }`}
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
                                    className="w-full mt-3 bg-[#4e9f66] hover:bg-[#3e8455] text-white py-2 rounded font-semibold"
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
