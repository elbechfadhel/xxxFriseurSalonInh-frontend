export interface Employee {
    id: string;
    name: string;
    nameAr?: string;
    createdAt: string;
    updatedAt: string;
}

const API_BASE = import.meta.env.VITE_API_URL;

const authHeaders = (isMultipart = false) => ({
    Authorization: `Bearer ${localStorage.getItem('admin_token')}`,
    ...(isMultipart ? {} : { 'Content-Type': 'application/json' }),
});

const STATIC_EMPLOYEES: Employee[] = [
    {
        id: '77f080f7-b1a2-4ad1-8230-234280b8fc75',
        name: 'Najib Neffati',
        nameAr: 'نجيب',
        createdAt: '2025-07-27T15:46:30.798Z',
        updatedAt: '2025-12-05T07:59:42.409Z',
    },
    {
        id: 'd756ef8e-2c11-45a0-87a6-237b0a526f27',
        name: 'Houssam',
        nameAr: 'حسام',
        createdAt: '2025-07-27T15:47:20.846Z',
        updatedAt: '2025-12-05T08:01:10.641Z',
    },
];

const EmployeeService = {
    async getAll(): Promise<Employee[]> {
        return Promise.resolve(STATIC_EMPLOYEES);
    },

    async getPhotoUrl(id: string): Promise<string> {
        return `${API_BASE}/employees/${id}/photo`;
    },

    async create(data: FormData): Promise<Employee> {
        const res = await fetch(`${API_BASE}/employees`, {
            method: 'POST',
            headers: authHeaders(true),
            body: data,
        });
        if (!res.ok) throw new Error('Failed to create employee');
        return res.json();
    },

    async update(id: string, data: FormData): Promise<Employee> {
        const res = await fetch(`${API_BASE}/employees/${id}`, {
            method: 'PUT',
            headers: authHeaders(true),
            body: data,
        });
        if (!res.ok) throw new Error('Failed to update employee');
        return res.json();
    },

    async delete(id: string): Promise<void> {
        const res = await fetch(`${API_BASE}/employees/${id}`, {
            method: 'DELETE',
            headers: authHeaders(),
        });
        if (!res.ok) throw new Error('Failed to delete employee');
    },
};

export default EmployeeService;
