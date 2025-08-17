import React, {useEffect, useMemo, useState} from 'react';
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
    date: string;          // ISO string
    employeeId?: string;
}

export type CreateReservationPayload = Pick<
    Reservation,
    'customerName' | 'email' | 'phone' | 'service' | 'date' | 'employeeId'
>;

interface Props {
    isOpen: boolean;
    onClose: () => void;
    onCreate: (payload: CreateReservationPayload) => Promise<void> | void;
    employees: Employee[];
    allReservations: Reservation[];
    saving?: boolean;
    initialValues?: Partial<CreateReservationPayload>; // NEW
}

const CreateModal: React.FC<Props> = ({ isOpen, onClose, onCreate, employees, allReservations, saving, initialValues }) => {
    const { t } = useTranslation();

    const defaultDate = useMemo(() => {
        const d = new Date();
        d.setMinutes(d.getMinutes() + 30);
        d.setSeconds(0);
        d.setMilliseconds(0);
        return d.toISOString().slice(0, 16); // yyyy-MM-ddTHH:mm for input[type=datetime-local]
    }, []);

    const toInputValue = (value?: string) => {
        if (!value) return '';
        if (/[zZ]|[+-]\d{2}:\d{2}$/.test(value)) {
            const d = new Date(value);
            d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
            return d.toISOString().slice(0, 16);
        }
        return value.length >= 16 ? value.slice(0, 16) : value;
    };
    
    const [form, setForm] = useState<CreateReservationPayload>({
        customerName: '',
        email: '',
        phone: '',
        service: '',
        date: defaultDate,
        employeeId: employees[0]?.id ?? '',
    });
    useEffect(() => {
        if (!isOpen) return;
        setForm(prev => ({
            customerName: (initialValues?.customerName ?? prev.customerName) || '',
            email: (initialValues?.email ?? prev.email) || '',
            phone: (initialValues?.phone ?? prev.phone) || '',
            service: (initialValues?.service ?? prev.service) || '',
            employeeId: (initialValues?.employeeId ?? prev.employeeId) || '',
            date: toInputValue(initialValues?.date ?? prev.date),
        }));
    }, [isOpen, initialValues]);
    const onChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setForm((f) => ({ ...f, [name]: value }));
    };

    const emailOk = !form.email || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email);
    const requiredOk =
        form.customerName.trim() !== ''  && form.date && form.employeeId;



    // naive conflict check: same employee with same start-time
    const conflict = useMemo(() => {
        if (!form.employeeId || !form.date) return false;
        const t = new Date(form.date).getTime();
        const THIRTY_MIN = 30 * 60 * 1000;
        return allReservations.some(
            (r) => r.employeeId === form.employeeId && Math.abs(new Date(r.date).getTime() - t) < THIRTY_MIN
        );
    }, [form.employeeId, form.date, allReservations]);

    const submit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!requiredOk) return;
        // send ISO string for date
        const payload: CreateReservationPayload = {
            ...form,
            date: new Date(form.date).toISOString(),
        };
        await onCreate(payload);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="w-full max-w-lg rounded bg-white p-6 shadow">
                <h2 className="mb-4 text-xl font-semibold">{t('createModal.title') || 'New Booking'}</h2>

                <form onSubmit={submit} className="space-y-4">
                    <div>
                        <label className="mb-1 block text-sm font-medium">{t('editModal.customerName') || 'Name'}</label>
                        <input
                            name="customerName"
                            className="w-full rounded border px-3 py-2"
                            value={form.customerName}
                            onChange={onChange}
                            required
                        />
                    </div>

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <div>
                            <label className="mb-1 block text-sm font-medium">Email</label>
                            <input
                                name="email"
                                type="email"
                                className={`w-full rounded border px-3 py-2 ${emailOk ? '' : 'border-red-500'}`}
                                value={form.email}
                                onChange={onChange}
                            />
                            {!emailOk && <p className="mt-1 text-xs text-red-600">{t('invalidEmail') || 'Invalid email.'}</p>}
                        </div>

                        <div>
                            <label className="mb-1 block text-sm font-medium">{t('editModal.phone') || 'Phone'}</label>
                            <input
                                name="phone"
                                className="w-full rounded border px-3 py-2"
                                value={form.phone || ''}
                                onChange={onChange}
                                placeholder="+49 ..."
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <div>
                            <label className="mb-1 block text-sm font-medium">{t('editModal.service') || 'Service'}</label>
                            <input
                                name="service"
                                className="w-full rounded border px-3 py-2"
                                value={form.service}
                                onChange={onChange}
                            />
                        </div>

                        <div>
                            <select
                                name="employeeId"
                                className="w-full rounded border px-3 py-2"
                                value={form.employeeId}
                                onChange={onChange}
                            >
                                {employees.map((e) => (
                                    <option key={e.id} value={e.id}>
                                        {e.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="mb-1 block text-sm font-medium">{t('adminBookings.date') || 'Date & time'}</label>
                        <input
                            name="date"
                            type="datetime-local"
                            className="w-full rounded border px-3 py-2"
                            value={form.date}
                            onChange={onChange}
                            required
                        />
                        {conflict && (
                            <p className="mt-1 text-xs text-amber-600">
                                {t('adminBookings.conflictWarning') ||
                                    'The selected employee already has a booking around this time.'}
                            </p>
                        )}
                    </div>

                    <div className="mt-6 flex justify-end gap-2">
                        <button type="button" className="rounded bg-gray-200 px-4 py-2" onClick={onClose} disabled={!!saving}>
                            {t('editModal.cancel') || 'Cancel'}
                        </button>
                        <button
                            type="submit"
                            className="rounded bg-[#4e9f66] px-4 py-2 font-semibold text-white disabled:opacity-60"
                            disabled={!requiredOk || !!saving}
                        >
                            {saving ? (t('editModal.saving') || 'Saving...') : t('editModal.save') || 'Create'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CreateModal;
