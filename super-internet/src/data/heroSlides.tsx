import type {ReactNode} from "react";

import spaceBack from "../assets/img/layers/Space-Back.png";
import spaceFront from "../assets/img/layers/Space-Front.png";
import earthBack from "../assets/img/layers/Earth-Back.png";
import earthFront from "../assets/img/layers/Earth-Front.png";
import satelliteBack from "../assets/img/layers/Satellite-Back.png";
import satelliteFront from "../assets/img/layers/Satellite-Front.png";
import earthWebBack from "../assets/img/layers/Earth-on-WEB-Back.png";
import earthWebFront from "../assets/img/layers/Earth-on-WEB-Front.png";

export interface HeroSlideData {
	navLabel: string;
	heading: string;
	paragraph: ReactNode;
	backLayer: string;
	frontLayer: string;
}

export const heroSlides: HeroSlideData[] = [
	{
		navLabel: "Головна",
		heading: "Неймовірні можливості",
		paragraph: (
			<p>
				Швидкісний та стабільний інтернет за доступною ціною. Ми гарантуємо
				якість, надійність та сучасні технології для вашого дому та бізнесу.
			</p>
		),
		backLayer: spaceBack,
		frontLayer: spaceFront,
	},
	{
		navLabel: "Про нас",
		heading: "Ми компанія",
		paragraph: (
			<p>
				Super Internet — провайдер оптоволоконного швидкісного інтернету.
				Працюємо чесно та прозоро, забезпечуємо стабільність з’єднання і
				підтримку 24/7.
			</p>
		),
		backLayer: earthBack,
		frontLayer: earthFront,
	},
	{
		navLabel: "Тарифи",
		heading: "Тарифи",
		paragraph: (
			<p>
				Обирайте свій варіант:
				<br />
				Інтернет — швидкісне та якісне з’єднання.
				<br />
				Інтернет + Телебачення — подвійна вигода.
				<br />
			</p>
		),
		backLayer: satelliteBack,
		frontLayer: satelliteFront,
	},
	{
		navLabel: "Контакти",
		heading: "Контакти",
		paragraph: (
			<p>
				📍 Адреса: м. Калуш, вул. Січових Стрільців, 15 <br />
				📧 Email: bohdan.kruchkevych-ip231@nung.edu.ua <br />
				📞 Телефон: +380 ХХ ХХХ ХХ ХХ
			</p>
		),
		backLayer: earthWebBack,
		frontLayer: earthWebFront,
	},
];
