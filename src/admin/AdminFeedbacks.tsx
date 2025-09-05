// src/admin/AdminFeedbacks.tsx
import React, { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import FeedbackService, { Feedback } from "@/services/FeedbackService";
import DeleteModal from "@/common/DeleteModal";

type Filter = "all" | "pending" | "validated";

const AdminFeedbacks: React.FC = () => {
    const { t } = useTranslation();

    const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [filter, setFilter] = useState<Filter>("all");
    const [validatingId, setValidatingId] = useState<string | null>(null);

    // delete modal state
    const [deleting, setDeleting] = useState<Feedback | null>(null);

    // Load feedbacks
    useEffect(() => {
        const load = async () => {
            setLoading(true);
            setError("");
            try {
                const data = await FeedbackService.getAllFeedBacks();
                setFeedbacks(data);
            } catch (e) {
                console.error(e);
                setError(t("adminFeedbacks.errorLoading", "Fehler beim Laden der Feedbacks."));
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [t]);

    console.log(feedbacks);

    const visibleFeedbacks = useMemo(() => {
        if (filter === "pending") return feedbacks.filter((f) => !f.approved);
        if (filter === "validated") return feedbacks.filter((f) => f.approved);
        return feedbacks;
    }, [feedbacks, filter]);

    const handleValidate = async (id: string) => {
        try {
            setValidatingId(id);
            const updated = await FeedbackService.validate(id);
            setFeedbacks((prev) =>
                prev.map((f) =>
                    f.id === id ? { ...f, ...(updated ?? {}), approved: updated?.approved ?? true } : f
                )
            );
        } catch (e) {
            console.error(e);
            setError(t("adminFeedbacks.errorValidate", "Validierung fehlgeschlagen."));
        } finally {
            setValidatingId(null);
        }
    };

    const handleDeleteConfirmed = async () => {
        if (!deleting) return;
        try {
            await FeedbackService.remove(deleting.id);
            setFeedbacks((prev) => prev.filter((f) => f.id !== deleting.id));
            setDeleting(null);
        } catch (e) {
            console.error(e);
            setError(t("adminFeedbacks.errorDelete", "Löschen fehlgeschlagen."));
        }
    };

    const getEntityName = (f: Feedback | null) => {
        if (!f) return "";
        if (f.name && f.name.trim()) return f.name;
        if (f.email && f.email.trim()) return f.email;
        const msg = f.message || "";
        return msg.length > 30 ? msg.slice(0, 30) + "…" : msg || t("adminFeedbacks.feedback", "Feedback");
    };

    return (
        <div className="p-6 max-w-6xl mx-auto">
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-3xl font-bold">{t("adminFeedbacks.title", "Feedbacks")}</h1>

                <div className="flex gap-2">
                    <FilterButton current={filter} value="all" onClick={setFilter}>
                        {t("adminFeedbacks.filter.all", "Alle")}
                    </FilterButton>
                    <FilterButton current={filter} value="pending" onClick={setFilter}>
                        {t("adminFeedbacks.filter.pending", "Ausstehend")}
                    </FilterButton>
                    <FilterButton current={filter} value="validated" onClick={setFilter}>
                        {t("adminFeedbacks.filter.validated", "Validiert")}
                    </FilterButton>
                </div>
            </div>

            {loading ? (
                <p className="text-gray-500">{t("adminFeedbacks.loading", "Lade Feedbacks...")}</p>
            ) : error ? (
                <p className="text-red-500">{error}</p>
            ) : visibleFeedbacks.length === 0 ? (
                <p className="text-gray-600">{t("adminFeedbacks.noFeedbacksFound", "Keine Feedbacks gefunden.")}</p>
            ) : (
                <div className="overflow-x-auto">
                    <table className="min-w-full bg-white shadow rounded border">
                        <thead className="bg-gray-100 text-left text-sm font-medium text-gray-700">
                        <tr>
                            <th className="px-4 py-2">{t("adminFeedbacks.name", "Name")}</th>
                            <th className="px-4 py-2">{t("adminFeedbacks.email", "E-Mail")}</th>
                            <th className="px-4 py-2">{t("adminFeedbacks.message", "Nachricht")}</th>
                            <th className="px-4 py-2">{t("adminFeedbacks.createdAt", "Erstellt am")}</th>
                            <th className="px-4 py-2">{t("adminFeedbacks.status", "Status")}</th>
                            <th className="px-4 py-2">{t("adminFeedbacks.actions", "Aktionen")}</th>
                        </tr>
                        </thead>
                        <tbody>
                        {visibleFeedbacks.map((f) => (
                            <tr key={f.id} className="border-t text-sm text-gray-800 align-top">
                                <td className="px-4 py-2">{f.name || "-"}</td>
                                <td className="px-4 py-2">{f.email || "-"}</td>
                                <td className="px-4 py-2 max-w-xl">
                                    <p className="whitespace-pre-wrap break-words">{f.message}</p>
                                </td>
                                <td className="px-4 py-2">{new Date(f.createdAt).toLocaleString()}</td>
                                <td className="px-4 py-2">
                    <span
                        className={`px-2 py-1 rounded text-xs ${
                            f.approved ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"
                        }`}
                    >
                      {f.approved
                          ? t("adminFeedbacks.validated", "Validiert")
                          : t("adminFeedbacks.pending", "Ausstehend")}
                    </span>
                                </td>
                                <td className="px-4 py-2">
                                    <div className="flex items-center gap-3">
                                        {!f.approved ? (
                                            <button
                                                onClick={() => handleValidate(f.id)}
                                                disabled={validatingId === f.id}
                                                className={`px-3 py-1 rounded text-white ${
                                                    validatingId === f.id
                                                        ? "bg-gray-400 cursor-not-allowed"
                                                        : "bg-[#4e9f66] hover:bg-green-600"
                                                }`}
                                            >
                                                {validatingId === f.id
                                                    ? t("adminFeedbacks.validating", "Validiere...")
                                                    : t("adminFeedbacks.validate", "Validieren")}
                                            </button>
                                        ) : (
                                            <span className="text-gray-400">—</span>
                                        )}

                                        {/* Delete action */}
                                        <button
                                            className="text-red-600 hover:underline"
                                            onClick={() => setDeleting(f)}
                                            aria-label={t("buttons.delete", "Löschen")}
                                        >
                                            {t("buttons.delete", "Löschen")}
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Delete Modal */}
            <DeleteModal
                isOpen={!!deleting}
                onClose={() => setDeleting(null)}
                onConfirm={handleDeleteConfirmed}
                entityName={getEntityName(deleting)}
            />
        </div>
    );
};

const FilterButton: React.FC<{
    current: "all" | "pending" | "validated";
    value: "all" | "pending" | "validated";
    onClick: (v: "all" | "pending" | "validated") => void;
    children: React.ReactNode;
}> = ({ current, value, onClick, children }) => (
    <button
        onClick={() => onClick(value)}
        className={`px-3 py-1 rounded border text-sm ${
            current === value
                ? "bg-gray-800 text-white border-gray-800"
                : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
        }`}
    >
        {children}
    </button>
);

export default AdminFeedbacks;
