-- Bug fix: skills/resources are meant to be an OPEN catalogue (docs/architecture.md
-- describes findOrCreateSkill/findOrCreateResource creating new rows on the fly when a
-- user types something not already seeded), but the original RLS policies only granted
-- SELECT to authenticated users -- there was no INSERT policy at all. Any attempt to add
-- a skill/resource outside the 28/13 seeded ones was silently blocked by RLS, which the
-- client then swallowed instead of surfacing (separately fixed in app code). This is why
-- "Add a skill we missed" appeared to do nothing for anything not already in the catalogue.

create policy "a signed-in user can add a new skill to the catalogue"
  on public.skills for insert
  to authenticated
  with check (true);

create policy "a signed-in user can add a new resource to the catalogue"
  on public.resources for insert
  to authenticated
  with check (true);
