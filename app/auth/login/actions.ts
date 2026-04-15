"use server";

import { signIn, signOut } from "@/lib/auth";
import { AuthError } from "next-auth";

export async function googleSignInAction(formData: FormData) {
  const redirectTo = (formData.get("redirectTo") as string) || "/";
  try {
    await signIn("google", { redirectTo });
  } catch (error) {
    // NEXT_REDIRECT is not an error — rethrow so Next.js handles the navigation
    if ((error as { digest?: string })?.digest?.startsWith("NEXT_REDIRECT")) throw error;
    console.error("[Google Sign-In Error]", error);
    return { error: "Google sign-in failed. Please try again." };
  }
}

export async function clientSignOutAction() {
  await signOut({ redirectTo: "/" });
}

export async function credentialsSignInAction(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const redirectTo = (formData.get("redirectTo") as string) || "/";

  if (!email || !password) {
    return { error: "Please enter your email and password." };
  }

  try {
    await signIn("credentials", {
      email,
      password,
      redirectTo,
    });
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case "CredentialsSignin": {
          // Distinguish unverified account from wrong password
          const { prisma } = await import("@/lib/prisma");
          const u = await prisma.user.findUnique({
            where:  { email },
            select: { emailVerified: true, role: true },
          });
          if (u && !u.emailVerified && u.role !== "ADMIN") {
            return { error: "Please verify your email before signing in.", needsVerification: true, email };
          }
          return { error: "Invalid email or password." };
        }
        default:
          return { error: "An error occurred during sign in." };
      }
    }
    // Must throw non-AuthErrors (like NEXT_REDIRECT) for redirects to actually work
    throw error;
  }
}
