import {useCallback, useEffect, useRef, useState} from "react";
import {useNavigate} from "react-router";
import {Header} from "../Header/Header";
import {HeroSlideContent} from "../HeroSlideContent/HeroSlideContent";
import {heroSlides} from "../../data/heroSlides";
import "./HeroSlider.scss";

// Pure CSS 3D hero slider — replaces Swiper entirely.
// No JS height calculation → no layout shift when devtools opens/closes.
// Slide position driven by CSS transform: translateY(N * 100dvh).
// Parallax: background layers shift slightly opposite to slide direction.
export function HeroSlider() {
	const navigate = useNavigate();
	const [activeIndex, setActiveIndex] = useState(0);
	const [isAnimating, setIsAnimating] = useState(false);
	const touchStartY = useRef<number | null>(null);
	const containerRef = useRef<HTMLDivElement>(null);
	const totalSlides = heroSlides.length;

	const goTo = useCallback(
		(index: number) => {
			if (isAnimating || index === activeIndex) return;
			if (index < 0 || index >= totalSlides) return;
			setIsAnimating(true);
			setActiveIndex(index);
			setTimeout(() => setIsAnimating(false), 1200);
		},
		[isAnimating, activeIndex, totalSlides],
	);

	// Mousewheel navigation
	useEffect(() => {
		const el = containerRef.current;
		if (!el) return;
		let lastScroll = 0;
		const onWheel = (e: WheelEvent) => {
			e.preventDefault();
			const now = Date.now();
			if (now - lastScroll < 800) return;
			lastScroll = now;
			if (e.deltaY > 0) goTo(activeIndex + 1);
			else goTo(activeIndex - 1);
		};
		el.addEventListener("wheel", onWheel, {passive: false});
		return () => el.removeEventListener("wheel", onWheel);
	}, [activeIndex, goTo]);

	// Touch navigation
	useEffect(() => {
		const el = containerRef.current;
		if (!el) return;
		const onTouchStart = (e: TouchEvent) => {
			touchStartY.current = e.touches[0].clientY;
		};
		const onTouchEnd = (e: TouchEvent) => {
			if (touchStartY.current === null) return;
			const delta = touchStartY.current - e.changedTouches[0].clientY;
			if (Math.abs(delta) > 50)
				goTo(delta > 0 ? activeIndex + 1 : activeIndex - 1);
			touchStartY.current = null;
		};
		el.addEventListener("touchstart", onTouchStart, {passive: true});
		el.addEventListener("touchend", onTouchEnd, {passive: true});
		return () => {
			el.removeEventListener("touchstart", onTouchStart);
			el.removeEventListener("touchend", onTouchEnd);
		};
	}, [activeIndex, goTo]);

	return (
		<div className="hero" ref={containerRef}>
			{/* Background slides — translate the whole track */}
			<div
				className="hero__track"
				style={{transform: `translateY(calc(${-activeIndex} * 100dvh))`}}>
				{heroSlides.map((slide, i) => (
					<div
						key={i}
						className={`hero__slide${i === activeIndex ? " hero__slide--active" : ""}`}
						style={{top: `calc(${i} * 100dvh)`}}>
						{/* Back layer — moves slower for parallax depth */}
						<div
							className="hero__layer"
							style={{
								backgroundImage: `url(${slide.backLayer})`,
							}}
						/>
						{/* Front layer — moves slightly faster */}
						<div
							className="hero__layer"
							style={{
								backgroundImage: `url(${slide.frontLayer})`,
								transform:
									i === activeIndex
										? "translateY(0) scale(1.04)"
										: "translateY(0) scale(1)",
								opacity: 0.85,
							}}
						/>
					</div>
				))}
			</div>

			{/* UI overlay — fixed, always on top */}
			<div className="slider-ui">
				<div className="container header-wrapper">
					<Header
						navItems={heroSlides.map((s) => s.navLabel)}
						activeIndex={activeIndex}
						onNavSelect={goTo}
					/>
					<div className="header-content">
						{heroSlides.map((slide, i) => (
							<HeroSlideContent
								key={i}
								heading={slide.heading}
								paragraph={slide.paragraph}
								active={i === activeIndex}
								onCtaClick={() => navigate("/personal-account")}
							/>
						))}
					</div>
				</div>
				<div className="header-bottom" />
			</div>
		</div>
	);
}
