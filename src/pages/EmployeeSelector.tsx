import React from 'react';

interface Employee {
    id: string;
    name: string;
}

interface EmployeeSelectorProps {
    employees: Employee[];
    selectedEmployee: string | null;
    onChange: (id: string) => void;
    apiBase: string;
}

const EmployeeSelector: React.FC<EmployeeSelectorProps> = ({
                                                               employees,
                                                               selectedEmployee,
                                                               onChange,
                                                               apiBase,
                                                           }) => {
    return (
        <div className="w-full overflow-x-auto">
            <div className="flex gap-4 justify-center flex-nowrap md:flex-nowrap">
                {employees.map((emp) => (
                    <div
                        key={emp.id}
                        onClick={() => onChange(emp.id)}
                        className={`cursor-pointer border rounded-lg p-2 flex flex-col items-center justify-center text-center shadow-sm hover:shadow-md transition flex-shrink-0 ${
                            selectedEmployee === emp.id
                                ? 'border-green-500 bg-green-50'
                                : 'border-gray-200'
                        }`}
                    >
                        <img
                            src={`${apiBase}/employees/${emp.id}/photo`}
                            onError={(e) =>
                                ((e.target as HTMLImageElement).src =
                                    '/images/avatar-placeholder.png')
                            }
                            alt={emp.name}
                            className="w-16 h-16 object-cover rounded-full mb-2"
                        />
                        <span className="text-sm font-medium">{emp.name}</span>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default EmployeeSelector;
