import type {ReactNode} from "react";
import {AnimatedHeading} from "../AnimatedHeading/AnimatedHeading";
import {Button} from "../Button/Button";
import "./HeroSlideContent.scss";

interface HeroSlideContentProps {
	heading: string;
	paragraph: ReactNode;
	active: boolean;
	onCtaClick: () => void;
}

export function HeroSlideContent({
	heading,
	paragraph,
	active,
	onCtaClick,
}: HeroSlideContentProps) {
	return (
		<div className={`header-content__slide${active ? " active" : ""}`}>
			<AnimatedHeading text={heading} />
			<div className="header-content__info">
				{paragraph}
				<br />
				<Button variant="main" onClick={onCtaClick}>
					Підключитися зараз
				</Button>
			</div>
		</div>
	);
}
