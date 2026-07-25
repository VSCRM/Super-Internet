import type { ReactElement } from "react";
import shared from "../../PersonalAccount/dashboardShared.module.scss";

export interface NavTabItem<TabId extends string> {
	readonly id: TabId;
	readonly label: string;
	/** Shown as a small red badge on the tab when greater than zero and the tab isn't active. */
	readonly badgeCount?: number;
}

export interface NavTabsProps<TabId extends string> {
	readonly tabs: readonly NavTabItem<TabId>[];
	readonly active: TabId;
	readonly onSelect: (tab: TabId) => void;
}

/** Single responsibility: render a row of dashboard tab buttons with the active/badge styling. */
export function NavTabs<TabId extends string>({
	tabs,
	active,
	onSelect,
}: NavTabsProps<TabId>): ReactElement {
	return (
		<div className={shared["nav-tabs"]}>
			{tabs.map((tab) => (
				<button
					key={tab.id}
					className={`${shared["nav-tab"]} ${tab.id === active ? shared["nav-tab--active"] : ""}`}
					onClick={() => onSelect(tab.id)}
				>
					{tab.label}
					{!!tab.badgeCount && tab.id !== active && (
						<span className={shared["unread-badge"]}>{tab.badgeCount}</span>
					)}
				</button>
			))}
		</div>
	);
}
