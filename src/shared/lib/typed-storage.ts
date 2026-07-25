/**
 * Generic, type-safe wrapper around `window.localStorage`.
 *
 * This is the single seam through which the Mock (VITE_BACKEND_MODE=false)
 * persistence layer touches the browser storage API. Swapping persistence
 * strategies (e.g. IndexedDB) only requires reimplementing this module.
 */
export class TypedStorage<T> {
	private readonly key: string;

	public constructor(key: string) {
		this.key = key;
	}

	public read(): T | null {
		const raw = window.localStorage.getItem(this.key);
		if (raw === null) return null;

		try {
			return JSON.parse(raw) as T;
		} catch {
			return null;
		}
	}

	public write(value: T): void {
		window.localStorage.setItem(this.key, JSON.stringify(value));
	}

	public clear(): void {
		window.localStorage.removeItem(this.key);
	}
}
