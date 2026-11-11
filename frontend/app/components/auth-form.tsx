"use client";

import Link from "next/link";
import axios from "axios";
import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import API from "@/lib/axios";

type AuthMode = "login" | "signup";

interface AuthFormProps {
  mode: AuthMode;
}

interface AuthResponse {
  success: boolean;
  message?: string;
}

export default function AuthForm({ mode }: AuthFormProps) {
  const router = useRouter();
  const isSignup = mode === "signup";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (isSignup && password !== confirmPassword) {
      setError("Those passwords don’t match. Please try again.");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await API.post<AuthResponse>(`/auth/${mode}`, {
        email: email.trim(),
        password,
      });
      const payload = response.data;

      if (!payload.success) {
        throw new Error(payload.message || "We couldn’t sign you in. Please try again.");
      }

      router.replace("/dashboard");
      router.refresh();
    } catch (submitError) {
      if (axios.isAxiosError<{ message?: string }>(submitError)) {
        setError(
          submitError.response?.data?.message ||
            (submitError.response
              ? "We couldn’t sign you in. Please check your details and try again."
              : "Couldn’t reach the account service. Check your connection and try again."),
        );
      } else {
        setError(
          submitError instanceof Error
            ? submitError.message
            : "Something went wrong. Please try again.",
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="auth-page">
      <div className="auth-story">
        <Link className="brand auth-brand" href="/" aria-label="Daily CatchUp home">
          <span className="brand-mark" aria-hidden="true"><span /><span /><span /></span>
          <span>daily<span className="brand-light">catchup</span></span>
        </Link>
        <div className="auth-story-content">
          <span className="section-kicker">A CLEARER WAY TO KEEP UP</span>
          <h1>Make space<br />for what <em>matters.</em></h1>
          <p>Thoughtful news briefings, built around your curiosity. Less noise, more perspective.</p>
          <div className="auth-quote">
            <span aria-hidden="true">“</span>
            <p>Finally, a way to feel informed without feeling overwhelmed.</p>
            <small>YOUR DAILY CATCHUP</small>
          </div>
        </div>
        <span className="auth-copyright">© Daily CatchUp</span>
      </div>

      <section className="auth-panel" aria-labelledby="auth-heading">
        <div className="auth-panel-top">
          <Link className="auth-back" href="/">← <span>Back to home</span></Link>
          <span className="auth-switch">
            {isSignup ? "Already have an account?" : "New to Daily CatchUp?"}{" "}
            <Link href={isSignup ? "/login" : "/signup"}>{isSignup ? "Log in" : "Sign up"}</Link>
          </span>
        </div>
        <div className="auth-form-wrap">
          <span className="auth-icon" aria-hidden="true">✳</span>
          <span className="section-kicker">{isSignup ? "YOUR NEXT CHAPTER" : "WELCOME BACK"}</span>
          <h2 id="auth-heading">{isSignup ? "Create your account" : "Good to see you again."}</h2>
          <p className="auth-intro">
            {isSignup
              ? "Start with a topic you care about. We’ll take it from there."
              : "Pick up where you left off and catch up on what matters."}
          </p>

          <form className="auth-form" onSubmit={handleSubmit}>
            <label htmlFor="email">Email address</label>
            <input
              autoComplete="email"
              id="email"
              name="email"
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@example.com"
              required
              type="email"
              value={email}
            />
            <div className="form-label-row">
              <label htmlFor="password">Password</label>
              {isSignup && <span>At least 6 characters</span>}
            </div>
            <input
              autoComplete={isSignup ? "new-password" : "current-password"}
              id="password"
              minLength={6}
              name="password"
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Enter your password"
              required
              type="password"
              value={password}
            />
            {isSignup && (
              <>
                <label htmlFor="confirm-password">Confirm password</label>
                <input
                  autoComplete="new-password"
                  id="confirm-password"
                  minLength={6}
                  name="confirm-password"
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  placeholder="Enter your password again"
                  required
                  type="password"
                  value={confirmPassword}
                />
              </>
            )}
            {error && <p className="form-error" role="alert">{error}</p>}
            <button className="button button-dark auth-submit" disabled={isSubmitting} type="submit">
              {isSubmitting ? (
                <><span className="button-spinner" aria-hidden="true" /> {isSignup ? "Creating your account…" : "Signing you in…"}</>
              ) : (
                <>{isSignup ? "Create account" : "Log in"} <span aria-hidden="true">↗</span></>
              )}
            </button>
          </form>
          <p className="auth-terms">
            By continuing, you agree to use Daily CatchUp responsibly and treat the news as a starting point for your own research.
          </p>
        </div>
      </section>
    </main>
  );
}
