import React, { useEffect, useState } from "react";
import busIcon from "../../public/images/bus.png";
import tramIcon from "../../public/images/tram.png";

type Mode = "tram" | "bus" | "other";

type Departure = {
    line: string;
    mode: Mode;
    direction: string;
    plannedTime: string | null;
    countdownMinutes: number | null;
    platform: string | null;
};

type RathausResponse = {
    stopName: string;
    city: string;
    departures: Departure[];
};

const API_BASE = import.meta.env.VITE_API_URL;

const formatTime = (iso: string | null): string => {
    if (!iso) return "";
    const d = new Date(iso);
    return d.toLocaleTimeString("de-DE", {
        hour: "2-digit",
        minute: "2-digit",
    });
};

const formatCountdown = (minutes: number | null): string => {
    if (minutes == null) return "";
    if (minutes <= 0) return "Sofort";
    if (minutes === 1) return "1";
    return `${minutes}`;
};

const isDelayed = (plannedTime: string | null, nowMs: number): boolean => {
    if (!plannedTime) return false;
    const t = new Date(plannedTime).getTime();
    return t < nowMs;
};

/**
 * Decide if a departure should still be shown.
 * - If countdownMinutes ≥ -1 → keep (vehicle is about to leave / leaving)
 * - Else, keep only if plannedTime is still in the future.
 */
const shouldDisplayDeparture = (d: Departure, nowMs: number): boolean => {
    if (d.countdownMinutes !== null && d.countdownMinutes >= -1) {
        return true;
    }

    if (d.plannedTime) {
        const t = new Date(d.plannedTime).getTime();
        if (t >= nowMs) {
            return true;
        }
    }

    return false;
};

const RathausWidget: React.FC = () => {
    const [data, setData] = useState<RathausResponse | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

    const loadData = async () => {
        try {
            setLoading(true);
            setError(null);

            const res = await fetch(`${API_BASE}/rathaus`);
            if (!res.ok) throw new Error(`HTTP ${res.status}`);

            const json = (await res.json()) as RathausResponse;

            const sorted = [...json.departures].sort((a, b) => {
                if (!a.plannedTime || !b.plannedTime) return 0;
                return a.plannedTime.localeCompare(b.plannedTime);
            });

            setData({ ...json, departures: sorted });
            setLastUpdated(new Date());
        } catch (e: unknown) {
            const msg =
                e instanceof Error
                    ? e.message
                    : "Es ist ein unbekannter Fehler aufgetreten";
            setError(msg);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
        const id = setInterval(loadData, 60_000);
        return () => clearInterval(id);
    }, []);

    const lastUpdatedText =
        lastUpdated &&
        lastUpdated.toLocaleTimeString("de-DE", {
            hour: "2-digit",
            minute: "2-digit",
        });

    // Prepare filtered departures (hide past departures)
    const nowMs = Date.now();
    const validDepartures =
        data?.departures.filter((d) => shouldDisplayDeparture(d, nowMs)) ?? [];

    return (
        <div className="w-full max-w-2xl rounded-3xl border border-slate-200 bg-white p-4 shadow-[0_18px_45px_rgba(15,23,42,0.12)]">
            {/* Header */}
            <div className="mb-3 flex items-start justify-between gap-3">
                <div>
                    <div className="flex items-center gap-2">
                        <h2 className="text-lg font-semibold text-slate-900">
                            {data
                                ? `${data.stopName} – ${data.city}`
                                : "Rathaus – Braunschweig"}
                        </h2>
                        <span className="inline-flex items-center rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-700">
                            ● Echtzeit
                        </span>
                    </div>
                    <p className="mt-0.5 text-xs text-slate-500">
                        Nächste Abfahrten in Echtzeit
                    </p>
                    {lastUpdatedText && (
                        <p className="mt-0.5 text-[10px] text-slate-400">
                            Aktualisiert um {lastUpdatedText}
                        </p>
                    )}
                </div>

                <button
                    type="button"
                    onClick={loadData}
                    disabled={loading}
                    className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium shadow-sm transition ${
                        loading
                            ? "cursor-default border-slate-200 bg-slate-100 text-slate-400"
                            : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50"
                    }`}
                >
                    {loading ? (
                        <span className="flex items-center gap-1">
                            <span className="h-3 w-3 animate-spin rounded-full border border-slate-300 border-t-slate-500" />
                            Wird aktualisiert…
                        </span>
                    ) : (
                        "Aktualisieren"
                    )}
                </button>
            </div>

            {error && (
                <p className="mb-2 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">
                    Fehler beim Laden: {error}
                </p>
            )}

            {loading && !data && (
                <p className="text-sm text-slate-500">Wird geladen…</p>
            )}

            {data && validDepartures.length === 0 && !loading && !error && (
                <p className="text-sm text-slate-500">
                    Aktuell keine Abfahrten verfügbar.
                </p>
            )}

            {data && validDepartures.length > 0 && (
                // No internal scroll: widget grows with content
                <div className="pr-1">
                    {/* Column header */}
                    <div className="mb-1 flex items-center gap-3 border-b border-slate-100 bg-white px-2 py-1 text-[10px] font-medium uppercase tracking-wide text-slate-400">
                        <div className="flex min-w-[92px] items-center gap-2">
                            <span className="w-10" />
                            <span className="w-10 text-right">Linie</span>
                        </div>
                        <span className="text-[9px] text-slate-300">|</span>
                        <span className="w-14">Uhrzeit</span>
                        <span className="text-[9px] text-slate-300">|</span>
                        <span className="w-16">In</span>
                        <span className="text-[9px] text-slate-300">|</span>
                        <span className="w-16">Steig</span>
                        <span className="w-16">Ziel</span>
                        <span className="flex-1" />
                    </div>

                    <ul className="divide-y divide-slate-100">
                        {validDepartures.map((d, index) => {
                            const isTram = d.mode === "tram";
                            const isBus = d.mode === "bus";
                            const icon = isTram ? tramIcon : isBus ? busIcon : "";

                            return (
                                <li
                                    key={`${d.line}-${d.direction}-${d.plannedTime ?? index}`}
                                    className="flex items-center gap-3 px-2 py-3 hover:bg-slate-50/80"
                                >
                                    {/* Icon + line */}
                                    <div className="flex min-w-[92px] items-center gap-3">
                                        <div
                                            className={`flex h-10 w-10 items-center justify-center rounded-xl ring-1 
    ${isTram ? "bg-red-50 ring-red-200" : ""}
    ${isBus ? "bg-blue-50 ring-blue-200" : ""}
    ${!isTram && !isBus ? "bg-slate-50 ring-slate-100" : ""}
  `}
                                        >

                                            {icon && (
                                                <img
                                                    src={icon}
                                                    alt={isTram ? "Straßenbahn" : "Bus"}
                                                    className="h-8 w-8 object-contain"
                                                />
                                            )}
                                        </div>
                                        <div className="flex flex-col items-end">
                                            <span className="w-10 text-right text-sm font-semibold text-slate-900">
                                                {d.line}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Separator */}
                                    <span className="text-xs text-slate-300">|</span>

                                    {/* Time */}
                                    <span className="w-14 text-sm font-medium text-slate-800">
                                        {formatTime(d.plannedTime)}
                                    </span>

                                    {/* Separator */}
                                    <span className="text-xs text-slate-300">|</span>

                                    {/* Countdown (real-time) */}
                                    <span
                                        className={`w-16 text-xs ${
                                            d.countdownMinutes !== null &&
                                            d.countdownMinutes <= 3
                                                ? "font-semibold text-emerald-600"
                                                : "text-slate-600"
                                        }`}
                                    >
                                        {formatCountdown(d.countdownMinutes)}
                                    </span>

                                    {/* Separator */}
                                    <span className="text-xs text-slate-300">|</span>

                                    {/* Platform */}
                                    <span className="w-16">
                                        {d.platform && (
                                            <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-[2px] text-[11px] font-medium text-slate-700">
                                                {d.platform}
                                            </span>
                                        )}
                                    </span>

                                    {/* Direction + delay badge */}
                                    <span className="ml-2 flex-1 truncate text-xs text-slate-500">
                                        {d.direction}
                                        {isDelayed(d.plannedTime, nowMs) && (
                                            <span className="ml-2 rounded-full bg-amber-50 px-2 py-[1px] text-[10px] font-medium text-amber-700">
                                                Verspätet
                                            </span>
                                        )}
                                    </span>
                                </li>
                            );
                        })}
                    </ul>
                </div>
            )}
        </div>
    );
};

export default RathausWidget;
