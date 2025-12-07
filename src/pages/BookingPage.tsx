import React, { useEffect, useState } from 'react';
import 'react-datepicker/dist/react-datepicker.css';
import 'react-calendar/dist/Calendar.css';
import TimeSlotSelection from '@/components/TimeSlotSelection';
import { useTranslation } from 'react-i18next';
import { de, enUS } from 'date-fns/locale';
import DatePicker from 'react-datepicker';
import EmployeeSelector from '@/pages/EmployeeSelector.tsx';
import EmployeeService from "@/services/EmployeeService.ts";

interface Employee {
    id: string;
    name: string;
}

// --- helpers ---
const isValidGermanPhone = (v: string) => {
    // Nettoyer et retirer un éventuel zéro de tête
    const digits = v.replace(/\D/g, "").replace(/^0/, "");
    // Les mobiles allemands : commencent par 1 et font entre 7 et 11 chiffres
    return /^1[5-7,6,9][0-9]{6,9}$/.test(digits);
};// 10 digits, no leading 0

async function isSlotStillFree(apiBase: string, employeeId: string, slotISO: string) {
    const dayStr = new Date(slotISO).toISOString().slice(0, 10);
    const res = await fetch(`${apiBase}/reservations/availability?date=${dayStr}&employeeId=${employeeId}`);
    if (!res.ok) return false;
    const takenISO: string[] = await res.json();
    return !takenISO.includes(new Date(slotISO).toISOString());
}

const BookingPage: React.FC = () => {
    const { t, i18n } = useTranslation();
    const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
    const [selectedDateTime, setSelectedDateTime] = useState<string | null>(null);
    const [selectedEmployee, setSelectedEmployee] = useState<string | null>(null);
    const [resetTrigger, setResetTrigger] = useState(0);
    const [employees, setEmployees] = useState<Employee[]>([]);

    const [customerName, setCustomerName] = useState('');
    const [phone, setPhone] = useState(''); // national, 10 digits, no leading 0

    const [codeSent, setCodeSent] = useState(false);
    const [smsCode, setSmsCode] = useState('');
    const [busy, setBusy] = useState(false);

    const [notification, setNotification] = useState<string | null>(null);
    const [notificationType, setNotificationType] = useState<'success' | 'error' | 'info' | null>(null);

    const API_BASE = import.meta.env.VITE_API_URL;
    const getLocale = () => (i18n.language?.startsWith('de') ? de : enUS);

    useEffect(() => {
        const fetchEmployees = async () => {
            try {
                const data = await EmployeeService.getAll();
                setEmployees(data);
            } catch {
                setNotification(t('failedLoadEmployees'));
                setNotificationType('error');
            }
        };

        fetchEmployees();
    }, [t]);


    const clearNotice = () => {
        setNotification(null);
        setNotificationType(null);
    };

    const handleSendSmsCode = async () => {
        clearNotice();

        if (!selectedDateTime || !selectedEmployee || !customerName.trim()) {
            setNotification(t('bookingInfoMissing') || 'Please complete the booking info first.');
            setNotificationType('error');
            return;
        }

        if (!isValidGermanPhone(phone)) {
            setNotification(t('invalidPhone') || 'Bitte gib eine gültige deutsche Nummer ein.');
            setNotificationType('error');
            return;
        }

        try {
            setBusy(true);

            // 1) check slot availability first
            const free = await isSlotStillFree(API_BASE, selectedEmployee, selectedDateTime);
            if (!free) {
                setNotification(t('booking.slotTaken') || 'This time slot has just been taken. Please pick another.');
                setNotificationType('error');
                setSelectedDateTime(null);
                setResetTrigger((p) => p + 1);
                return;
            }

            // 2) send SMS
            const national = phone.replace(/[^\d]/g, '');
            const fullPhone = `+49${national}`;
            const res = await fetch(`${API_BASE}/verify-phone/start`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    phone: fullPhone,
                    lang: i18n.language?.startsWith('de') ? 'de' : 'en',
                }),
            });
            const j = await res.json().catch(() => ({}));

            if (!res.ok || j?.success !== true) {
                throw new Error(j?.error || 'Failed to send SMS');
            }

            setCodeSent(true);
            setNotification(t('verificationCodeSent') || 'Verification code sent via SMS.');
            setNotificationType('success');
        } catch {
            setNotification(t('booking.errors.sendCodeFailed') || 'Failed to send SMS code.');
            setNotificationType('error');
        } finally {
            setBusy(false);
        }
    };

    const handleVerifyCodeAndBook = async () => {
        clearNotice();

        if (!smsCode.trim()) {
            setNotification(t('enterCode') || 'Please enter the code.');
            setNotificationType('error');
            return;
        }
        if (!selectedDateTime || !selectedEmployee) {
            setNotification(t('bookingInfoMissing') || 'Booking info missing.');
            setNotificationType('error');
            return;
        }

        try {
            setBusy(true);

            // normalize phone to E.164 (+49…)
            const national = phone.replace(/[^\d]/g, '');
            const fullPhone = `+49${national}`;

            // 1) confirm SMS code (⚠️ correct endpoint = /verify-phone/check)
            const verifyRes = await fetch(`${API_BASE}/verify-phone/check`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    phone: fullPhone,
                    code: smsCode.trim(),
                    lang: i18n.language?.startsWith('de') ? 'de' : 'en',
                }),
            });

            const verifyJson = await verifyRes.json();
            console.log("verify-phone/check response:", verifyJson);

            if (!verifyRes.ok || verifyJson?.success !== true) {
                throw new Error('Invalid verification code');
            }

            // 2) recheck slot before final booking
            const free = await isSlotStillFree(API_BASE, selectedEmployee, selectedDateTime);
            if (!free) {
                setNotification(t('booking.slotTaken') || 'This time slot has just been taken. Please pick another.');
                setNotificationType('error');
                setSelectedDateTime(null);
                setResetTrigger((p) => p + 1);
                return;
            }

            // 3) create reservation
            const bookingRes = await fetch(`${API_BASE}/reservations`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    customerName,
                    phone: fullPhone,
                    service: 'Haircut', // 🔧 replace with real serviceId like in mobile
                    date: selectedDateTime,
                    employeeId: selectedEmployee,
                    verificationMethod: 'sms',
                }),
            });

            if (!bookingRes.ok) {
                const errText = await bookingRes.text();
                console.error("Booking failed:", bookingRes.status, errText);
                throw new Error('Failed to book');
            }

            setNotification(t('bookingConfirmed') || 'Your booking is confirmed!');
            setNotificationType('success');

            // reset form
            setCustomerName('');
            setPhone('');
            setSmsCode('');
            setCodeSent(false);
            setSelectedDateTime(null);
            setSelectedEmployee(null);
            setSelectedDate(new Date());
            setResetTrigger((p) => p + 1);
        } catch (err) {
            console.error("handleVerifyCodeAndBook error:", err);
            setNotification(t('bookingError') || 'Booking failed. Please try again.');
            setNotificationType('error');
        } finally {
            setBusy(false);
        }
    };


    const isBookingInfoValid =
        !!selectedDateTime &&
        !!selectedEmployee &&
        !!customerName.trim() &&
        isValidGermanPhone(phone);

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
                        filterDate={(d: Date) => d.getDay() !== 0}
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
                            />
                        </div>
                    </div>

                    {/* Time Slots */}
                    {selectedEmployee && (
                        <>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                {t('pickTime')}
                            </label>
                            <TimeSlotSelection
                                selectedDate={selectedDate || new Date()}
                                selectedEmployeeId={selectedEmployee}
                                onSlotSelected={setSelectedDateTime}
                                resetTrigger={resetTrigger}
                            />
                        </>
                    )}

                    {/* Customer Info */}
                    <div className="mt-6 mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
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
                                onClick={handleSendSmsCode}
                                disabled={!isBookingInfoValid || busy}
                                className={`w-full py-3 rounded-lg text-lg font-semibold ${
                                    !isBookingInfoValid || busy
                                        ? 'bg-gray-200 text-gray-500 border border-gray-300 shadow-inner cursor-not-allowed'
                                        : 'bg-[#4e9f66] hover:bg-[#3e8455] text-white'
                                }`}
                            >
                                {busy ? t('booking.sending') || 'Sending...' : t('sendVerificationCode') || 'Send SMS Code'}
                            </button>
                        ) : (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mt-2">{t('enterCode')}</label>
                                <input
                                    type="text"
                                    value={smsCode}
                                    onChange={(e) => setSmsCode(e.target.value)}
                                    placeholder={t('codePlaceholder')}
                                    className="w-full border rounded px-3 py-2 shadow-sm mt-1"
                                />
                                <button
                                    onClick={handleVerifyCodeAndBook}
                                    disabled={busy || !smsCode.trim()}
                                    className="w-full mt-3 bg-[#4e9f66] hover:bg-[#3e8455] text-white py-2 rounded font-semibold disabled:opacity-50"
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
