"use server";

import { auth } from "@/auth";
import { hashPassword } from "@/lib/auth/password";
import { normaliseEmail, store } from "@/lib/db/store";
import type { OnboardingAnswers } from "@/lib/db/types";

/**
 * Server actions for the two things the client must not do itself: hashing a
 * password, and writing to the user store. Both run only on the server, and
 * `saveOnboarding` takes the user id from the session rather than the argument
 * list — otherwise anyone could post onboarding answers for anyone else.
 */

export type RegisterResult = { ok: true } | { ok: false; message: string };

export async function registerWithPassword(input: {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}): Promise<RegisterResult> {
  const email = normaliseEmail(input.email);
  if (!email || input.password.length < 8) {
    return { ok: false, message: "Enter a valid email and a password of at least 8 characters." };
  }

  const existing = await store.findUserByEmail(email);
  if (existing) {
    const accounts = await store.listAccounts(existing.id);
    if (accounts.some((a) => a.provider === "credentials")) {
      return { ok: false, message: "An account with that email already exists." };
    }
    // Google-only account adding a password: that is linking, and it needs the
    // person to prove they hold the Google account first. Send them there.
    return {
      ok: false,
      message: "This email is already registered with Google. Use Continue with Google to sign in.",
    };
  }

  await store.createUser(
    { email, firstName: input.firstName, lastName: input.lastName, image: null },
    { provider: "credentials", providerAccountId: email, passwordHash: await hashPassword(input.password) },
  );
  return { ok: true };
}

export async function saveOnboarding(answers: OnboardingAnswers): Promise<{ ok: boolean }> {
  const session = await auth();
  if (!session?.user?.id) return { ok: false };

  await store.setOnboarding(session.user.id, {
    bathroomName: answers.bathroomName.trim().slice(0, 120),
    intent: answers.intent,
    priorities: answers.priorities.slice(0, 12),
  });
  return { ok: true };
}

/**
 * Password reset — NOT IMPLEMENTED, and deliberately not faked.
 *
 * Milagro Universe has no mail transport, so no reset link can be sent. The form is
 * left wired to this so the screen keeps working, and it always resolves: an
 * endpoint that answered differently for a registered address would tell an
 * attacker which emails have accounts. Implement a real token + email here.
 */
export async function requestPasswordReset(email: string): Promise<{ ok: true }> {
  void email;
  return { ok: true };
}
