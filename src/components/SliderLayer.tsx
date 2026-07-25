import { memo } from "react";
import type { ReactElement } from "react";

interface SliderLayerProps {
	readonly image: string;
}

export const SliderLayer = memo(function SliderLayer({
	image,
}: SliderLayerProps): ReactElement {
	return (
		<div
			className="slider__layer"
			style={{ backgroundImage: `url(${image})` }}
		/>
	);
});
