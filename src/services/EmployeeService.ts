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

const EmployeeService = {
    async getAll(): Promise<Employee[]> {
        const res = await fetch(`${API_BASE}/employees`, { headers: authHeaders() });
        if (!res.ok) throw new Error('Failed to load employees');
        return res.json();
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
