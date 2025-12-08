// src/admin/KioskBusBoard.tsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import EmployeeService from "@/services/EmployeeService.ts";

type Employee = { id: string; name: string };
type Reservation = {
    id: string;
    customerName: string;
    email: string;
    phone?: string;
    service: string;
    date: string; // ISO string
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

/*const POLL_MS = 5000;*/
const SLOT_MINUTES = 30;
const DAY_START = { h: 9, m: 30 }; // start 09:30
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
function getFirstName(fullName: string = "") {
    return fullName.trim().split(/\s+/)[0] || "";
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
    const [now, setNow] = useState<Date>(() => new Date());

    // scaling
    const containerRef = useRef<HTMLDivElement | null>(null);
    const [scale, setScale] = useState(1);



    // real-time clock
    useEffect(() => {
        const timer = setInterval(() => {
            setNow(new Date());   // no -1 here
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    const todayDateStr = now.toLocaleDateString("de-DE", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
    });

    const timeStr = now.toLocaleTimeString("de-DE", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
    });

    // --- load employees once ---
    useEffect(() => {
        (async () => {
            try {
                const data = await EmployeeService.getAll();
                setEmployees(data);
            } catch (err) {
                console.error('Failed to load employees:', err);
            }
        })();
    }, []);



    // --- load reservations + subscribe to Realtime ---
    const POLL_MS = 5000;

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
                    signal: ctrl.signal,
                });
                if (!res.ok) throw new Error("Failed to load reservations");

                const data: Reservation[] = await res.json();
                setReservations(data);
            } catch (err) {
                if (!ctrl?.signal.aborted) {
                    console.error("[Kiosk] Failed to fetch reservations:", err);
                    setError(
                        t("adminBookings.errorLoading") || "Fehler beim Laden"
                    );
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
            if (timer) clearTimeout(timer);
            ctrl?.abort();
        };
    }, [API_BASE, t]);




    // --- load reservations with polling ---
  /*  useEffect(() => {
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
                    setError(
                        t("adminBookings.errorLoading") || "Fehler beim Laden"
                    );
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
            if (timer) clearTimeout(timer);
            ctrl?.abort();
        };
    }, [API_BASE, t]);*/

    // --- detect new reservations (for flash + banner) ---
    useEffect(() => {
        if (prevReservations.current.length === 0) {
            prevReservations.current = reservations;
            return;
        }

        const oldIds = new Set(prevReservations.current.map((r) => r.id));
        const newOnes = reservations.filter((r) => !oldIds.has(r.id));

        if (newOnes.length > 0) {
            const ids = newOnes.map((r) => r.id);
            setFlashIds(ids);

            const newBanners = newOnes.map((r) => ({
                id: r.id,
                message: `Neue Buchung: ${
                    r.customerName
                } um ${new Date(r.date).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                })}`,
            }));
            setBanners((prev) => [...prev, ...newBanners]);

            // clear flash highlight
            setTimeout(() => {
                setFlashIds([]);
            }, 5000);

            // remove banners after 5s
            newBanners.forEach((b) => {
                setTimeout(() => {
                    setBanners((prev) => prev.filter((p) => p.id !== b.id));
                }, 5000);
            });
        }

        prevReservations.current = reservations;
    }, [reservations]);

    const start = useMemo(
        () => startOfTodayAt(DAY_START.h, DAY_START.m),
        []
    );
    const end = useMemo(() => endOfTodayAt(DAY_END.h, DAY_END.m), []);

    const allSlots: Slot[] = useMemo(() => {
        return Array.from(slotsOfDay(SLOT_MINUTES, start, end)).map((d) => ({
            iso: d.toISOString(),
            label: fmtTime(d, i18n.language),
            hour: d.getHours(),
            minutes: d.getMinutes(),
        }));
    }, [start, end, i18n.language]);

    // AM: 09:30 → 14:00
    const amSlots = allSlots.filter(
        (s) => s.hour < 14 || (s.hour === 14 && s.minutes === 0)
    );

    // PM: after 14:00
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
        const ids = new Set([...employees.map((e) => e.id), ...Object.keys(byEmp)]);
        return Array.from(ids).map((id) => ({
            id,
            name:
                employees.find((e) => e.id === id)?.name ||
                (id === "unassigned"
                    ? t("unassigned") || "Unassigned"
                    : id),
        }));
    }, [employees, byEmp, t]);

    const findBooking = (empId: string, slotIso: string) => {
        const list = byEmp[empId] || [];
        const s = new Date(slotIso).getTime();
        return list.find((r) => new Date(r.date).getTime() === s);
    };

    // Past slot: strictly before now
    const isPastSlot = (slotIso: string) => {
        const cutoff = new Date(now);
        cutoff.setHours(cutoff.getHours() - 1);  // shift only for slot logic
        return new Date(slotIso).getTime() < cutoff.getTime();
    };

    // --- auto-scale to fit screen (no scroll) ---
    useEffect(() => {
        const applyScale = () => {
            const el = containerRef.current;
            if (!el) return;

            const contentWidth = el.scrollWidth;
            const contentHeight = el.scrollHeight;
            if (!contentWidth || !contentHeight) return;

            const screenWidth = window.innerWidth;
            const screenHeight = window.innerHeight;

            const sX = screenWidth / contentWidth;
            const sY = screenHeight / contentHeight;

            const finalScale = Math.min(sX, sY, 1); // never upscale > 1
            setScale(finalScale);
        };

        applyScale();
        window.addEventListener("resize", applyScale);
        return () => window.removeEventListener("resize", applyScale);
    }, [employees.length, reservations.length, i18n.language]);

    return (
        <div
            className="kiosk-background w-screen h-screen overflow-hidden bg-gray-100 text-gray-900"
            dir={i18n.dir()}
        >
            <div
                ref={containerRef}
                style={{
                    transform: `scale(${scale})`,
                    transformOrigin: "top left",
                    width: "100%",
                    height: "100%",
                    overflow: "hidden",
                }}
            >
                <main className="px-6 py-0">
                    {/* HEADER */}
                    <header className="w-full flex items-center justify-between mb-0 border-b border-gray-200 pb-2">
                        {/* LEFT SIDE: Logo + Title */}
                        <div className="flex items-center gap-4">
                            <img
                                src="/images/logo-xxx.png"
                                alt="Logo"
                                className="h-20 w-auto"
                            />

                            <div className="text-2xl font-extrabold text-gray-900 flex items-center gap-2">
                                {t("welcomeTitle")}
                                <span className="text-[#4e9f66]">
                                    {t("barberShopName")}
                                </span>
                            </div>
                        </div>

                        {/* RIGHT SIDE: Date + Time */}
                        <div className="text-lg text-gray-600 font-extrabold flex items-center gap-2">
                            <span>{todayDateStr}</span>
                            <span>–</span>
                            <span>{timeStr}</span>
                        </div>
                    </header>

                    {loading ? (
                        <p className="text-gray-600 text-2xl">
                            {t("adminBookings.loading")}
                        </p>
                    ) : error ? (
                        <p className="text-red-600 text-2xl">{error}</p>
                    ) : (
                        <div
                            className="grid gap-4"
                            style={{
                                gridTemplateColumns: `repeat(${
                                    employeeList.length * 2
                                }, minmax(0, 1fr))`,
                            }}
                        >
                            {employeeList.map((emp) => (
                                <React.Fragment key={emp.id}>
                                    {/* AM Column */}
                                    <section className="border border-gray-200 shadow-md overflow-hidden bg-transparent">
                                        <div
                                            className="px-4 py-2 text-center font-semibold text-white"
                                            style={{ backgroundColor: "#374151" }}
                                        >
                                            {emp.name} – AM
                                        </div>
                                        <ul className="p-3 space-y-2 bg-transparent">
                                            {amSlots.map((slot) => {
                                                const booking = findBooking(
                                                    emp.id,
                                                    slot.iso
                                                );
                                                const isFlash =
                                                    booking &&
                                                    flashIds.includes(booking.id);

                                                return (
                                                    <li
                                                        key={slot.iso}
                                                        className={`
                                                            px-3 py-1 flex items-center gap-3 transition-all duration-500
                                                            ${
                                                            isPastSlot(slot.iso)
                                                                ? "bg-transparent text-transparent border-0"
                                                                : booking
                                                                    ? isFlash
                                                                        ? "bg-yellow-300 text-black border border-yellow-300"
                                                                        : "bg-[#3d7f52] text-white border border-[#3d7f52]"
                                                                    : "bg-white text-gray-600 border border-gray-200"
                                                        }
                                                        `}
                                                    >
                                                        <div className="w-[64px] text-lg font-bold tabular-nums">
                                                            {slot.label}
                                                        </div>
                                                        {booking ? (
                                                            <div className="text-lg font-semibold truncate max-w-[180px]">
                                                                {getFirstName(
                                                                    booking.customerName
                                                                )}
                                                            </div>
                                                        ) : (
                                                            <div className="text-gray-400"></div>
                                                        )}
                                                    </li>
                                                );
                                            })}
                                        </ul>
                                    </section>

                                    {/* PM Column */}
                                    <section className=" border border-gray-200 shadow-md overflow-hidden bg-transparent">
                                        <div
                                            className="px-4 py-2 text-center font-semibold text-white"
                                            style={{ backgroundColor: "#374151" }}
                                        >
                                            {emp.name} – PM
                                        </div>
                                        <ul className="p-3 space-y-2 bg-transparent">
                                            {pmSlots.map((slot) => {
                                                const booking = findBooking(
                                                    emp.id,
                                                    slot.iso
                                                );
                                                const isFlash =
                                                    booking &&
                                                    flashIds.includes(booking.id);

                                                return (
                                                    <li
                                                        key={slot.iso}
                                                        className={`
                                                            px-3 py-1 flex items-center gap-3 transition-all duration-500
                                                            ${
                                                            isPastSlot(slot.iso)
                                                                ? "bg-transparent text-transparent border-0"
                                                                : booking
                                                                    ? isFlash
                                                                        ? "bg-yellow-300 text-black border border-yellow-300"
                                                                        : "bg-[#3d7f52] text-white border border-[#3d7f52]"
                                                                    : "bg-white text-gray-600 border border-gray-200"
                                                        }
                                                        `}
                                                    >
                                                        <div className="w-[64px] text-lg font-bold tabular-nums">
                                                            {slot.label}
                                                        </div>
                                                        {booking ? (
                                                            <div className="text-lg font-semibold truncate max-w-[180px]">
                                                                {getFirstName(
                                                                    booking.customerName
                                                                )}
                                                            </div>
                                                        ) : (
                                                            <div className="text-gray-400"></div>
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

            {/* Floating banners (not scaled, always on screen) */}
            <div className="fixed top-4 right-4 space-y-2 z-50">
                {banners.map((b) => (
                    <div
                        key={b.id}
                        className="text-white px-4 py-2 rounded-lg shadow-lg"
                        style={{ backgroundColor: "#374151" }}
                    >
                        {b.message}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default KioskBusBoard;
