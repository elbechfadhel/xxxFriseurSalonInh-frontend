// src/admin/KioskBusBoard.tsx
import React, { useEffect, useMemo, useRef, useState } from "react";
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

type Banner = { id: string; message: string };

const POLL_MS = 15000;
const SLOT_MINUTES = 30;
const DAY_START = { h: 8, m: 30 };   // start 08:30
const DAY_END = { h: 20, m: 0 };

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
    const [flashIds, setFlashIds] = useState<string[]>([]);
    const [banners, setBanners] = useState<Banner[]>([]);
    const prevReservations = useRef<Reservation[]>([]);

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

    // --- detect new reservations (for flash + banner) ---
    useEffect(() => {
        if (prevReservations.current.length === 0) {
            prevReservations.current = reservations;
            return;
        }

        const oldIds = new Set(prevReservations.current.map(r => r.id));
        const newOnes = reservations.filter(r => !oldIds.has(r.id));

        if (newOnes.length > 0) {
            const ids = newOnes.map(r => r.id);
            setFlashIds(ids);

            const newBanners = newOnes.map(r => ({
                id: r.id,
                message: `Neue Buchung: ${r.customerName} um ${new Date(r.date).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit"
                })}`,
            }));
            setBanners(prev => [...prev, ...newBanners]);

            // clear flash highlight
            setTimeout(() => {
                setFlashIds([]);
            }, 5000);

            // remove banners after 5s
            newBanners.forEach(b => {
                setTimeout(() => {
                    setBanners(prev => prev.filter(p => p.id !== b.id));
                }, 5000);
            });
        }

        prevReservations.current = reservations;
    }, [reservations]);

    const start = useMemo(() => startOfTodayAt(DAY_START.h, DAY_START.m), []);
    const end = useMemo(() => endOfTodayAt(DAY_END.h, DAY_END.m), []);

    const allSlots: Slot[] = useMemo(() => {
        return Array.from(slotsOfDay(SLOT_MINUTES, start, end)).map((d) => ({
            iso: d.toISOString(),
            label: fmtTime(d, i18n.language),
            hour: d.getHours(),
            minutes: d.getMinutes(),
        }));
    }, [start, end, i18n.language]);

    // AM: 08:30 → 14:00
    const amSlots = allSlots.filter(
        (s) => s.hour < 14 || (s.hour === 14 && s.minutes === 0)
    );

    // PM: AFTER 14:00
    const pmSlots = allSlots.filter(
        (s) => s.hour > 14 || (s.hour === 14 && s.minutes > 0)
    );

    const todayReservations = useMemo(() => {
        const s0 = new Date(start);
        const e0 = new Date(end);
        return reservations.filter((r) => {
            const d = new Date(r.date);
            return d >= s0 && d <= e0;
        });
    }, [reservations, start, end]);

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
        return Array.from(ids).map((id) => ({
            id,
            name:
                employees.find((e) => e.id === id)?.name ||
                (id === "unassigned" ? t("unassigned") || "Unassigned" : id),
        }));
    }, [employees, byEmp, t]);

    const findBooking = (empId: string, slotIso: string) => {
        const list = byEmp[empId] || [];
        const s = new Date(slotIso).getTime();
        return list.find((r) => new Date(r.date).getTime() === s);
    };

    return (
        <div className="min-h-screen w-full bg-black text-white" dir={i18n.dir()}>
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
                                <section className="rounded-3xl bg-white/5 ring-1 ring-white/10 shadow-xl overflow-hidden">
                                    <div className="px-4 py-2 bg-white/10 text-center font-semibold">
                                        {emp.name} – AM
                                    </div>
                                    <ul className="p-3 space-y-2">
                                        {amSlots.map((slot) => {
                                            const booking = findBooking(emp.id, slot.iso);
                                            const isFlash = booking && flashIds.includes(booking.id);
                                            return (
                                                <li
                                                    key={slot.iso}
                                                    className={`rounded-xl px-3 py-2 flex items-center gap-3 transition-colors duration-500
                            ${
                                                        booking
                                                            ? isFlash
                                                                ? "bg-yellow-400 text-black"
                                                                : "bg-emerald-600/25 ring-1 ring-emerald-400/40"
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
                                                        </div>
                                                    ) : (
                                                        <div className="text-white/60"></div>
                                                    )}
                                                </li>
                                            );
                                        })}
                                    </ul>
                                </section>

                                {/* PM Column */}
                                <section className="rounded-3xl bg-white/5 ring-1 ring-white/10 shadow-xl overflow-hidden">
                                    <div className="px-4 py-2 bg-white/10 text-center font-semibold">
                                        {emp.name} – PM
                                    </div>
                                    <ul className="p-3 space-y-2">
                                        {pmSlots.map((slot) => {
                                            const booking = findBooking(emp.id, slot.iso);
                                            const isFlash = booking && flashIds.includes(booking.id);
                                            return (
                                                <li
                                                    key={slot.iso}
                                                    className={`rounded-xl px-3 py-2 flex items-center gap-3 transition-colors duration-500
    ${booking ? (isFlash ? "animate-flashFade" : "bg-emerald-600/25 ring-1 ring-emerald-400/40") : "bg-black/30 ring-1 ring-white/10"}
  `}
                                                >

                                                    <div className="w-[64px] text-lg font-bold tabular-nums">
                                                        {slot.label}
                                                    </div>
                                                    {booking ? (
                                                        <div>
                                                            <div className="text-lg font-semibold">
                                                                {booking.customerName}
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <div className="text-white/60"></div>
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

            {/* Floating banners */}
            <div className="fixed top-4 right-4 space-y-2 z-50">
                {banners.map(b => (
                    <div
                        key={b.id}
                        className="bg-emerald-500 text-white px-4 py-2 rounded-lg shadow-lg animate-slideIn"
                    >
                        {b.message}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default KioskBusBoard;
