import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

interface Employee {
    id: string;
    name: string;
    nameAr?: string;
    createdAt?: string;
    updatedAt?: string;
}

interface EditEmployeeModalProps {
    isOpen: boolean;
    employee?: Employee | null;
    onClose: () => void;
    onSave: (id: string | null, data: FormData) => Promise<void>;
}

const EditEmployeeModal: React.FC<EditEmployeeModalProps> = ({
                                                                 isOpen,
                                                                 employee,
                                                                 onClose,
                                                                 onSave,
                                                             }) => {
    const { t } = useTranslation();

    const [name, setName] = useState('');
    const [nameAr, setNameAr] = useState('');
    const [photo, setPhoto] = useState<File | null>(null);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (employee) {
            setName(employee.name);
            setNameAr(employee.nameAr || '');
        } else {
            setName('');
            setNameAr('');
            setPhoto(null);
        }
    }, [employee]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);

        const formData = new FormData();
        formData.append('name', name);
        formData.append('nameAr', nameAr);
        if (photo) formData.append('photo', photo);

        await onSave(employee ? employee.id : null, formData);
        setSaving(false);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
            <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-6 relative">
                <h2 className="text-xl font-bold mb-4">
                    {employee ? t('editEmployeeModal.titleEmployee') : t('editEmployeeModal.addEmployee')}
                </h2>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Name */}
                    <div>
                        <label className="block text-sm font-medium mb-1">
                            {t('editEmployeeModal.employeeName')}
                        </label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full border rounded px-3 py-2"
                            required
                        />
                    </div>

                    {/* Arabic Name */}
                    <div>
                        <label className="block text-sm font-medium mb-1">
                            {t('editEmployeeModal.employeeNameAr')}
                        </label>
                        <input
                            type="text"
                            value={nameAr}
                            onChange={(e) => setNameAr(e.target.value)}
                            className="w-full border rounded px-3 py-2"
                        />
                    </div>

                    {/* Photo */}
                    <div>
                        <label className="block text-sm font-medium mb-1">
                            {t('editEmployeeModal.photo')}
                        </label>
                        <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => setPhoto(e.target.files ? e.target.files[0] : null)}
                            className="w-full"
                        />
                        {employee && (
                            <img
                                src={`${import.meta.env.VITE_API_URL}/employees/${employee.id}/photo`}
                                alt={employee.name}
                                className="mt-2 w-20 h-20 object-cover rounded-full"
                                onError={(e) => ((e.target as HTMLImageElement).style.display = 'none')}
                            />
                        )}
                    </div>

                    {/* Buttons */}
                    <div className="flex justify-end gap-3 mt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
                        >
                            {t('editEmployeeModal.cancel')}
                        </button>
                        <button
                            type="submit"
                            disabled={saving}
                            className={`px-4 py-2 rounded text-white ${
                                saving ? 'bg-gray-400' : 'bg-[#4e9f66] hover:bg-green-600'
                            }`}
                        >
                            {saving ? t('editEmployeeModal.saving') : t('editEmployeeModal.save')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default EditEmployeeModal;
