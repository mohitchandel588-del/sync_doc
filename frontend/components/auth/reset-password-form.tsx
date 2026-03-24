"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api, getApiErrorMessage } from "@/lib/api";

type ResetPasswordFormProps = {
  token?: string;
};

export const ResetPasswordForm = ({ token }: ResetPasswordFormProps) => {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isComplete, setIsComplete] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!token) {
      toast.error("This reset link is missing its token. Request a new one.");
      return;
    }

    if (password !== confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }

    setIsSubmitting(true);

    try {
      const { data } = await api.post<{ message: string }>("/auth/reset-password", {
        token,
        password
      });

      setIsComplete(true);
      toast.success(data.message);
      router.push("/login");
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Unable to reset password."));
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
              Set a fresh password and step right back into your documents.
            </h1>
            <p className="mt-5 max-w-lg text-base leading-7 text-white/72">
              Reset tokens are single-use, time boxed, and invalidated as soon as
              your password changes.
            </p>
          </div>
          <div className="rounded-[1.75rem] border border-white/10 bg-white/5 p-6 text-sm leading-6 text-white/78">
            Create a strong password with at least 8 characters so the workspace
            stays protected for you and your collaborators.
          </div>
        </section>

        <section className="panel rounded-[2rem] px-6 py-8 sm:px-8 sm:py-10">
          <span className="rounded-full bg-teal/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.28em] text-teal">
            Reset Password
          </span>
          <h2 className="mt-6 font-[family-name:var(--font-space-grotesk)] text-4xl font-semibold tracking-[-0.05em] text-ink">
            Choose a new password
          </h2>
          <p className="mt-3 max-w-md text-sm leading-6 text-slate-600">
            This link will only work while the reset token is still valid.
          </p>

          {!token ? (
            <div className="mt-8 rounded-[1.5rem] border border-coral/20 bg-coral/10 p-4 text-sm text-slate-700">
              This reset link is incomplete. Request a new password reset link to
              continue.
            </div>
          ) : null}

          <form className="mt-8 grid gap-4" onSubmit={handleSubmit}>
            <Input
              type="password"
              placeholder="New password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
            <Input
              type="password"
              placeholder="Confirm new password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
            />
            <Button className="mt-2 h-12" disabled={!token || isSubmitting} type="submit">
              {isSubmitting ? "Resetting..." : "Reset Password"}
            </Button>
          </form>

          {isComplete ? (
            <div className="mt-6 rounded-[1.5rem] border border-teal/20 bg-teal/5 p-4 text-sm text-slate-700">
              Password updated. Redirecting you to sign in.
            </div>
          ) : null}

          <p className="mt-6 text-sm text-slate-600">
            Need a new link?{" "}
            <Link
              className="font-semibold text-teal transition hover:text-pine"
              href="/forgot-password"
            >
              Request reset again
            </Link>
          </p>
        </section>
      </div>
    </div>
  );
};
