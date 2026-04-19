"use server";

import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { sendEmail, emailVerificationHtml } from "@/lib/email";
import { COMPANY_NAME } from "@/lib/constants";

export async function registerUserAction(formData: FormData) {
  const name             = formData.get("name")             as string;
  const email            = formData.get("email")            as string;
  const password         = formData.get("password")         as string;
  const country          = formData.get("country")          as string;
  const state            = formData.get("state")            as string;
  const phone            = formData.get("phone")            as string;
  const dealSubscription = formData.get("dealSubscription") === "true";

  if (!name || !email || !password) {
    return { error: "Name, email, and password are required." };
  }

  // Check duplicate before creating anything
  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    // If they exist but are unverified, let them proceed to re-send verification
    if (!existingUser.emailVerified) {
      return { needsVerification: true, email };
    }
    return { error: "An account with this email already exists." };
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);

    await prisma.user.create({
      data: {
        name,
        email,
        hashedPassword,
        country:          country || null,
        state:            state   || null,
        phone:            phone   || null,
        role:             "CUSTOMER",
        dealSubscription,
      },
    });
  } catch (error) {
    console.error("User create error:", error);
    return { error: "Failed to create account. Please try again." };
  }

  // Account created — now send verification email independently
  try {
    const rawToken    = crypto.randomBytes(32).toString("hex");
    const hashedToken = crypto.createHash("sha256").update(rawToken).digest("hex");
    const expires     = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 h

    await prisma.verificationToken.deleteMany({ where: { identifier: email } });
    await prisma.verificationToken.create({
      data: { identifier: email, token: hashedToken, expires },
    });

    const baseUrl   = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";
    const verifyUrl = `${baseUrl}/api/auth/verify-email?token=${rawToken}&email=${encodeURIComponent(email)}`;

    await sendEmail({
      to:      email,
      subject: `Verify your email — ${COMPANY_NAME}`,
      html:    emailVerificationHtml({ name, verifyUrl }),
    });

    await prisma.emailLog.create({
      data: {
        to:      email,
        subject: `Verify your email — ${COMPANY_NAME}`,
        type:    "EMAIL_VERIFICATION",
        status:  "SENT",
        sentAt:  new Date(),
      },
    }).catch(() => {}); // log failure is non-critical
  } catch (error) {
    console.error("Verification email error:", error);
    // Account exists — show verification screen so user can use "Resend" button
  }

  return { needsVerification: true, email };
}

export async function resendVerificationAction(email: string) {
  if (!email) return { error: "Email is required." };

  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user)              return { error: "No account found with this email." };
    if (user.emailVerified) return { error: "This account is already verified." };

    const rawToken    = crypto.randomBytes(32).toString("hex");
    const hashedToken = crypto.createHash("sha256").update(rawToken).digest("hex");
    const expires     = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await prisma.verificationToken.deleteMany({ where: { identifier: email } });
    await prisma.verificationToken.create({
      data: { identifier: email, token: hashedToken, expires },
    });

    const baseUrl   = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";
    const verifyUrl = `${baseUrl}/api/auth/verify-email?token=${rawToken}&email=${encodeURIComponent(email)}`;

    await sendEmail({
      to:      email,
      subject: `Verify your email — ${COMPANY_NAME}`,
      html:    emailVerificationHtml({ name: user.name ?? "Traveller", verifyUrl }),
    });

    return { success: true };
  } catch {
    return { error: "Failed to resend. Please try again." };
  }
}
