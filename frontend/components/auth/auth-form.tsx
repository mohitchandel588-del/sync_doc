"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getApiErrorMessage } from "@/lib/api";
import { useAuthStore } from "@/store/auth-store";

type AuthFormProps = {
  mode: "login" | "register";
};

export const AuthForm = ({ mode }: AuthFormProps) => {
  const router = useRouter();
  const { login, register, isLoading } = useAuthStore();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    try {
      if (mode === "login") {
        await login({
          email: email.trim(),
          password
        });
      } else {
        const normalizedName = name.trim();

        await register({
          name: normalizedName ? normalizedName : undefined,
          email: email.trim(),
          password
        });
      }

      router.push("/workspace");
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Unable to continue."));
    }
  };

  return (
    <div className="mx-auto flex min-h-screen max-w-6xl items-center px-6 py-12">
      <div className="grid w-full gap-10 lg:grid-cols-[1.1fr_0.9fr]">
        <section className="hidden rounded-[2rem] bg-ink px-10 py-12 text-white shadow-panel lg:flex lg:flex-col lg:justify-between">
          <div>
            <span className="rounded-full border border-white/20 px-3 py-1 text-xs uppercase tracking-[0.28em] text-white/70">
              SyncDoc
            </span>
            <h1 className="mt-8 max-w-xl font-[family-name:var(--font-space-grotesk)] text-5xl font-semibold leading-tight tracking-[-0.05em]">
              Collaborate on living documents without losing the thread.
            </h1>
            <p className="mt-5 max-w-lg text-base leading-7 text-white/72">
              Real-time editing, role-based control, file-backed discussions, and
              Gemini-powered writing support in one workspace.
            </p>
          </div>
          <div className="grid gap-4 rounded-[1.75rem] border border-white/10 bg-white/5 p-6">
            <div className="flex items-center justify-between text-sm text-white/70">
              <span>Presence</span>
              <span>Live</span>
            </div>
            <div className="rounded-2xl bg-white/95 p-4 text-ink">
              <p className="text-sm font-medium text-slate-500">Workspace pulse</p>
              <p className="mt-2 font-[family-name:var(--font-space-grotesk)] text-2xl font-semibold tracking-[-0.04em]">
                Docs, chat, AI, and permissions all stay in sync.
              </p>
            </div>
          </div>
        </section>

        <section className="panel rounded-[2rem] px-6 py-8 sm:px-8 sm:py-10">
          <span className="rounded-full bg-teal/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.28em] text-teal">
            {mode === "login" ? "Welcome Back" : "Create Workspace Access"}
          </span>
          <h2 className="mt-6 font-[family-name:var(--font-space-grotesk)] text-4xl font-semibold tracking-[-0.05em] text-ink">
            {mode === "login" ? "Sign in to SyncDoc" : "Join SyncDoc"}
          </h2>
          <p className="mt-3 max-w-md text-sm leading-6 text-slate-600">
            {mode === "login"
              ? "Open your collaborative workspace and continue where the team left off."
              : "Start authoring shared documents with structured permissions and live collaboration."}
          </p>

          <form className="mt-8 grid gap-4" onSubmit={handleSubmit}>
            {mode === "register" ? (
              <Input
                placeholder="Full name"
                value={name}
                onChange={(event) => setName(event.target.value)}
              />
            ) : null}
            <Input
              type="email"
              placeholder="Email address"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
            <Input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
            <Button className="mt-2 h-12" disabled={isLoading} type="submit">
              {isLoading
                ? "Working..."
                : mode === "login"
                  ? "Sign In"
                  : "Create Account"}
            </Button>
          </form>

          {mode === "login" ? (
            <div className="mt-4 flex justify-end">
              <Link
                className="text-sm font-semibold text-teal transition hover:text-pine"
                href="/forgot-password"
              >
                Forgot password?
              </Link>
            </div>
          ) : null}

          <p className="mt-6 text-sm text-slate-600">
            {mode === "login" ? "Need an account?" : "Already have an account?"}{" "}
            <Link
              className="font-semibold text-teal transition hover:text-pine"
              href={mode === "login" ? "/register" : "/login"}
            >
              {mode === "login" ? "Create one" : "Sign in"}
            </Link>
          </p>
        </section>
      </div>
    </div>
  );
};
