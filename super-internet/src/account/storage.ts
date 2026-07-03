import type {AppUser} from "./types";
import {createAdmin, createSupport} from "./factories";

const STORAGE_KEY = "superInternetUsers";

export function loadUsers(): AppUser[] {
	const data = window.localStorage.getItem(STORAGE_KEY);
	if (!data) return [];

	try {
		const parsed = JSON.parse(data) as AppUser[];
		return Array.isArray(parsed) ? parsed : [];
	} catch {
		return [];
	}
}

export function saveUsers(users: AppUser[]): void {
	window.localStorage.setItem(STORAGE_KEY, JSON.stringify(users));
}

export function withDefaultUsers(users: AppUser[]): AppUser[] {
	const next = [...users];

	if (!next.find((u) => u.email === "admin@super.net")) {
		next.push(createAdmin("admin@super.net", "admin123"));
	}
	if (!next.find((u) => u.email === "support@super.net")) {
		next.push(createSupport("support@super.net", "support123", "Техпідтримка"));
	}

	return next;
}
