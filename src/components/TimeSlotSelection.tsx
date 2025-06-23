import React, { useState } from 'react';

interface Slot {
    id: string;
    time: string;
    isAvailable: boolean;
}

const TimeSlotSelection: React.FC = () => {
    const slotsData: Slot[] = [
        { id: 'slot-1', time: '07:00 AM', isAvailable: true },
        { id: 'slot-2', time: '07:30 AM', isAvailable: true },
        { id: 'slot-3', time: '08:00 AM', isAvailable: true },
        { id: 'slot-4', time: '08:30 AM', isAvailable: true },
        { id: 'slot-5', time: '09:00 AM', isAvailable: true },
        { id: 'slot-6', time: '09:30 AM', isAvailable: true },
        { id: 'slot-7', time: '10:00 AM', isAvailable: false },
        { id: 'slot-9', time: '11:00 AM', isAvailable: true },
        { id: 'slot-11', time: '12:00 PM', isAvailable: true },
        { id: 'slot-13', time: '01:00 PM', isAvailable: true },
        { id: 'slot-15', time: '02:00 PM', isAvailable: true },
        { id: 'slot-17', time: '03:00 PM', isAvailable: true },
        { id: 'slot-19', time: '04:00 PM', isAvailable: true },
        { id: 'slot-20', time: '04:30 PM', isAvailable: true },
        { id: 'slot-21', time: '05:00 PM', isAvailable: true },
        { id: 'slot-22', time: '05:30 PM', isAvailable: true },
        { id: 'slot-23', time: '06:00 PM', isAvailable: true },
        { id: 'slot-25', time: '07:00 PM', isAvailable: true },
        { id: 'slot-27', time: '08:00 PM', isAvailable: true },
    ];

    const [slots, setSlots] = useState<Slot[]>(slotsData);
    const [selectedSlot, setSelectedSlot] = useState<string | null>(null);

    const handleSelectSlot = (slotId: string) => {
        const updatedSlots = slots.map((slot) =>
            slot.id === slotId ? slot : slot
        );
        setSlots(updatedSlots);
        setSelectedSlot(slotId);
    };

    const selectedIndex = slots.findIndex((slot) => slot.id === selectedSlot);
    const fromTime = selectedIndex !== -1 ? slots[selectedIndex]?.time : null;
    const toTime = slots[selectedIndex + 1]?.time || 'N/A';

    return (
        <div className="w-full">
            <div className="overflow-x-auto py-6 px-2 border rounded">
                <div className="flex justify-center gap-2">
                    {slots.map((slot) => (
                        <div key={slot.id} className="text-center relative">
                            <button
                                onClick={() => handleSelectSlot(slot.id)}
                                disabled={!slot.isAvailable}
                                className={`w-6 h-6 text-xs font-semibold transition-all duration-200 ${
                                    selectedSlot === slot.id
                                        ? 'bg-green-700 text-white'
                                        : slot.isAvailable
                                            ? 'bg-green-400 hover:bg-green-500 text-white'
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


            {selectedSlot && (
                <div className="mt-6 flex justify-center">
                    <div className="bg-gray-800 text-white px-6 py-4 rounded-md shadow-lg text-sm">
                        <p className="mb-1">interval: 30 min</p>
                        <p>
                            From: <span className="font-bold">{fromTime}</span>
                        </p>
                        <p>
                            To: <span className="font-bold">{toTime}</span>
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TimeSlotSelection;
