import {useState} from "react";
import {useModalVisibility} from "./useModalVisibility";
import "./Modal.scss";

interface PromptModalProps {
	title: string;
	message: string;
	placeholder: string;
	onResult: (value: string | null) => void;
}

export function PromptModal({
	title,
	message,
	placeholder,
	onResult,
}: PromptModalProps) {
	const {visible, closeAndThen} = useModalVisibility();
	const [value, setValue] = useState("");

	const confirm = () => closeAndThen(() => onResult(value.trim()));
	const cancel = () => closeAndThen(() => onResult(null));

	return (
		<div className={`modal-overlay${visible ? " show" : ""}`}>
			<div className="modal-content">
				<h3>{title}</h3>
				<p>{message}</p>
				<input
					type="text"
					className="modal-input"
					placeholder={placeholder}
					value={value}
					autoFocus
					onChange={(e) => setValue(e.target.value)}
					onKeyDown={(e) => {
						if (e.key === "Enter") confirm();
					}}
				/>
				<div style={{display: "flex", gap: "1rem", marginTop: "1rem"}}>
					<button className="modal-btn cancel" onClick={cancel}>
						Cancel
					</button>
					<button className="modal-btn confirm" onClick={confirm}>
						Confirm
					</button>
				</div>
			</div>
		</div>
	);
}
