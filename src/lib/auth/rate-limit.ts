import "server-only";

import { LOGIN_LOCK_MINUTES, LOGIN_MAX_FAILURES } from "@/lib/constants";

/**
 * 登录失败限流（PRD 3.3.1 推荐项）：同一账号连续 5 次失败锁定 10 分钟。
 * 内存实现，适用于单实例部署；重启后清零（可接受）。
 */
type FailureState = { count: number; lockedUntil: number };

const failures = new Map<string, FailureState>();

const LOCK_MS = LOGIN_LOCK_MINUTES * 60 * 1000;

/** 返回剩余锁定毫秒数；未锁定返回 null。 */
export function getLockRemaining(key: string): number | null {
  const state = failures.get(key);
  if (!state || state.lockedUntil <= Date.now()) return null;
  return state.lockedUntil - Date.now();
}

export function recordFailure(key: string): void {
  const state = failures.get(key) ?? { count: 0, lockedUntil: 0 };
  state.count += 1;
  if (state.count >= LOGIN_MAX_FAILURES) {
    state.lockedUntil = Date.now() + LOCK_MS;
    state.count = 0;
  }
  failures.set(key, state);
}

export function clearFailures(key: string): void {
  failures.delete(key);
}
