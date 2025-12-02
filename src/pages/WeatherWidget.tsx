import React, { useEffect, useState } from "react";

type WeatherIcon = "sun" | "cloud" | "rain" | "storm" | "snow" | "fog";

type WeatherResponse = {
    location: string;
    temperature: number;
    feelsLike: number;
    condition: string;
    icon: WeatherIcon;
    rainChancePercent: number;
};

// If you want to configure it via .env, set VITE_WEATHER_API_URL="/api/weather"
const API_BASE = import.meta.env.VITE_RATHAUS_API_URL ?? "/api/weather";

const iconEmoji: Record<WeatherIcon, string> = {
    sun: "☀️",
    cloud: "☁️",
    rain: "🌧️",
    storm: "⛈️",
    snow: "❄️",
    fog: "🌫️",
};

const WeatherWidget: React.FC = () => {
    const [data, setData] = useState<WeatherResponse | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const loadData = async () => {
        try {
            setLoading(true);
            setError(null);

            const res = await fetch(`${API_BASE}/weather`);
            if (!res.ok) {
                throw new Error(`HTTP ${res.status}`);
            }

            const json = (await res.json()) as WeatherResponse;
            setData(json);
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
        // Alle 5 Minuten aktualisieren
        const id = setInterval(loadData, 5 * 60_000);
        return () => clearInterval(id);
    }, []);

    const umbrellaHint =
        data && data.rainChancePercent >= 50
            ? "Regenschirm empfohlen ☂️"
            : "Kein Regenschirm nötig 🙂";

    return (
        <div className="w-full max-w-md rounded-3xl bg-white p-4 shadow-[0_18px_45px_rgba(0,0,0,0.15)]">
            {/* Header */}
            <div className="mb-3 flex items-start justify-between">
                <div>
                    <h2 className="text-lg font-bold text-slate-900 tracking-wide">
                        Wetter
                    </h2>
                    <p className="mt-0.5 text-xs text-slate-500">
                        {data?.location ?? "Aktuelles Wetter"}
                    </p>
                </div>
            </div>

            {/* Error */}
            {error && (
                <p className="mb-3 rounded-lg bg-red-100 px-3 py-2 text-xs text-red-700">
                    Fehler beim Laden: {error}
                </p>
            )}

            {/* Loading */}
            {loading && !data && (
                <p className="text-sm text-slate-700">Wird geladen…</p>
            )}

            {/* Content */}
            {data && !loading && !error && (
                <div className="flex items-center justify-between">
                    {/* Left: icon + temperature */}
                    <div className="flex items-center gap-3">
                        <div className="text-4xl">
                            {iconEmoji[data.icon] ?? iconEmoji.sun}
                        </div>
                        <div>
                            <div className="text-3xl font-semibold text-slate-900">
                                {Math.round(data.temperature)}°C
                            </div>
                            <div className="text-xs text-slate-500">
                                Fühlt sich an wie {Math.round(data.feelsLike)}°C
                            </div>
                            <div className="text-xs text-slate-600">{data.condition}</div>
                        </div>
                    </div>

                    {/* Right: rain info */}
                    <div className="text-right">
                        <div className="text-xs text-slate-500">Regenwahrscheinlichkeit</div>
                        <div className="text-xl font-bold text-blue-600">
                            {Math.round(data.rainChancePercent)}%
                        </div>
                        <div className="mt-1 text-xs text-slate-600">{umbrellaHint}</div>
                    </div>
                </div>
            )}

            {/* Fallback if no data but also no error */}
            {!data && !loading && !error && (
                <p className="text-sm text-slate-700">Keine Wetterdaten verfügbar.</p>
            )}
        </div>
    );
};

export default WeatherWidget;
