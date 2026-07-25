import { useCallback, useEffect, useRef, useState } from "react";

export interface UseVerticalSliderOptions {
	readonly slideCount: number;
	/** Minimum time between accepted slide transitions, in ms. Prevents rapid-fire wheel events from skipping slides on trackpads. */
	readonly cooldownMs?: number;
}

export interface UseVerticalSliderResult {
	readonly activeIndex: number;
	readonly containerRef: React.RefObject<HTMLDivElement | null>;
	goTo: (index: number) => void;
	next: () => void;
	previous: () => void;
}

/**
 * Minimal, dependency-free vertical slider built on CSS transforms instead of
 * a third-party library. Swiper's full bundle (with its modules) ships
 * meaningfully more JavaScript than this hook needs to parse and execute,
 * which matters disproportionately on low-end devices and slow networks -
 * the explicit performance requirement this hook addresses.
 */
export function useVerticalSlider({
	slideCount,
	cooldownMs = 900,
}: UseVerticalSliderOptions): UseVerticalSliderResult {
	const [activeIndex, setActiveIndex] = useState(0);
	const containerRef = useRef<HTMLDivElement | null>(null);
	const isTransitioningRef = useRef(false);
	const touchStartYRef = useRef<number | null>(null);

	const goTo = useCallback(
		(index: number) => {
			const clamped = Math.max(0, Math.min(slideCount - 1, index));
			if (clamped === activeIndex || isTransitioningRef.current) return;

			isTransitioningRef.current = true;
			setActiveIndex(clamped);
			window.setTimeout(() => {
				isTransitioningRef.current = false;
			}, cooldownMs);
		},
		[activeIndex, cooldownMs, slideCount]
	);

	const next = useCallback(() => goTo(activeIndex + 1), [activeIndex, goTo]);
	const previous = useCallback(
		() => goTo(activeIndex - 1),
		[activeIndex, goTo]
	);

	useEffect(() => {
		const node = containerRef.current;
		if (!node) return;

		const handleWheel = (event: WheelEvent) => {
			event.preventDefault();
			if (event.deltaY > 0) next();
			else if (event.deltaY < 0) previous();
		};

		const handleTouchStart = (event: TouchEvent) => {
			touchStartYRef.current = event.touches[0]?.clientY ?? null;
		};

		const handleTouchEnd = (event: TouchEvent) => {
			const startY = touchStartYRef.current;
			const endY = event.changedTouches[0]?.clientY;
			if (startY === null || endY === undefined) return;

			const delta = startY - endY;
			const SWIPE_THRESHOLD_PX = 50;
			if (Math.abs(delta) < SWIPE_THRESHOLD_PX) return;

			if (delta > 0) next();
			else previous();
		};

		const handleKeyDown = (event: KeyboardEvent) => {
			if (event.key === "ArrowDown" || event.key === "PageDown") next();
			else if (event.key === "ArrowUp" || event.key === "PageUp") previous();
		};

		node.addEventListener("wheel", handleWheel, { passive: false });
		node.addEventListener("touchstart", handleTouchStart, { passive: true });
		node.addEventListener("touchend", handleTouchEnd, { passive: true });
		window.addEventListener("keydown", handleKeyDown);

		return () => {
			node.removeEventListener("wheel", handleWheel);
			node.removeEventListener("touchstart", handleTouchStart);
			node.removeEventListener("touchend", handleTouchEnd);
			window.removeEventListener("keydown", handleKeyDown);
		};
	}, [next, previous]);

	return { activeIndex, containerRef, goTo, next, previous };
}
