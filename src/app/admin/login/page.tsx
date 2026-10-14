import type { Metadata } from "next";
import { Suspense } from "react";
import { LoginForm } from "@/components/admin/login-form";

export const metadata: Metadata = {
  title: "登录后台",
  robots: { index: false },
};

type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>;

export default function AdminLoginPage(props: { searchParams: SearchParams }) {
  return (
    <main className="admin-scope flex min-h-dvh items-center justify-center px-4 py-10">
      {/* 回跳地址（?next=）与过期提示（?expired=1）来自 URL：
          静态外壳先出表单本体，参数在 Suspense 内流式解析后补上 */}
      <Suspense fallback={<LoginForm />}>
        <LoginFormWithParams searchParams={props.searchParams} />
      </Suspense>
    </main>
  );
}

async function LoginFormWithParams({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const nextPath = typeof params.next === "string" ? params.next : "";
  const sessionExpired = params.expired === "1";

  return <LoginForm nextPath={nextPath} sessionExpired={sessionExpired} />;
}
