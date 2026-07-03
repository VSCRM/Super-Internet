import "./AnimatedHeading.scss";

interface AnimatedHeadingProps {
	text: string;
}

export function AnimatedHeading({text}: AnimatedHeadingProps) {
	let letterIndex = -1;

	return (
		<h1 className="letters">
			{Array.from(text).map((char, i) => {
				if (char === " ") return <span key={i}> </span>;

				letterIndex += 1;
				const index = letterIndex;

				return (
					<span
						key={i}
						className="letter"
						style={{zIndex: -index, transitionDuration: `${index / 5 + 1}s`}}>
						{char}
					</span>
				);
			})}
		</h1>
	);
}
