import { useMemo, useState } from "react";

export interface UsePagination<T> {
	readonly page: number;
	readonly pageCount: number;
	readonly pageItems: readonly T[];
	readonly goToPage: (page: number) => void;
}

const DEFAULT_PAGE_SIZE = 12;

/**
 * Single responsibility: paginate an in-memory list. Clamps the current
 * page automatically if the underlying list shrinks (e.g. after a delete)
 * so the view never gets stuck on a now-empty trailing page.
 */
export function usePagination<T>(
	items: readonly T[],
	pageSize: number = DEFAULT_PAGE_SIZE
): UsePagination<T> {
	const [page, setPage] = useState(1);

	const pageCount = Math.max(1, Math.ceil(items.length / pageSize));
	const clampedPage = Math.min(page, pageCount);

	const pageItems = useMemo(
		() => items.slice((clampedPage - 1) * pageSize, clampedPage * pageSize),
		[items, clampedPage, pageSize]
	);

	return { page: clampedPage, pageCount, pageItems, goToPage: setPage };
}
