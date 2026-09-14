import { AppError } from "@/lib/errors";
import { getMatchProfile, getProfile } from "@/services/profileService";
import type { Team, TeamMember } from "@/types/domain";
import type { SupabaseClientType } from "@/types/supabase-helpers";

/** Picks a short role label from a member's strongest skill (real data, not invented copy). */
function inferRole(skills: { skillName: string; experienceLevel: string }[]): string | null {
  if (skills.length === 0) return null;
  const rank = { beginner: 0, some_experience: 1, experienced: 2, expert: 3 } as const;
  const best = [...skills].sort(
    (a, b) => (rank[b.experienceLevel as keyof typeof rank] ?? 0) - (rank[a.experienceLevel as keyof typeof rank] ?? 0)
  )[0];
  return best.skillName;
}

/**
 * Forms a team immediately (spec §22: "prototype acceptance may be simulated") from the
 * requesting user plus the people they picked in UBY-007.
 */
export async function createTeam(
  supabase: SupabaseClientType,
  creatorUserId: string,
  teamName: string,
  opportunityId: string,
  memberUserIds: string[]
): Promise<Team> {
  const allMemberIds = [...new Set([creatorUserId, ...memberUserIds])];

  const { data: team, error: teamError } = await supabase
    .from("teams")
    .insert({ name: teamName, created_by: creatorUserId, opportunity_id: opportunityId, status: "formed" })
    .select("*")
    .single();

  if (teamError || !team) throw new AppError("We couldn't create your team. Please try again.", teamError);

  const memberRows = await Promise.all(
    allMemberIds.map(async (userId) => {
      const matchProfile = await getMatchProfile(supabase, userId);
      return { team_id: team.id, user_id: userId, role: inferRole(matchProfile.skills) };
    })
  );

  const { error: membersError } = await supabase.from("team_members").insert(memberRows);
  if (membersError) throw new AppError("We couldn't add your team members. Please try again.", membersError);

  return getTeam(supabase, team.id);
}

export async function getTeam(supabase: SupabaseClientType, teamId: string): Promise<Team> {
  const { data: team, error: teamError } = await supabase.from("teams").select("*").eq("id", teamId).single();
  if (teamError || !team) throw new AppError("We couldn't find that team.", teamError);

  const { data: memberRows, error: membersError } = await supabase
    .from("team_members")
    .select("user_id, role")
    .eq("team_id", teamId);
  if (membersError) throw new AppError("We couldn't load the team's members.", membersError);

  const members: TeamMember[] = await Promise.all(
    (memberRows ?? []).map(async (m) => {
      const profile = await getProfile(supabase, m.user_id);
      return { userId: m.user_id, firstName: profile.firstName, lastName: profile.lastName, role: m.role };
    })
  );

  return {
    id: team.id,
    name: team.name,
    createdBy: team.created_by,
    opportunityId: team.opportunity_id,
    status: team.status as Team["status"],
    members,
  };
}

/** Every team the user belongs to, most recent first. Used by the dashboard (UBY-017). */
export async function getUserTeams(supabase: SupabaseClientType, userId: string): Promise<Team[]> {
  const { data: memberships, error } = await supabase
    .from("team_members")
    .select("team_id")
    .eq("user_id", userId);
  if (error) throw new AppError("We couldn't load your teams.", error);

  const teamIds = [...new Set((memberships ?? []).map((m) => m.team_id))];
  return Promise.all(teamIds.map((id) => getTeam(supabase, id)));
}
