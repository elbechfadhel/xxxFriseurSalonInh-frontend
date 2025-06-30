import React, { useState } from 'react';
import TimeSlotSelection from '@/components/TimeSlotSelection';
import toast from "react-hot-toast";

const BookingPage: React.FC = () => {
    const [selectedDateTime, setSelectedDateTime] = useState<string | null>(null);

    const handleConfirmBooking = async () => {
        if (!selectedDateTime) {
            toast.error("Please select a time slot before confirming.");
            return;
        }

        try {
            const response = await fetch("http://localhost:4000/api/reservations", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    customerName: "Ali",  // Replace with dynamic name input later
                    phone: "0123456789",  // Replace with dynamic phone input
                    service: "Haircut",
                    date: selectedDateTime,
                }),
            });

            if (!response.ok) throw new Error("Failed to book");

            const data = await response.json();
            toast.success("Booking confirmed!");
            console.log("Booked:", data);
        } catch (err) {
            toast.error("Booking failed. Please try again.");

        }
    };

    return (
        <div className="flex items-center justify-center h-screen">
            <div className="w-full max-w-4xl bg-white ">
                <h1 className="text-4xl font-semibold text-center text-gray-800 mb-8">
                    Book Your Appointment
                </h1>

                <TimeSlotSelection onSlotSelected={setSelectedDateTime} />

                {/* Confirm Booking Button */}
                <div className="mt-8">
                    <button
                        onClick={handleConfirmBooking}
                        className="w-full bg-blue-600 text-white py-3 rounded-md text-lg font-semibold hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        Confirm Booking
                    </button>
                </div>
            </div>
        </div>
    );
};

export default BookingPage;
