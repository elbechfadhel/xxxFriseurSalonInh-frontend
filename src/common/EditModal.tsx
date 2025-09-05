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
    allReservations: Reservation[]; // for conflict checks
    saving: boolean;
    onClose: () => void;
    onSave: (id: string, payload: UpdateReservationPayload) => Promise<void>;
    /** NEW: ask parent to open DeleteModal for this reservation */
    onRequestDelete: (reservation: Pick<Reservation, 'id' | 'customerName'>) => void;
}

const EditModal: React.FC<EditModalProps> = ({
                                                 isOpen,
                                                 reservation,
                                                 employees,
                                                 allReservations,
                                                 saving,
                                                 onClose,
                                                 onSave,
                                                 onRequestDelete,
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

        // conflict check
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
            date: new Date(form.date as string).toISOString(),
            employeeId: form.employeeId ?? undefined,
        });
    };

    const handleDeleteClick = () => {
        // close this modal, then ask parent to open DeleteModal
        onClose();
        onRequestDelete({ id: reservation.id, customerName: reservation.customerName });
    };

    return (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
            <div className="bg-white rounded p-6 w-full max-w-md">
                <h2 className="text-xl font-semibold mb-4">
                    {t('editModal.title', 'Edit Reservation')}
                </h2>

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
                            value={(form.date as string) || ''}
                            onChange={onChange}
                            className="w-full border p-2 rounded"
                            type="datetime-local"
                        />
                        {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
                    </div>

                    <select
                        name="employeeId"
                        value={(form.employeeId as string) || ''}
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

                    {/* Footer: Delete on the left, Cancel/Save on the right */}
                    <div className="flex items-center justify-between pt-2">
                        <button
                            type="button"
                            onClick={handleDeleteClick}
                            className="px-4 py-2 rounded bg-red-600 text-white hover:bg-red-700 disabled:opacity-60"
                            disabled={saving}
                        >
                            {t('editModal.delete', 'Delete')}
                        </button>

                        <div className="flex gap-2">
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
                    </div>
                </form>
            </div>
        </div>
    );
};

export default EditModal;
