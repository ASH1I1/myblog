"use client";

import { useActionState, useEffect, useRef } from "react";
import { loginAction, type LoginState } from "@/actions/auth";

const initialState: LoginState = { error: null };

const inputClass =
  "block w-full rounded-lg border border-border bg-background px-3 py-2 text-base " +
  "placeholder:text-muted focus:border-klein focus:outline-none " +
  "disabled:cursor-not-allowed disabled:opacity-60";

/**
 * 登录表单（PRD 3.3.1）。
 * next / expired 由服务端下发（登录页在 Suspense 中解析 searchParams），
 * 输入框保持非受控：失败时保留账号、清空密码并聚焦（直接操作 DOM，不额外引入状态）。
 */
export function LoginForm({
  nextPath = "",
  sessionExpired = false,
}: {
  nextPath?: string;
  sessionExpired?: boolean;
}) {
  const [state, formAction, pending] = useActionState(loginAction, initialState);
  const passwordRef = useRef<HTMLInputElement>(null);

  // 登录失败：清空密码框、保留账号并聚焦密码框（PRD 3.3.1）
  useEffect(() => {
    if (state.error) {
      if (passwordRef.current) passwordRef.current.value = "";
      passwordRef.current?.focus();
    }
  }, [state]);

  return (
    <form
      action={formAction}
      className="w-full max-w-[400px] rounded-2xl border border-border bg-background p-6 shadow-sm sm:p-8"
    >
      <h1 className="text-xl font-semibold">登录后台</h1>
      <p className="type-label mt-1.5 text-muted">仅博主本人可访问管理后台</p>

      {sessionExpired ? (
        <p
          role="status"
          className="type-label mt-4 rounded-lg border border-border bg-surface px-3 py-2 text-muted"
        >
          登录状态已过期，请重新登录。
        </p>
      ) : null}

      <input type="hidden" name="next" value={nextPath} />

      <div className="mt-6 space-y-4">
        <div>
          <label htmlFor="username" className="type-label mb-1.5 block font-medium text-muted">
            账号
          </label>
          <input
            id="username"
            name="username"
            type="text"
            autoComplete="username"
            required
            maxLength={50}
            disabled={pending}
            className={inputClass}
          />
        </div>

        <div>
          <label htmlFor="password" className="type-label mb-1.5 block font-medium text-muted">
            密码
          </label>
          <input
            id="password"
            ref={passwordRef}
            name="password"
            type="password"
            autoComplete="current-password"
            required
            maxLength={100}
            disabled={pending}
            className={inputClass}
          />
        </div>
      </div>

      <p
        role="alert"
        aria-live="polite"
        className="type-label mt-4 min-h-5 text-danger"
      >
        {state.error ?? ""}
      </p>

      <button
        type="submit"
        disabled={pending}
        className="type-label mt-2 inline-flex min-h-11 w-full items-center justify-center rounded-full bg-foreground px-6 font-medium text-background transition-opacity duration-300 ease-out hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending ? "登录中…" : "登录"}
      </button>
    </form>
  );
}
