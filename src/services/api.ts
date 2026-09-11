// @ts-nocheck
// VITE_API_URL permite definir una API remota al desplegar. En desarrollo,
// usa el mismo equipo desde el cual se abre la interfaz.
const defaultApiUrl = typeof window !== "undefined"
	? `http://${window.location.hostname}:3003/api`
	: "http://localhost:3003/api";
const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || defaultApiUrl).replace(/\/+$/, "");

async function parseResponse(response) {
	const text = await response.text();
	let data = {};
	if (text) {
		try {
			data = JSON.parse(text);
		} catch {
			throw new Error(`La API respondió HTML en ${response.url}. Verifica que el backend esté iniciado en el puerto 3003.`);
		}
	}
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
		const token = sessionStorage.getItem("add_token");
		if (token) headers.Authorization = `Bearer ${token}`;
	}
	return headers;
}

export const api = {
	login: (credentials) => fetchJson(`${API_BASE_URL}/auth/login`, { method: "POST", headers: getHeaders(false), body: JSON.stringify(credentials) }),
	register: (data) => fetchJson(`${API_BASE_URL}/auth/register`, { method: "POST", headers: getHeaders(false), body: JSON.stringify(data) }),
	getUsers: () => fetchJson(`${API_BASE_URL}/users`, { headers: getHeaders() }),
	getUser: (id) => fetchJson(`${API_BASE_URL}/users/${id}`, { headers: getHeaders() }),
	createUser: (user) => fetchJson(`${API_BASE_URL}/users`, { method: "POST", headers: getHeaders(), body: JSON.stringify(user) }),
	updateUser: (id, updates) => fetchJson(`${API_BASE_URL}/users/${id}`, { method: "PUT", headers: getHeaders(), body: JSON.stringify(updates) }),
	deleteUser: (id) => fetchJson(`${API_BASE_URL}/users/${id}`, { method: "DELETE", headers: getHeaders() }),
	testUserEmail: (id) => fetchJson(`${API_BASE_URL}/users/${id}/test-email`, { method: "POST", headers: getHeaders() }),
	getActas: () => fetchJson(`${API_BASE_URL}/actas`, { headers: getHeaders() }),
	getActa: (id) => fetchJson(`${API_BASE_URL}/actas/${id}`, { headers: getHeaders() }),
	createActa: (acta) => fetchJson(`${API_BASE_URL}/actas`, { method: "POST", headers: getHeaders(), body: JSON.stringify(acta) }),
	updateActa: (id, updates) => fetchJson(`${API_BASE_URL}/actas/${id}`, { method: "PUT", headers: getHeaders(), body: JSON.stringify(updates) }),
	deleteActa: (id) => fetchJson(`${API_BASE_URL}/actas/${id}`, { method: "DELETE", headers: getHeaders() }),
	submitActa: (id, data) => fetchJson(`${API_BASE_URL}/actas/${id}/submit`, { method: "POST", headers: getHeaders(), body: JSON.stringify(data) }),
	approveActa: (id, data) => fetchJson(`${API_BASE_URL}/actas/${id}/approve`, { method: "POST", headers: getHeaders(), body: JSON.stringify(data) }),
	rejectActa: (id, data) => fetchJson(`${API_BASE_URL}/actas/${id}/reject`, { method: "POST", headers: getHeaders(), body: JSON.stringify(data) }),
	returnActa: (id, data) => fetchJson(`${API_BASE_URL}/actas/${id}/return`, { method: "POST", headers: getHeaders(), body: JSON.stringify(data) }),
	getNotifications: (userId) => fetchJson(`${API_BASE_URL}/notifications/user/${userId}`, { headers: getHeaders() }),
	createNotification: (notification) => fetchJson(`${API_BASE_URL}/notifications`, { method: "POST", headers: getHeaders(), body: JSON.stringify(notification) }),
	markNotificationRead: (id) => fetchJson(`${API_BASE_URL}/notifications/${id}/read`, { method: "PUT", headers: getHeaders() }),
	deleteNotification: (id) => fetchJson(`${API_BASE_URL}/notifications/${id}`, { method: "DELETE", headers: getHeaders() }),
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
