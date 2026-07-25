import { memo } from "react";
import type { ReactElement } from "react";
import { useTranslation } from "react-i18next";
import { LetterTitle } from "./LetterTitle";

interface SlideData {
	id: string;
	title: string;
	body: ReactElement;
}

interface HeaderContentProps {
	activeIndex: number;
	onConnectClick: () => void;
}

export const HeaderContent = memo(function HeaderContent({
	activeIndex,
	onConnectClick,
}: HeaderContentProps): ReactElement {
	const { t } = useTranslation();

	const slides: SlideData[] = [
		{
			id: "features",
			title: t("landing.slides.features.title"),
			body: <p>{t("landing.slides.features.body")}</p>,
		},
		{
			id: "about",
			title: t("landing.slides.about.title"),
			body: <p>{t("landing.slides.about.body")}</p>,
		},
		{
			id: "pricing",
			title: t("landing.slides.pricing.title"),
			body: (
				<p>
					{t("landing.slides.pricing.intro")}
					<br />
					{t("landing.slides.pricing.internet")}
					<br />
					{t("landing.slides.pricing.internetTv")}
					<br />
				</p>
			),
		},
		{
			id: "contacts",
			title: t("landing.slides.contacts.title"),
			body: (
				<p>
					{t("landing.slides.contacts.address")} <br />
					{t("landing.slides.contacts.email")} <br />
					{t("landing.slides.contacts.phone")}
				</p>
			),
		},
	];

	return (
		<div className="header-content">
			{slides.map((slide, index) => (
				<div
					key={slide.id}
					className={`header-content__slide ${activeIndex === index ? "active" : ""}`}
				>
					<LetterTitle text={slide.title} />
					<div className="header-content__info">
						{slide.body}
						<br />
						<button className="button button--main" onClick={onConnectClick}>
							{t("landing.connectNow")}
						</button>
					</div>
				</div>
			))}
		</div>
	);
});
