import { memo, useState } from "react";
import type { ReactElement } from "react";
import { Link } from "react-router";
import { useTranslation } from "react-i18next";
import { LanguageSwitcher } from "./molecules/LanguageSwitcher/LanguageSwitcher";

const logo = `${import.meta.env.BASE_URL}Logo.png`;

interface HeaderProps {
	activeIndex: number;
	onMenuSelect: (index: number) => void;
}

const MENU_ITEM_KEYS = [
	"landing.menu.home",
	"landing.menu.about",
	"landing.menu.pricing",
	"landing.menu.contacts",
] as const;

export const Header = memo(function Header({
	activeIndex,
	onMenuSelect,
}: HeaderProps): ReactElement {
	const [menuOpen, setMenuOpen] = useState(false);
	const { t } = useTranslation();

	const handleSelect = (index: number) => {
		onMenuSelect(index);
		setMenuOpen(false);
	};

	return (
		<div className="top-line">
			<div className="top-line__lang">
				<LanguageSwitcher />
			</div>
			<div className="row">
				<div className="col col--center">
					<a
						href="#top"
						className="logo"
						onClick={(e) => {
							e.preventDefault();
							handleSelect(0);
						}}
					>
						<img src={logo} alt="Super Internet" />
					</a>
				</div>
				<div className="col col--center col--right col--lead">
					<nav className={`main-menu ${menuOpen ? "active" : ""}`}>
						<ul>
							{MENU_ITEM_KEYS.map((key, index) => (
								<li key={key} className={activeIndex === index ? "active" : ""}>
									<a
										href="#top"
										onClick={(e) => {
											e.preventDefault();
											handleSelect(index);
										}}
									>
										{t(key)}
									</a>
								</li>
							))}
						</ul>
					</nav>
					<Link to="/account" className="button button--top">
						{t("landing.login")}
					</Link>
				</div>
				<div className="col col--center">
					<div
						className={`hamburger-menu ${menuOpen ? "active" : ""}`}
						onClick={() => setMenuOpen((open) => !open)}
					>
						<div className="hamburger" />
					</div>
				</div>
			</div>
		</div>
	);
});
