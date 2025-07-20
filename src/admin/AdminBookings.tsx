import React, { useEffect, useState } from 'react';

interface Reservation {
    id: string;
    customerName: string;
    email: string;
    phone?: string;
    service: string;
    date: string;
    employee: { name: string };
}

const AdminBookings: React.FC = () => {
    const [reservations, setReservations] = useState<Reservation[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [view, setView] = useState<'today' | 'future'>('today');
    const API_BASE = import.meta.env.VITE_API_URL;
    useEffect(() => {
        const fetchReservations = async () => {
            try {
                const res = await fetch(`${API_BASE}/reservations`);
                if (!res.ok) throw new Error('Failed to fetch reservations');
                const data = await res.json();
                setReservations(data);
            } catch (err) {
                setError('Could not load reservations.');
            } finally {
                setLoading(false);
            }
        };

        fetchReservations();
    }, []);

    const formatDate = (dateStr: string) =>
        new Intl.DateTimeFormat('de-DE', {
            dateStyle: 'medium',
            timeStyle: 'short',
        }).format(new Date(dateStr));

    const isToday = (dateStr: string) => {
        const today = new Date();
        const date = new Date(dateStr);
        return today.toDateString() === date.toDateString();
    };

    const todayBookings = reservations.filter((res) => isToday(res.date));
    const futureBookings = reservations.filter((res) => !isToday(res.date));

    const groupedByEmployee = futureBookings.reduce((groups: Record<string, Reservation[]>, res) => {
        const empName = res.employee?.name || 'Unassigned';
        if (!groups[empName]) groups[empName] = [];
        groups[empName].push(res);
        return groups;
    }, {});

    return (
        <div className="p-6 max-w-6xl mx-auto">
            <h1 className="text-3xl font-bold mb-6">All Bookings</h1>

            {/* 🔁 Toggle Buttons */}
            <div className="flex gap-4 mb-8">
                <button
                    className={`px-4 py-2 rounded font-semibold transition ${
                        view === 'today'
                            ? 'bg-orange-500 text-white'
                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                    onClick={() => setView('today')}
                >
                    Today's Bookings
                </button>
                <button
                    className={`px-4 py-2 rounded font-semibold transition ${
                        view === 'future'
                            ? 'bg-orange-500 text-white'
                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                    onClick={() => setView('future')}
                >
                    Future Bookings
                </button>
            </div>

            {loading ? (
                <p className="text-gray-500">Loading bookings...</p>
            ) : error ? (
                <p className="text-red-500">{error}</p>
            ) : reservations.length === 0 ? (
                <p className="text-gray-600">No reservations found.</p>
            ) : view === 'today' ? (
                // 🔶 TODAY'S BOOKINGS VIEW
                todayBookings.length === 0 ? (
                    <p className="text-gray-600">No bookings for today.</p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full bg-white shadow rounded border">
                            <thead>
                            <tr className="bg-gray-100 text-left text-sm font-medium text-gray-700">
                                <th className="px-4 py-2">Name</th>
                                <th className="px-4 py-2">Email</th>
                                <th className="px-4 py-2">Phone</th>
                                <th className="px-4 py-2">Service</th>
                                <th className="px-4 py-2">Time</th>
                                <th className="px-4 py-2">Barber</th>
                            </tr>
                            </thead>
                            <tbody>
                            {todayBookings
                                .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                                .map((res) => (
                                    <tr key={res.id} className="border-t text-sm text-gray-800">
                                        <td className="px-4 py-2">{res.customerName}</td>
                                        <td className="px-4 py-2">{res.email}</td>
                                        <td className="px-4 py-2">{res.phone || '-'}</td>
                                        <td className="px-4 py-2">{res.service}</td>
                                        <td className="px-4 py-2">
                                            {new Date(res.date).toLocaleTimeString([], {
                                                hour: '2-digit',
                                                minute: '2-digit',
                                            })}
                                        </td>
                                        <td className="px-4 py-2">{res.employee?.name || '—'}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )
            ) : (
                // 🔷 FUTURE BOOKINGS VIEW
                Object.entries(groupedByEmployee).map(([employeeName, bookings]) => (
                    <div key={employeeName} className="mb-10">
                        <h2 className="text-xl font-semibold text-orange-600 mb-4 border-b pb-1">
                            {employeeName}
                        </h2>
                        <div className="overflow-x-auto">
                            <table className="min-w-full bg-white shadow rounded border">
                                <thead>
                                <tr className="bg-gray-100 text-left text-sm font-medium text-gray-700">
                                    <th className="px-4 py-2">Name</th>
                                    <th className="px-4 py-2">Email</th>
                                    <th className="px-4 py-2">Phone</th>
                                    <th className="px-4 py-2">Service</th>
                                    <th className="px-4 py-2">Date</th>
                                </tr>
                                </thead>
                                <tbody>
                                {bookings
                                    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                                    .map((res) => (
                                        <tr key={res.id} className="border-t text-sm text-gray-800">
                                            <td className="px-4 py-2">{res.customerName}</td>
                                            <td className="px-4 py-2">{res.email}</td>
                                            <td className="px-4 py-2">{res.phone || '-'}</td>
                                            <td className="px-4 py-2">{res.service}</td>
                                            <td className="px-4 py-2">{formatDate(res.date)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                ))
            )}
        </div>
    );
};

export default AdminBookings;
