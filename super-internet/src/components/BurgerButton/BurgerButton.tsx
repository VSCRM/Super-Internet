import "./BurgerButton.scss";

interface BurgerButtonProps {
	isOpen: boolean;
	onClick: () => void;
}

export function BurgerButton({isOpen, onClick}: BurgerButtonProps) {
	return (
		<div
			className={`hamburger-menu${isOpen ? " active" : ""}`}
			onClick={onClick}>
			<div className="hamburger" />
		</div>
	);
}
