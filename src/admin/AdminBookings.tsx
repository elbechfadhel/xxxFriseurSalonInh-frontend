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

    useEffect(() => {
        const fetchReservations = async () => {
            try {
                const res = await fetch('http://localhost:4000/api/reservations');
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

    return (
        <div className="p-6 max-w-6xl mx-auto">
            <h1 className="text-3xl font-bold mb-6">All Bookings</h1>

            {loading ? (
                <p className="text-gray-500">Loading bookings...</p>
            ) : error ? (
                <p className="text-red-500">{error}</p>
            ) : reservations.length === 0 ? (
                <p className="text-gray-600">No reservations found.</p>
            ) : (
                <div className="overflow-x-auto">
                    <table className="min-w-full bg-white shadow rounded border">
                        <thead>
                        <tr className="bg-gray-100 text-left text-sm font-medium text-gray-700">
                            <th className="px-4 py-2">Name</th>
                            <th className="px-4 py-2">Email</th>
                            <th className="px-4 py-2">Phone</th>
                            <th className="px-4 py-2">Service</th>
                            <th className="px-4 py-2">Date</th>
                            <th className="px-4 py-2">Barber</th>
                        </tr>
                        </thead>
                        <tbody>
                        {reservations.map((res) => (
                            <tr key={res.id} className="border-t text-sm text-gray-800">
                                <td className="px-4 py-2">{res.customerName}</td>
                                <td className="px-4 py-2">{res.email}</td>
                                <td className="px-4 py-2">{res.phone || '-'}</td>
                                <td className="px-4 py-2">{res.service}</td>
                                <td className="px-4 py-2">{formatDate(res.date)}</td>
                                <td className="px-4 py-2">{res.employee?.name || '—'}</td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default AdminBookings;
