import React, { useEffect, useMemo, useState } from 'react';

interface Slot {
    id: string;
    time: string;
    isAvailable: boolean;
}

interface TimeSlotSelectionProps {
    selectedDate: Date;
    selectedEmployeeId: string | null;
    onSlotSelected: (dateTimeISO: string | null) => void;
    resetTrigger: number;
}

const TimeSlotSelection: React.FC<TimeSlotSelectionProps> = ({
                                                                 selectedDate,
                                                                 selectedEmployeeId,
                                                                 onSlotSelected,
                                                                 resetTrigger,
                                                             }) => {
    const [slots, setSlots] = useState<Slot[]>([]);
    const [selectedSlotId, setSelectedSlotId] = useState<string | null>(null);
    const API_BASE = import.meta.env.VITE_API_URL;
    useEffect(() => {
        const fetchReservations = async () => {
            try {
                const res = await fetch(`${API_BASE}/reservations`);
                const reservations = await res.json();

                const bookedTimes = reservations
                    .filter((r: any) =>
                        new Date(r.date).toDateString() === selectedDate.toDateString() &&
                        (!selectedEmployeeId || r.employeeId === selectedEmployeeId)
                    )
                    .map((r: any) =>
                        new Date(r.date).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                            hour12: true,
                        })
                    );

                const allSlots: Slot[] = [
                    '08:00 AM', '09:00 AM', '10:00 AM', '11:00 AM', '12:00 PM',
                    '01:00 PM', '02:00 PM', '03:00 PM', '04:00 PM', '04:30 PM',
                    '05:00 PM', '05:30 PM', '06:00 PM', '07:00 PM', '08:00 PM',
                ].map((time, index) => ({
                    id: `slot-${index}`,
                    time,
                    isAvailable: !bookedTimes.includes(time),
                }));

                setSlots(allSlots);
            } catch (err) {
                console.error("Failed to load reservations", err);
            }
        };

        if (selectedEmployeeId) {
            fetchReservations();
        }
    }, [selectedDate, selectedEmployeeId, resetTrigger]);

    useEffect(() => {
        setSelectedSlotId(null);
    }, [resetTrigger]);

    const selectedIndex = slots.findIndex((slot) => slot.id === selectedSlotId);
    const selectedSlotTime = selectedIndex !== -1 ? slots[selectedIndex]?.time : null;
    const fromTime = selectedSlotTime;
    const toTime = slots[selectedIndex + 1]?.time || 'N/A';

    const selectedDateTimeISO = useMemo(() => {
        if (!selectedSlotTime) return null;

        const [time, modifier] = selectedSlotTime.split(" ");
        const [hourStr, minuteStr] = time.split(":");
        let hour = parseInt(hourStr);
        const minute = parseInt(minuteStr);

        if (modifier === "PM" && hour < 12) hour += 12;
        if (modifier === "AM" && hour === 12) hour = 0;

        const combined = new Date(selectedDate);
        combined.setHours(hour, minute, 0, 0);

        return combined.toISOString();
    }, [selectedSlotTime, selectedDate]);

    useEffect(() => {
        onSlotSelected(selectedDateTimeISO);
    }, [selectedDateTimeISO, onSlotSelected]);

    return (
        <div className="w-full">
            <div className="overflow-x-auto py-6 px-2 border rounded">
                <div className="flex justify-center gap-2">
                    {slots.map((slot) => (
                        <div key={slot.id} className="text-center relative">
                            <button
                                onClick={() => setSelectedSlotId(slot.id)}
                                disabled={!slot.isAvailable}
                                className={`w-6 h-6 text-xs font-semibold transition-all duration-200 ${
                                    selectedSlotId === slot.id
                                        ? 'bg-orange-600 text-white'
                                        : slot.isAvailable
                                            ? 'bg-orange-400 hover:bg-orange-500 text-white'
                                            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                }`}
                            />
                            <div className="text-xs mt-1 leading-tight text-center">
                                <div className="font-bold">{slot.time.split(':')[0]}</div>
                                <div className="text-[10px] text-gray-500">
                                    {slot.time.includes('AM') ? 'AM' : 'PM'}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {selectedSlotId && (
                <div className="mt-6 flex justify-center">
                    <div className="bg-[#5A5C60] text-white px-4 py-2 rounded-md shadow text-sm text-center">
  <span>
    <strong>30 min</strong> | From: <strong>{fromTime}</strong> | To: <strong>{toTime}</strong> |{' '}
      {selectedDateTimeISO
          ? new Date(selectedDateTimeISO).toLocaleString('en-GB', {
              weekday: 'short',
              year: 'numeric',
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
          })
          : 'No time selected'}
  </span>
                    </div>

                </div>
            )}
        </div>
    );
};

export default TimeSlotSelection;
