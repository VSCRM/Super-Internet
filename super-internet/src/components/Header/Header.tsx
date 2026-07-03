import {useState} from "react";
import {Logo} from "../Logo/Logo";
import {NavMenu} from "../NavMenu/NavMenu";
import {Button} from "../Button/Button";
import {BurgerButton} from "../BurgerButton/BurgerButton";
import "./Header.scss";

interface HeaderProps {
	navItems: string[];
	activeIndex: number;
	onNavSelect: (index: number) => void;
}

export function Header({navItems, activeIndex, onNavSelect}: HeaderProps) {
	const [menuOpen, setMenuOpen] = useState(false);

	const handleNavSelect = (index: number) => {
		onNavSelect(index);
		setMenuOpen(false);
	};

	return (
		<div className="top-line">
			<div className="row">
				<div className="col col--center">
					<Logo />
				</div>
				<div className="col col--center col--right col--lead">
					<NavMenu
						items={navItems}
						activeIndex={activeIndex}
						isOpen={menuOpen}
						onSelect={handleNavSelect}
					/>
					<Button as="link" to="/personal-account" variant="top">
						Увійти
					</Button>
				</div>
				<div className="col col--center">
					<BurgerButton
						isOpen={menuOpen}
						onClick={() => setMenuOpen((open) => !open)}
					/>
				</div>
			</div>
		</div>
	);
}
