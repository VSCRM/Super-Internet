export interface AddressRequirement {
	readonly id: string;
	readonly label: string;
	readonly test: (value: string) => boolean;
}

const STREET_PATTERN =
	/(вул\.?|вулиця|пров\.?|провулок|просп\.?|проспект|бульв\.?|бульвар|площа|майдан)/i;
const CYRILLIC_PATTERN = /[а-яіїєґА-ЯІЇЄҐ]/;
const NUMBER_PATTERN = /\d/;

export const ADDRESS_REQUIREMENTS: readonly AddressRequirement[] = [
	{
		id: "cyrillic",
		label: "Адреса написана українською",
		test: (v) => CYRILLIC_PATTERN.test(v.trim()),
	},
	{
		id: "street",
		label: "Тип вулиці (вул. / просп. / пров. / бульв. / площа / майдан)",
		test: (v) => STREET_PATTERN.test(v),
	},
	{
		id: "number",
		label: "Номер будинку (цифра)",
		test: (v) => NUMBER_PATTERN.test(v),
	},
	{
		id: "length",
		label: "Не менше 15 символів",
		test: (v) => v.trim().length >= 15,
	},
];

export function isAddressValid(value: string): boolean {
	return ADDRESS_REQUIREMENTS.every((r) => r.test(value));
}
