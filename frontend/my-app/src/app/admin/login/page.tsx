import type { Metadata } from "next";
import { Suspense } from "react";
import { LoginForm } from "@/features/admin/auth/login-form";

export const metadata: Metadata = { title: "Sign in" };

export default function LoginPage() {
  return (
    <main id="main" className="flex min-h-screen items-center justify-center bg-subtle px-4">
      <Suspense>
        <LoginForm />
      </Suspense>
    </main>
  );
}
