import { describe, expect, it } from "vitest";
import {
	addStaffBackendSchema,
	addStaffSchema,
} from "../../shared/schemas/auth.schema";

const valid = {
	name: "Петренко Петро Петрович",
	email: "staff@gmail.com",
	password: "Passw0rd",
	phone: "+380671112233",
};

describe("add-staff schemas", () => {
	it("the backend schema accepts what RegisterRequest accepts", () => {
		expect(addStaffBackendSchema.safeParse(valid).success).toBe(true);
	});

	it("the backend schema needs a three-word name and a +380 phone", () => {
		expect(
			addStaffBackendSchema.safeParse({ ...valid, name: "Петро" }).success
		).toBe(false);
		expect(
			addStaffBackendSchema.safeParse({ ...valid, phone: "0671112233" }).success
		).toBe(false);
		expect(
			addStaffBackendSchema.safeParse({ ...valid, phone: "" }).success
		).toBe(false);
	});

	it("the Mock schema still takes a short name and no phone", () => {
		expect(
			addStaffSchema.safeParse({
				name: "Оксана",
				email: "o@super.net",
				password: "Passw0rd",
				phone: "",
			}).success
		).toBe(true);
	});
});
