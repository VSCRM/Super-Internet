import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Button } from "../../components/atoms/Button/Button";
import { FormField } from "../../components/molecules/FormField/FormField";

describe("Button", () => {
	it("invokes onClick when clicked", async () => {
		const handleClick = vi.fn();
		render(<Button onClick={handleClick}>Submit</Button>);

		await userEvent.click(screen.getByRole("button", { name: "Submit" }));
		expect(handleClick).toHaveBeenCalledOnce();
	});

	it("disables the button and hides label while isLoading", () => {
		render(<Button isLoading>Submit</Button>);
		expect(screen.getByRole("button")).toBeDisabled();
		expect(screen.queryByText("Submit")).not.toBeInTheDocument();
	});
});

describe("FormField", () => {
	it("renders the label and forwards input value", () => {
		render(
			<FormField
				id="email"
				label="Email"
				value="test@gmail.com"
				onChange={() => {}}
			/>
		);

		expect(screen.getByText("Email")).toBeInTheDocument();
		expect(screen.getByDisplayValue("test@gmail.com")).toBeInTheDocument();
	});

	it("shows the error message only when touched", () => {
		const { rerender } = render(
			<FormField
				id="email"
				label="Email"
				value=""
				errorMessage="Required"
				touched={false}
				onChange={() => {}}
			/>
		);
		expect(screen.queryByText("Required")).not.toBeInTheDocument();

		rerender(
			<FormField
				id="email"
				label="Email"
				value=""
				errorMessage="Required"
				touched
				onChange={() => {}}
			/>
		);
		expect(screen.getByText("Required")).toBeInTheDocument();
	});
});
