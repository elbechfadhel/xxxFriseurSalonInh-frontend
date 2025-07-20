import React, { useEffect, useState } from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import TimeSlotSelection from '@/components/TimeSlotSelection';
import toast from 'react-hot-toast';
import ReCAPTCHA from 'react-google-recaptcha';

interface Employee {
    id: string;
    name: string;
}

const BookingPage: React.FC = () => {
    const [selectedDate, setSelectedDate] = useState<Date>(new Date());
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
    const API_BASE = import.meta.env.VITE_API_URL;
    useEffect(() => {
        const fetchEmployees = async () => {
            try {


                const res = await fetch(`${API_BASE}/employees`);
                const data = await res.json();
                setEmployees(data);
            } catch (err) {
                toast.error("Failed to load employees");
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
            toast.error("Please enter a valid email address.");
            return;
        }

        if (!captchaToken) {
            toast.error("Please complete the CAPTCHA.");
            return;
        }

        try {
            const res = await fetch(`${API_BASE}/verify-email/send-code`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, captchaToken }),
            });

            if (!res.ok) throw new Error('Failed to send verification email');

            toast.success('Verification code sent to your email.');
            setCodeSent(true);
        } catch (err) {
            toast.error('Could not send email. Try again.');
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

            toast.success('Email verified. Booking in progress...');

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

            toast.success("Booking confirmed!");
            setCustomerName('');
            setEmail('');
            setPhone('');
            setEmailCode('');
            setCodeSent(false);
            setCaptchaToken(null);
            setSelectedDateTime(null);
            setResetTrigger(prev => prev + 1);
        } catch (err) {
            toast.error('Verification or booking failed.');
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
                    Welcome to <span className="text-orange-500">Our Barber Shop</span>
                </h1>
                <p className="text-lg text-gray-600">
                    Book your next haircut appointment with us — it’s fast and easy!
                </p>
            </div>

            <div
                className="max-w-5xl mx-auto bg-white grid grid-cols-1 md:grid-cols-3 gap-6 g p-6">

                {/* Calendar */}
                <div className="col-span-1">
                    <h2 className="text-lg font-semibold text-gray-700 mb-2 text-center">Pick a date</h2>
                    <Calendar
                        onChange={(date) => setSelectedDate(date as Date)}
                        value={selectedDate}
                        minDate={new Date()}
                        className="rounded-lg border shadow-md p-2"
                    />
                </div>

                {/* Right Panel */}
                <div className="col-span-2">
                    <h2 className="text-lg font-semibold text-gray-700 mb-4 text-center">Pick a time slot</h2>

                    <div className="mb-6">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Choose a Barber</label>
                        <select
                            value={selectedEmployee ?? ''}
                            onChange={(e) => {
                                setSelectedEmployee(e.target.value);
                                setResetTrigger(prev => prev + 1);
                            }}
                            className="w-full border rounded px-3 py-2"
                        >
                            <option value="" disabled>Select a barber</option>
                            {employees.map(emp => (
                                <option key={emp.id} value={emp.id}>{emp.name}</option>
                            ))}
                        </select>
                    </div>

                    <TimeSlotSelection
                        selectedDate={selectedDate}
                        selectedEmployeeId={selectedEmployee}
                        onSlotSelected={setSelectedDateTime}
                        resetTrigger={resetTrigger}
                    />

                    {/* Customer Info */}
                    <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                            <input
                                type="text"
                                value={customerName}
                                onChange={(e) => setCustomerName(e.target.value)}
                                placeholder="Your full name"
                                className={`w-full border rounded px-3 py-2 shadow-sm ${!customerName.trim() ? 'border-red-500' : ''}`}
                            />
                            {!customerName.trim() && (
                                <p className="text-red-500 text-sm mt-1">Full name is required.</p>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
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
                                    placeholder="e.g. 1761234567"
                                    className="flex-1 outline-none"
                                />
                            </div>
                            {!isValidGermanPhone(phone) && phone && (
                                <p className="text-sm text-red-500 mt-1">Please enter a valid German phone number.</p>
                            )}
                        </div>

                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="you@example.com"
                                className={`w-full border rounded px-3 py-2 shadow-sm ${!isValidEmail(email) && email ? 'border-red-500' : ''}`}
                            />
                            {!isValidEmail(email) && email && (
                                <p className="text-sm text-red-500 mt-1">Invalid email format.</p>
                            )}
                        </div>
                    </div>

                    {/* CAPTCHA */}
                    <div className="mt-6">
                        <ReCAPTCHA
                            sitekey="6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI" // test site key from Google
                            onChange={(token: any) => setCaptchaToken(token)}
                        />
                    </div>

                    {/* Send code / verify code */}
                    <div className="mt-6 mb-2">
                        {!codeSent ? (
                            <button
                                onClick={handleSendEmailCode}
                                disabled={!isBookingInfoValid || !captchaToken}
                                className={`w-full py-3 rounded-lg text-lg font-semibold 
                                    ${!isBookingInfoValid
                                    ? 'bg-gray-200 text-gray-500 border border-gray-300 shadow-inner cursor-not-allowed'
                                    : 'bg-orange-500 hover:bg-orange-600 text-white'}
                                `}
                            >
                                Send Verification Code
                            </button>
                        ) : (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mt-2">Enter the 6-digit
                                    code</label>
                                <input
                                    type="text"
                                    value={emailCode}
                                    onChange={(e) => setEmailCode(e.target.value)}
                                    placeholder="e.g. 123456"
                                    className="w-full border rounded px-3 py-2 shadow-sm mt-1"
                                />
                                <button
                                    onClick={handleVerifyCodeAndBook}
                                    className="w-full mt-3 bg-orange-500 hover:bg-orange-600 text-white py-2 rounded font-semibold"
                                >
                                    Verify & Confirm Booking
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
