import type {MouseEventHandler, ReactNode} from "react";
import {Link} from "react-router";
import "./Button.scss";

type ButtonVariant = "top" | "main";

interface ButtonAsLink {
	as: "link";
	to: string;
	onClick?: never;
}

interface ButtonAsButton {
	as?: "button";
	onClick: MouseEventHandler<HTMLButtonElement>;
	to?: never;
}

type ButtonProps = {
	variant: ButtonVariant;
	children: ReactNode;
} & (ButtonAsLink | ButtonAsButton);

export function Button(props: ButtonProps) {
	const className = `button button--${props.variant}`;

	if (props.as === "link") {
		return (
			<Link to={props.to} className={className}>
				{props.children}
			</Link>
		);
	}

	return (
		<button type="button" className={className} onClick={props.onClick}>
			{props.children}
		</button>
	);
}
