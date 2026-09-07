// @ts-nocheck
const defaultApiUrl = typeof window !== "undefined"
	? `http://${window.location.hostname}:3002/api`
	: "http://localhost:3002/api";
const API_BASE_URL = (import.meta.env.VITE_API_URL || defaultApiUrl).replace(/\/+$/, "");

async function parseResponse(response) {
	const text = await response.text();
	const data = text ? JSON.parse(text) : {};
	if (!response.ok) throw new Error(data.error || "Error en la solicitud");
	return data;
}

async function fetchJson(url, options = {}) {
	try {
		return parseResponse(await fetch(url, options));
	} catch (error) {
		if (error instanceof Error && error.message.includes("Failed to fetch")) {
			throw new Error("No se pudo conectar al servidor");
		}
		throw error;
	}
}

function getHeaders(includeAuth = true) {
	const headers = { "Content-Type": "application/json" };
	if (includeAuth) {
		const token = localStorage.getItem("add_token");
		if (token) headers.Authorization = `Bearer ${token}`;
	}
	return headers;
}

export const api = {
	login: (credentials) => fetchJson(`${API_BASE_URL}/auth/login`, { method: "POST", headers: getHeaders(false), body: JSON.stringify(credentials) }),
	register: (data) => fetchJson(`${API_BASE_URL}/auth/register`, { method: "POST", headers: getHeaders(false), body: JSON.stringify(data) }),
	getUsers: () => fetch(`${API_BASE_URL}/users`, { headers: getHeaders() }).then((r) => r.json()),
	getUser: (id) => fetch(`${API_BASE_URL}/users/${id}`, { headers: getHeaders() }).then((r) => r.json()),
	createUser: (user) => fetch(`${API_BASE_URL}/users`, { method: "POST", headers: getHeaders(), body: JSON.stringify(user) }).then((r) => r.json()),
	updateUser: (id, updates) => fetch(`${API_BASE_URL}/users/${id}`, { method: "PUT", headers: getHeaders(), body: JSON.stringify(updates) }).then((r) => r.json()),
	deleteUser: (id) => fetch(`${API_BASE_URL}/users/${id}`, { method: "DELETE", headers: getHeaders() }).then((r) => r.json()),
	getActas: () => fetch(`${API_BASE_URL}/actas`, { headers: getHeaders() }).then((r) => r.json()),
	getActa: (id) => fetch(`${API_BASE_URL}/actas/${id}`, { headers: getHeaders() }).then((r) => r.json()),
	createActa: (acta) => fetchJson(`${API_BASE_URL}/actas`, { method: "POST", headers: getHeaders(), body: JSON.stringify(acta) }),
	updateActa: (id, updates) => fetch(`${API_BASE_URL}/actas/${id}`, { method: "PUT", headers: getHeaders(), body: JSON.stringify(updates) }).then((r) => r.json()),
	deleteActa: (id) => fetch(`${API_BASE_URL}/actas/${id}`, { method: "DELETE", headers: getHeaders() }).then((r) => r.json()),
	approveActa: (id, data) => fetch(`${API_BASE_URL}/actas/${id}/approve`, { method: "POST", headers: getHeaders(), body: JSON.stringify(data) }).then((r) => r.json()),
	rejectActa: (id, data) => fetch(`${API_BASE_URL}/actas/${id}/reject`, { method: "POST", headers: getHeaders(), body: JSON.stringify(data) }).then((r) => r.json()),
	getNotifications: (userId) => fetch(`${API_BASE_URL}/notifications/user/${userId}`, { headers: getHeaders() }).then((r) => r.json()),
	createNotification: (notification) => fetch(`${API_BASE_URL}/notifications`, { method: "POST", headers: getHeaders(), body: JSON.stringify(notification) }).then((r) => r.json()),
	markNotificationRead: (id) => fetch(`${API_BASE_URL}/notifications/${id}/read`, { method: "PUT", headers: getHeaders() }).then((r) => r.json()),
	markAllNotificationsRead: (userId) => fetch(`${API_BASE_URL}/notifications/user/${userId}/read-all`, { method: "PUT", headers: getHeaders() }).then((r) => r.json()),
	getSolicitudes: () => fetch(`${API_BASE_URL}/solicitudes`, { headers: getHeaders() }).then((r) => r.json()),
	createSolicitud: (solicitud) => fetch(`${API_BASE_URL}/solicitudes`, { method: "POST", headers: getHeaders(), body: JSON.stringify(solicitud) }).then((r) => r.json()),
	approveSolicitud: (id) => fetch(`${API_BASE_URL}/solicitudes/${id}/approve`, { method: "POST", headers: getHeaders() }).then((r) => r.json()),
	rejectSolicitud: (id) => fetch(`${API_BASE_URL}/solicitudes/${id}/reject`, { method: "POST", headers: getHeaders() }).then((r) => r.json()),
	getInvimaProducts: () => fetch(`${API_BASE_URL}/invima`, { headers: getHeaders() }).then((r) => r.json()),
	createInvimaProduct: (product) => fetch(`${API_BASE_URL}/invima`, { method: "POST", headers: getHeaders(), body: JSON.stringify(product) }).then((r) => r.json()),
	updateInvimaProduct: (id, updates) => fetch(`${API_BASE_URL}/invima/${id}`, { method: "PUT", headers: getHeaders(), body: JSON.stringify(updates) }).then((r) => r.json()),
	deleteInvimaProduct: (id) => fetch(`${API_BASE_URL}/invima/${id}`, { method: "DELETE", headers: getHeaders() }).then((r) => r.json()),
	getSapCodes: (params = "") => fetchJson(`${API_BASE_URL}/sap${params ? `?${params}` : ""}`, { headers: getHeaders() }),
	createSapCode: (sap) => fetchJson(`${API_BASE_URL}/sap`, { method: "POST", headers: getHeaders(), body: JSON.stringify(sap) }),
	getCecos: () => fetchJson(`${API_BASE_URL}/cecos`, { headers: getHeaders() }),
	createCeco: (ceco) => fetchJson(`${API_BASE_URL}/cecos`, { method: "POST", headers: getHeaders(), body: JSON.stringify(ceco) }),
	updateCeco: (id, updates) => fetchJson(`${API_BASE_URL}/cecos/${id}`, { method: "PUT", headers: getHeaders(), body: JSON.stringify(updates) }),
	deleteCeco: (id) => fetchJson(`${API_BASE_URL}/cecos/${id}`, { method: "DELETE", headers: getHeaders() }),
};