import { memo, useCallback } from "react";
import type { ReactElement } from "react";
import { useNavigate } from "react-router";
import "../styles/main.css";
import { Header } from "../components/Header";
import { HeaderContent } from "../components/HeaderContent";
import { SliderLayer } from "../components/SliderLayer";
import { useVerticalSlider } from "../hooks/useVerticalSlider";
import spaceBack from "../assets/img/layers/Space-Back.webp";
import spaceFront from "../assets/img/layers/Space-Front.webp";
import earthBack from "../assets/img/layers/Earth-Back.webp";
import earthFront from "../assets/img/layers/Earth-Front.webp";
import satelliteBack from "../assets/img/layers/Satellite-Back.webp";
import satelliteFront from "../assets/img/layers/Satellite-Front.webp";
import earthWebBack from "../assets/img/layers/Earth-on-WEB-Back.webp";
import earthWebFront from "../assets/img/layers/Earth-on-WEB-Front.webp";

interface SlideLayerPair {
	readonly back: string;
	readonly front: string;
}

const SLIDE_LAYERS: readonly SlideLayerPair[] = [
	{ back: spaceBack, front: spaceFront },
	{ back: earthBack, front: earthFront },
	{ back: satelliteBack, front: satelliteFront },
	{ back: earthWebBack, front: earthWebFront },
];

interface SlideTrackProps {
	readonly activeIndex: number;
}

/**
 * Memoized so that re-renders triggered by unrelated state elsewhere on the
 * page (e.g. a future header search field) never re-render every slide's
 * background images.
 */
const SlideTrack = memo(function SlideTrack({
	activeIndex,
}: SlideTrackProps): ReactElement {
	const offsetPercent = (activeIndex * 100) / SLIDE_LAYERS.length;

	return (
		<div
			className="slider__track"
			style={{ transform: `translateY(-${offsetPercent}%)` }}
		>
			{SLIDE_LAYERS.map((layer, index) => (
				<div key={index} className="slider__item">
					<SliderLayer image={layer.back} />
					<SliderLayer image={layer.front} />
				</div>
			))}
		</div>
	);
});

export function MainPage(): ReactElement {
	const navigate = useNavigate();
	const { activeIndex, containerRef, goTo } = useVerticalSlider({
		slideCount: SLIDE_LAYERS.length,
	});

	const handleConnectClick = useCallback(
		() => navigate("/account"),
		[navigate]
	);

	return (
		<div id="top" ref={containerRef} className="slider">
			<div className="slider-ui">
				<div className="container header-wrapper">
					<Header activeIndex={activeIndex} onMenuSelect={goTo} />
					<HeaderContent
						activeIndex={activeIndex}
						onConnectClick={handleConnectClick}
					/>
					<div className="header-bottom" />
				</div>
			</div>

			<SlideTrack activeIndex={activeIndex} />
		</div>
	);
}
