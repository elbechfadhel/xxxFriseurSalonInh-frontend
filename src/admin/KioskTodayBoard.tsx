// src/admin/KioskBusBoard.tsx
import React, { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

type Employee = { id: string; name: string };
type Reservation = {
    id: string;
    customerName: string;
    email: string;
    phone?: string;
    service: string;
    date: string;           // ISO string
    employeeId?: string;
    employee?: { name: string };
};

type Slot = {
    iso: string;
    label: string;
    hour: number;
    minutes: number;
};

const POLL_MS = 30000;
const SLOT_MINUTES = 30;
const DAY_START = { h: 8, m: 30 };   // start 08:30
const DAY_END = { h: 19, m: 0 };

function startOfTodayAt(h: number, m = 0) {
    const d = new Date();
    d.setHours(h, m, 0, 0);
    return d;
}
function endOfTodayAt(h: number, m = 0) {
    const d = new Date();
    d.setHours(h, m, 0, 0);
    return d;
}
function* slotsOfDay(stepMin: number, start: Date, end: Date): Generator<Date> {
    const t = new Date(start);
    while (t <= end) {
        yield new Date(t);
        t.setMinutes(t.getMinutes() + stepMin);
    }
}
function fmtTime(d: Date, locale: string) {
    return new Intl.DateTimeFormat(locale, {
        hour: "2-digit",
        minute: "2-digit",
    }).format(d);
}

const KioskBusBoard: React.FC = () => {
    const { t, i18n } = useTranslation();
    const API_BASE = import.meta.env.VITE_API_URL;

    const [employees, setEmployees] = useState<Employee[]>([]);
    const [reservations, setReservations] = useState<Reservation[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const authHeaders = () => ({
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("admin_token") || ""}`,
    });

    // --- load employees once ---
    useEffect(() => {
        (async () => {
            try {
                const res = await fetch(`${API_BASE}/employees`);
                if (!res.ok) throw new Error("Failed to load employees");
                setEmployees(await res.json());
            } catch (err) {
                console.error("Failed to load employees:", err);
            }
        })();
    }, [API_BASE]);

    // --- load reservations with polling ---
    useEffect(() => {
        let timer: number | undefined;
        let ctrl: AbortController | null = null;
        let stopped = false;

        const load = async () => {
            ctrl?.abort();
            ctrl = new AbortController();
            try {
                setError("");
                const res = await fetch(`${API_BASE}/reservations`, {
                    headers: authHeaders(),
                    signal: ctrl.signal,
                });
                if (!res.ok) throw new Error("Failed to load reservations");
                setReservations(await res.json());
            } catch (err) {
                if (!ctrl?.signal.aborted) {
                    console.error("Failed to fetch reservations:", err);
                    setError(t("adminBookings.errorLoading") || "Fehler beim Laden");
                }
            } finally {
                setLoading(false);
            }
        };

        const tick = async () => {
            await load();
            if (!stopped) timer = window.setTimeout(tick, POLL_MS);
        };

        tick();
        return () => {
            stopped = true;
            clearTimeout(timer);
            ctrl?.abort();
        };
    }, [API_BASE, t]);

    const start = useMemo(() => startOfTodayAt(DAY_START.h, DAY_START.m), []);
    const end = useMemo(() => endOfTodayAt(DAY_END.h, DAY_END.m), []);

    // build all slots, then split AM/PM
    const allSlots: Slot[] = useMemo(() => {
        return Array.from(slotsOfDay(SLOT_MINUTES, start, end)).map((d) => ({
            iso: d.toISOString(),
            label: fmtTime(d, i18n.language),
            hour: d.getHours(),
            minutes: d.getMinutes(),
        }));
    }, [start, end, i18n.language]);

// AM: 08:30 → 14:00 (14:00 INCLUDED)
    const amSlots = allSlots.filter(
        (s) => s.hour < 14 || (s.hour === 14 && s.minutes === 0)
    );

// PM: AFTER 14:00 (so 14:30, 15:00, …)
    const pmSlots = allSlots.filter(
        (s) => s.hour > 14 || (s.hour === 14 && s.minutes > 0)
    );

    // filter only today's reservations
    const todayReservations = useMemo(() => {
        const s0 = new Date(start);
        const e0 = new Date(end);
        return reservations.filter((r) => {
            const d = new Date(r.date);
            return d >= s0 && d <= e0;
        });
    }, [reservations, start, end]);

    // group reservations by employee
    const byEmp: Record<string, Reservation[]> = useMemo(() => {
        const map: Record<string, Reservation[]> = {};
        for (const r of todayReservations) {
            const k = r.employeeId || "unassigned";
            (map[k] ||= []).push(r);
        }
        return map;
    }, [todayReservations]);

    const employeeList = useMemo(() => {
        const ids = new Set([
            ...employees.map((e) => e.id),
            ...Object.keys(byEmp),
        ]);
        const rows = Array.from(ids).map((id) => ({
            id,
            name:
                employees.find((e) => e.id === id)?.name ||
                (id === "unassigned"
                    ? t("unassigned") || "Unassigned"
                    : id),
        }));

        return rows;
    }, [employees, byEmp, i18n.language, t]);

    const findBooking = (empId: string, slotIso: string) => {
        const list = byEmp[empId] || [];
        const s = new Date(slotIso).getTime();
        return list.find((r) => new Date(r.date).getTime() === s);
    };
    const [currentTime, setCurrentTime] = useState(
        new Intl.DateTimeFormat(i18n.language, {
            hour: "2-digit",
            minute: "2-digit",
            hour12: false,
        }).format(new Date())
    );

    // update clock every minute
    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentTime(
                new Intl.DateTimeFormat(i18n.language, {
                    hour: "2-digit",
                    minute: "2-digit",
                    hour12: false,
                }).format(new Date())
            );
        }, 60 * 1000);
        return () => clearInterval(interval);
    }, [i18n.language]);

    return (
        <div className="min-h-screen w-full bg-black  text-white" dir={i18n.dir()}>
            {/* Header */}
            <header className="flex justify-between items-center px-8 py-4 bg-black">
                <div className="flex items-baseline gap-6">
                    <h1 className="text-3xl font-bold">{t("adminBookings.today")}</h1>
                    <span className="text-lg text-gray-300">
            {new Intl.DateTimeFormat(i18n.language, {
                weekday: "long",
                day: "numeric",
                month: "long",
                year: "numeric",
            }).format(new Date)}
          </span>
                </div>
                <span className="text-2xl font-bold">{currentTime}</span>
            </header>

            <main className="px-6 py-6">
                {loading ? (
                    <p className="text-white/70 text-2xl">
                        {t("adminBookings.loading")}
                    </p>
                ) : error ? (
                    <p className="text-red-400 text-2xl">{error}</p>
                ) : (
                    <div
                        className="grid gap-4"
                        style={{
                            gridTemplateColumns: `repeat(${employeeList.length * 2}, minmax(0, 1fr))`,
                        }}
                    >
                        {employeeList.map((emp) => (
                            <React.Fragment key={emp.id}>
                                {/* AM Column */}
                                <section
                                    className="rounded-3xl bg-white/5 ring-1 ring-white/10 shadow-xl overflow-hidden">
                                    <div className="px-4 py-2 bg-white/10 text-center font-semibold">
                                        {emp.name} – AM
                                    </div>
                                    <ul className="p-3 space-y-2">
                                        {amSlots.map((slot) => {
                                            const booking = findBooking(emp.id, slot.iso);
                                            return (
                                                <li
                                                    key={slot.iso}
                                                    className={`rounded-xl px-3 py-2 flex items-center gap-3
                            ${
                                                        booking
                                                            ? "bg-emerald-600/25 ring-1 ring-emerald-400/40"
                                                            : "bg-black/30 ring-1 ring-white/10"
                                                    }`}
                                                >
                                                    <div className="w-[64px] text-lg font-bold tabular-nums">
                                                        {slot.label}
                                                    </div>
                                                    {booking ? (
                                                        <div>
                                                            <div className="text-lg font-semibold">
                                                                {booking.customerName}
                                                            </div>
                                                            <div className="text-sm text-white/70">
                                                                {booking.service}
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <div className="text-white/60">

                                                        </div>
                                                    )}
                                                </li>
                                            );
                                        })}
                                    </ul>
                                </section>

                                {/* PM Column */}
                                <section
                                    className="rounded-3xl bg-white/5 ring-1 ring-white/10 shadow-xl overflow-hidden">
                                    <div className="px-4 py-2 bg-white/10 text-center font-semibold">
                                        {emp.name} – PM
                                    </div>
                                    <ul className="p-3 space-y-2">
                                        {pmSlots.map((slot) => {
                                            const booking = findBooking(emp.id, slot.iso);
                                            return (
                                                <li
                                                    key={slot.iso}
                                                    className={`rounded-xl px-3 py-2 flex items-center gap-3
                            ${
                                                        booking
                                                            ? "bg-emerald-600/25 ring-1 ring-emerald-400/40"
                                                            : "bg-black/30 ring-1 ring-white/10"
                                                    }`}
                                                >
                                                    <div className="w-[64px] text-lg font-bold tabular-nums">
                                                        {slot.label}
                                                    </div>
                                                    {booking ? (
                                                        <div>
                                                            <div className="text-lg font-semibold">
                                                                {booking.customerName}
                                                            </div>
                                                            <div className="text-sm text-white/70">
                                                                {booking.service}
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <div className="text-white/60">

                                                        </div>
                                                    )}
                                                </li>
                                            );
                                        })}
                                    </ul>
                                </section>
                            </React.Fragment>
                        ))}
                    </div>
                )}
            </main>


        </div>
    );
};

export default KioskBusBoard;
