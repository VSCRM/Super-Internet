import { describe, expect, it } from "vitest";
import {
	addressSchema,
	editableProfileSchema,
} from "../../shared/schemas/profile.schema";

describe("addressSchema", () => {
	it("accepts a well-formed Ukrainian street address", () => {
		expect(
			addressSchema.safeParse("вул. Івана Франка, 25, кв. 10").success
		).toBe(true);
	});

	it("rejects an address shorter than 15 characters", () => {
		expect(addressSchema.safeParse("вул. АБ, 1").success).toBe(false);
	});

	it("rejects an address without a house number", () => {
		expect(
			addressSchema.safeParse("вулиця Шевченка без номера тут").success
		).toBe(false);
	});

	it("rejects an address without a recognizable street keyword", () => {
		expect(
			addressSchema.safeParse("Якась випадкова адреса 25 кв 10").success
		).toBe(false);
	});
});

describe("editableProfileSchema", () => {
	it("only accepts fio and phone - contract/equipment fields are not part of this schema", () => {
		const parsed = editableProfileSchema.parse({
			fio: "Іванов Іван Іванович",
			phone: "+380501234567",
		});
		expect(Object.keys(parsed)).toEqual(["fio", "phone"]);
	});

	it("rejects an invalid phone format", () => {
		const result = editableProfileSchema.safeParse({
			fio: "Іванов Іван Іванович",
			phone: "12345",
		});
		expect(result.success).toBe(false);
	});
});
