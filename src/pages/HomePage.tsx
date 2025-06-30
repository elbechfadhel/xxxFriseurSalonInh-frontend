import React, { useEffect, useState } from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import TimeSlotSelection from '@/components/TimeSlotSelection';
import toast from 'react-hot-toast';

interface Employee {
    id: string;
    name: string;
}

const HomePage: React.FC = () => {
    const [selectedDate, setSelectedDate] = useState<Date>(new Date());
    const [selectedDateTime, setSelectedDateTime] = useState<string | null>(null);
    const [selectedEmployee, setSelectedEmployee] = useState<string | null>(null);
    const [resetTrigger, setResetTrigger] = useState(0);
    const [employees, setEmployees] = useState<Employee[]>([]);

    useEffect(() => {
        const fetchEmployees = async () => {
            try {
                const res = await fetch("http://localhost:4000/api/employees");
                const data = await res.json();
                setEmployees(data);
            } catch (err) {
                toast.error("Failed to load employees");
            }
        };
        fetchEmployees();
    }, []);

    const handleConfirmBooking = async () => {
        if (!selectedDateTime || !selectedEmployee) {
            toast.error("Please select a time slot and a barber before confirming.");
            return;
        }

        try {
            const response = await fetch("http://localhost:4000/api/reservations", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    customerName: "Ali",
                    phone: "0123456789",
                    service: "Haircut",
                    date: selectedDateTime,
                    employeeId: selectedEmployee,
                }),
            });

            if (!response.ok) throw new Error("Failed to book");

            await response.json();
            toast.success("Booking confirmed!");
            setResetTrigger(prev => prev + 1);
            setSelectedDateTime(null);
        } catch (err) {
            toast.error("Booking failed. Please try again.");
        }
    };

    return (
        <div className="min-h-screen px-4 py-10">
            <div className="text-center mb-12">
                <h1 className="text-4xl font-extrabold text-gray-800 mb-4">
                    Welcome to <span className="text-green-600">Our Barber Shop</span>
                </h1>
                <p className="text-lg text-gray-600">Book your next haircut appointment with us — it’s fast and easy!</p>
            </div>

            <div className="max-w-5xl mx-auto bg-white grid grid-cols-1 md:grid-cols-3 gap-6 rounded-xl shadow-lg p-6">
                <div className="col-span-1">
                    <h2 className="text-lg font-semibold text-gray-700 mb-2 text-center">Pick a date</h2>
                    <Calendar
                        onChange={(date) => setSelectedDate(date as Date)}
                        value={selectedDate}
                        minDate={new Date()}
                        className="rounded-lg border shadow-md p-2"
                    />
                </div>

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

                    <div className="mt-6">
                        <button
                            onClick={handleConfirmBooking}
                            disabled={!selectedDateTime || !selectedEmployee}
                            className={`w-full py-3 rounded-lg text-lg font-semibold 
                             ${!selectedDateTime || !selectedEmployee
                                ? 'bg-gray-200 text-gray-500 border border-gray-300 shadow-inner cursor-not-allowed'
                                : 'bg-blue-600 hover:bg-blue-700 text-white'}
  `}
                        >
                            Confirm Booking
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default HomePage;
