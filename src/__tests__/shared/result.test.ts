import { describe, expect, it } from "vitest";
import {
	appError,
	failure,
	isFailure,
	isSuccess,
	success,
	unwrapOrThrow,
} from "../../shared/lib/result";

describe("Result helpers", () => {
	it("isSuccess narrows a Success result", () => {
		const result = success(42);
		expect(isSuccess(result)).toBe(true);
		if (isSuccess(result)) {
			expect(result.value).toBe(42);
		}
	});

	it("isFailure narrows a Failure result", () => {
		const result = failure(appError("CODE", "message"));
		expect(isFailure(result)).toBe(true);
		if (isFailure(result)) {
			expect(result.error.code).toBe("CODE");
		}
	});

	it("unwrapOrThrow returns the value for a Success", () => {
		expect(unwrapOrThrow(success("ok"))).toBe("ok");
	});

	it("unwrapOrThrow throws for a Failure", () => {
		expect(() => unwrapOrThrow(failure(appError("CODE", "boom")))).toThrow(
			"boom"
		);
	});
});
