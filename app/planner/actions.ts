"use server";

import { auth } from "@/auth";
import { projectStore, type Invite, type MemberInfo, type ProjectComment } from "@/lib/db/projects";
import { broadcastToProject } from "@/lib/db/realtime";
import type { Project } from "@/lib/planner/types";

/** A human-readable author name from the session user. */
function displayName(u: {
  firstName?: string | null;
  lastName?: string | null;
  name?: string | null;
  email?: string | null;
}): string {
  const full = [u.firstName, u.lastName].filter(Boolean).join(" ").trim();
  return full || u.name?.trim() || u.email?.split("@")[0] || "Member";
}

/**
 * Server actions for planner projects.
 *
 * The only bridge between the client planner and the database. Each resolves the
 * user id from the Auth.js session and scopes every store call to it, so a
 * client can only ever read or write its own projects. The service-role Supabase
 * key lives behind these functions and never reaches the browser.
 */
async function requireUserId(): Promise<string> {
  const session = await auth();
  const id = session?.user?.id;
  if (!id) throw new Error("Not authenticated");
  return id;
}

export async function listProjectsAction(): Promise<Project[]> {
  return projectStore.list(await requireUserId());
}

/** The planner's entry: resume the latest project, or start a fresh one
 *  (named from the user's onboarding answer when they have one). */
export async function loadOrCreateProjectAction(): Promise<Project> {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) throw new Error("Not authenticated");
  const existing = await projectStore.list(userId);
  if (existing[0]) return existing[0];
  const seededName = session.user.onboarding?.bathroomName?.trim() || "My Bathroom";
  return projectStore.create(userId, seededName);
}

export async function getProjectAction(projectId: string): Promise<Project | null> {
  return projectStore.get(await requireUserId(), projectId);
}

export async function createProjectAction(name: string): Promise<Project> {
  return projectStore.create(await requireUserId(), name);
}

export async function saveProjectAction(project: Project): Promise<Project> {
  const saved = await projectStore.update(await requireUserId(), project.id, project);
  // Live co-edit: push the new state to any other editor on this project.
  await broadcastToProject(saved.id, "update", saved);
  return saved;
}

export async function deleteProjectAction(projectId: string): Promise<void> {
  return projectStore.remove(await requireUserId(), projectId);
}

// ── Sharing (two-sided co-edit) ──────────────────────────────────────────────

export async function listMembersAction(projectId: string): Promise<MemberInfo[]> {
  // access-gate: only someone who can open the project can see its members
  const userId = await requireUserId();
  const project = await projectStore.get(userId, projectId);
  if (!project) return [];
  return projectStore.listMembers(projectId);
}

/** Owner-only: mint a shareable invite. Returns the token; the client builds the URL. */
export async function createInviteAction(projectId: string): Promise<Invite> {
  return projectStore.createInvite(await requireUserId(), projectId);
}

/** Redeem an invite link; the caller (join page) is already authenticated. */
export async function acceptInviteAction(token: string): Promise<string | null> {
  return projectStore.acceptInvite(await requireUserId(), token);
}

// ── Comments (M7) ────────────────────────────────────────────────────────────

export async function listCommentsAction(projectId: string): Promise<ProjectComment[]> {
  return projectStore.listComments(await requireUserId(), projectId);
}

export async function addCommentAction(projectId: string, body: string): Promise<ProjectComment> {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) throw new Error("Not authenticated");
  const comment = await projectStore.addComment(userId, displayName(session.user), projectId, body);
  await broadcastToProject(projectId, "comment", comment);
  return comment;
}

export async function deleteCommentAction(commentId: string): Promise<void> {
  return projectStore.deleteComment(await requireUserId(), commentId);
}
