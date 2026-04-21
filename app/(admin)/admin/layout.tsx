export const dynamic = "force-dynamic";

import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { isRedirectError } from "next/dist/client/components/redirect-error";
import { AdminShell } from "@/components/admin/AdminShell";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let session = null;
  try {
    session = await auth();
  } catch (e) {
    if (isRedirectError(e)) throw e;
    console.error("Auth error in AdminLayout:", e);
    redirect("/admin/login");
  }

  if (!session?.user) {
    redirect("/admin/login");
  }

  if ((session.user as { role?: string }).role !== "ADMIN") {
    redirect("/");
  }

  const user = session.user;

  return (
    <AdminShell user={{ name: user.name, email: user.email, image: user.image }}>
      {children}
    </AdminShell>
  );
}
