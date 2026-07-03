import {Link} from "react-router";
import "./Logo.scss";

const logoUrl = `${import.meta.env.BASE_URL}Logo.png`;

export function Logo() {
	return (
		<Link to="/" className="logo">
			<img src={logoUrl} alt="Super Internet" />
		</Link>
	);
}
