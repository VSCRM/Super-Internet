import type { ReactElement } from "react";

interface LetterTitleProps {
	text: string;
}

// Ports the old Main/JS/app.js letter-splitting logic: every non-space character
// becomes its own <span class="letter"> with a staggered transition delay.
export function LetterTitle({ text }: LetterTitleProps): ReactElement {
	const words = text.split(" ");
	let letterIndex = 0;

	return (
		<h1 className="letters">
			{words.map((word, wordIdx) => (
				<span key={wordIdx}>
					{wordIdx > 0 ? " " : ""}
					{[...word].map((char, charIdx) => {
						const i = letterIndex++;
						return (
							<span
								key={charIdx}
								className="letter"
								style={{ zIndex: -i, transitionDuration: `${i / 5 + 1}s` }}
							>
								{char}
							</span>
						);
					})}
				</span>
			))}
		</h1>
	);
}
