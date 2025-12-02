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

const API_BASE = import.meta.env.VITE_RATHAUS_API_URL;

// Yellow-on-black countdown formatting
const formatCountdownDisplay = (minutes: number | null): string => {
    if (minutes == null) return "";
    if (minutes <= 0) return "sofort";
    if (minutes === 1) return "1 min";
    return `${minutes} min`;
};



// Fallback if no realtime available
const getEffectiveCountdown = (
    d: Departure,
    nowMs: number
): number | null => {
    if (d.countdownMinutes != null) return d.countdownMinutes;

    if (!d.plannedTime) return null;
    const diffMs = new Date(d.plannedTime).getTime() - nowMs;
    return Math.round(diffMs / 60000);
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
        // ⚠️ Faster interval: 10 seconds (real station feeling)
        const id = setInterval(loadData, 10_000);
        return () => clearInterval(id);
    }, []);

    const lastUpdatedText =
        lastUpdated &&
        lastUpdated.toLocaleTimeString("de-DE", {
            hour: "2-digit",
            minute: "2-digit",
        });

    const nowMs = Date.now();
    const validDepartures =
        data?.departures
            .map((d) => ({
                ...d,
                effectiveCountdown: getEffectiveCountdown(d, nowMs),
            }))
            .filter((d) => d.effectiveCountdown !== null && d.effectiveCountdown >= -1)
            .sort(
                (a, b) =>
                    (a.effectiveCountdown as number) -
                    (b.effectiveCountdown as number)
            ) ?? [];

    return (
        <div className="w-full max-w-2xl rounded-3xl bg-white p-4 shadow-[0_18px_45px_rgba(0,0,0,0.15)]">
            {/* Header */}
            <div className="mb-4 flex items-start justify-between">
                <div>
                    <h2 className="text-lg font-bold text-slate-900 tracking-wide">
                        {data ? `${data.stopName} – ${data.city}` : "Rathaus – Braunschweig"}
                    </h2>

                    <p className="mt-0.5 text-xs text-slate-500">
                        Nächste Abfahrten – Echtzeit
                    </p>

                    {lastUpdatedText && (
                        <p className="mt-0.5 text-[10px] text-slate-400">
                            Aktualisiert um {lastUpdatedText}
                        </p>
                    )}
                </div>
            </div>

            {error && (
                <p className="mb-3 rounded-lg bg-red-100 px-3 py-2 text-xs text-red-700">
                    Fehler beim Laden: {error}
                </p>
            )}

            {loading && !data && (
                <p className="text-sm text-slate-700">Wird geladen…</p>
            )}

            {validDepartures.length === 0 && !loading && !error && (
                <p className="text-sm text-slate-700">
                    Keine Abfahrten verfügbar.
                </p>
            )}

            {validDepartures.length > 0 && (
                <ul>
                    {validDepartures.map((d, index) => {
                        const isTram = d.mode === "tram";
                        const isBus = d.mode === "bus";
                        const icon = isTram ? tramIcon : isBus ? busIcon : "";
                        const minutes = d.effectiveCountdown;

                        return (
                            <li
                                key={index}
                                className="flex items-center justify-between py-2 border-b border-slate-300/60"
                            >
                                {/* Line badge */}
                                <div className="flex items-center gap-3 w-24">
                                    <div
                                        className={`flex h-10 w-10 items-center justify-center 
                                    ${!isTram && !isBus ? "bg-gray-200 ring-gray-300" : ""}
                                `}
                                    >
                                        {icon && (
                                            <img
                                                src={icon}
                                                alt={isTram ? "Straßenbahn" : "Bus"}
                                                className="h-10 w-10 object-contain"
                                            />
                                        )}
                                    </div>
                                    <span className="text-lg font-bold text-slate-900">
                                {d.line}
                            </span>
                                </div>

                                {/* Destination */}
                                <span className="flex-1 text-slate-800 text-sm">
                            {d.direction}
                        </span>

                                {/* Platform */}
                                <span className="w-12 text-center text-slate-700">
                            {d.platform}
                        </span>

                                {/* Countdown */}
                                <span className="w-16 text-right text-blue-600 font-bold">
                            {formatCountdownDisplay(minutes)}
                        </span>
                            </li>
                        );
                    })}
                </ul>
            )}
        </div>

    );
};

export default RathausWidget;
