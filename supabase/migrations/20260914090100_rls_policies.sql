-- Row Level Security. See docs/decisions.md D4 for the RLS-vs-demo-reset resolution:
-- the service_role key (which bypasses RLS entirely) is only ever used server-side in
-- app/api/demo/**, gated by ENABLE_DEMO_PANEL. Everything else goes through these policies.
--
-- Ubunye is a discovery platform: a user must be able to see other users' skills,
-- resources and location to be matched with them, and see opportunities/programmes to be
-- matched to them. So catalogue-style and "public profile" data is readable by any signed-in
-- user; writes are restricted to the owning row.

alter table public.profiles enable row level security;
alter table public.skills enable row level security;
alter table public.user_skills enable row level security;
alter table public.resources enable row level security;
alter table public.user_resources enable row level security;
alter table public.opportunities enable row level security;
alter table public.opportunity_skills enable row level security;
alter table public.opportunity_resources enable row level security;
alter table public.teams enable row level security;
alter table public.team_members enable row level security;
alter table public.recommendations enable row level security;
alter table public.ventures enable row level security;
alter table public.venture_stages enable row level security;
alter table public.support_programmes enable row level security;
alter table public.learning_programmes enable row level security;
alter table public.help_requests enable row level security;
alter table public.notifications enable row level security;

-- ---------------------------------------------------------------------------
-- profiles
-- ---------------------------------------------------------------------------
create policy "profiles are readable by any signed-in user"
  on public.profiles for select
  to authenticated
  using (true);

create policy "a user can update their own profile"
  on public.profiles for update
  to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

-- ---------------------------------------------------------------------------
-- skills / resources / opportunities / catalogue tables — read-only catalogue data
-- ---------------------------------------------------------------------------
create policy "skills are readable by any signed-in user"
  on public.skills for select to authenticated using (true);

create policy "resources are readable by any signed-in user"
  on public.resources for select to authenticated using (true);

create policy "opportunities are readable by any signed-in user"
  on public.opportunities for select to authenticated using (true);

create policy "opportunity_skills are readable by any signed-in user"
  on public.opportunity_skills for select to authenticated using (true);

create policy "opportunity_resources are readable by any signed-in user"
  on public.opportunity_resources for select to authenticated using (true);

create policy "support_programmes are readable by any signed-in user"
  on public.support_programmes for select to authenticated using (true);

create policy "learning_programmes are readable by any signed-in user"
  on public.learning_programmes for select to authenticated using (true);

-- ---------------------------------------------------------------------------
-- user_skills / user_resources — readable by all (needed for matching), owner-writable
-- ---------------------------------------------------------------------------
create policy "user_skills are readable by any signed-in user"
  on public.user_skills for select to authenticated using (true);

create policy "a user manages their own skills"
  on public.user_skills for all
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "user_resources are readable by any signed-in user"
  on public.user_resources for select to authenticated using (true);

create policy "a user manages their own resources"
  on public.user_resources for all
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- teams / team_members
-- ---------------------------------------------------------------------------
create policy "teams are readable by any signed-in user"
  on public.teams for select to authenticated using (true);

create policy "a user creates teams they lead"
  on public.teams for insert
  to authenticated
  with check (created_by = auth.uid());

create policy "a team's creator can update it"
  on public.teams for update
  to authenticated
  using (created_by = auth.uid())
  with check (created_by = auth.uid());

create policy "team_members are readable by any signed-in user"
  on public.team_members for select to authenticated using (true);

create policy "a team's creator adds its members"
  on public.team_members for insert
  to authenticated
  with check (
    exists (
      select 1 from public.teams t
      where t.id = team_id and t.created_by = auth.uid()
    )
  );

-- ---------------------------------------------------------------------------
-- recommendations — a user reads/writes only their own
-- ---------------------------------------------------------------------------
create policy "a user reads their own recommendations"
  on public.recommendations for select
  to authenticated
  using (subject_user_id = auth.uid());

create policy "a user creates their own recommendations"
  on public.recommendations for insert
  to authenticated
  with check (subject_user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- ventures / venture_stages — scoped to team membership
-- ---------------------------------------------------------------------------
create policy "team members read their venture"
  on public.ventures for select
  to authenticated
  using (
    exists (
      select 1 from public.team_members tm
      where tm.team_id = ventures.team_id and tm.user_id = auth.uid()
    )
  );

create policy "team members create their venture"
  on public.ventures for insert
  to authenticated
  with check (
    exists (
      select 1 from public.team_members tm
      where tm.team_id = ventures.team_id and tm.user_id = auth.uid()
    )
  );

create policy "team members update their venture"
  on public.ventures for update
  to authenticated
  using (
    exists (
      select 1 from public.team_members tm
      where tm.team_id = ventures.team_id and tm.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.team_members tm
      where tm.team_id = ventures.team_id and tm.user_id = auth.uid()
    )
  );

create policy "team members read their venture stages"
  on public.venture_stages for select
  to authenticated
  using (
    exists (
      select 1 from public.ventures v
      join public.team_members tm on tm.team_id = v.team_id
      where v.id = venture_stages.venture_id and tm.user_id = auth.uid()
    )
  );

create policy "team members update their venture stages"
  on public.venture_stages for update
  to authenticated
  using (
    exists (
      select 1 from public.ventures v
      join public.team_members tm on tm.team_id = v.team_id
      where v.id = venture_stages.venture_id and tm.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.ventures v
      join public.team_members tm on tm.team_id = v.team_id
      where v.id = venture_stages.venture_id and tm.user_id = auth.uid()
    )
  );

create policy "team members insert their venture stages"
  on public.venture_stages for insert
  to authenticated
  with check (
    exists (
      select 1 from public.ventures v
      join public.team_members tm on tm.team_id = v.team_id
      where v.id = venture_stages.venture_id and tm.user_id = auth.uid()
    )
  );

-- ---------------------------------------------------------------------------
-- help_requests — owner only
-- ---------------------------------------------------------------------------
create policy "a user reads their own help requests"
  on public.help_requests for select
  to authenticated
  using (user_id = auth.uid());

create policy "a user creates their own help requests"
  on public.help_requests for insert
  to authenticated
  with check (user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- notifications — owner reads/marks-read; inserts are server-side (service role) only
-- ---------------------------------------------------------------------------
create policy "a user reads their own notifications"
  on public.notifications for select
  to authenticated
  using (user_id = auth.uid());

create policy "a user marks their own notifications read"
  on public.notifications for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());
