"use server";

import { signIn, signOut } from "@/lib/auth";
import { AuthError } from "next-auth";

export async function googleSignInAction(formData: FormData) {
  const redirectTo = (formData.get("redirectTo") as string) || "/";
  await signIn("google", { redirectTo });
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
        case "CredentialsSignin":
          return { error: "Invalid email or password." };
        default:
          return { error: "An error occurred during sign in." };
      }
    }
    // Must throw non-AuthErrors (like NEXT_REDIRECT) for redirects to actually work
    throw error;
  }
}
