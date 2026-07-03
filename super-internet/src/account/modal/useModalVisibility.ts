import {useEffect, useState} from "react";

export function useModalVisibility() {
	const [visible, setVisible] = useState(false);

	useEffect(() => {
		const id = window.setTimeout(() => setVisible(true), 10);
		return () => window.clearTimeout(id);
	}, []);

	const closeAndThen = (action: () => void) => {
		setVisible(false);
		window.setTimeout(action, 300);
	};

	return {visible, closeAndThen};
}
