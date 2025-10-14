import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

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
    const { t } = useTranslation();
    const [slots, setSlots] = useState<Slot[]>([]);
    const [selectedSlotId, setSelectedSlotId] = useState<string | null>(null);
    const API_BASE = import.meta.env.VITE_API_URL;

    const generateTimeSlots = (): string[] => {
        const times: string[] = [];
        const start = new Date();
        start.setHours(9, 30, 0, 0); // 👈 Début à 09:30
        const end = new Date();
        end.setHours(19, 0, 0, 0);   // 👈 Dernier créneau à 19:00

        while (start <= end) {
            times.push(
                start.toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                    hour12: false, // format 24h
                })
            );
            start.setMinutes(start.getMinutes() + 30);
        }

        return times;
    };

    const isPastTime = (time: string): boolean => {
        const now = new Date();
        const [hourStr, minuteStr] = time.split(':');
        const hour = parseInt(hourStr, 10);
        const minute = parseInt(minuteStr, 10);

        const slotTime = new Date(selectedDate);
        slotTime.setHours(hour, minute, 0, 0);

        return selectedDate.toDateString() === now.toDateString() && slotTime < now;
    };

    useEffect(() => {
        const fetchReservations = async () => {
            try {
                const res = await fetch(`${API_BASE}/reservations`);
                const reservations = await res.json();

                const bookedTimes = reservations
                    .filter(
                        (r: any) =>
                            new Date(r.date).toDateString() === selectedDate.toDateString() &&
                            (!selectedEmployeeId || r.employeeId === selectedEmployeeId)
                    )
                    .map((r: any) =>
                        new Date(r.date).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                            hour12: false, // 24-hour format
                        })
                    );

                const allSlots: Slot[] = generateTimeSlots().map((time, index) => ({
                    id: `slot-${index}`,
                    time,
                    isAvailable: !bookedTimes.includes(time) && !isPastTime(time),
                }));

                setSlots(allSlots);
            } catch (err) {
                console.error('Failed to load reservations', err);
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
    let toTime = 'N/A';

    if (selectedSlotTime) {
        const [hourStr, minuteStr] = selectedSlotTime.split(':');
        const slotDate = new Date();
        slotDate.setHours(parseInt(hourStr, 10), parseInt(minuteStr, 10), 0, 0);
        slotDate.setMinutes(slotDate.getMinutes() + 30);
        toTime = slotDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
    }

    const selectedDateTimeISO = useMemo(() => {
        if (!selectedSlotTime) return null;
        const [hourStr, minuteStr] = selectedSlotTime.split(':');
        const hour = parseInt(hourStr, 10);
        const minute = parseInt(minuteStr, 10);

        const combined = new Date(selectedDate);
        combined.setHours(hour, minute, 0, 0);

        return combined.toISOString();
    }, [selectedSlotTime, selectedDate]);

    useEffect(() => {
        onSlotSelected(selectedDateTimeISO);
    }, [selectedDateTimeISO, onSlotSelected]);

    const renderSlotButton = (slot: Slot) => (
        <div key={slot.id} className="text-center relative flex-shrink-0">
            <button
                onClick={() => slot.isAvailable && setSelectedSlotId(slot.id)}
                disabled={!slot.isAvailable}
                aria-disabled={!slot.isAvailable}
                title={!slot.isAvailable ? t("notAvailable") : ""}
                className={`w-8 h-8 text-xs font-semibold flex items-center justify-center rounded transition-all duration-200
        ${
                    selectedSlotId === slot.id
                        ? "bg-[#4e9f66] text-white"
                        : slot.isAvailable
                            ? "bg-[#8bc99e] hover:bg-[#4e9f66] text-white"
                            : "bg-[#b91c1c] text-white cursor-not-allowed"
                }`}
            >
                {/* Pas d'icône/texte pour rester cohérent avec le mobile */}
            </button>
            <div
                className={`text-[10px] mt-1 whitespace-nowrap
        ${slot.isAvailable ? "text-gray-600" : "text-gray-400 line-through"}`}
            >
                {slot.time}
            </div>
        </div>
    );



    return (
        <div className="w-full">
            <div className="py-6 px-2 border rounded">
                <div className="w-full overflow-x-auto">
                    <div className="flex flex-nowrap justify-center gap-2">
                        {slots.map(renderSlotButton)}
                    </div>
                </div>
            </div>

            {selectedSlotId && (
                <div className="mt-6 flex justify-center">
                    <div className="bg-[#5A5C60] text-white px-4 py-2 rounded-md shadow text-sm text-center">
                        <span>
                            <strong>30 min</strong> | {t('from')}: <strong>{fromTime}</strong> | {t('to')}:{' '}
                            <strong>{toTime}</strong> |{' '}
                            {selectedDateTimeISO
                                ? new Date(selectedDateTimeISO).toLocaleString('de-DE', {
                                    weekday: 'short',
                                    year: 'numeric',
                                    month: 'short',
                                    day: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit',
                                })
                                : t('noTimeSelected')}
                        </span>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TimeSlotSelection;
