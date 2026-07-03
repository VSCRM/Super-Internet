import {useState} from "react";
import {Eye, EyeOff} from "lucide-react";
import type {ValidationRule} from "../validation";
import "./FieldWithRules.scss";

interface FieldWithRulesProps {
	id: string;
	label?: string;
	type?: string;
	value: string;
	onChange: (value: string) => void;
	rules: ValidationRule[];
	placeholder?: string;
	autoFocus?: boolean;
	autoComplete?: string;
}

export function FieldWithRules({
	id,
	label,
	type = "text",
	value,
	onChange,
	rules,
	placeholder,
	autoFocus,
	autoComplete,
}: FieldWithRulesProps) {
	const [showPassword, setShowPassword] = useState(false);
	const isPassword = type === "password";
	const inputType = isPassword ? (showPassword ? "text" : "password") : type;

	// Derive a sensible autocomplete value when not explicitly provided
	const resolvedAutoComplete =
		autoComplete ??
		(isPassword
			? "current-password"
			: type === "email"
				? "email"
				: type === "tel"
					? "tel"
					: undefined);

	const allPassed = rules.every((r) => r.test(value));
	const touched = value.length > 0;
	const fieldClass = touched ? (allPassed ? "success" : "error") : "";

	return (
		<div className="form-group">
			{label && <label htmlFor={id}>{label}</label>}
			<div className="input-wrapper">
				<input
					id={id}
					type={inputType}
					value={value}
					placeholder={placeholder}
					autoFocus={autoFocus}
					autoComplete={resolvedAutoComplete}
					className={fieldClass}
					onChange={(e) => onChange(e.target.value)}
				/>
				{isPassword && (
					<button
						type="button"
						className="eye-toggle"
						tabIndex={-1}
						onClick={() => setShowPassword((v) => !v)}
						aria-label={showPassword ? "Приховати пароль" : "Показати пароль"}>
						{showPassword ? (
							<EyeOff size={18} strokeWidth={1.8} />
						) : (
							<Eye size={18} strokeWidth={1.8} />
						)}
					</button>
				)}
			</div>
			{touched && (
				<ul className="validation-hints">
					{rules.map((rule) => {
						const ok = rule.test(value);
						return (
							<li key={rule.label} className={ok ? "hint-ok" : "hint-fail"}>
								<span className="hint-icon">{ok ? "✓" : "✗"}</span>
								{rule.label}
							</li>
						);
					})}
				</ul>
			)}
		</div>
	);
}
