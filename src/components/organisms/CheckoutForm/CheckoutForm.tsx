import { useMemo, useState } from "react";
import type { ReactElement } from "react";
import { useTranslation } from "react-i18next";
import { useZodForm } from "../../../hooks/useZodForm";
import {
	detectCardBrand,
	formatCardNumber,
	formatExpiry,
} from "../../../shared/lib/card";
import {
	checkoutAmountSchema,
	createCheckoutSchema,
	parseAmount,
} from "../../../shared/schemas/payment.schema";
import { Button } from "../../atoms/Button/Button";
import { ToggleSwitch } from "../../atoms/ToggleSwitch/ToggleSwitch";
import { Privat24Button } from "../../molecules/Privat24Button/Privat24Button";
import { FormField } from "../../molecules/FormField/FormField";
import styles from "./CheckoutForm.module.scss";

/** All that leaves the form: the card data stays in its state and is dropped on unmount. */
export interface CheckoutResult {
	readonly amount: number;
	readonly recurring: boolean;
	/** `card` = the card form was filled in; `privat24-app` = pay in the Privat24 app. */
	readonly method: "card" | "privat24-app";
}

interface CheckoutFormProps {
	/** Monthly price of the client's tariff - the amount is pre-filled with it. */
	readonly monthlyPrice: number;
	readonly tariffLabel: string;
	/** Accepted test cards (digits only); empty = any valid card. */
	readonly allowedCards?: readonly string[];
	/**
	 * Real payment: no card fields here - the user pays on the Privat24 page, so
	 * only the amount, the recurring choice and the Privat24 button are shown.
	 */
	readonly realPayment?: boolean;
	readonly onSubmit: (result: CheckoutResult) => void;
	readonly onCancel: () => void;
}

const NO_CARD_RESTRICTION: readonly string[] = [];

const PRESET_MONTHS = [1, 3, 6] as const;

const BRAND_LABEL = { visa: "VISA", mastercard: "Mastercard" } as const;

export function CheckoutForm({
	monthlyPrice,
	tariffLabel,
	allowedCards = NO_CARD_RESTRICTION,
	realPayment = false,
	onSubmit,
	onCancel,
}: CheckoutFormProps): ReactElement {
	const { t } = useTranslation();
	const schema = useMemo(
		() => createCheckoutSchema(allowedCards),
		[allowedCards]
	);
	const form = useZodForm(schema, {
		amount: String(monthlyPrice),
		cardNumber: "",
		expiry: "",
		cvv: "",
	});
	const [recurring, setRecurring] = useState(false);
	const brand = detectCardBrand(form.values.cardNumber);

	const handleSubmit = () => {
		const data = form.validate();
		if (!data) return;
		onSubmit({
			amount: parseAmount(data.amount),
			recurring,
			method: "card",
		});
	};

	const handlePayInApp = () => {
		if (!checkoutAmountSchema.safeParse(form.values.amount).success) {
			form.touchField("amount");
			return;
		}
		onSubmit({
			amount: parseAmount(form.values.amount),
			recurring,
			method: "privat24-app",
		});
	};

	return (
		<form
			className={styles.checkout}
			noValidate
			onSubmit={(e) => {
				e.preventDefault();
				handleSubmit();
			}}
		>
			<p className={styles.checkout__tariff}>
				{t("payment.tariffLine", { tariff: tariffLabel, price: monthlyPrice })}
			</p>
			<div className={styles.checkout__presets} role="group">
				{PRESET_MONTHS.map((months) => {
					const value = String(monthlyPrice * months);
					return (
						<button
							key={months}
							type="button"
							className={`${styles.checkout__preset} ${form.values.amount === value ? styles["checkout__preset--active"] : ""}`}
							aria-pressed={form.values.amount === value}
							onClick={() => form.setValue("amount", value)}
						>
							{t("payment.presetMonths", { count: months })} · {value}
						</button>
					);
				})}
			</div>
			<FormField
				id="checkoutAmount"
				label={t("payment.amountLabel")}
				type="text"
				inputMode="decimal"
				value={form.values.amount}
				errorMessage={form.errors.amount}
				touched={form.touched.amount}
				onChange={(e) => form.setValue("amount", e.target.value)}
				onBlur={() => form.touchField("amount")}
			/>

			{!realPayment && (
				<>
					<div className={styles.checkout__card}>
						<FormField
							id="checkoutCardNumber"
							label={t("payment.cardNumber")}
							type="text"
							inputMode="numeric"
							autoComplete="cc-number"
							placeholder="0000 0000 0000 0000"
							value={form.values.cardNumber}
							errorMessage={form.errors.cardNumber}
							touched={form.touched.cardNumber}
							onChange={(e) =>
								form.setValue("cardNumber", formatCardNumber(e.target.value))
							}
							onBlur={() => form.touchField("cardNumber")}
						/>
						<span
							className={`${styles.checkout__brand} ${brand ? styles[`checkout__brand--${brand}`] : ""}`}
							data-testid="card-brand"
							aria-live="polite"
						>
							{brand ? BRAND_LABEL[brand] : ""}
						</span>
					</div>

					<div className={styles.checkout__row}>
						<FormField
							id="checkoutExpiry"
							label={t("payment.cardExpiry")}
							type="text"
							inputMode="numeric"
							autoComplete="cc-exp"
							placeholder="MM/YY"
							value={form.values.expiry}
							errorMessage={form.errors.expiry}
							touched={form.touched.expiry}
							onChange={(e) =>
								form.setValue("expiry", formatExpiry(e.target.value))
							}
							onBlur={() => form.touchField("expiry")}
						/>
						<FormField
							id="checkoutCvv"
							label="CVV"
							type="password"
							inputMode="numeric"
							autoComplete="cc-csc"
							maxLength={3}
							placeholder="•••"
							value={form.values.cvv}
							errorMessage={form.errors.cvv}
							touched={form.touched.cvv}
							onChange={(e) =>
								form.setValue(
									"cvv",
									e.target.value.replace(/\D/g, "").slice(0, 3)
								)
							}
							onBlur={() => form.touchField("cvv")}
						/>
					</div>
				</>
			)}

			<div className={styles.checkout__recurring}>
				<span>{t("payment.recurringToggleLabel")}</span>
				<ToggleSwitch
					checked={recurring}
					onChange={() => setRecurring((value) => !value)}
					label={t("payment.recurringToggleLabel")}
				/>
			</div>

			{realPayment && (
				<p className={styles.checkout__testCards}>{t("payment.realHint")}</p>
			)}

			{!realPayment && (
				<>
					<Button type="submit" fullWidth className={styles.checkout__pay}>
						{t("payment.payByCard")}
					</Button>
					<div className={styles.checkout__or}>{t("payment.or")}</div>
				</>
			)}
			<Privat24Button
				className={styles.checkout__pay}
				onClick={handlePayInApp}
			/>
			<Button type="button" variant="ghost" fullWidth onClick={onCancel}>
				{t("modal.cancel")}
			</Button>
			<p className={styles.checkout__note}>{t("payment.securityNote")}</p>
		</form>
	);
}
