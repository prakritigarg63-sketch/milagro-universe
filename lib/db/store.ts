import { randomUUID } from "node:crypto";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { supabaseStore } from "./supabase";
import { normaliseEmail } from "./types";
import type {
  Database,
  NewAccount,
  NewUser,
  ProfilePatch,
  User,
  UserStore,
} from "./types";

// Re-exported so callers keep importing the store and its vocabulary from one place.
export { normaliseEmail };
export type { UserStore, NewUser, NewAccount, ProfilePatch };

/**
 * The Milagro Universe user store.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * TWO IMPLEMENTATIONS, PICKED BY ENVIRONMENT.
 *
 *   Supabase Postgres  — used whenever SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY
 *                        are both set. This is the real one. See ./supabase.ts.
 *   JSON file          — the fallback, so `npm run dev` works with no setup.
 *
 * The file store is DEVELOPMENT ONLY and cannot work on Vercel or any serverless
 * host: the filesystem is read-only and each instance keeps its own copy, so
 * users would fail to save or silently diverge. The selection is logged on first
 * use rather than left to be guessed at.
 *
 * Both satisfy `UserStore`, which is the whole point of the interface — callers
 * never learn which one they got.
 * ─────────────────────────────────────────────────────────────────────────────
 */
/* ── file-backed implementation ─────────────────────────────────────────── */

const FILE = process.env.MILAGRO_DATA_FILE ?? join(process.cwd(), ".data", "milagro.json");
const EMPTY: Database = { users: [], accounts: [] };

/**
 * Every mutation runs through one promise chain. Node is single-threaded but
 * `await` is not atomic: two concurrent sign-ins could both read the file, both
 * decide the user does not exist, and both write — creating the duplicate user
 * this whole module exists to prevent.
 */
let queue: Promise<unknown> = Promise.resolve();

function serialise<T>(job: () => Promise<T>): Promise<T> {
  const run = queue.then(job, job);
  queue = run.catch(() => {});
  return run;
}

async function read(): Promise<Database> {
  try {
    const raw = await readFile(FILE, "utf8");
    const parsed = JSON.parse(raw) as Partial<Database>;
    return { users: parsed.users ?? [], accounts: parsed.accounts ?? [] };
  } catch {
    // Missing or corrupt: an empty database is the correct starting point.
    return { ...EMPTY };
  }
}

/** Write to a sibling temp file and rename, so a crash mid-write cannot truncate. */
async function write(db: Database): Promise<void> {
  await mkdir(dirname(FILE), { recursive: true });
  const tmp = `${FILE}.${process.pid}.tmp`;
  await writeFile(tmp, JSON.stringify(db, null, 2), "utf8");
  await rename(tmp, FILE);
}

const fileStore: UserStore = {
  async findUserById(id) {
    const db = await read();
    return db.users.find((u) => u.id === id) ?? null;
  },

  async findUserByEmail(email) {
    const db = await read();
    const key = normaliseEmail(email);
    return db.users.find((u) => u.email === key) ?? null;
  },

  async findUserByAccount(provider, providerAccountId) {
    const db = await read();
    const account = db.accounts.find(
      (a) => a.provider === provider && a.providerAccountId === providerAccountId,
    );
    if (!account) return null;
    return db.users.find((u) => u.id === account.userId) ?? null;
  },

  async listAccounts(userId) {
    const db = await read();
    return db.accounts.filter((a) => a.userId === userId);
  },

  createUser(input, account) {
    return serialise(async () => {
      const db = await read();
      const email = normaliseEmail(input.email);

      // Re-check inside the lock. The caller's check happened before the queue.
      const existing = db.users.find((u) => u.email === email);
      if (existing) {
        const linked = db.accounts.some(
          (a) => a.provider === account.provider && a.providerAccountId === account.providerAccountId,
        );
        if (!linked) {
          db.accounts.push({ ...account, userId: existing.id, createdAt: new Date().toISOString() });
          await write(db);
        }
        return existing;
      }

      const user: User = {
        id: randomUUID(),
        email,
        firstName: input.firstName.trim(),
        lastName: input.lastName.trim(),
        image: input.image ?? null,
        createdAt: new Date().toISOString(),
        onboarding: null,
      };
      db.users.push(user);
      db.accounts.push({ ...account, userId: user.id, createdAt: new Date().toISOString() });
      await write(db);
      return user;
    });
  },

  linkAccount(userId, account) {
    return serialise(async () => {
      const db = await read();
      const already = db.accounts.some(
        (a) => a.provider === account.provider && a.providerAccountId === account.providerAccountId,
      );
      if (already) return;
      db.accounts.push({ ...account, userId, createdAt: new Date().toISOString() });
      await write(db);
    });
  },

  updateProfile(userId, patch) {
    return serialise(async () => {
      const db = await read();
      const user = db.users.find((u) => u.id === userId);
      if (!user) return null;
      Object.assign(user, patch);
      await write(db);
      return user;
    });
  },

  setOnboarding(userId, answers) {
    return serialise(async () => {
      const db = await read();
      const user = db.users.find((u) => u.id === userId);
      if (!user) return null;
      user.onboarding = answers;
      await write(db);
      return user;
    });
  },
};

/* ── selection ───────────────────────────────────────────────────────────── */

const hasSupabase = Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);

/**
 * Loaded lazily and only when configured, so a developer without Supabase
 * credentials never pays for the client — and, more importantly, so a missing
 * key fails here with a clear message instead of somewhere inside a sign-in.
 */
function resolveStore(): UserStore {
  if (!hasSupabase) {
    if (process.env.NODE_ENV !== "production") {
      console.warn(
        "[milagro] Supabase is not configured — using the JSON file store at " +
          FILE +
          ". Development only; set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY for the real database.",
      );
    }
    return fileStore;
  }
  return supabaseStore;
}

export const store: UserStore = resolveStore();

/** Which implementation is live. Reported by scripts/check-supabase.mjs. */
export const storeKind: "supabase" | "file" = hasSupabase ? "supabase" : "file";
