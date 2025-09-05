import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import FeedbackService from "@/services/FeedbackService.ts";
import toast from "react-hot-toast";

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const FeedbackPage: React.FC = () => {
    const { t } = useTranslation();
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [message, setMessage] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);

    // simple honeypot (hidden) to reduce bots
    const [company, setCompany] = useState("");

    const validate = () => {
        if (!name.trim() || !email.trim() || !message.trim()) {
            toast.error(t("feedback.form.required", "Bitte fülle alle Felder aus."));
            return false;
        }
        if (!emailRegex.test(email.trim())) {
            toast.error(t("feedback.form.invalidEmail", "Bitte gib eine gültige E-Mail ein."));
            return false;
        }
        return true;
    };

    const onSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (company) return; // bot trap
        if (!validate()) return;

        setSubmitting(true);
        try {
            await FeedbackService.create({ name: name.trim(), email: email.trim(), message: message.trim() });
            setSubmitted(true);
            toast.success(t("feedback.form.successToast", "Vielen Dank für dein Feedback!"));
            setName("");
            setEmail("");
            setMessage("");
        } catch (err: any) {
            console.error(err);
            toast.error(
                err?.message ||
                t("feedback.form.errorToast", "Senden fehlgeschlagen. Bitte versuche es später erneut.")
            );
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="p-6 max-w-3xl mx-auto">
            <h1 className="text-3xl font-bold mb-2">{t("feedback.title", "Dein Feedback")}</h1>
            <p className="text-gray-600 mb-6">
                {t(
                    "feedback.subtitle",
                    "Sag uns bitte, wie zufrieden du warst und was wir besser machen können."
                )}
            </p>

            {submitted && (
                <div className="mb-6 rounded border border-green-200 bg-green-50 p-4 text-green-800">
                    {t("feedback.thankyou", "Danke! Dein Feedback wurde gesendet und wird nach Prüfung veröffentlicht.")}
                </div>
            )}

            <form onSubmit={onSubmit} className="bg-white shadow rounded border p-4 grid gap-4">
                {/* Honeypot */}
                <div className="hidden">
                    <label htmlFor="company">Company</label>
                    <input id="company" value={company} onChange={(e) => setCompany(e.target.value)} />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="name">
                        {t("feedback.form.name", "Name")}
                    </label>
                    <input
                        id="name"
                        className="w-full rounded border px-3 py-2 outline-none focus:ring focus:ring-gray-200"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder={t("feedback.form.namePh", "Dein Name")}
                        required
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="email">
                        {t("feedback.form.email", "E-Mail")}
                    </label>
                    <input
                        id="email"
                        type="email"
                        className="w-full rounded border px-3 py-2 outline-none focus:ring focus:ring-gray-200"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@example.com"
                        required
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="message">
                        {t("feedback.form.message", "Nachricht")}
                    </label>
                    <textarea
                        id="message"
                        className="w-full rounded border px-3 py-2 min-h-[140px] outline-none focus:ring focus:ring-gray-200"
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder={t("feedback.form.messagePh", "Erzähl uns von deinem Besuch…")}
                        required
                    />
                </div>

                <div className="flex items-center gap-3">
                    <button
                        type="submit"
                        disabled={submitting}
                        className={`px-4 py-2 rounded text-white ${
                            submitting ? "bg-gray-400 cursor-not-allowed" : "bg-[#4e9f66] hover:bg-green-600"
                        }`}
                    >
                        {submitting ? t("feedback.form.sending", "Senden…") : t("feedback.form.send", "Senden")}
                    </button>
                    <span className="text-xs text-gray-500">
            {t("feedback.form.info", "Wird nach Prüfung veröffentlicht.")}
          </span>
                </div>
            </form>
        </div>
    );
};

export default FeedbackPage;
