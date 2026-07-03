import "./StatusDot.scss";

type DotStatus = "online" | "offline" | "pending" | "active" | "debt";

const LABELS: Record<DotStatus, string> = {
	online: "Онлайн",
	offline: "Офлайн",
	pending: "Очікує",
	active: "Активний",
	debt: "Заборгованість",
};

interface StatusDotProps {
	status: DotStatus;
	label?: string;
}

export function StatusDot({status, label}: StatusDotProps) {
	return (
		<span className={`status-dot-wrap status-dot--${status}`}>
			<span className="status-dot" />
			{label ?? LABELS[status]}
		</span>
	);
}
