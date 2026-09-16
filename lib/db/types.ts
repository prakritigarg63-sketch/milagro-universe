/**
 * The Milagro Universe user model.
 *
 * Authentication providers are modelled *separately* from the user on purpose.
 * One Milagro Universe account can carry a password credential and a Google identity
 * at the same time, so signing in either way lands on the same `userId` and the
 * same bathrooms. Collapsing the two into one row would make linking impossible
 * without rewriting identity, which is how account-takeover bugs get written.
 */

export type AuthProviderId = "google" | "credentials";

export type OnboardingAnswers = {
  bathroomName: string;
  intent: string | null;
  priorities: string[];
};

export type User = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  /** Google's picture URL, or null — the navbar falls back to initials. */
  image: string | null;
  createdAt: string;
  /** Null until the three-question flow is finished. Gates the redirect. */
  onboarding: OnboardingAnswers | null;
};

export type Account = {
  userId: string;
  provider: AuthProviderId;
  /**
   * Google's `sub` claim for google, the normalised email for credentials.
   * `sub` is the only Google identifier guaranteed stable — an account's email
   * address can change, so matching on email alone would eventually split or
   * merge the wrong people.
   */
  providerAccountId: string;
  /** scrypt hash, credentials only. Never a plaintext password. */
  passwordHash?: string;
  createdAt: string;
};

export type Database = {
  users: User[];
  accounts: Account[];
};

/* ---------------------------------------------------------------------------
   The store contract.

   It lives beside the types rather than next to an implementation so that both
   implementations can depend on it without depending on each other. Putting it
   in store.ts created a cycle: store -> supabase -> store.
--------------------------------------------------------------------------- */

export interface UserStore {
  findUserById(id: string): Promise<User | null>;
  findUserByEmail(email: string): Promise<User | null>;
  findUserByAccount(provider: AuthProviderId, providerAccountId: string): Promise<User | null>;
  listAccounts(userId: string): Promise<Account[]>;
  createUser(input: NewUser, account: NewAccount): Promise<User>;
  linkAccount(userId: string, account: NewAccount): Promise<void>;
  updateProfile(userId: string, patch: ProfilePatch): Promise<User | null>;
  setOnboarding(userId: string, answers: OnboardingAnswers): Promise<User | null>;
}

export type NewUser = {
  email: string;
  firstName: string;
  lastName: string;
  image?: string | null;
};

export type NewAccount = {
  provider: AuthProviderId;
  providerAccountId: string;
  passwordHash?: string;
};

export type ProfilePatch = Partial<Pick<User, "firstName" | "lastName" | "image">>;

/** Addresses are compared lower-cased everywhere. One definition, no drift. */
export const normaliseEmail = (email: string) => email.trim().toLowerCase();
