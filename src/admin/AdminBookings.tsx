import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import EditModal from "@/common/EditModal.tsx";
import DeleteModal from "@/common/DeleteModal.tsx";


interface Employee {
    id: string;
    name: string;
}

interface Reservation {
    id: string;
    customerName: string;
    email: string;
    phone?: string;
    service: string;
    date: string;
    employeeId?: string;
    employee: { name: string };
}

type UpdateReservationPayload = Partial<
    Pick<Reservation, 'customerName' | 'email' | 'phone' | 'service' | 'date' | 'employeeId'>
>;

const AdminBookings: React.FC = () => {
    const { t } = useTranslation();
    const [reservations, setReservations] = useState<Reservation[]>([]);
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [view, setView] = useState<'today' | 'future' | 'history'>('today');
    const [editing, setEditing] = useState<Reservation | null>(null);
    const [deleting, setDeleting] = useState<Reservation | null>(null);
    const [saving, setSaving] = useState(false);

    const API_BASE = import.meta.env.VITE_API_URL;

    const authHeaders = () => ({
        'Content-Type': 'application/json',
        Authorization: `Bearer ${localStorage.getItem('admin_token')}`,
    });

    // Fetch reservations
    const fetchReservations = async () => {
        try {
            const res = await fetch(`${API_BASE}/reservations`, { headers: authHeaders() });
            if (!res.ok) throw new Error(t('adminBookings.errorLoading'));
            const data = await res.json();
            setReservations(data);
        } catch {
            setError(t('adminBookings.errorLoading'));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchReservations();
    }, [t]);

    // Fetch employees
    useEffect(() => {
        const fetchEmployees = async () => {
            try {
                const res = await fetch(`${API_BASE}/employees`);
                const data = await res.json();
                setEmployees(data);
            } catch (err) {
                console.error('Failed to load employees:', err);
            }
        };
        fetchEmployees();
    }, []);

    // Delete reservation (after confirmation)
    const handleDeleteConfirmed = async () => {
        if (!deleting) return;
        try {
            const res = await fetch(`${API_BASE}/reservations/${deleting.id}`, {
                method: 'DELETE',
                headers: authHeaders(),
            });
            if (!res.ok) throw new Error('Delete failed');
            setReservations(prev => prev.filter(r => r.id !== deleting.id));
            setDeleting(null);
        } catch (e) {
            console.error('Failed to delete reservation:', e);
        }
    };

    // Update reservation
    const handleUpdate = async (id: string, payload: UpdateReservationPayload) => {
        setSaving(true);
        try {
            const res = await fetch(`${API_BASE}/reservations/${id}`, {
                method: 'PUT',
                headers: authHeaders(),
                body: JSON.stringify(payload),
            });
            if (!res.ok) throw new Error('Update failed');

            const updated = await res.json();
            const updatedEmployee = employees.find(e => e.id === updated.employeeId);

            setReservations(prev =>
                prev.map(r =>
                    r.id === id
                        ? {
                            ...updated,
                            employee: updatedEmployee ? { name: updatedEmployee.name } : { name: 'Unassigned' },
                        }
                        : r
                )
            );

            setEditing(null);
        } catch (e) {
            console.error('Failed to update reservation:', e);
        } finally {
            setSaving(false);
        }
    };

    const formatDate = (dateStr: string) =>
        new Intl.DateTimeFormat('de-DE', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(dateStr));

    const today = new Date();
    const todayBookings = reservations.filter(r => new Date(r.date).toDateString() === today.toDateString());
    const futureBookings = reservations.filter(r => new Date(r.date) > today);
    const pastBookings = reservations.filter(r => new Date(r.date) < today);

    const groupByEmployee = (data: Reservation[]) =>
        data.reduce((groups: Record<string, Reservation[]>, res) => {
            const empName = res.employee?.name || 'Unassigned';
            if (!groups[empName]) groups[empName] = [];
            groups[empName].push(res);
            return groups;
        }, {});

    return (
        <div className="p-6 max-w-6xl mx-auto">
            <h1 className="text-3xl font-bold mb-6">{t('adminBookings.title')}</h1>

            {/* View toggle */}
            <div className="flex gap-4 mb-8">
                {(['today', 'future', 'history'] as const).map(v => (
                    <button
                        key={v}
                        className={`px-4 py-2 rounded font-semibold transition ${
                            view === v ? 'bg-[#4e9f66] text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        }`}
                        onClick={() => setView(v)}
                    >
                        {t(`adminBookings.${v}Bookings`)}
                    </button>
                ))}
            </div>

            {loading ? (
                <p className="text-gray-500">{t('adminBookings.loading')}</p>
            ) : error ? (
                <p className="text-red-500">{error}</p>
            ) : reservations.length === 0 ? (
                <p className="text-gray-600">{t('adminBookings.noBookingsFound')}</p>
            ) : (
                <>
                    {view === 'today' && (
                        <BookingTable
                            groups={groupByEmployee(todayBookings)}
                            onEdit={setEditing}
                            onDelete={setDeleting}
                            formatDate={formatDate}
                        />
                    )}
                    {view === 'future' && (
                        <BookingTable
                            groups={groupByEmployee(futureBookings)}
                            onEdit={setEditing}
                            onDelete={setDeleting}
                            formatDate={formatDate}
                        />
                    )}
                    {view === 'history' && (
                        <BookingTable
                            groups={groupByEmployee(pastBookings)}
                            onEdit={setEditing}
                            onDelete={setDeleting}
                            formatDate={formatDate}
                        />
                    )}
                </>
            )}

            {/* Edit Modal */}
            <EditModal
                isOpen={!!editing}
                reservation={editing}
                employees={employees}
                allReservations={reservations}
                saving={saving}
                onClose={() => setEditing(null)}
                onSave={handleUpdate}
            />

            {/* Delete Modal */}
            <DeleteModal
                isOpen={!!deleting}
                onClose={() => setDeleting(null)}
                onConfirm={handleDeleteConfirmed}
                entityName={deleting?.customerName}
            />
        </div>
    );
};

export default AdminBookings;

interface BookingTableProps {
    groups: Record<string, Reservation[]>;
    onEdit: (res: Reservation) => void;
    onDelete: (res: Reservation) => void;
    formatDate: (dateStr: string) => string;
}

const BookingTable: React.FC<BookingTableProps> = ({ groups, onEdit, onDelete, formatDate }) => {
    const { t } = useTranslation();
    return (
        <>
            {Object.entries(groups).map(([employeeName, bookings]) => (
                <div key={employeeName} className="mb-10">
                    <h1 className="text-2xl font-bold mb-6 flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-[#4e9f66] flex items-center justify-center text-white font-semibold text-sm">
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
                                <th className="px-4 py-2">{t('adminBookings.date')}</th>
                                <th className="px-4 py-2"></th>
                            </tr>
                            </thead>
                            <tbody>
                            {bookings
                                .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                                .map(res => (
                                    <tr key={res.id} className="border-t text-sm text-gray-800">
                                        <td className="px-4 py-2">{res.customerName}</td>
                                        <td className="px-4 py-2">{res.email}</td>
                                        <td className="px-4 py-2">{res.phone || '-'}</td>
                                        <td className="px-4 py-2">{res.service}</td>
                                        <td className="px-4 py-2">{formatDate(res.date)}</td>
                                        <td className="px-4 py-2 flex gap-2">
                                            <button className="text-blue-600 hover:underline" onClick={() => onEdit(res)}>
                                                {t('buttons.edit') || 'Edit'}
                                            </button>
                                            <button className="text-red-600 hover:underline" onClick={() => onDelete(res)}>
                                                {t('buttons.delete') || 'Delete'}
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            ))}
        </>
    );
};
