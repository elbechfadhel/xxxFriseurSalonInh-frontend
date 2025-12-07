import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

export interface Employee {
    id: string;
    name: string;
    nameAr?: string;
}

export interface Reservation {
    id: string;
    customerName: string;
    email: string;
    phone?: string;
    service: string;
    date: string;            // ISO
    employeeId?: string;
    employee: { name: string };
}

type Props = {
    date: Date;
    employees: Employee[];
    reservations: Reservation[];
    onEdit: (reservation: Reservation) => void;
    onEmptyClick?: (args: { employeeId: string; dateISO: string }) => void;
    openHour?: number;
    closeHour?: number;
    slotMinutes?: number;
    includeUnassigned?: boolean;
    /** Fixed width (px) of the left employee column */
    employeeColWidth?: number;       // default 180
    /** Minimum width (px) of a slot cell, grows evenly beyond this */
    slotMinWidth?: number;           // default 44
    /** Base URL for employee photos (e.g. import.meta.env.VITE_API_URL) */
    apiBase: string;                 // <-- NEW
};

const pad2 = (n: number) => (n < 10 ? `0${n}` : `${n}`);

const DayScheduleGrid: React.FC<Props> = ({
                                              date,
                                              employees,
                                              reservations,
                                              onEdit,
                                              onEmptyClick,
                                              openHour = 9,
                                              closeHour = 19,
                                              slotMinutes = 30,
                                              includeUnassigned = true,
                                              employeeColWidth = 180,
                                              slotMinWidth = 44,
                                              // <-- NEW
                                          }) => {
    const { t, i18n } = useTranslation();
    const lang = i18n.language;

    const times = useMemo(() => {
        const out: string[] = [];
        const d = new Date(date);
        d.setHours(openHour, 30, 0, 0);  // start at 09:30
        const end = new Date(date);
        end.setHours(closeHour, 0, 0, 0);
        while (d <= end) {
            out.push(`${pad2(d.getHours())}:${pad2(d.getMinutes())}`);
            d.setMinutes(d.getMinutes() + slotMinutes);
        }
        return out;
    }, [date, openHour, closeHour, slotMinutes]);


    // employeeId -> "HH:MM" -> reservation
    const byEmpTime = useMemo(() => {
        const m = new Map<string, Map<string, Reservation>>();
        for (const r of reservations) {
            const empId = r.employeeId || 'unassigned';
            const d = new Date(r.date);
            const key = `${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
            if (!m.has(empId)) m.set(empId, new Map());
            m.get(empId)!.set(key, r);
        }
        return m;
    }, [reservations]);

    type Row = { id: string; name: string; nameAr?: string };
    const rows: Array<Row> = useMemo(() => {
        const arr: Array<Row> = [...employees];
        if (includeUnassigned && byEmpTime.has('unassigned')) {
            arr.unshift({ id: 'unassigned', name: t('editModal.unassigned') || 'Unassigned' });
        }
        return arr;
    }, [employees, byEmpTime, includeUnassigned, t]);

    // Fixed first column; slots stretch evenly
    const gridTemplateCols = `${employeeColWidth}px repeat(${times.length}, minmax(${slotMinWidth}px, 1fr))`;

    const toLocalISOString = (d: Date) => {
        const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);
        return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:00`;
    };

    const toISO = (d: Date, hhmm: string) => {
        const [hh, mm] = hhmm.split(':').map(Number);
        const copy = new Date(d);
        copy.setHours(hh, mm, 0, 0);
        return toLocalISOString(copy);
    };

    // Compute display name per lang
    const displayName = (emp: Row) => (lang === 'ar' ? emp.nameAr || emp.name : emp.name);



    const employeeImages: Record<string, string> = {
        '77f080f7-b1a2-4ad1-8230-234280b8fc75': '/employees/nejib.jpeg',
        'd756ef8e-2c11-45a0-87a6-237b0a526f27': '/employees/houssem.jpeg',
    };




    return (
        <div className="w-full">
            {/* Legend */}
            <div className="mb-3 flex items-center gap-4 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                    <span className="inline-block h-4 w-4 rounded bg-[#4e9f66]" />
                    {t('adminBookings.booked') || 'Booked'}
                </div>
                <div className="flex items-center gap-2">
                    <span className="inline-block h-4 w-4 rounded border bg-white" />
                    {t('adminBookings.free') || 'Free'}
                </div>
            </div>

            <div className="w-full overflow-x-auto rounded border">
                {/* Header */}
                <div
                    className="grid items-center border-b bg-gray-50"
                    style={{ gridTemplateColumns: gridTemplateCols }}
                >
                    <div className="px-3 py-2 text-xs font-semibold uppercase tracking-wide text-gray-600">
                        {/* left header cell intentionally blank or you can put t('adminBookings.employee') */}
                    </div>
                    {times.map((tstr) => (
                        <div key={`h-${tstr}`} className="px-1 py-2 text-center text-[10px] text-gray-500 font-bold">
                            {tstr}
                        </div>
                    ))}
                </div>

                {/* Rows */}
                <div className="w-full">
                    {rows.map((emp) => {
                        const bookings = byEmpTime.get(emp.id) || new Map<string, Reservation>();
                        const name = displayName(emp);
                        return (
                            <div
                                key={emp.id}
                                className="grid items-stretch border-b last:border-b-0"
                                style={{ gridTemplateColumns: gridTemplateCols }}
                            >
                                {/* Employee cell (fixed width) */}
                                <div className="flex items-center px-3 py-2 text-sm font-medium text-gray-800">


                                    <img
                                        src={employeeImages[emp.id] ?? '/images/avatar-placeholder.png'}
                                        alt={emp.name}
                                        className="me-2 h-7 w-7 rounded-full object-cover"
                                    />


                                    <span className="truncate" title={name}>
                    {name}
                  </span>
                                </div>

                                {/* Slots (grow evenly) */}
                                {times.map((tstr) => {
                                    const res = bookings.get(tstr);

                                    if (res) {
                                        const timeLabel = new Date(res.date).toLocaleTimeString([], {
                                            hour: '2-digit',
                                            minute: '2-digit',
                                        });
                                        const tooltip = `${res.customerName} • ${res.service} • ${timeLabel}`;

                                        return (
                                            <button
                                                key={`${emp.id}-${tstr}`}
                                                type="button"
                                                title={tooltip}
                                                aria-label={tooltip}
                                                onClick={() => onEdit(res)}
                                                className="relative m-1 h-8 rounded bg-[#4e9f66] transition hover:opacity-90"
                                            >
                                         <span className="pointer-events-none absolute inset-0 flex items-center justify-center px-1 text-[10px] leading-none text-white truncate">
                                               {res.customerName}
                                              </span>



                                            </button>
                                        );
                                    }

                                    if (onEmptyClick) {
                                        return (
                                            <button
                                                key={`${emp.id}-${tstr}`}
                                                type="button"
                                                title={t('adminBookings.free') || 'Free'}
                                                onClick={() => onEmptyClick({ employeeId: emp.id, dateISO: toISO(date, tstr) })}
                                                className="m-1 h-8 rounded border bg-white transition hover:bg-gray-50"
                                            />
                                        );
                                    }

                                    return <div key={`${emp.id}-${tstr}`} className="m-1 h-8 rounded border bg-white" />;
                                })}

                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default DayScheduleGrid;
