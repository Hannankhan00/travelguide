import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function AdminAuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let session = null;
  try {
    session = await auth();
  } catch (e) {
    console.error("Auth error in AdminAuthLayout:", e);
    redirect("/admin/login");
  }

  if (!session?.user) {
    redirect("/admin/login");
  }

  if ((session.user as { role?: string }).role !== "ADMIN") {
    redirect("/");
  }

  return <>{children}</>;
}
