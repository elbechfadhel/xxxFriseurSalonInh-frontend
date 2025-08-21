import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

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
}

type UpdateReservationPayload = Partial<
    Pick<Reservation, 'customerName' | 'email' | 'phone' | 'service' | 'date' | 'employeeId'>
>;

interface EditModalProps {
    isOpen: boolean;
    reservation: Reservation | null;
    employees: Employee[];
    allReservations: Reservation[]; // Added to check conflicts
    saving: boolean;
    onClose: () => void;
    onSave: (id: string, payload: UpdateReservationPayload) => Promise<void>;
}

const EditModal: React.FC<EditModalProps> = ({
                                                 isOpen,
                                                 reservation,
                                                 employees,
                                                 allReservations,
                                                 saving,
                                                 onClose,
                                                 onSave,
                                             }) => {
    const { t } = useTranslation();
    const [form, setForm] = useState<UpdateReservationPayload>({});
    const [error, setError] = useState<string | null>(null);

    const toLocalInputValue = (dateString: string) => {
        const d = new Date(dateString);
        d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
        return d.toISOString().slice(0, 16); // yyyy-MM-ddTHH:mm
    };



    useEffect(() => {
        if (reservation) {
            setForm({
                customerName: reservation.customerName,
                email: reservation.email,
                phone: reservation.phone,
                service: reservation.service,
                date: toLocalInputValue(reservation.date),
                employeeId: reservation.employeeId || '',
            });
            setError(null);
        }
    }, [reservation]);

    if (!isOpen || !reservation) return null;

    const onChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setForm(prev => ({ ...prev, [name]: value }));
    };

    const onSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.date) return;

        // Check for time conflict with existing reservations for the same employee
        const conflict = allReservations.some(
            r =>
                r.employeeId === (form.employeeId || reservation.employeeId) &&
                r.id !== reservation.id &&
                new Date(r.date).getTime() === new Date(form.date as string).getTime()
        );

        if (conflict) {
            setError(t('editModal.slotTaken', 'This time slot is already booked.'));
            return;
        }

        setError(null);
        onSave(reservation.id, {
            ...form,
            date: new Date(form.date).toISOString(),
            employeeId: form.employeeId ?? undefined,
        });
    };

    return (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
            <div className="bg-white rounded p-6 w-full max-w-md">
                <h2 className="text-xl font-semibold mb-4">{t('editModal.title', 'Edit Reservation')}</h2>
                <form onSubmit={onSubmit} className="space-y-4">
                    {['customerName', 'email', 'phone', 'service'].map(field => (
                        <input
                            key={field}
                            name={field}
                            value={(form as any)[field] || ''}
                            onChange={onChange}
                            className="w-full border p-2 rounded"
                            placeholder={t(`editModal.${field}`, field)}
                        />
                    ))}

                    <div>
                        <input
                            name="date"
                            value={form.date || ''}
                            onChange={onChange}
                            className="w-full border p-2 rounded"
                            type="datetime-local"
                        />
                        {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
                    </div>

                    <select
                        name="employeeId"
                        value={form.employeeId || ''}
                        onChange={onChange}
                        className="w-full border p-2 rounded"
                    >
                        <option value="">{t('editModal.unassigned', 'Unassigned')}</option>
                        {employees.map(emp => (
                            <option key={emp.id} value={emp.id}>
                                {emp.name}
                            </option>
                        ))}
                    </select>

                    <div className="flex justify-end gap-2 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 rounded bg-gray-200"
                            disabled={saving}
                        >
                            {t('editModal.cancel', 'Cancel')}
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-2 rounded bg-[#4e9f66] text-white disabled:opacity-60"
                            disabled={saving}
                        >
                            {saving ? t('editModal.saving', 'Saving…') : t('editModal.save', 'Save')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default EditModal;
