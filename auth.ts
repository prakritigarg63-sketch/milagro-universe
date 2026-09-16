import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { authConfig } from "./auth.config";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { normaliseEmail, store } from "@/lib/db/store";
import type { OnboardingAnswers, User as MilagroUser } from "@/lib/db/types";

/**
 * The full Auth.js configuration — Node runtime only.
 *
 * Everything here reaches the user store or node:crypto, so it must not be
 * imported from middleware. `auth.config.ts` holds the Edge-safe half.
 */

/** Splits Google's single `name` claim into the two fields Milagro Universe stores. */
function splitName(name: string | null | undefined, email: string) {
  const raw = (name ?? "").trim();
  if (raw) {
    const [first, ...rest] = raw.split(/\s+/);
    return { firstName: first ?? "", lastName: rest.join(" ") };
  }
  const local = normaliseEmail(email).split("@")[0] ?? "there";
  return { firstName: local.charAt(0).toUpperCase() + local.slice(1), lastName: "" };
}

/** Copies the Milagro Universe record onto the JWT. One place, so the shape cannot drift. */
function applyUser(token: Record<string, unknown>, user: MilagroUser) {
  token.uid = user.id;
  token.email = user.email;
  token.firstName = user.firstName;
  token.lastName = user.lastName;
  token.picture = user.image;
  // The answers ride on the token, not just a boolean: /bathrooms renders the
  // bathroom name, and a round trip to the store for three strings would be waste.
  token.onboarding = user.onboarding;
  return token;
}

/**
 * A throwaway hash, verified against when no account matches, so a wrong email
 * and a wrong password take the same time to fail. Without it the response time
 * tells an attacker which addresses are registered.
 */
const DUMMY_HASH_PROMISE = hashPassword("milagro-timing-equaliser");

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,

  providers: [
    ...authConfig.providers,

    /**
     * The existing email/password form, moved onto Auth.js so both sign-in
     * paths produce the same session cookie. Running two session mechanisms
     * side by side is how "signed in but not really" bugs happen.
     */
    Credentials({
      name: "Milagro Universe",
      credentials: { email: {}, password: {} },
      async authorize(raw) {
        const email = typeof raw?.email === "string" ? normaliseEmail(raw.email) : "";
        const password = typeof raw?.password === "string" ? raw.password : "";
        if (!email || !password) return null;

        const user = await store.findUserByEmail(email);
        const credential = user
          ? (await store.listAccounts(user.id)).find((a) => a.provider === "credentials")
          : null;

        if (!user || !credential?.passwordHash) {
          await verifyPassword(password, await DUMMY_HASH_PROMISE);
          return null;
        }
        if (!(await verifyPassword(password, credential.passwordHash))) return null;

        return {
          id: user.id,
          email: user.email,
          name: `${user.firstName} ${user.lastName}`.trim(),
          image: user.image,
        };
      },
    }),
  ],

  callbacks: {
    ...authConfig.callbacks,

    /**
     * Decides whether a Google identity may become a Milagro Universe session, and is
     * the only place a user is created from Google. Returning a string here
     * redirects instead of signing in.
     */
    async signIn({ account, profile }) {
      if (account?.provider !== "google") return true;

      // Trust the ID token's claims, not anything the browser sent us. An
      // unverified Google address proves nothing about who controls the inbox.
      if (!profile?.email || profile.email_verified !== true) {
        return "/signin?error=GoogleEmailUnverified";
      }

      const email = normaliseEmail(profile.email);
      const googleSub = account.providerAccountId;
      const { firstName, lastName } = splitName(profile.name, email);
      const image = typeof profile.picture === "string" ? profile.picture : null;

      // 1. Returning user: this exact Google account is already linked.
      const linked = await store.findUserByAccount("google", googleSub);
      if (linked) {
        // Keep the avatar and name fresh, but never overwrite with nothing.
        await store.updateProfile(linked.id, {
          image: image ?? linked.image,
          firstName: linked.firstName || firstName,
          lastName: linked.lastName || lastName,
        });
        return true;
      }

      // 2. The address already belongs to a Milagro Universe account — almost always a
      //    password account. Linking on a matching email alone would mean anyone
      //    who can make Google assert an address inherits that account, so we
      //    require the person to already be signed in to it.
      const existing = await store.findUserByEmail(email);
      if (existing) {
        let signedInAs: string | undefined;
        try {
          signedInAs = (await auth())?.user?.id;
        } catch {
          // Session unreadable — fall through and refuse. Denying is the safe way to be wrong.
        }
        if (signedInAs === existing.id) {
          await store.linkAccount(existing.id, { provider: "google", providerAccountId: googleSub });
          if (image && !existing.image) await store.updateProfile(existing.id, { image });
          return true;
        }
        return "/signin?error=AccountExists";
      }

      // 3. First time here. One user, one linked Google account.
      await store.createUser(
        { email, firstName, lastName, image },
        { provider: "google", providerAccountId: googleSub },
      );
      return true;
    },

    /**
     * The JWT is the session. It carries the Milagro Universe user id — never Google's
     * — so that a linked account resolves to the same bathrooms either way.
     */
    async jwt({ token, user, account, trigger }) {
      if (account && user) {
        const record =
          account.provider === "google"
            ? await store.findUserByAccount("google", account.providerAccountId)
            : await store.findUserById(String(user.id));
        if (record) applyUser(token, record);
      }

      // `useSession().update()` after onboarding, so the flag refreshes without
      // making the user sign out and back in.
      if (trigger === "update" && typeof token.uid === "string") {
        const record = await store.findUserById(token.uid);
        if (record) applyUser(token, record);
      }

      return token;
    },

    /** Only non-sensitive profile fields cross to the client. No tokens. */
    async session({ session, token }) {
      if (session.user) {
        session.user.id = String(token.uid ?? "");
        session.user.email = String(token.email ?? "");
        session.user.firstName = String(token.firstName ?? "");
        session.user.lastName = String(token.lastName ?? "");
        session.user.image = (token.picture as string | null) ?? null;
        session.user.onboarding = (token.onboarding as OnboardingAnswers | null) ?? null;
        session.user.onboarded = session.user.onboarding !== null;
        session.user.name = `${token.firstName ?? ""} ${token.lastName ?? ""}`.trim();
      }
      return session;
    },
  },
});
