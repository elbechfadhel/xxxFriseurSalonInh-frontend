import React from 'react';
import { useTranslation } from 'react-i18next';

interface DeleteModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    entityName?: string; // Optional: name of the item being deleted
}

const DeleteModal: React.FC<DeleteModalProps> = ({ isOpen, onClose, onConfirm, entityName }) => {
    const { t } = useTranslation();

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
            <div className="bg-white rounded p-6 w-full max-w-md shadow-lg">
                <h2 className="text-xl font-semibold mb-4">{t('deleteModal.title')}</h2>
                <p>
                    {entityName
                        ? t('deleteModal.messageWithName', { name: entityName })
                        : t('deleteModal.message')}
                </p>
                <div className="flex justify-end gap-2 pt-4">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300"
                    >
                        {t('deleteModal.cancel')}
                    </button>
                    <button
                        onClick={onConfirm}
                        className="px-4 py-2 rounded bg-red-600 text-white hover:bg-red-700"
                    >
                        {t('deleteModal.confirm')}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DeleteModal;
