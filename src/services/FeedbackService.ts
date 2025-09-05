// src/services/FeedbackService.ts


export interface Feedback {
    id: string;
    name?: string | null;
    email?: string | null;
    message: string;
    rating?: number | null;
    validated: boolean;
    approved: boolean;
    createdAt: string;
}

type FeedbackApi = Omit<Feedback, "approved"> & { valid: boolean }; // backend shape

const API_BASE = import.meta.env.VITE_API_URL;
const FEEDBACK_GET_BASE = `${API_BASE}/feedback`;      // GET /api/feedback?valid=...


function authHeaders(json = false): Record<string, string> {
    const token =
        localStorage.getItem("adminToken") || localStorage.getItem("token") || "";
    const headers: Record<string, string> = {};
    if (token) headers["Authorization"] = `Bearer ${token}`;
    if (json) headers["Content-Type"] = "application/json";
    return headers;
}

function mapApiToModel(api: FeedbackApi): Feedback {
    const { valid, ...rest } = api as any;
    return { ...rest, approved: valid };
}

export type ValidFilter = "all" | boolean;

const FeedbackService = {
    async getAll(params?: { valid?: ValidFilter }): Promise<Feedback[]> {
        const url = new URL(FEEDBACK_GET_BASE);
        if (typeof params?.valid !== "undefined") {
            url.searchParams.set("valid", params.valid === "all" ? "all" : String(params.valid));
        }
        const res = await fetch(url.toString(), {
            method: "GET",
            credentials: "omit",
            headers: authHeaders(false),
            mode: "cors",
        });
        if (!res.ok) throw new Error("Failed to fetch feedbacks");
        const data = (await res.json()) as FeedbackApi[];
        return data.map(mapApiToModel);
    },


    async getAllFeedBacks(): Promise<Feedback[]> {
        const res = await fetch(`${FEEDBACK_GET_BASE}?valid=all`, { headers: authHeaders() });
        if (!res.ok) throw new Error('Failed to load employees');
        return res.json();
    },

    async create(payload: { name: string; email: string; message: string }): Promise<Feedback> {
        const res = await fetch(`${FEEDBACK_GET_BASE}`, {
            method: "POST",
            headers: authHeaders(true),   // JSON body
            credentials: "omit",
            mode: "cors",
            body: JSON.stringify(payload),
        });
        if (!res.ok) {
            const text = await res.text();
            throw new Error(text || "Failed to submit feedback");
        }
        const api = (await res.json()) as FeedbackApi;
        return mapApiToModel(api);
    },

    async validate(id: string): Promise<Feedback | null> {
        const res = await fetch(`${FEEDBACK_GET_BASE}/${id}/approve`, {
            method: "PATCH",
            credentials: "omit",
            headers: authHeaders(false),
            mode: "cors",
        });
        if (!res.ok) throw new Error("Failed to validate feedback");
        const text = await res.text();
        if (!text) return null;
        return mapApiToModel(JSON.parse(text) as FeedbackApi);
    },
    async remove(id: string): Promise<Feedback | null> {
        const res = await fetch(`${FEEDBACK_GET_BASE}/${id}`, {
            method: "DELETE",
            credentials: "omit",
            headers: authHeaders(false), // no Content-Type for DELETE without body
            mode: "cors",
        });

        // If your API returns 204 No Content:
        if (res.status === 204) return null;

        if (!res.ok) throw new Error("Failed to delete feedback");

        // If your API returns the deleted feedback as JSON:
        const text = await res.text();
        if (!text) return null;
        const api = JSON.parse(text) as FeedbackApi;
        return mapApiToModel(api);
    },

};

export default FeedbackService;
