import "./NavMenu.scss";

interface NavMenuProps {
	items: string[];
	activeIndex: number;
	isOpen: boolean;
	onSelect: (index: number) => void;
}

export function NavMenu({items, activeIndex, isOpen, onSelect}: NavMenuProps) {
	return (
		<nav className={`main-menu${isOpen ? " active" : ""}`}>
			<ul>
				{items.map((label, i) => (
					<li key={label} className={i === activeIndex ? "active" : ""}>
						{i === activeIndex ? (
							<span>{label}</span>
						) : (
							<a
								href="#"
								onClick={(e) => {
									e.preventDefault();
									onSelect(i);
								}}>
								{label}
							</a>
						)}
					</li>
				))}
			</ul>
		</nav>
	);
}
