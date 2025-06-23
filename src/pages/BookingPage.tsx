import React from 'react';
import TimeSlotSelection from '@/components/TimeSlotSelection';

const BookingPage: React.FC = () => {
    return (
        <div className="flex items-center justify-center h-screen">
            <div className="w-full max-w-4xl bg-white ">
                <h1 className="text-4xl font-semibold text-center text-gray-800 mb-8">Book Your Appointment</h1>

                {/* Time Slot Selection Component */}
                <TimeSlotSelection/>

                {/* Confirm Booking Button */}
                <div className="mt-8">
                    <button
                        onClick={() => alert('Booking Confirmed!')}
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
