import { useState } from "react";
import type { ButtonHTMLAttributes, ReactElement } from "react";
import { useTranslation } from "react-i18next";
import styles from "./Privat24Button.module.scss";

/** Privat24 round "24" icon, served from `public/privat24-logo.png`. */
export const PRIVAT24_LOGO_SRC = `${import.meta.env.BASE_URL}privat24-logo.png`;

type Privat24ButtonProps = Omit<
	ButtonHTMLAttributes<HTMLButtonElement>,
	"children"
>;

/**
 * "Pay via the Privat24 app": a round icon button with the Privat24 logo and a
 * short caption under it. If the logo file is missing it falls back to a round
 * "24" badge, so the button never shows a broken image.
 */
export function Privat24Button({
	className,
	...rest
}: Privat24ButtonProps): ReactElement {
	const { t } = useTranslation();
	const [logoFailed, setLogoFailed] = useState(false);
	const label = t("payment.payViaApp");

	return (
		<div className={styles.privat24}>
			<button
				type="button"
				className={[styles.privat24__button, className]
					.filter(Boolean)
					.join(" ")}
				aria-label={label}
				title={label}
				{...rest}
			>
				{logoFailed ? (
					<span className={styles.privat24__fallback} aria-hidden="true">
						24
					</span>
				) : (
					<img
						className={styles.privat24__logo}
						src={PRIVAT24_LOGO_SRC}
						alt=""
						onError={() => setLogoFailed(true)}
					/>
				)}
			</button>
			<span className={styles.privat24__caption}>
				{t("payment.payViaAppShort")}
			</span>
		</div>
	);
}
