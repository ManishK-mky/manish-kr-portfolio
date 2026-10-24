import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { fail, mockFetch, ok } from "@/test/fetch-mock";
import { ContactForm } from "./contact-form";

async function fill(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText("Name"), "Jamie Doe");
  await user.type(screen.getByLabelText("Email"), "jamie@example.com");
  await user.type(screen.getByLabelText("Message"), "I'd love to work together on a project.");
}

describe("ContactForm", () => {
  it("shows validation errors and does not submit invalid input", async () => {
    const calls = mockFetch(() => undefined);
    const user = userEvent.setup();
    render(<ContactForm />);

    await user.type(screen.getByLabelText("Email"), "not-an-email");
    await user.click(screen.getByRole("button", { name: /send message/i }));

    expect(screen.getByText("Please enter your name")).toBeInTheDocument();
    expect(screen.getByText("Please enter a valid email address")).toBeInTheDocument();
    expect(screen.getByLabelText("Email")).toHaveAttribute("aria-invalid", "true");
    expect(calls).toHaveLength(0);
  });

  it("submits valid input with the honeypot and timing fields, then confirms", async () => {
    const calls = mockFetch((url) => (url.pathname === "/api/v1/contact" ? ok({ received: true }, 202) : undefined));
    const user = userEvent.setup();
    render(<ContactForm />);
    await fill(user);
    await user.click(screen.getByRole("button", { name: /send message/i }));

    expect(await screen.findByText(/your message is on its way/i)).toBeInTheDocument();
    const body = JSON.parse(calls[0].init.body as string);
    expect(body).toMatchObject({ name: "Jamie Doe", email: "jamie@example.com", website: "" });
    expect(typeof body.startedAt).toBe("number");
  });

  it("surfaces server errors", async () => {
    mockFetch(() => fail(429, "Too many requests"));
    const user = userEvent.setup();
    render(<ContactForm />);
    await fill(user);
    await user.click(screen.getByRole("button", { name: /send message/i }));
    await waitFor(() => expect(screen.getByRole("alert")).toHaveTextContent("Too many requests"));
  });
});
