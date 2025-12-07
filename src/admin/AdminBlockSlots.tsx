import React, { useEffect, useMemo, useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import EmployeeService from "@/services/EmployeeService.ts";

type Employee = { id: string; name: string };
type Reservation = {
    id: string;
    customerName: string;
    service: string;
    date: string;        // ISO
    employeeId: string;
};
type Slot = {
    iso: string;         // ISO début
    label: string;       // ex "09:30"
    hour: number;
    minutes: number;
    booked: boolean;     // déjà réservé => checkbox disabled
};

const SLOT_MINUTES = 30;
const DAY_START = { h: 9, m: 30 };  // 09:30
const DAY_END   = { h: 19, m: 0 };  // 19:00

const AdminBlockSlotsTwoCols: React.FC = () => {
    const { t, i18n } = useTranslation();
    const API_BASE = import.meta.env.VITE_API_URL;

    const [employees, setEmployees] = useState<Employee[]>([]);
    const [employeeId, setEmployeeId] = useState("");
    const [date, setDate] = useState<string>(() => new Date().toISOString().slice(0, 10)); // YYYY-MM-DD

    const [slots, setSlots] = useState<Slot[]>([]);
    const [checked, setChecked] = useState<Record<string, boolean>>({});

    const [loadingEmps, setLoadingEmps] = useState(true);
    const [loadingSlots, setLoadingSlots] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [feedback, setFeedback] = useState<{ type: "ok" | "err"; msg: string } | null>(null);

    const authHeaders = useMemo(
        () => ({
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("admin_token") || ""}`,
        }),
        []
    );

    // ---------------- utils
    const atDate = (yyyyMmDd: string, h: number, m = 0) => {
        const [Y, M, D] = yyyyMmDd.split("-").map(Number);
        return new Date(Y, (M - 1), D, h, m, 0, 0);
    };
    function* slotsOfDay(stepMin: number, start: Date, end: Date): Generator<Date> {
        const t = new Date(start);
        while (t <= end) {
            yield new Date(t);
            t.setMinutes(t.getMinutes() + stepMin);
        }
    }
    const fmtTime = (d: Date) =>
        new Intl.DateTimeFormat(i18n.language || "de-DE", { hour: "2-digit", minute: "2-digit" }).format(d);

    const isoToHM = (iso: string) => {
        const d = new Date(iso);
        const hh = String(d.getHours()).padStart(2, "0");
        const mm = String(d.getMinutes()).padStart(2, "0");
        return `${hh}:${mm}`;
    };
    const hmToIsoLocal = (yyyyMmDd: string, hm: string) => {
        const [Y, M, D] = yyyyMmDd.split("-").map(Number);
        const [h, m] = hm.split(":").map(Number);
        return new Date(Y, M - 1, D, h, m, 0, 0).toISOString();
    };

    // ---------------- load employees once
    useEffect(() => {
        const loadEmployees = async () => {
            try {
                const data = await EmployeeService.getAll();

                setEmployees(data);

                if (data.length && !employeeId) {
                    setEmployeeId(data[0].id);
                }
            } catch (e) {
                console.error('Failed to load employees', e);
            } finally {
                setLoadingEmps(false);
            }
        };

        loadEmployees();
    }, [employeeId]);


    // ---------------- reusable loader
    const loadSlots = useCallback(async () => {
        if (!employeeId || !date) return;
        setLoadingSlots(true);
        setFeedback(null);
        setChecked({});

        try {
            // Idéal: GET /reservations?employeeId=...&date=YYYY-MM-DD
            const res = await fetch(`${API_BASE}/reservations`, { headers: authHeaders });
            if (!res.ok) throw new Error("Failed to load reservations");
            const all: Reservation[] = await res.json();

            const start = atDate(date, DAY_START.h, DAY_START.m);
            const end   = atDate(date, DAY_END.h, DAY_END.m);

            const dayRes = all.filter(r => {
                if (r.employeeId !== employeeId) return false;
                const d = new Date(r.date);
                return d >= start && d <= end;
            });

            const busy = new Set(dayRes.map(r => new Date(r.date).getTime()));
            const generated: Slot[] = Array.from(slotsOfDay(SLOT_MINUTES, start, end)).map(d => ({
                iso: d.toISOString(),
                label: fmtTime(d),
                hour: d.getHours(),
                minutes: d.getMinutes(),
                booked: busy.has(d.getTime()),
            }));
            setSlots(generated);
        } catch (e) {
            console.error(e);
            setSlots([]);
        } finally {
            setLoadingSlots(false);
        }
    }, [API_BASE, authHeaders, employeeId, date, i18n.language]);

    // initial + when dependencies change
    useEffect(() => {
        loadSlots();
    }, [loadSlots]);

    // ---------------- AM / PM split
    const amSlots = useMemo(
        () => slots.filter(s => s.hour < 14 || (s.hour === 14 && s.minutes === 0)),
        [slots]
    );
    const pmSlots = useMemo(
        () => slots.filter(s => s.hour > 14 || (s.hour === 14 && s.minutes > 0)),
        [slots]
    );

    // ---------------- selection helpers
    const enabledKeys = slots.filter(s => !s.booked).map(s => s.iso);
    const allSelected = enabledKeys.length > 0 && enabledKeys.every(k => checked[k]);
    const selectedCount = enabledKeys.filter(k => checked[k]).length;
    const canSubmit = !!employeeId && !!date && selectedCount > 0 && !submitting;

    const toggleAll = () => {
        const next = { ...checked };
        if (allSelected) enabledKeys.forEach(k => (next[k] = false));
        else enabledKeys.forEach(k => (next[k] = true));
        setChecked(next);
    };


    // ---------------- submit: POST /reservations avec "__BLOCK__"
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!canSubmit) return;

        setSubmitting(true);
        setFeedback(null);

        const chosen = slots.filter(s => checked[s.iso] && !s.booked);
        const tasks = chosen.map(s => {
            const fromHM = isoToHM(s.iso);
            const iso = hmToIsoLocal(date, fromHM);
            return fetch(`${API_BASE}/reservations`, {
                method: "POST",
                headers: authHeaders,
                body: JSON.stringify({
                    customerName: "__BLOCK__",
                    service: "__BLOCK__",
                    email: null,
                    phone: null,
                    date: iso,
                    employeeId
                }),
            });
        });

        try {
            const results = await Promise.allSettled(tasks);
            const ok = results.filter(r => r.status === "fulfilled" && (r.value as Response).ok).length;
            const fail = results.length - ok;

            if (ok > 0) {
                setFeedback({ type: "ok", msg: `${ok} slot(s) bloqué(s)${fail ? `, ${fail} en échec` : ""}.` });
                setChecked({});
                await loadSlots(); // <-- refresh slots sans reload page
            } else {
                setFeedback({ type: "err", msg: "Échec du blocage des créneaux." });
            }
        } catch (err) {
            console.error(err);
            setFeedback({ type: "err", msg: "Erreur réseau lors du blocage." });
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="w-full min-h-screen px-6 py-6">


            <form onSubmit={handleSubmit} className="w-full bg-white border rounded p-5 shadow space-y-5">
                {/* Employé + Date */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-semibold mb-1">{t("adminBlockSlots.employee") || "Employé"}</label>
                        <select
                            className="w-full border rounded px-3 py-2"
                            value={employeeId}
                            onChange={(e) => setEmployeeId(e.target.value)}
                            disabled={loadingEmps}
                        >
                            {employees.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-semibold mb-1">{t("adminBlockSlots.date") || "Date"}</label>
                        <input
                            type="date"
                            className="w-full border rounded px-3 py-2"
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                        />
                    </div>
                </div>

                {/* Actions globales */}
                <div className="flex items-center justify-between">
                    <span className="font-semibold">{t("adminBlockSlots.slots") || "Créneaux de la journée"}</span>
                    <button
                        type="button"
                        onClick={toggleAll}
                        className="text-sm text-blue-700 hover:underline disabled:text-gray-400"
                        disabled={loadingSlots || enabledKeys.length === 0}
                    >
                        {allSelected
                            ? (t("adminBlockSlots.unselectAll") || "Tout désélectionner")
                            : (t("adminBlockSlots.selectAll") || "Tout sélectionner")}
                    </button>
                </div>

                {/* 2 colonnes parallèles AM / PM */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* AM */}
                    <section className="rounded-2xl border">
                        <div className="px-4 py-2 text-center font-semibold text-white" style={{ backgroundColor: "#374151" }}>
                            AM
                        </div>
                        <ul className="p-3 space-y-2">
                            {loadingSlots ? (
                                <li className="text-gray-500">{t("adminBlockSlots.loadingSlots") || "Chargement..."}</li>
                            ) : amSlots.length === 0 ? (
                                <li className="text-gray-500">{t("adminBlockSlots.noSlots") || "Aucun créneau"}</li>
                            ) : (
                                amSlots.map(s => {
                                    const key = s.iso;
                                    return (
                                        <li
                                            key={key}
                                            className={`rounded-xl px-3 py-1.5 flex items-center justify-between border ${s.booked ? "opacity-60" : ""}`}
                                        >
                                            <div className="flex items-center gap-3">
                                                <input
                                                    type="checkbox"
                                                    disabled={s.booked}
                                                    checked={!!checked[key]}
                                                    onChange={() => setChecked(prev => ({ ...prev, [key]: !prev[key] }))}
                                                />
                                                <span className="font-mono text-sm">{s.label}</span>
                                            </div>
                                            {s.booked && <span className="text-xs text-gray-600">{t("adminBlockSlots.booked") || "Réservé"}</span>}
                                        </li>
                                    );
                                })
                            )}
                        </ul>
                    </section>

                    {/* PM */}
                    <section className="rounded-2xl border">
                        <div className="px-4 py-2 text-center font-semibold text-white" style={{ backgroundColor: "#374151" }}>
                            PM
                        </div>
                        <ul className="p-3 space-y-2">
                            {loadingSlots ? (
                                <li className="text-gray-500">{t("adminBlockSlots.loadingSlots") || "Chargement..."}</li>
                            ) : pmSlots.length === 0 ? (
                                <li className="text-gray-500">{t("adminBlockSlots.noSlots") || "Aucun créneau"}</li>
                            ) : (
                                pmSlots.map(s => {
                                    const key = s.iso;
                                    return (
                                        <li
                                            key={key}
                                            className={`rounded-xl px-3 py-1.5 flex items-center justify-between border ${s.booked ? "opacity-60" : ""}`}
                                        >
                                            <div className="flex items-center gap-3">
                                                <input
                                                    type="checkbox"
                                                    disabled={s.booked}
                                                    checked={!!checked[key]}
                                                    onChange={() => setChecked(prev => ({ ...prev, [key]: !prev[key] }))}
                                                />
                                                <span className="font-mono text-sm">{s.label}</span>
                                            </div>
                                            {s.booked && <span className="text-xs text-gray-600">{t("adminBlockSlots.booked") || "Réservé"}</span>}
                                        </li>
                                    );
                                })
                            )}
                        </ul>
                    </section>
                </div>



                {/* Submit */}
                <div className="flex items-center gap-3">
                    <button
                        type="submit"
                        disabled={!canSubmit}
                        className={`rounded px-4 py-2 font-semibold text-white ${
                            canSubmit ? "bg-[#4e9f66] hover:bg-[#3e8455]" : "bg-gray-400 cursor-not-allowed"
                        }`}
                    >
                        {submitting ? (t("adminBlockSlots.saving") || "Enregistrement…") : (t("adminBlockSlots.block") || "Bloquer")}
                    </button>
                    {feedback && (
                        <span className={feedback.type === "ok" ? "text-green-700" : "text-red-600"}>
              {feedback.msg}
            </span>
                    )}
                </div>
            </form>
        </div>
    );
};

export default AdminBlockSlotsTwoCols;
