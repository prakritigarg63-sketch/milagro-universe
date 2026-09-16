import "server-only";

import { randomUUID } from "node:crypto";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Project, ProjectRole } from "@/lib/planner/types";
import {
  defaultRoom,
  defaultStyle,
  defaultFixtures,
  defaultAddOns,
} from "@/lib/planner/defaults";

/**
 * The planner project store — where saved bathroom plans live, plus the sharing
 * that makes them two-sided.
 *
 * Supabase Postgres in production (service-role key, server-only), a JSON file
 * for local dev. Access is by membership: a project's OWNER, or any user in
 * `project_members`, can open and co-edit it; only the owner can delete. Experts
 * join via a shareable invite link (`project_invites`). Every method takes the
 * acting user id; the callers (server actions) resolve it from the Auth.js
 * session.
 */
export interface MemberInfo {
  userId: string;
  role: ProjectRole;
  name: string;
}

export interface Invite {
  token: string;
  projectId: string;
  role: "expert";
  expiresAt: string;
}

export interface ProjectStore {
  /** Projects the user owns or has been invited to, newest first. */
  list(userId: string): Promise<Project[]>;
  /** A project the user owns or is a member of, else null. */
  get(userId: string, id: string): Promise<Project | null>;
  create(userId: string, name: string): Promise<Project>;
  /** Co-edit: owner or member may update. */
  update(userId: string, id: string, patch: Partial<Project>): Promise<Project>;
  /** Owner only. */
  remove(userId: string, id: string): Promise<void>;

  // ── sharing ──
  listMembers(projectId: string): Promise<MemberInfo[]>;
  /** Owner-scoped: create a shareable invite link (30-day expiry). */
  createInvite(userId: string, projectId: string): Promise<Invite>;
  /** Redeem an invite; adds the user as an expert. Returns the project id, or null. */
  acceptInvite(userId: string, token: string): Promise<string | null>;
}

const INVITE_TTL_MS = 30 * 24 * 60 * 60 * 1000;

function nowIso() {
  return new Date().toISOString();
}

function newProject(ownerId: string, name: string): Project {
  return {
    id: randomUUID(),
    ownerId,
    members: [{ userId: ownerId, role: "owner" }],
    status: "draft",
    room: { ...defaultRoom(), name: name || defaultRoom().name },
    style: defaultStyle(),
    fixtures: defaultFixtures(),
    addOns: defaultAddOns(),
    plan: null,
    estimate: null,
    createdAt: nowIso(),
    updatedAt: nowIso(),
  };
}

// ── Supabase implementation ──────────────────────────────────────────────────

type ProjectRow = {
  id: string;
  owner_id: string;
  name: string;
  status: Project["status"];
  data: Project;
  created_at: string;
  updated_at: string;
};

function toProject(r: ProjectRow): Project {
  return {
    ...r.data,
    id: r.id,
    ownerId: r.owner_id,
    status: r.status,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

let client: SupabaseClient | null = null;
function db(): SupabaseClient {
  if (client) return client;
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Supabase is not configured.");
  client = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  return client;
}

const COLS = "id, owner_id, name, status, data, created_at, updated_at";

async function isMember(projectId: string, userId: string): Promise<boolean> {
  const { data, error } = await db()
    .from("project_members")
    .select("user_id")
    .eq("project_id", projectId)
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw error;
  return Boolean(data);
}

const supabaseProjectStore: ProjectStore = {
  async list(userId) {
    const owned = await db().from("projects").select(COLS).eq("owner_id", userId);
    if (owned.error) throw owned.error;

    const memberships = await db()
      .from("project_members")
      .select("project_id")
      .eq("user_id", userId);
    if (memberships.error) throw memberships.error;
    const sharedIds = (memberships.data as { project_id: string }[])
      .map((m) => m.project_id)
      .filter((id) => !(owned.data as ProjectRow[]).some((p) => p.id === id));

    let shared: ProjectRow[] = [];
    if (sharedIds.length > 0) {
      const res = await db().from("projects").select(COLS).in("id", sharedIds);
      if (res.error) throw res.error;
      shared = res.data as ProjectRow[];
    }
    return [...(owned.data as ProjectRow[]), ...shared]
      .map(toProject)
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  },

  async get(userId, id) {
    const { data, error } = await db().from("projects").select(COLS).eq("id", id).maybeSingle();
    if (error) throw error;
    if (!data) return null;
    const project = toProject(data as ProjectRow);
    if (project.ownerId === userId) return project;
    return (await isMember(id, userId)) ? project : null;
  },

  async create(userId, name) {
    const project = newProject(userId, name);
    const { error } = await db().from("projects").insert({
      id: project.id,
      owner_id: userId,
      name: project.room.name,
      status: project.status,
      data: project,
    });
    if (error) throw error;
    return project;
  },

  async update(userId, id, patch) {
    const current = await this.get(userId, id); // enforces owner-or-member access
    if (!current) throw new Error(`Project ${id} not accessible`);
    const next: Project = { ...current, ...patch, id, ownerId: current.ownerId, updatedAt: nowIso() };
    const { error } = await db()
      .from("projects")
      .update({ name: next.room.name, status: next.status, data: next, updated_at: next.updatedAt })
      .eq("id", id);
    if (error) throw error;
    return next;
  },

  async remove(userId, id) {
    const { data, error } = await db()
      .from("projects")
      .select("owner_id")
      .eq("id", id)
      .maybeSingle();
    if (error) throw error;
    if (!data) return;
    if ((data as { owner_id: string }).owner_id !== userId) {
      throw new Error("Only the owner can delete this project");
    }
    const del = await db().from("projects").delete().eq("id", id);
    if (del.error) throw del.error;
  },

  async listMembers(projectId) {
    // supabase-js types an embedded to-one relation as an array; normalise it.
    const pickName = (u: unknown): string => {
      const rec = (Array.isArray(u) ? u[0] : u) as { first_name?: string; email?: string } | null | undefined;
      return rec?.first_name || rec?.email || "Member";
    };
    const projRes = await db()
      .from("projects")
      .select("owner_id, users:owner_id (first_name, email)")
      .eq("id", projectId)
      .maybeSingle();
    const memRes = await db()
      .from("project_members")
      .select("user_id, role, users:user_id (first_name, email)")
      .eq("project_id", projectId);
    if (memRes.error) throw memRes.error;

    const rows = (memRes.data ?? []) as unknown as { user_id: string; role: ProjectRole; users: unknown }[];
    const members: MemberInfo[] = rows.map((m) => ({
      userId: m.user_id,
      role: m.role,
      name: pickName(m.users),
    }));
    const proj = projRes.data as unknown as { owner_id: string; users: unknown } | null;
    if (proj) members.unshift({ userId: proj.owner_id, role: "owner", name: pickName(proj.users) });
    return members;
  },

  async createInvite(userId, projectId) {
    const { data, error } = await db()
      .from("projects")
      .select("owner_id")
      .eq("id", projectId)
      .maybeSingle();
    if (error) throw error;
    if (!data || (data as { owner_id: string }).owner_id !== userId) {
      throw new Error("Only the owner can invite");
    }
    const invite: Invite = {
      token: randomUUID(),
      projectId,
      role: "expert",
      expiresAt: new Date(Date.now() + INVITE_TTL_MS).toISOString(),
    };
    const ins = await db().from("project_invites").insert({
      token: invite.token,
      project_id: projectId,
      role: "expert",
      created_by: userId,
      expires_at: invite.expiresAt,
    });
    if (ins.error) throw ins.error;
    return invite;
  },

  async acceptInvite(userId, token) {
    const { data, error } = await db()
      .from("project_invites")
      .select("project_id, expires_at, revoked")
      .eq("token", token)
      .maybeSingle();
    if (error) throw error;
    const inv = data as { project_id: string; expires_at: string; revoked: boolean } | null;
    if (!inv || inv.revoked || new Date(inv.expires_at).getTime() < Date.now()) return null;
    // owner joining their own project is a no-op
    const proj = await db().from("projects").select("owner_id").eq("id", inv.project_id).maybeSingle();
    if (proj.data && (proj.data as { owner_id: string }).owner_id === userId) return inv.project_id;
    const up = await db()
      .from("project_members")
      .upsert({ project_id: inv.project_id, user_id: userId, role: "expert" }, { onConflict: "project_id,user_id" });
    if (up.error) throw up.error;
    return inv.project_id;
  },
};

// ── JSON-file implementation (local development) ─────────────────────────────

const DATA_DIR = process.env.MILAGRO_DATA_DIR ?? join(process.cwd(), ".data");
const PROJECTS_FILE = process.env.MILAGRO_PROJECTS_FILE ?? join(DATA_DIR, "projects.json");
const MEMBERS_FILE = join(DATA_DIR, "project_members.json");
const INVITES_FILE = join(DATA_DIR, "project_invites.json");

type MemberRow = { projectId: string; userId: string; role: ProjectRole };
type InviteRow = { token: string; projectId: string; createdBy: string; expiresAt: string; revoked: boolean };

async function readJson<T>(file: string): Promise<T[]> {
  try {
    return JSON.parse(await readFile(file, "utf8")) as T[];
  } catch {
    return [];
  }
}
async function writeJson<T>(file: string, rows: T[]) {
  await mkdir(dirname(file), { recursive: true });
  const tmp = `${file}.${randomUUID()}.tmp`;
  await writeFile(tmp, JSON.stringify(rows, null, 2), "utf8");
  await rename(tmp, file);
}

const fileProjectStore: ProjectStore = {
  async list(userId) {
    const all = await readJson<Project>(PROJECTS_FILE);
    const members = await readJson<MemberRow>(MEMBERS_FILE);
    const sharedIds = new Set(members.filter((m) => m.userId === userId).map((m) => m.projectId));
    return all
      .filter((p) => p.ownerId === userId || sharedIds.has(p.id))
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  },
  async get(userId, id) {
    const p = (await readJson<Project>(PROJECTS_FILE)).find((x) => x.id === id);
    if (!p) return null;
    if (p.ownerId === userId) return p;
    const members = await readJson<MemberRow>(MEMBERS_FILE);
    return members.some((m) => m.projectId === id && m.userId === userId) ? p : null;
  },
  async create(userId, name) {
    const project = newProject(userId, name);
    const all = await readJson<Project>(PROJECTS_FILE);
    all.push(project);
    await writeJson(PROJECTS_FILE, all);
    return project;
  },
  async update(userId, id, patch) {
    const current = await this.get(userId, id);
    if (!current) throw new Error(`Project ${id} not accessible`);
    const all = await readJson<Project>(PROJECTS_FILE);
    const idx = all.findIndex((p) => p.id === id);
    const next: Project = { ...all[idx], ...patch, id, ownerId: all[idx].ownerId, updatedAt: nowIso() };
    all[idx] = next;
    await writeJson(PROJECTS_FILE, all);
    return next;
  },
  async remove(userId, id) {
    const all = await readJson<Project>(PROJECTS_FILE);
    const p = all.find((x) => x.id === id);
    if (!p) return;
    if (p.ownerId !== userId) throw new Error("Only the owner can delete this project");
    await writeJson(PROJECTS_FILE, all.filter((x) => x.id !== id));
  },
  async listMembers(projectId) {
    const p = (await readJson<Project>(PROJECTS_FILE)).find((x) => x.id === projectId);
    const members = await readJson<MemberRow>(MEMBERS_FILE);
    const out: MemberInfo[] = [];
    if (p) out.push({ userId: p.ownerId, role: "owner", name: "Owner" });
    for (const m of members.filter((m) => m.projectId === projectId)) {
      out.push({ userId: m.userId, role: m.role, name: "Member" });
    }
    return out;
  },
  async createInvite(userId, projectId) {
    const p = (await readJson<Project>(PROJECTS_FILE)).find((x) => x.id === projectId);
    if (!p || p.ownerId !== userId) throw new Error("Only the owner can invite");
    const invite: Invite = {
      token: randomUUID(),
      projectId,
      role: "expert",
      expiresAt: new Date(Date.now() + INVITE_TTL_MS).toISOString(),
    };
    const invites = await readJson<InviteRow>(INVITES_FILE);
    invites.push({ token: invite.token, projectId, createdBy: userId, expiresAt: invite.expiresAt, revoked: false });
    await writeJson(INVITES_FILE, invites);
    return invite;
  },
  async acceptInvite(userId, token) {
    const invites = await readJson<InviteRow>(INVITES_FILE);
    const inv = invites.find((i) => i.token === token);
    if (!inv || inv.revoked || new Date(inv.expiresAt).getTime() < Date.now()) return null;
    const p = (await readJson<Project>(PROJECTS_FILE)).find((x) => x.id === inv.projectId);
    if (p && p.ownerId === userId) return inv.projectId;
    const members = await readJson<MemberRow>(MEMBERS_FILE);
    if (!members.some((m) => m.projectId === inv.projectId && m.userId === userId)) {
      members.push({ projectId: inv.projectId, userId, role: "expert" });
      await writeJson(MEMBERS_FILE, members);
    }
    return inv.projectId;
  },
};

const hasSupabase = Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);

export const projectStore: ProjectStore = hasSupabase ? supabaseProjectStore : fileProjectStore;
export const projectStoreKind: "supabase" | "file" = hasSupabase ? "supabase" : "file";
