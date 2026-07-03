import {Route, Routes} from "react-router";
import {Home} from "./pages/Home/Home";
import {PersonalAccount} from "./pages/PersonalAccount/PersonalAccount";

function App() {
	return (
		<Routes>
			<Route path="/" element={<Home />} />
			<Route path="/personal-account" element={<PersonalAccount />} />
		</Routes>
	);
}

export default App;
