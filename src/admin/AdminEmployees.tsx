import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import DeleteModal from '@/common/DeleteModal';
import EditEmployeeModal from './EditEmployeeModal';
import EmployeeService, { Employee } from '@/services/EmployeeService';

const AdminEmployees: React.FC = () => {
    const { t } = useTranslation();
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [editing, setEditing] = useState<Employee | null>(null);
    const [deleting, setDeleting] = useState<Employee | null>(null);
    const [showAdd, setShowAdd] = useState(false);

    const API_BASE = import.meta.env.VITE_API_URL;

    // Fetch Employees
    useEffect(() => {
        const loadEmployees = async () => {
            try {
                const data = await EmployeeService.getAll();
                setEmployees(data);
            } catch (err) {
                console.error(err);
                setError(t('adminEmployees.errorLoading'));
            } finally {
                setLoading(false);
            }
        };
        loadEmployees();
    }, [t]);

    // Delete Employee
    const handleDeleteConfirmed = async () => {
        if (!deleting) return;
        try {
            await EmployeeService.delete(deleting.id);
            setEmployees(prev => prev.filter(emp => emp.id !== deleting.id));
            setDeleting(null);
        } catch (e) {
            console.error('Failed to delete employee:', e);
        }
    };

    // Save Employee (Create/Update)
    const handleSave = async (id: string | null, data: FormData) => {
        try {
            const updated = id
                ? await EmployeeService.update(id, data)
                : await EmployeeService.create(data);

            setEmployees(prev =>
                id ? prev.map(emp => (emp.id === id ? updated : emp)) : [...prev, updated]
            );

            setEditing(null);
            setShowAdd(false);
        } catch (e) {
            console.error('Failed to save employee:', e);
        }
    };

    return (
        <div className="p-6 max-w-6xl mx-auto">
            <h1 className="text-3xl font-bold mb-6">{t('adminEmployees.title')}</h1>

            <button
                onClick={() => setShowAdd(true)}
                className="mb-4 bg-[#4e9f66] text-white px-4 py-2 rounded hover:bg-green-600"
            >
                {t('adminEmployees.addEmployee')}
            </button>

            {loading ? (
                <p className="text-gray-500">{t('adminEmployees.loading')}</p>
            ) : error ? (
                <p className="text-red-500">{error}</p>
            ) : employees.length === 0 ? (
                <p className="text-gray-600">{t('adminEmployees.noEmployeesFound')}</p>
            ) : (
                <div className="overflow-x-auto">
                    <table className="min-w-full bg-white shadow rounded border">
                        <thead className="bg-gray-100 text-left text-sm font-medium text-gray-700">
                        <tr>
                            <th className="px-4 py-2">{t('adminEmployees.photo')}</th>
                            <th className="px-4 py-2">{t('adminEmployees.name')}</th>
                            <th className="px-4 py-2">{t('adminEmployees.nameAr')}</th>
                            <th className="px-4 py-2">{t('adminEmployees.createdAt')}</th>
                            <th className="px-4 py-2">{t('adminEmployees.actions')}</th>
                        </tr>
                        </thead>
                        <tbody>
                        {employees.map(emp => (
                            <tr key={emp.id} className="border-t text-sm text-gray-800">
                                <td className="px-4 py-2">
                                    <EmployeeAvatar id={emp.id} name={emp.name} apiBase={API_BASE} />
                                </td>
                                <td className="px-4 py-2">{emp.name}</td>
                                <td className="px-4 py-2">{emp.nameAr || '-'}</td>
                                <td className="px-4 py-2">
                                    {new Date(emp.createdAt).toLocaleDateString()}
                                </td>
                                <td className="px-4 py-2 flex gap-2">
                                    <button
                                        className="text-blue-600 hover:underline"
                                        onClick={() => setEditing(emp)}
                                    >
                                        {t('buttons.edit')}
                                    </button>
                                    <button
                                        className="text-red-600 hover:underline"
                                        onClick={() => setDeleting(emp)}
                                    >
                                        {t('buttons.delete')}
                                    </button>
                                </td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Add/Edit Modal */}
            <EditEmployeeModal
                isOpen={!!editing || showAdd}
                employee={editing}
                onClose={() => {
                    setEditing(null);
                    setShowAdd(false);
                }}
                onSave={handleSave}
            />

            {/* Delete Modal */}
            <DeleteModal
                isOpen={!!deleting}
                onClose={() => setDeleting(null)}
                onConfirm={handleDeleteConfirmed}
                entityName={deleting?.name}
            />
        </div>
    );
};

const EmployeeAvatar: React.FC<{ id: string; name: string; apiBase: string }> = ({ id, name, apiBase }) => {
    const [error, setError] = useState(false);

    if (error) {
        return (
            <div className="w-12 h-12 rounded-full bg-gray-300 flex items-center justify-center">
                {name.charAt(0).toUpperCase()}
            </div>
        );
    }

    return (
        <img
            src={`${apiBase}/employees/${id}/photo?ts=${Date.now()}`}
            alt={name}
            className="w-12 h-12 object-cover rounded-full"
            onError={() => setError(true)}
        />
    );
};

export default AdminEmployees;
