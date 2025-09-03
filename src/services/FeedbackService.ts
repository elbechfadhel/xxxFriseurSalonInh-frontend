// src/services/FeedbackService.ts
export interface Feedback {
    id: string;
    name?: string | null;
    email?: string | null;
    message: string;
    rating?: number | null;
    validated: boolean;
    createdAt: string;
}
type FeedbackApi = Omit<Feedback, "validated"> & { valid: boolean };

const API_BASE = import.meta.env.VITE_API_URL;
const FEEDBACK_GET_BASE = `${API_BASE}/feedback`;      // GET /api/feedback?valid=all
const FEEDBACKS_MUTATE_BASE = `${API_BASE}/feedbacks`; // PATCH /api/feedbacks/:id/validate

function authHeaders(json = false): Record<string, string> {
    const token =
        localStorage.getItem("adminToken") || localStorage.getItem("token") || "";
    const headers: Record<string, string> = {};
    if (token) headers["Authorization"] = `Bearer ${token}`;
    if (json) headers["Content-Type"] = "application/json"; // only when sending a body
    return headers;
}

function map(api: FeedbackApi): Feedback {
    const { valid, ...rest } = api as any;
    return { ...rest, validated: valid };
}

export type ValidFilter = "all" | boolean;

const FeedbackService = {
    async getAll(params?: { valid?: ValidFilter }): Promise<Feedback[]> {
        const url = new URL(FEEDBACK_GET_BASE);
        if (typeof params?.valid !== "undefined") {
            url.searchParams.set(
                "valid",
                params.valid === "all" ? "all" : String(params.valid)
            );
        }
        const res = await fetch(url.toString(), {
            method: "GET",
            // IMPORTANT: no Content-Type, no credentials unless needed
            credentials: "omit",
            headers: authHeaders(false),
            mode: "cors",
        });
        if (!res.ok) throw new Error("Failed to fetch feedbacks");
        const data = (await res.json()) as FeedbackApi[];
        return data.map(map);
    },

    async validate(id: string): Promise<Feedback | null> {
        const res = await fetch(`${FEEDBACKS_MUTATE_BASE}/${id}/validate`, {
            method: "PATCH",
            credentials: "omit", // switch to 'include' only if you rely on cookies
            headers: authHeaders(false), // no body -> no Content-Type
            mode: "cors",
        });
        if (!res.ok) throw new Error("Failed to validate feedback");
        // backend returns updated feedback; handle empty body too
        const text = await res.text();
        if (!text) return null;
        const body = JSON.parse(text) as FeedbackApi;
        return map(body);
    },
};

export default FeedbackService;
