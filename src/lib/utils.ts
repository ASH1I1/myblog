/** 拼接 className，过滤假值（轻量版 clsx） */
export function cn(
  ...values: Array<string | false | null | undefined>
): string {
  return values.filter(Boolean).join(" ");
}
