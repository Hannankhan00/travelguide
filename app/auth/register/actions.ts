"use server";

import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { signIn } from "@/lib/auth";

export async function registerUserAction(formData: FormData) {
  const name = formData.get("name") as string;
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const country = formData.get("country") as string;
  const state = formData.get("state") as string;
  const phone = formData.get("phone") as string;
  const redirectTo = (formData.get("redirectTo") as string) || "/";

  if (!name || !email || !password) {
    return { error: "Name, email, and password are required." };
  }

  try {
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return { error: "User with this email already exists." };
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await prisma.user.create({
      data: {
        name,
        email,
        hashedPassword,
        country: country || null,
        state: state || null,
        phone: phone || null,
        role: "CUSTOMER", // default role
      },
    });

  } catch (error) {
    console.error("Registration error:", error);
    return { error: "Failed to create account. Please try again." };
  }

  await signIn("credentials", {
    email,
    password,
    redirectTo,
  });
}
