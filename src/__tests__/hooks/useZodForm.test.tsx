import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { z } from "zod";
import { useZodForm } from "../../hooks/useZodForm";

const schema = z.object({
	name: z.string().min(2, "Too short"),
	age: z.number().min(18, "Must be an adult"),
});

describe("useZodForm", () => {
	it("starts invalid when initial values fail the schema", () => {
		const { result } = renderHook(() =>
			useZodForm(schema, { name: "", age: 0 })
		);
		expect(result.current.isValid).toBe(false);
	});

	it("becomes valid once values satisfy the schema", () => {
		const { result } = renderHook(() =>
			useZodForm(schema, { name: "", age: 0 })
		);

		act(() => {
			result.current.setValue("name", "Bob");
			result.current.setValue("age", 25);
		});

		expect(result.current.isValid).toBe(true);
	});

	it("validate() returns null and marks fields touched when invalid", () => {
		const { result } = renderHook(() =>
			useZodForm(schema, { name: "", age: 0 })
		);

		let validated: unknown;
		act(() => {
			validated = result.current.validate();
		});

		expect(validated).toBeNull();
		expect(result.current.touched.name).toBe(true);
		expect(result.current.errors.name).toBeTruthy();
	});

	it("validate() returns parsed data when valid", () => {
		const { result } = renderHook(() =>
			useZodForm(schema, { name: "Bob", age: 25 })
		);

		let validated: { name: string; age: number } | null = null;
		act(() => {
			validated = result.current.validate();
		});

		expect(validated).toEqual({ name: "Bob", age: 25 });
	});

	it("reset() restores initial values and clears touched state", () => {
		const { result } = renderHook(() =>
			useZodForm(schema, { name: "Bob", age: 25 })
		);

		act(() => {
			result.current.setValue("name", "Changed");
			result.current.touchField("name");
		});
		expect(result.current.values.name).toBe("Changed");

		act(() => {
			result.current.reset();
		});

		expect(result.current.values.name).toBe("Bob");
		expect(result.current.touched.name).toBeUndefined();
	});
});
