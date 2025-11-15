// src/admin/AdminSmsLogs.tsx
import React, { useEffect, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';

interface SmsLog {
    id: string;
    to: string;
    status: string;        // "ok" | "error" | "exception"
    errorText?: string | null;
    createdAt: string;     // ISO string from backend
}

const POLL_MS = 30000; // 30s, adjust/disable if you want

const AdminSmsLogs: React.FC = () => {
    const { t } = useTranslation();
    const [logs, setLogs] = useState<SmsLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [filterPhone, setFilterPhone] = useState('');
    const [filterStatus, setFilterStatus] = useState<'all' | 'ok' | 'error' | 'exception'>('all');
    const [view, setView] = useState<'list' | 'grouped'>('list');

    const API_BASE = import.meta.env.VITE_API_URL;

    const authHeaders = () => ({
        'Content-Type': 'application/json',
        Authorization: `Bearer ${localStorage.getItem('admin_token')}`,
    });

    // --- Fetch SMS logs (stable, abortable) ---
    const fetchLogs = useCallback(
        async (signal?: AbortSignal) => {
            try {
                const res = await fetch(`${API_BASE}/sms-logs`, {
                    headers: authHeaders(),
                    signal,
                });
                if (!res.ok) throw new Error('Failed to load SMS logs');

                const data = await res.json();

                // Handle both shapes:
                // 1) plain array: [ ... ]
                // 2) paginated: { items: [ ... ], total, page, ... }
                const items: SmsLog[] = Array.isArray(data) ? data : data.items ?? [];

                setLogs(items);
                setError('');
            } catch (e: any) {
                if (!signal || !signal.aborted) {
                    console.error('Error loading SMS logs:', e);
                    setError(
                        t('adminSmsLogs.errorLoading', 'Fehler beim Laden der SMS-Protokolle')
                    );
                }
            } finally {
                setLoading(false);
            }
        },
        [API_BASE, t]
    );

    // Initial load
    useEffect(() => {
        const ctrl = new AbortController();
        fetchLogs(ctrl.signal);
        return () => ctrl.abort();
    }, [fetchLogs]);

    // Optional polling (like AdminBookings)
    useEffect(() => {
        let timeoutId: number | undefined;
        let stopped = false;
        let ctrl: AbortController | null = null;

        const tick = async () => {
            ctrl?.abort();
            ctrl = new AbortController();
            await fetchLogs(ctrl.signal);
            if (!stopped) {
                timeoutId = window.setTimeout(tick, POLL_MS);
            }
        };

        const onVisibilityChange = () => {
            if (document.visibilityState === 'visible') {
                clearTimeout(timeoutId);
                tick();
            } else {
                clearTimeout(timeoutId);
                ctrl?.abort();
            }
        };

        // Start according to current visibility
        onVisibilityChange();
        document.addEventListener('visibilitychange', onVisibilityChange);

        return () => {
            stopped = true;
            clearTimeout(timeoutId);
            ctrl?.abort();
            document.removeEventListener('visibilitychange', onVisibilityChange);
        };
    }, [fetchLogs]);

    const formatDateTime = (dateStr: string) =>
        new Intl.DateTimeFormat('de-DE', {
            dateStyle: 'medium',
            timeStyle: 'medium',
        }).format(new Date(dateStr));

    const filteredLogs = logs
        .filter((log) => {
            if (filterStatus !== 'all' && log.status !== filterStatus) return false;
            if (!filterPhone.trim()) return true;
            return log.to.toLowerCase().includes(filterPhone.trim().toLowerCase());
        })
        .sort(
            (a, b) =>
                new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        ); // newest first

    const groupByPhone = (data: SmsLog[]) =>
        data.reduce((groups: Record<string, SmsLog[]>, log) => {
            if (!groups[log.to]) groups[log.to] = [];
            groups[log.to].push(log);
            return groups;
        }, {});

    const getGroupStats = (entries: SmsLog[]) => {
        const total = entries.length;
        const ok = entries.filter((e) => e.status === 'ok').length;
        const error = entries.filter((e) => e.status === 'error').length;
        const exception = entries.filter((e) => e.status === 'exception').length;

        const last = entries.reduce((latest: Date | null, e) => {
            const d = new Date(e.createdAt);
            if (!latest || d > latest) return d;
            return latest;
        }, null as Date | null);

        return { total, ok, error, exception, last };
    };

    const grouped = groupByPhone(filteredLogs);

    return (
        <div className="mx-auto">
            {/* Header */}
            <div className="mb-6 flex items-center justify-between">
                <h1 className="text-3xl font-bold">
                    {t('adminSmsLogs.title', 'SMS-Verlauf')}
                </h1>
                <button
                    className="rounded bg-[#4e9f66] px-4 py-2 font-semibold text-white hover:bg-[#3e8455]"
                    onClick={() => {
                        setLoading(true);
                        const ctrl = new AbortController();
                        fetchLogs(ctrl.signal).finally(() => ctrl.abort());
                    }}
                >
                    {t('adminSmsLogs.refresh', 'Aktualisieren')}
                </button>
            </div>

            {/* View toggle */}
            <div className="mb-4 flex gap-4">
                <button
                    className={`px-4 py-2 rounded font-semibold transition ${
                        view === 'list'
                            ? 'bg-[#4e9f66] text-white'
                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                    onClick={() => setView('list')}
                >
                    {t('adminSmsLogs.list', 'Liste')}
                </button>

                <button
                    className={`px-4 py-2 rounded font-semibold transition ${
                        view === 'grouped'
                            ? 'bg-[#4e9f66] text-white'
                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                    onClick={() => setView('grouped')}
                >
                    {t('adminSmsLogs.grouped', 'Gruppiert nach Telefonnummer')}
                </button>
            </div>

            {/* Filters */}
            <div className="mb-6 flex flex-wrap gap-4 items-center">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        {t('adminSmsLogs.filterPhone', 'Nach Telefonnummer filtern')}
                    </label>
                    <input
                        type="text"
                        value={filterPhone}
                        onChange={(e) => setFilterPhone(e.target.value)}
                        className="rounded border px-3 py-2 text-sm"
                        placeholder="+49..."
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        {t('adminSmsLogs.filterStatus', 'Status')}
                    </label>
                    <select
                        value={filterStatus}
                        onChange={(e) =>
                            setFilterStatus(
                                e.target.value as 'all' | 'ok' | 'error' | 'exception'
                            )
                        }
                        className="rounded border px-3 py-2 text-sm"
                    >
                        <option value="all">
                            {t('adminSmsLogs.status.all', 'Alle')}
                        </option>
                        <option value="ok">
                            {t('adminSmsLogs.status.ok', 'Erfolgreich')}
                        </option>
                        <option value="error">
                            {t('adminSmsLogs.status.error', 'Fehler')}
                        </option>
                        <option value="exception">
                            {t('adminSmsLogs.status.exception', 'Exception')}
                        </option>
                    </select>
                </div>
            </div>

            {/* Content */}
            {loading ? (
                <p className="text-gray-500">
                    {t('adminSmsLogs.loading', 'Lade SMS-Protokolle...')}
                </p>
            ) : error ? (
                <p className="text-red-500">{error}</p>
            ) : filteredLogs.length === 0 ? (
                <p className="text-gray-600">
                    {t('adminSmsLogs.empty', 'Keine SMS-Protokolle gefunden.')}
                </p>
            ) : (
                <>
                    {/* List view */}
                    {view === 'list' && (
                        <div className="overflow-x-auto">
                            <table className="min-w-full bg-white shadow rounded border">
                                <thead className="bg-gray-100 text-left text-sm font-medium text-gray-700">
                                <tr>
                                    <th className="px-4 py-2">
                                        {t('adminSmsLogs.to', 'Telefonnummer')}
                                    </th>
                                    <th className="px-4 py-2">
                                        {t('adminSmsLogs.statusLabel', 'Status')}
                                    </th>
                                    <th className="px-4 py-2">
                                        {t('adminSmsLogs.errorText', 'Fehlertext')}
                                    </th>
                                    <th className="px-4 py-2">
                                        {t('adminSmsLogs.createdAt', 'Gesendet am')}
                                    </th>
                                </tr>
                                </thead>
                                <tbody>
                                {filteredLogs.map((log) => (
                                    <tr key={log.id} className="border-t text-sm text-gray-800">
                                        <td className="px-4 py-2 font-mono">{log.to}</td>
                                        <td className="px-4 py-2">
                        <span
                            className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-semibold ${
                                log.status === 'ok'
                                    ? 'bg-green-100 text-green-800'
                                    : log.status === 'error'
                                        ? 'bg-red-100 text-red-800'
                                        : 'bg-yellow-100 text-yellow-800'
                            }`}
                        >
                          {log.status}
                        </span>
                                        </td>
                                        <td className="px-4 py-2 text-xs max-w-xs break-words">
                                            {log.errorText || '—'}
                                        </td>
                                        <td className="px-4 py-2 whitespace-nowrap">
                                            {formatDateTime(log.createdAt)}
                                        </td>
                                    </tr>
                                ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {/* Grouped view */}
                    {view === 'grouped' && (
                        <div className="mt-6">
                            {Object.entries(grouped)
                                .sort((a, b) => b[1].length - a[1].length) // <-- NEW SORT
                                .map(([phone, entries]) => {
                                const stats = getGroupStats(entries);
                                return (
                                    <div key={phone} className="mb-10">
                                        <div className="mb-3 flex items-center justify-between gap-4 flex-wrap">
                                            <h2 className="text-2xl font-bold flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-[#4e9f66] text-white flex items-center justify-center font-semibold text-sm">
                                                    {phone.slice(-3)}
                                                </div>
                                                {phone}
                                            </h2>

                                            {/* Summary badges */}
                                            <div className="flex flex-wrap gap-2 text-xs">
                        <span className="inline-flex items-center rounded-full bg-gray-100 px-3 py-1 font-semibold text-gray-800">
                          {t('adminSmsLogs.summary.total', 'Gesamt')}: {stats.total}
                        </span>
                                                <span className="inline-flex items-center rounded-full bg-green-100 px-3 py-1 font-semibold text-green-800">
                          {t('adminSmsLogs.summary.ok', 'Erfolgreich')}: {stats.ok}
                        </span>
                                                <span className="inline-flex items-center rounded-full bg-red-100 px-3 py-1 font-semibold text-red-800">
                          {t('adminSmsLogs.summary.error', 'Fehler')}: {stats.error}
                        </span>
                                                <span className="inline-flex items-center rounded-full bg-yellow-100 px-3 py-1 font-semibold text-yellow-800">
                          {t('adminSmsLogs.summary.exception', 'Exception')}: {stats.exception}
                        </span>
                                                {stats.last && (
                                                    <span className="inline-flex items-center rounded-full bg-blue-50 px-3 py-1 font-semibold text-blue-800">
                            {t('adminSmsLogs.summary.last', 'Letzte SMS')}:{" "}
                                                        {formatDateTime(stats.last.toISOString())}
                          </span>
                                                )}
                                            </div>
                                        </div>

                                        <div className="overflow-x-auto">
                                            <table className="min-w-full bg-white shadow rounded border">
                                                <thead className="bg-gray-100 text-left text-sm font-medium text-gray-700">
                                                <tr>
                                                    <th className="px-4 py-2">
                                                        {t('adminSmsLogs.statusLabel', 'Status')}
                                                    </th>
                                                    <th className="px-4 py-2">
                                                        {t('adminSmsLogs.errorText', 'Fehlertext')}
                                                    </th>
                                                    <th className="px-4 py-2">
                                                        {t('adminSmsLogs.createdAt', 'Gesendet am')}
                                                    </th>
                                                </tr>
                                                </thead>
                                                <tbody>
                                                {entries
                                                    .sort(
                                                        (a, b) =>
                                                            new Date(b.createdAt).getTime() -
                                                            new Date(a.createdAt).getTime()
                                                    )
                                                    .map((log) => (
                                                        <tr
                                                            key={log.id}
                                                            className="border-t text-sm text-gray-800"
                                                        >
                                                            <td className="px-4 py-2">
                                  <span
                                      className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-semibold ${
                                          log.status === 'ok'
                                              ? 'bg-green-100 text-green-800'
                                              : log.status === 'error'
                                                  ? 'bg-red-100 text-red-800'
                                                  : 'bg-yellow-100 text-yellow-800'
                                      }`}
                                  >
                                    {log.status}
                                  </span>
                                                            </td>
                                                            <td className="px-4 py-2 text-xs max-w-xs break-words">
                                                                {log.errorText || '—'}
                                                            </td>
                                                            <td className="px-4 py-2 whitespace-nowrap">
                                                                {formatDateTime(log.createdAt)}
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default AdminSmsLogs;
