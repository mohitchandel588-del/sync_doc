"use client";

import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api, getApiErrorMessage } from "@/lib/api";

type ForgotPasswordResponse = {
  message: string;
  resetUrl?: string;
  expiresAt?: string;
};

export const ForgotPasswordForm = () => {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverMessage, setServerMessage] = useState<string | null>(null);
  const [resetUrl, setResetUrl] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);

    try {
      const { data } = await api.post<ForgotPasswordResponse>(
        "/auth/forgot-password",
        {
          email: email.trim()
        }
      );

      setServerMessage(data.message);
      setResetUrl(data.resetUrl ?? null);
      toast.success(data.message);
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Unable to start password reset."));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mx-auto flex min-h-screen max-w-6xl items-center px-6 py-12">
      <div className="grid w-full gap-10 lg:grid-cols-[1.1fr_0.9fr]">
        <section className="hidden rounded-[2rem] bg-ink px-10 py-12 text-white shadow-panel lg:flex lg:flex-col lg:justify-between">
          <div>
            <span className="rounded-full border border-white/20 px-3 py-1 text-xs uppercase tracking-[0.28em] text-white/70">
              SyncDoc Recovery
            </span>
            <h1 className="mt-8 max-w-xl font-[family-name:var(--font-space-grotesk)] text-5xl font-semibold leading-tight tracking-[-0.05em]">
              Get back into your workspace without touching your shared docs.
            </h1>
            <p className="mt-5 max-w-lg text-base leading-7 text-white/72">
              We create a one-time reset link, keep only a hashed token in the
              database, and expire it automatically.
            </p>
          </div>
          <div className="rounded-[1.75rem] border border-white/10 bg-white/5 p-6">
            <p className="text-sm uppercase tracking-[0.24em] text-white/55">
              Recovery Steps
            </p>
            <ol className="mt-4 grid gap-4 text-sm leading-6 text-white/78">
              <li>1. Request a secure reset link.</li>
              <li>2. Open the one-time tokenized page.</li>
              <li>3. Set a new password and sign back in.</li>
            </ol>
          </div>
        </section>

        <section className="panel rounded-[2rem] px-6 py-8 sm:px-8 sm:py-10">
          <span className="rounded-full bg-teal/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.28em] text-teal">
            Password Recovery
          </span>
          <h2 className="mt-6 font-[family-name:var(--font-space-grotesk)] text-4xl font-semibold tracking-[-0.05em] text-ink">
            Forgot your password?
          </h2>
          <p className="mt-3 max-w-md text-sm leading-6 text-slate-600">
            Enter the email tied to your account. If it exists, we&apos;ll generate a
            secure reset link for you.
          </p>

          <form className="mt-8 grid gap-4" onSubmit={handleSubmit}>
            <Input
              type="email"
              placeholder="Email address"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
            <Button className="mt-2 h-12" disabled={isSubmitting} type="submit">
              {isSubmitting ? "Generating link..." : "Send Reset Link"}
            </Button>
          </form>

          {serverMessage ? (
            <div className="mt-6 rounded-[1.5rem] border border-teal/20 bg-teal/5 p-4 text-sm text-slate-700">
              <p>{serverMessage}</p>
              {resetUrl ? (
                <div className="mt-3 rounded-2xl bg-white/80 p-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                    Development Reset Link
                  </p>
                  <Link
                    className="mt-2 block break-all font-medium text-teal transition hover:text-pine"
                    href={resetUrl}
                  >
                    {resetUrl}
                  </Link>
                </div>
              ) : null}
            </div>
          ) : null}

          <p className="mt-6 text-sm text-slate-600">
            Remembered it?{" "}
            <Link className="font-semibold text-teal transition hover:text-pine" href="/login">
              Back to sign in
            </Link>
          </p>
        </section>
      </div>
    </div>
  );
};
