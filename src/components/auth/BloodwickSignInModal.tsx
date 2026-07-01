"use client";

import { type FormEvent, useEffect, useId, useRef } from "react";

export type BloodwickSignInModalProps = {
  isOpen: boolean;
  email: string;
  password: string;
  isSubmitting: boolean;
  errorMessage?: string | null;
  onEmailChange: (value: string) => void;
  onPasswordChange: (value: string) => void;
  onSubmit: () => void;
  onResetPassword: () => void;
  onContinueAsGuest: () => void;
};

export function BloodwickSignInModal(props: BloodwickSignInModalProps) {
  const {
    isOpen,
    email,
    password,
    isSubmitting,
    errorMessage,
    onEmailChange,
    onPasswordChange,
    onSubmit,
    onResetPassword,
    onContinueAsGuest,
  } = props;
  const titleId = useId();
  const bodyId = useId();
  const emailInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    emailInputRef.current?.focus();
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        onContinueAsGuest();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onContinueAsGuest]);

  if (!isOpen) return null;

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSubmit();
  }

  return (
    <div className="bloodwick-sign-in-modal" aria-hidden={!isOpen}>
      <div
        className="bloodwick-sign-in-modal__panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={bodyId}
      >
        <p className="bloodwick-sign-in-modal__eyebrow">Bloodwick</p>
        <h2 id={titleId} className="bloodwick-sign-in-modal__title">
          Enter Bloodwick
        </h2>
        <p id={bodyId} className="bloodwick-sign-in-modal__body">
          Sign in to save your stories, continue episodes, and shape what
          Bloodwick learns about what scares you.
        </p>
        <form className="bloodwick-sign-in-modal__form" onSubmit={handleSubmit}>
          <label className="bloodwick-sign-in-modal__label">
            <span>Email</span>
            <input
              ref={emailInputRef}
              className="bloodwick-sign-in-modal__input"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => onEmailChange(event.target.value)}
              placeholder="you@example.com"
              required
            />
          </label>
          <label className="bloodwick-sign-in-modal__label">
            <span>Password</span>
            <input
              className="bloodwick-sign-in-modal__input"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => onPasswordChange(event.target.value)}
              placeholder="Password"
              required
            />
          </label>
          {errorMessage ? (
            <p className="bloodwick-sign-in-modal__error" role="alert">
              {errorMessage}
            </p>
          ) : null}
          <button
            className="bloodwick-sign-in-modal__primary"
            disabled={isSubmitting || !password.trim()}
            type="submit"
          >
            {isSubmitting ? "Signing in..." : "Sign in"}
          </button>
          <button
            className="bloodwick-sign-in-modal__secondary"
            onClick={onResetPassword}
            type="button"
          >
            Set or reset password
          </button>
          <button
            className="bloodwick-sign-in-modal__guest"
            onClick={onContinueAsGuest}
            type="button"
          >
            Continue as guest
          </button>
        </form>
      </div>
    </div>
  );
}
