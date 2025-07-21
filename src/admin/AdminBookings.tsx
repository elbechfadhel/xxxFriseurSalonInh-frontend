import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

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
    const { t } = useTranslation();
    const [reservations, setReservations] = useState<Reservation[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [view, setView] = useState<'today' | 'future' | 'history'>('today'); // Added 'history' view
    const API_BASE = import.meta.env.VITE_API_URL;

    useEffect(() => {
        const fetchReservations = async () => {
            try {
                const token = localStorage.getItem('admin_token');

                const res = await fetch(`${API_BASE}/reservations`, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                    },
                });

                if (!res.ok) throw new Error(t('adminBookings.errorLoading'));
                const data = await res.json();
                setReservations(data);
            } catch (err) {
                setError(t('adminBookings.errorLoading'));
            } finally {
                setLoading(false);
            }
        };

        fetchReservations();
    }, [t]);

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

    const isFuture = (dateStr: string) => {
        const now = new Date();
        const date = new Date(dateStr);
        return date > now; // Future bookings are those that are after the current time/date
    };

    const isPast = (dateStr: string) => {
        const now = new Date();
        const date = new Date(dateStr);
        return date < now; // Past bookings are those that are before the current time/date
    };

    const todayBookings = reservations.filter((res) => isToday(res.date));
    const futureBookings = reservations.filter((res) => isFuture(res.date)); // Filter future bookings
    const pastBookings = reservations.filter((res) => isPast(res.date)); // Filter past bookings

    const todayGroupedByEmployee = todayBookings.reduce((groups: Record<string, Reservation[]>, res) => {
        const empName = res.employee?.name || 'Unassigned';
        if (!groups[empName]) groups[empName] = [];
        groups[empName].push(res);
        return groups;
    }, {});

    const groupedByEmployee = futureBookings.reduce((groups: Record<string, Reservation[]>, res) => {
        const empName = res.employee?.name || 'Unassigned';
        if (!groups[empName]) groups[empName] = [];
        groups[empName].push(res);
        return groups;
    }, {});

    const pastGroupedByEmployee = pastBookings.reduce((groups: Record<string, Reservation[]>, res) => {
        const empName = res.employee?.name || 'Unassigned';
        if (!groups[empName]) groups[empName] = [];
        groups[empName].push(res);
        return groups;
    }, {});

    return (
        <div className="p-6 max-w-6xl mx-auto">
            <h1 className="text-3xl font-bold mb-6">{t('adminBookings.title')}</h1>

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
                    {t('adminBookings.todayBookings')}
                </button>
                <button
                    className={`px-4 py-2 rounded font-semibold transition ${
                        view === 'future'
                            ? 'bg-orange-500 text-white'
                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                    onClick={() => setView('future')}
                >
                    {t('adminBookings.futureBookings')}
                </button>
                <button
                    className={`px-4 py-2 rounded font-semibold transition ${
                        view === 'history'
                            ? 'bg-orange-500 text-white'
                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                    onClick={() => setView('history')}
                >
                    {t('adminBookings.historyBookings')}
                </button>
            </div>

            {loading ? (
                <p className="text-gray-500">{t('adminBookings.loading')}</p>
            ) : error ? (
                <p className="text-red-500">{error}</p>
            ) : reservations.length === 0 ? (
                <p className="text-gray-600">{t('adminBookings.noBookingsFound')}</p>
            ) : view === 'today' ? (
                // 🔶 TODAY'S BOOKINGS VIEW
                todayBookings.length === 0 ? (
                    <p className="text-gray-600">{t('adminBookings.noBookingsForToday')}</p>
                ) : (
                    Object.entries(todayGroupedByEmployee).map(([employeeName, bookings]) => (
                        <div key={employeeName} className="mb-10">
                            <h1 className="text-2xl font-bold mb-6 flex items-center gap-3">
                                <div
                                    className="w-8 h-8 rounded-full bg-orange-500 flex items-center justify-center text-white font-semibold text-sm">
                                    {employeeName.charAt(0).toUpperCase()}
                                </div>
                                {employeeName}
                            </h1>

                            <div className="overflow-x-auto">
                                <table className="min-w-full bg-white shadow rounded border">
                                    <thead className="bg-gray-100 text-left text-sm font-medium text-gray-700">
                                    <tr>
                                        <th className="px-4 py-2">{t('adminBookings.name')}</th>
                                        <th className="px-4 py-2">{t('adminBookings.email')}</th>
                                        <th className="px-4 py-2">{t('adminBookings.phone')}</th>
                                        <th className="px-4 py-2">{t('adminBookings.service')}</th>
                                        <th className="px-4 py-2">{t('adminBookings.time')}</th>
                                    </tr>
                                    </thead>
                                    <tbody>
                                    {bookings
                                        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                                        .map((res) => (
                                            <tr key={res.id} className="border-t text-sm text-gray-800">
                                                <td className="px-4 py-2">{res.customerName}</td>
                                                <td className="px-4 py-2">
                                                    <a href={`mailto:${res.email}`} className="text-blue-600 hover:underline">
                                                        {res.email}
                                                    </a>
                                                </td>
                                                <td className="px-4 py-2">
                                                    {res.phone ? (
                                                        <a href={`tel:${res.phone}`} className="text-blue-600 hover:underline">
                                                            {res.phone}
                                                        </a>
                                                    ) : (
                                                        '-'
                                                    )}
                                                </td>
                                                <td className="px-4 py-2">{res.service}</td>
                                                <td className="px-4 py-2">
                                                        <span className="inline-block font-normal px-2 py-1 rounded text-sm">
                                                            {new Date(res.date).toLocaleTimeString([], {
                                                                hour: '2-digit',
                                                                minute: '2-digit',
                                                            })}
                                                        </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    ))
                )
            ) : view === 'future' ? (
                // 🔷 FUTURE BOOKINGS VIEW
                Object.entries(groupedByEmployee).map(([employeeName, bookings]) => (
                    <div key={employeeName} className="mb-10">
                        <h1 className="text-2xl font-bold mb-6 flex items-center gap-3">
                            <div
                                className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center text-black font-semibold text-sm">
                                {employeeName.charAt(0).toUpperCase()}
                            </div>
                            {employeeName}
                        </h1>
                        <div className="overflow-x-auto">
                            <table className="min-w-full bg-white shadow rounded border">
                                <thead>
                                <tr className="bg-gray-100 text-left text-sm font-medium text-gray-700">
                                    <th className="px-4 py-2">{t('adminBookings.name')}</th>
                                    <th className="px-4 py-2">{t('adminBookings.email')}</th>
                                    <th className="px-4 py-2">{t('adminBookings.phone')}</th>
                                    <th className="px-4 py-2">{t('adminBookings.service')}</th>
                                    <th className="px-4 py-2">{t('adminBookings.date')}</th>
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
            ) : (
                // 🔶 HISTORY BOOKINGS VIEW
                Object.entries(pastGroupedByEmployee).map(([employeeName, bookings]) => (
                    <div key={employeeName} className="mb-10">
                        <h1 className="text-2xl font-bold mb-6 flex items-center gap-3">
                            <div
                                className="w-8 h-8 rounded-full bg-gray-400 flex items-center justify-center text-black font-semibold text-sm">
                                {employeeName.charAt(0).toUpperCase()}
                            </div>
                            {employeeName}
                        </h1>
                        <div className="overflow-x-auto">
                            <table className="min-w-full bg-white shadow rounded border">
                                <thead>
                                <tr className="bg-gray-100 text-left text-sm font-medium text-gray-700">
                                    <th className="px-4 py-2">{t('adminBookings.name')}</th>
                                    <th className="px-4 py-2">{t('adminBookings.email')}</th>
                                    <th className="px-4 py-2">{t('adminBookings.phone')}</th>
                                    <th className="px-4 py-2">{t('adminBookings.service')}</th>
                                    <th className="px-4 py-2">{t('adminBookings.date')}</th>
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
