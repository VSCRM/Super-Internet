import { useEffect } from "react";
import type { RefObject } from "react";

const FOCUSABLE_SELECTOR =
	'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

function getFocusableElements(container: HTMLElement): HTMLElement[] {
	return Array.from(
		container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)
	).filter((el) => !el.hasAttribute("disabled") && el.tabIndex !== -1);
}

/**
 * Single responsibility: makes a dialog/overlay keyboard-accessible.
 *  - Escape calls `onEscape` (typically "cancel"/"close").
 *  - Tab / Shift+Tab is trapped within the container instead of leaking
 *    focus onto the page behind the overlay.
 *  - On mount, focus moves into the container if nothing inside it is
 *    already focused (e.g. an `autoFocus` input).
 *
 * `active` lets callers mount the hook unconditionally and simply toggle it,
 * which keeps call sites simpler than conditionally calling hooks.
 */
export function useDialogA11y(
	containerRef: RefObject<HTMLElement | null>,
	onEscape: () => void,
	active: boolean
): void {
	useEffect(() => {
		if (!active) return;
		const container = containerRef.current;
		if (!container) return;

		if (!container.contains(document.activeElement)) {
			const focusable = getFocusableElements(container);
			(focusable[0] ?? container).focus();
		}

		const handleKeyDown = (event: KeyboardEvent): void => {
			if (event.key === "Escape") {
				event.stopPropagation();
				onEscape();
				return;
			}

			if (event.key !== "Tab") return;

			const focusable = getFocusableElements(container);
			if (focusable.length === 0) return;

			const first = focusable[0];
			const last = focusable[focusable.length - 1];

			if (event.shiftKey && document.activeElement === first) {
				event.preventDefault();
				last.focus();
			} else if (!event.shiftKey && document.activeElement === last) {
				event.preventDefault();
				first.focus();
			}
		};

		document.addEventListener("keydown", handleKeyDown);
		return () => document.removeEventListener("keydown", handleKeyDown);
	}, [active, containerRef, onEscape]);
}
