import {useModalVisibility} from "./useModalVisibility";
import type {ModalType} from "./ModalContext";
import "./Modal.scss";

interface AlertModalProps {
	title: string;
	message: string;
	type: ModalType;
	onClose: () => void;
}

export function AlertModal({title, message, type, onClose}: AlertModalProps) {
	const {visible, closeAndThen} = useModalVisibility();

	return (
		<div className={`modal-overlay${visible ? " show" : ""}`}>
			<div className={`modal-content ${type}`}>
				<h3>{title}</h3>
				<p>{message}</p>
				<button className="modal-btn" onClick={() => closeAndThen(onClose)}>
					OK
				</button>
			</div>
		</div>
	);
}
