import { Component } from "react";
import type { ErrorInfo, ReactNode } from "react";
import { withTranslation } from "react-i18next";
import type { WithTranslation } from "react-i18next";
import styles from "./ErrorBoundary.module.scss";

export interface ErrorBoundaryProps extends WithTranslation {
	readonly children: ReactNode;
	/** Optional custom fallback renderer; defaults to a generic "something broke" screen. */
	readonly fallback?: (error: Error, reset: () => void) => ReactNode;
}

interface ErrorBoundaryState {
	readonly error: Error | null;
}

/**
 * Single responsibility: stop a render-time exception anywhere in the tree
 * below it from crashing the entire app to a blank white screen. This must
 * be a class component - React has no hook equivalent for
 * `getDerivedStateFromError`/`componentDidCatch` as of React 19.
 */
class ErrorBoundaryImpl extends Component<
	ErrorBoundaryProps,
	ErrorBoundaryState
> {
	public state: ErrorBoundaryState = { error: null };

	public static getDerivedStateFromError(error: Error): ErrorBoundaryState {
		return { error };
	}

	public componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
		// Last-resort visibility; replace with a real logging service (e.g. Sentry) when one is wired up.
		console.error(
			"Unhandled render error caught by ErrorBoundary:",
			error,
			errorInfo.componentStack
		);
	}

	private readonly reset = (): void => {
		this.setState({ error: null });
	};

	public render(): ReactNode {
		const { error } = this.state;
		if (!error) return this.props.children;

		if (this.props.fallback) return this.props.fallback(error, this.reset);

		const { t } = this.props;
		return (
			<div className={styles["error-boundary"]}>
				<div className={styles["error-boundary__card"]}>
					<h2>{t("errorBoundary.title")}</h2>
					<p>{t("errorBoundary.message")}</p>
					<button
						className={styles["error-boundary__button"]}
						onClick={() => window.location.reload()}
					>
						{t("errorBoundary.reload")}
					</button>
				</div>
			</div>
		);
	}
}

/**
 * `withTranslation` HOC because `ErrorBoundary` must be a class component
 * (React has no hook equivalent for `getDerivedStateFromError`/
 * `componentDidCatch` as of React 19), and hooks like `useTranslation`
 * cannot be used inside class components.
 */
export const ErrorBoundary = withTranslation()(ErrorBoundaryImpl);
