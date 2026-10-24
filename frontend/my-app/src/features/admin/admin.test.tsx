import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { fail, mockFetch, ok } from "@/test/fetch-mock";
import { AuthProvider } from "./auth/auth-provider";
import { LoginForm } from "./auth/login-form";
import { ConfirmButton } from "./components/confirm-button";
import { SocialLinksPage } from "./pages/social-links";

const session = { accessToken: "token-1", user: { id: "u1", email: "admin@example.com", name: "Admin", role: "admin" } };
const links = [
  { id: "l1", platform: "github", label: "GitHub", url: "https://github.com/me", visible: true, showInHero: true, order: 0 },
  { id: "l2", platform: "linkedin", label: "LinkedIn", url: "https://linkedin.com/in/me", visible: true, showInHero: false, order: 1 },
];

describe("LoginForm", () => {
  it("validates before calling the API", async () => {
    const calls = mockFetch((url) => (url.pathname === "/api/v1/auth/refresh" ? fail(401, "No session") : undefined));
    const user = userEvent.setup();
    render(
      <AuthProvider>
        <LoginForm />
      </AuthProvider>,
    );
    await user.click(screen.getByRole("button", { name: /sign in/i }));
    expect(screen.getByText("Enter a valid email address")).toBeInTheDocument();
    expect(screen.getByText("Enter your password")).toBeInTheDocument();
    expect(calls.some((c) => c.url.pathname === "/api/v1/auth/login")).toBe(false);
  });

  it("shows a friendly message when rate limited", async () => {
    mockFetch((url) => {
      if (url.pathname === "/api/v1/auth/refresh") return fail(401, "No session");
      if (url.pathname === "/api/v1/auth/login") return fail(429, "ThrottlerException");
      return undefined;
    });
    const user = userEvent.setup();
    render(
      <AuthProvider>
        <LoginForm />
      </AuthProvider>,
    );
    await user.type(screen.getByLabelText("Email"), "admin@example.com");
    await user.type(screen.getByLabelText("Password"), "wrong-password");
    await user.click(screen.getByRole("button", { name: /sign in/i }));
    expect(await screen.findByRole("alert")).toHaveTextContent(/too many attempts/i);
  });
});

describe("ConfirmButton", () => {
  it("only runs the action after confirmation", async () => {
    const onConfirm = vi.fn();
    const user = userEvent.setup();
    render(
      <ConfirmButton title="Delete it?" description="Gone forever." onConfirm={onConfirm}>
        Delete
      </ConfirmButton>,
    );
    await user.click(screen.getByRole("button", { name: "Delete" }));
    const dialog = await screen.findByRole("alertdialog");
    expect(onConfirm).not.toHaveBeenCalled();
    await user.click(within(dialog).getByRole("button", { name: "Cancel" }));
    expect(onConfirm).not.toHaveBeenCalled();

    await user.click(screen.getByRole("button", { name: "Delete" }));
    await user.click(within(await screen.findByRole("alertdialog")).getByRole("button", { name: "Delete" }));
    await waitFor(() => expect(onConfirm).toHaveBeenCalledTimes(1));
  });
});

describe("SocialLinksPage (admin workflow)", () => {
  it("loads with a refreshed session, then reorders with the bearer token", async () => {
    const calls = mockFetch((url, init) => {
      if (url.pathname === "/api/v1/auth/refresh") return ok(session);
      if (url.pathname === "/api/v1/social-links/admin") return ok(links);
      if (url.pathname === "/api/v1/social-links/reorder" && init.method === "PATCH") return ok({ updated: 2 });
      return undefined;
    });
    const user = userEvent.setup();
    render(<SocialLinksPage />);

    expect(await screen.findByText("LinkedIn")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Move LinkedIn up" }));

    await waitFor(() => expect(calls.some((c) => c.url.pathname === "/api/v1/social-links/reorder")).toBe(true));
    const reorder = calls.find((c) => c.url.pathname === "/api/v1/social-links/reorder")!;
    expect(JSON.parse(reorder.init.body as string)).toEqual({ ids: ["l2", "l1"] });
    expect((reorder.init.headers as Record<string, string>).authorization).toBe("Bearer token-1");
    // The refresh call carries the CSRF header the API requires.
    const refresh = calls.find((c) => c.url.pathname === "/api/v1/auth/refresh")!;
    expect((refresh.init.headers as Record<string, string>)["x-requested-with"]).toBe("portfolio-admin");
  });

  it("shows an error state with retry when loading fails", async () => {
    mockFetch((url) => {
      if (url.pathname === "/api/v1/auth/refresh") return ok(session);
      if (url.pathname === "/api/v1/social-links/admin") return fail(500, "Database unavailable");
      return undefined;
    });
    render(<SocialLinksPage />);
    expect(await screen.findByRole("alert")).toHaveTextContent("Database unavailable");
    expect(screen.getByRole("button", { name: /try again/i })).toBeInTheDocument();
  });

  it("validates the link form before saving", async () => {
    const calls = mockFetch((url) => {
      if (url.pathname === "/api/v1/auth/refresh") return ok(session);
      if (url.pathname === "/api/v1/social-links/admin") return ok([]);
      return undefined;
    });
    const user = userEvent.setup();
    render(<SocialLinksPage />);
    await screen.findByText("No links yet");
    await user.click(screen.getByRole("button", { name: /add link/i }));
    const dialog = await screen.findByRole("dialog");
    await user.type(within(dialog).getByLabelText(/^URL/), "javascript:alert(1)");
    await user.click(within(dialog).getByRole("button", { name: "Save" }));
    expect(await within(dialog).findByText(/http\(s\):\/\/ or mailto:/)).toBeInTheDocument();
    expect(calls.some((c) => c.init.method === "POST" && c.url.pathname === "/api/v1/social-links")).toBe(false);
  });
});
