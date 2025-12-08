import React, { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import EditModal from "@/common/EditModal.tsx";
import DeleteModal from "@/common/DeleteModal.tsx";
import CreateModal, { CreateReservationPayload } from "@/common/CreateModal.tsx";
import DayScheduleGrid from "@/admin/DayScheduleGrid.tsx";
import EmployeeService from "@/services/EmployeeService.ts";

interface Employee { id: string; name: string; }
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

/*const POLL_MS = 15000;*/ // 15s; increase to 30000 if you want less frequent polling

const AdminBookings: React.FC = () => {
    const { t } = useTranslation();
    const [reservations, setReservations] = useState<Reservation[]>([]);
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [view, setView] = useState<'today' | 'future' | 'history'>('today');
    const [editing, setEditing] = useState<Reservation | null>(null);
    // was: const [deleting, setDeleting] = useState<Reservation | null>(null);
    const [deleting, setDeleting] = useState<Pick<Reservation, 'id' | 'customerName'> | null>(null);

    const [creating, setCreating] = useState<boolean>(false);
    const [createPrefill, setCreatePrefill] = useState<Partial<CreateReservationPayload> | null>(null);
    const [saving, setSaving] = useState(false);

    const API_BASE = import.meta.env.VITE_API_URL;

    const authHeaders = () => ({
        'Content-Type': 'application/json',
        Authorization: `Bearer ${localStorage.getItem('admin_token')}`,
    });

    // --- Fetch reservations (stable, abortable) ---
    const fetchReservations = useCallback(async (signal?: AbortSignal) => {
        try {
            const res = await fetch(`${API_BASE}/reservations`);

            if (!res.ok) throw new Error(t('adminBookings.errorLoading'));
            const data = await res.json();
            setReservations(data);
            setError('');
        } catch (e: any) {
            if (!signal || !signal.aborted) {
                setError(t('adminBookings.errorLoading'));
            }
        } finally {
            setLoading(false);
        }
    }, [API_BASE, t]);

    // Initial load
    useEffect(() => {
        const ctrl = new AbortController();
        fetchReservations(ctrl.signal);
        return () => ctrl.abort();
    }, [fetchReservations]);



    // Initial load (keep this as you have it)
    useEffect(() => {
        const ctrl = new AbortController();
        fetchReservations(ctrl.signal);
        return () => ctrl.abort();
    }, [fetchReservations]);







    // Polling with pause on tab hidden
   /* useEffect(() => {
        let timeoutId: number | undefined;
        let stopped = false;
        let ctrl: AbortController | null = null;

        const tick = async () => {
            ctrl?.abort(); // cancel previous in-flight request
            ctrl = new AbortController();
            await fetchReservations(ctrl.signal);
            if (!stopped) {
                timeoutId = window.setTimeout(tick, POLL_MS);
            }
        };

        const onVisibilityChange = () => {
            if (document.visibilityState === 'visible') {
                clearTimeout(timeoutId);
                tick(); // immediate refresh on resume
            } else {
                clearTimeout(timeoutId);
                ctrl?.abort();
            }
        };

        // Start according to current visibility
        onVisibilityChange();
        document.addEventListener('visibilitychange', onVisibilityChange);

        return () => {
            stopped = true;
            clearTimeout(timeoutId);
            ctrl?.abort();
            document.removeEventListener('visibilitychange', onVisibilityChange);
        };
    }, [fetchReservations]);*/




    useEffect(() => {
        const fetchEmployees = async () => {
            try {
                const data = await EmployeeService.getAll();
                console.log(data);
                setEmployees(data);
            } catch (err) {
                console.error('Failed to load employees:', err);
            }
        };

        fetchEmployees();
    }, []);





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

    const handleCreate = async (payload: CreateReservationPayload) => {
        setSaving(true);
        try {
            const res = await fetch(`${API_BASE}/reservations`, {
                method: 'POST',
                headers: authHeaders(),
                body: JSON.stringify(payload),
            });
            if (!res.ok) throw new Error('Create failed');

            const created = await res.json();
            const employeeName = employees.find(e => e.id === created.employeeId)?.name || 'Unassigned';

            setReservations(prev => [
                ...prev,
                { ...created, employee: { name: employeeName } },
            ]);

            setCreating(false);
            setCreatePrefill(null);
        } catch (e) {
            console.error('Failed to create reservation:', e);
        } finally {
            setSaving(false);
        }
    };

    const formatDate = (dateStr: string) =>
        new Intl.DateTimeFormat('de-DE', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(dateStr));

    const today = new Date();
    const now = new Date();
    const startOfToday = new Date(now);
    startOfToday.setHours(0, 0, 0, 0);

    const endOfToday = new Date(now);
    endOfToday.setHours(23, 59, 59, 999);

    const todayBookings = reservations.filter(r => {
        const d = new Date(r.date);
        return d >= startOfToday && d <= endOfToday;
    });

    const futureBookings = reservations.filter(r => new Date(r.date) > endOfToday);
    const pastBookings = reservations.filter(r => new Date(r.date) < startOfToday);

    const groupByEmployee = (data: Reservation[], employees: Employee[]) =>
        data.reduce((groups: Record<string, Reservation[]>, res) => {
            console.log('➡️ reservation in groupByEmployee:', res);

            const emp = employees.find(e => e.id === res.employeeId);
            console.log('   ↳ matched employee:', emp);

            const empName = emp?.name || 'Unassigned';

            if (!groups[empName]) groups[empName] = [];
            groups[empName].push(res);
            return groups;
        }, {});

    const toInputMinutes = (s: string) => s.includes('T') ? s.slice(0, 16) : s;

    return (
        <div className="mx-auto">
            {/* header + create button */}
            <div className="mb-6 flex items-center justify-between">
                <h1 className="text-3xl font-bold">{t('adminBookings.title')}</h1>
                <button
                    className="rounded bg-[#4e9f66] px-4 py-2 font-semibold text-white hover:bg-[#3e8455]"
                    onClick={() => { setCreating(true); setCreatePrefill(null); }}
                >
                    {t('createModal.title') || 'New Booking'}
                </button>
            </div>

            {/* View toggle */}
            <div className="mb-8 flex gap-4">
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
                        <DayScheduleGrid
                            date={today}
                            employees={employees}
                            reservations={todayBookings}
                            onEdit={setEditing}
                            onEmptyClick={({ employeeId, dateISO }) => {
                                setCreatePrefill({ employeeId, date: toInputMinutes(dateISO) });
                                setCreating(true);
                            }}
                            apiBase={API_BASE}
                        />
                    )}
                    {view === 'future' && (
                        <BookingTable
                            groups={groupByEmployee(futureBookings, employees)}
                            onEdit={setEditing}
                            onDelete={setDeleting}   // OK: Reservation is assignable to Pick<...>
                            formatDate={formatDate}
                        />
                    )}
                    {view === 'history' && (
                        <BookingTable
                            groups={groupByEmployee(pastBookings, employees)}
                            onEdit={setEditing}
                            onDelete={setDeleting}
                            formatDate={formatDate}
                        />
                    )}
                </>
            )}

            {/* Create Modal */}
            <CreateModal
                isOpen={creating}
                onClose={() => { setCreating(false); setCreatePrefill(null); }}
                onCreate={handleCreate}
                employees={employees}
                allReservations={reservations}
                saving={saving}
                initialValues={createPrefill ?? undefined}
            />

            {/* Edit Modal */}
            <EditModal
                isOpen={!!editing}
                reservation={editing}
                employees={employees}
                allReservations={reservations}
                saving={saving}
                onClose={() => setEditing(null)}
                onSave={handleUpdate}
                onRequestDelete={(res) => setDeleting(res)} // now types match
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
    onDelete: (res: Pick<Reservation, 'id' | 'customerName'>) => void; // <-- narrowed
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
