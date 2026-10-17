import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import EmployeeService from "@/services/EmployeeService.ts";

type Employee = { id: string; name: string };

type Absence = {
    id: string;
    employeeId: string;
    startDate: string; // YYYY-MM-DD, inclusive
    endDate: string; // YYYY-MM-DD, inclusive
    reason: string;
};

type Conflict = {
    id: string;
    customerName: string;
    phone: string | null;
    email: string | null;
    date: string; // ISO
    employeeId: string;
};

const ABSENCE_REASONS: { value: string; label: string }[] = [
    { value: "urlaub", label: "Urlaub" },
    { value: "krankheit", label: "Krankheit" },
    { value: "feiertag", label: "Feiertag" },
];

// Local calendar day as YYYY-MM-DD (not UTC)
const todayLocal = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

const daysBetween = (from: string, to: string) =>
    Math.round((Date.parse(to + "T00:00:00Z") - Date.parse(from + "T00:00:00Z")) / 86400000) + 1;

const AdminAbsences: React.FC = () => {
    const { t, i18n } = useTranslation();
    const API_BASE = import.meta.env.VITE_API_URL;

    const [employees, setEmployees] = useState<Employee[]>([]);
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [startDate, setStartDate] = useState(todayLocal());
    const [endDate, setEndDate] = useState(todayLocal());
    const [reason, setReason] = useState("urlaub");

    const [absences, setAbsences] = useState<Absence[]>([]);
    const [loadingList, setLoadingList] = useState(true);

    const [conflicts, setConflicts] = useState<Conflict[]>([]);
    const [checkingConflicts, setCheckingConflicts] = useState(false);

    const [submitting, setSubmitting] = useState(false);
    const [feedback, setFeedback] = useState<{ type: "ok" | "err"; msg: string } | null>(null);
    // Reservations to warn about, kept visible after saving
    const [savedConflicts, setSavedConflicts] = useState<Conflict[] | null>(null);

    // The backend only checks that a token is present (same as ProtectedRoute)
    const authHeaders = useMemo(
        () => ({
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("admin_token") || ""}`,
        }),
        []
    );

    const locale = i18n.language?.startsWith("ar") ? "ar" : i18n.language?.startsWith("en") ? "en-GB" : "de-DE";
    const fmtDay = (ymd: string) =>
        new Intl.DateTimeFormat(locale, { weekday: "short", day: "2-digit", month: "2-digit", year: "numeric" }).format(
            new Date(ymd + "T12:00:00")
        );
    const fmtDateTime = (iso: string) =>
        new Intl.DateTimeFormat(locale, {
            weekday: "short",
            day: "2-digit",
            month: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
        }).format(new Date(iso));
    const employeeName = (id: string) => employees.find((e) => e.id === id)?.name ?? id;
    const reasonLabel = (value: string) =>
        t(`absences.reasons.${value}`, { defaultValue: ABSENCE_REASONS.find((r) => r.value === value)?.label ?? value });

    // ---------------- load employees once
    useEffect(() => {
        EmployeeService.getAll()
            .then((data) => {
                setEmployees(data);
                if (data.length) setSelectedIds([data[0].id]);
            })
            .catch((e) => console.error("Failed to load employees", e));
    }, []);

    // ---------------- current + upcoming absences
    const loadAbsences = useCallback(async () => {
        setLoadingList(true);
        try {
            const res = await fetch(`${API_BASE}/absences`);
            if (!res.ok) throw new Error("Failed to load absences");
            setAbsences(await res.json());
        } catch (e) {
            console.error(e);
            setFeedback({ type: "err", msg: t("absences.loadError", { defaultValue: "Abwesenheiten konnten nicht geladen werden." }) });
        } finally {
            setLoadingList(false);
        }
    }, [API_BASE, t]);

    useEffect(() => {
        loadAbsences();
    }, [loadAbsences]);

    const datesValid = !!startDate && !!endDate && startDate <= endDate;
    const canSubmit = selectedIds.length > 0 && datesValid && !submitting;

    // ---------------- preview: reservations already booked in the period
    useEffect(() => {
        if (selectedIds.length === 0 || !datesValid) {
            setConflicts([]);
            return;
        }
        let cancelled = false;
        const timer = setTimeout(async () => {
            setCheckingConflicts(true);
            try {
                const qs = new URLSearchParams({ employeeIds: selectedIds.join(","), startDate, endDate, reason });
                const res = await fetch(`${API_BASE}/absences/conflicts?${qs}`, { headers: authHeaders });
                if (!res.ok) throw new Error(`conflicts ${res.status}`);
                const data: Conflict[] = await res.json();
                if (!cancelled) setConflicts(data);
            } catch (e) {
                console.error(e);
                if (!cancelled) setConflicts([]);
            } finally {
                if (!cancelled) setCheckingConflicts(false);
            }
        }, 300);
        return () => {
            cancelled = true;
            clearTimeout(timer);
        };
    }, [API_BASE, authHeaders, selectedIds, startDate, endDate, reason, datesValid]);

    const toggleEmployee = (id: string) =>
        setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

    // ---------------- create
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!canSubmit) return;

        setSubmitting(true);
        setFeedback(null);
        setSavedConflicts(null);
        try {
            const res = await fetch(`${API_BASE}/absences`, {
                method: "POST",
                headers: authHeaders,
                body: JSON.stringify({ employeeIds: selectedIds, startDate, endDate, reason }),
            });

            if (res.status === 401) {
                setFeedback({ type: "err", msg: t("absences.loginRequired", { defaultValue: "Bitte melde dich erneut an." }) });
                return;
            }
            if (res.status === 409) {
                setFeedback({
                    type: "err",
                    msg: t("absences.overlapError", {
                        defaultValue: "Für diesen Zeitraum gibt es bereits eine Abwesenheit. Bitte zuerst die bestehende löschen.",
                    }),
                });
                return;
            }
            if (!res.ok) throw new Error(`create ${res.status}`);

            const data: { conflicts: Conflict[] } = await res.json();
            setFeedback({ type: "ok", msg: t("absences.saved", { defaultValue: "Abwesenheit gespeichert." }) });
            setSavedConflicts(data.conflicts);
            await loadAbsences();
        } catch (err) {
            console.error(err);
            setFeedback({ type: "err", msg: t("absences.saveError", { defaultValue: "Speichern fehlgeschlagen." }) });
        } finally {
            setSubmitting(false);
        }
    };

    // ---------------- delete
    const handleDelete = async (a: Absence) => {
        const confirmMsg = t("absences.confirmDelete", {
            name: employeeName(a.employeeId),
            from: fmtDay(a.startDate),
            to: fmtDay(a.endDate),
            defaultValue: "Abwesenheit von {{name}} ({{from}} – {{to}}) löschen?",
        });
        if (!window.confirm(confirmMsg)) return;

        setFeedback(null);
        try {
            const res = await fetch(`${API_BASE}/absences/${a.id}`, { method: "DELETE", headers: authHeaders });
            if (res.status === 401) {
                setFeedback({ type: "err", msg: t("absences.loginRequired", { defaultValue: "Bitte melde dich erneut an." }) });
                return;
            }
            if (!res.ok && res.status !== 404) throw new Error(`delete ${res.status}`);
            setFeedback({ type: "ok", msg: t("absences.deleted", { defaultValue: "Abwesenheit gelöscht." }) });
            await loadAbsences();
        } catch (err) {
            console.error(err);
            setFeedback({ type: "err", msg: t("absences.deleteError", { defaultValue: "Löschen fehlgeschlagen." }) });
        }
    };

    const renderConflictList = (list: Conflict[]) => (
        <ul className="mt-2 space-y-1">
            {list.map((c) => (
                <li key={c.id} className="text-sm flex flex-wrap gap-x-3">
                    <span className="font-mono">{fmtDateTime(c.date)}</span>
                    <span className="font-semibold">{c.customerName}</span>
                    <span className="text-gray-600">{employeeName(c.employeeId)}</span>
                    {c.phone && (
                        <a className="text-blue-700 hover:underline" href={`tel:${c.phone}`}>
                            {c.phone}
                        </a>
                    )}
                </li>
            ))}
        </ul>
    );

    return (
        <div className="w-full min-h-screen px-6 py-6 space-y-6">
            <form onSubmit={handleSubmit} className="w-full bg-white border rounded p-5 shadow space-y-5">
                <h1 className="text-xl font-semibold">{t("absences.title", { defaultValue: "Abwesenheiten" })}</h1>

                {/* Barbers */}
                <div>
                    <span className="block text-sm font-semibold mb-1">{t("absences.employees", { defaultValue: "Barber" })}</span>
                    <div className="flex flex-wrap gap-4">
                        {employees.map((e) => (
                            <label key={e.id} className="flex items-center gap-2 cursor-pointer">
                                <input type="checkbox" checked={selectedIds.includes(e.id)} onChange={() => toggleEmployee(e.id)} />
                                <span>{e.name}</span>
                            </label>
                        ))}
                    </div>
                </div>

                {/* Period */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label className="block text-sm font-semibold mb-1">{t("absences.from", { defaultValue: "Von" })}</label>
                        <input
                            type="date"
                            className="w-full border rounded px-3 py-2"
                            value={startDate}
                            onChange={(e) => {
                                setStartDate(e.target.value);
                                if (endDate < e.target.value) setEndDate(e.target.value);
                            }}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-semibold mb-1">{t("absences.to", { defaultValue: "Bis (einschließlich)" })}</label>
                        <input
                            type="date"
                            className="w-full border rounded px-3 py-2"
                            value={endDate}
                            min={startDate}
                            onChange={(e) => setEndDate(e.target.value)}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-semibold mb-1">{t("absences.reason", { defaultValue: "Grund" })}</label>
                        <select className="w-full border rounded px-3 py-2" value={reason} onChange={(e) => setReason(e.target.value)}>
                            {ABSENCE_REASONS.map((r) => (
                                <option key={r.value} value={r.value}>
                                    {reasonLabel(r.value)}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                {!datesValid && (
                    <p className="text-sm text-red-600">
                        {t("absences.invalidDates", { defaultValue: "Das Enddatum darf nicht vor dem Startdatum liegen." })}
                    </p>
                )}

                {/* Existing reservations in the period */}
                {checkingConflicts ? (
                    <p className="text-sm text-gray-500">{t("absences.checking", { defaultValue: "Bestehende Termine werden geprüft…" })}</p>
                ) : (
                    conflicts.length > 0 && (
                        <div className="rounded border border-orange-300 bg-orange-50 p-3">
                            <p className="text-sm font-semibold text-orange-800">
                                {t("absences.conflictsWarning", {
                                    count: conflicts.length,
                                    defaultValue:
                                        "{{count}} bestehende Termin(e) in diesem Zeitraum. Sie werden nicht storniert: bitte die Kunden informieren.",
                                })}
                            </p>
                            {renderConflictList(conflicts)}
                        </div>
                    )
                )}

                {/* Submit */}
                <div className="flex items-center gap-3">
                    <button
                        type="submit"
                        disabled={!canSubmit}
                        className={`rounded px-4 py-2 font-semibold text-white ${
                            canSubmit ? "bg-[#4e9f66] hover:bg-[#3e8455]" : "bg-gray-400 cursor-not-allowed"
                        }`}
                    >
                        {submitting
                            ? t("absences.saving", { defaultValue: "Speichern…" })
                            : t("absences.save", { defaultValue: "Abwesenheit speichern" })}
                    </button>
                    {feedback && <span className={feedback.type === "ok" ? "text-green-700" : "text-red-600"}>{feedback.msg}</span>}
                </div>

                {savedConflicts && savedConflicts.length > 0 && (
                    <div className="rounded border border-orange-300 bg-orange-50 p-3">
                        <p className="text-sm font-semibold text-orange-800">
                            {t("absences.savedConflicts", {
                                count: savedConflicts.length,
                                defaultValue: "Bitte diese {{count}} Kunden informieren:",
                            })}
                        </p>
                        {renderConflictList(savedConflicts)}
                    </div>
                )}

                <div className="text-xs text-gray-500">
                    • {t("absences.hint1", { defaultValue: "Während der Abwesenheit können Kunden bei diesem Barber nicht buchen (Website und App)." })}
                    <br />• {t("absences.hint2", { defaultValue: "Für einzelne Stunden die Seite „Zeitfenster sperren“ verwenden." })}
                </div>
            </form>

            {/* Current + upcoming absences */}
            <section className="w-full bg-white border rounded p-5 shadow">
                <h2 className="text-lg font-semibold mb-3">{t("absences.upcoming", { defaultValue: "Aktuelle und geplante Abwesenheiten" })}</h2>
                {loadingList ? (
                    <p className="text-gray-500">{t("absences.loading", { defaultValue: "Laden…" })}</p>
                ) : absences.length === 0 ? (
                    <p className="text-gray-500">{t("absences.none", { defaultValue: "Keine Abwesenheiten geplant." })}</p>
                ) : (
                    <ul className="divide-y">
                        {absences.map((a) => {
                            const ongoing = a.startDate <= todayLocal();
                            return (
                                <li key={a.id} className="py-2 flex flex-wrap items-center justify-between gap-3">
                                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                                        <span className="font-semibold">{employeeName(a.employeeId)}</span>
                                        <span>
                                            {fmtDay(a.startDate)} – {fmtDay(a.endDate)}
                                        </span>
                                        <span className="text-sm text-gray-600">
                                            ({t("absences.days", { count: daysBetween(a.startDate, a.endDate), defaultValue: "{{count}} Tag(e)" })})
                                        </span>
                                        <span className="text-xs font-semibold text-orange-700">{reasonLabel(a.reason)}</span>
                                        {ongoing && (
                                            <span className="text-xs rounded bg-orange-100 text-orange-800 px-2 py-0.5">
                                                {t("absences.ongoing", { defaultValue: "läuft" })}
                                            </span>
                                        )}
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => handleDelete(a)}
                                        className="text-sm text-red-600 hover:underline"
                                    >
                                        {t("absences.delete", { defaultValue: "Löschen" })}
                                    </button>
                                </li>
                            );
                        })}
                    </ul>
                )}
            </section>
        </div>
    );
};

export default AdminAbsences;
