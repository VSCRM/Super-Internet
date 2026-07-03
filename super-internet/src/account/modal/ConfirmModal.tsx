import {useModalVisibility} from "./useModalVisibility";
import "./Modal.scss";

interface ConfirmModalProps {
	title: string;
	message: string;
	onResult: (value: boolean) => void;
}

export function ConfirmModal({title, message, onResult}: ConfirmModalProps) {
	const {visible, closeAndThen} = useModalVisibility();

	return (
		<div className={`modal-overlay${visible ? " show" : ""}`}>
			<div className="modal-content warning">
				<h3>{title}</h3>
				<p>{message}</p>
				<div style={{display: "flex", gap: "1rem", marginTop: "1rem"}}>
					<button
						className="modal-btn cancel"
						onClick={() => closeAndThen(() => onResult(false))}>
						Ні
					</button>
					<button
						className="modal-btn confirm"
						onClick={() => closeAndThen(() => onResult(true))}>
						Так
					</button>
				</div>
			</div>
		</div>
	);
}
