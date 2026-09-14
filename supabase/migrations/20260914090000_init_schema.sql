-- Ubunye prototype — core schema
-- Entities per spec §33. Design choices recorded in docs/decisions.md and docs/architecture.md.
-- `auth.users` (managed by Supabase Auth) is the "users" entity from §33; `profiles` is a 1:1
-- public extension of it holding everything the matching engine needs.

create extension if not exists "pgcrypto";

-- =========================================================================
-- PROFILES
-- =========================================================================
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  first_name text not null,
  last_name text not null,
  email text not null,
  mobile_number text,
  province text,
  city text,
  availability text check (availability in ('full_time', 'part_time', 'weekends', 'evenings')),
  situation text check (
    situation in ('unemployed', 'under_employed', 'informally_employed', 'employed_seeking')
  ),
  onboarding_completed_at timestamptz,
  skills_confirmed_at timestamptz,
  is_demo_persona boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.profiles is 'Structured profile: location, availability, situation (spec §11).';

-- =========================================================================
-- SKILLS / USER_SKILLS
-- =========================================================================
create table public.skills (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  category text,
  created_at timestamptz not null default now()
);

create table public.user_skills (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  skill_id uuid not null references public.skills (id) on delete cascade,
  confidence numeric check (confidence >= 0 and confidence <= 1),
  experience_level text check (
    experience_level in ('beginner', 'some_experience', 'experienced', 'expert')
  ) default 'some_experience',
  source text not null default 'ai_interpreted' check (source in ('ai_interpreted', 'manual')),
  created_at timestamptz not null default now(),
  unique (user_id, skill_id)
);

create index user_skills_user_id_idx on public.user_skills (user_id);
create index user_skills_skill_id_idx on public.user_skills (skill_id);

-- =========================================================================
-- RESOURCES / USER_RESOURCES
-- =========================================================================
create table public.resources (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  category text,
  created_at timestamptz not null default now()
);

create table public.user_resources (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  resource_id uuid not null references public.resources (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, resource_id)
);

create index user_resources_user_id_idx on public.user_resources (user_id);

-- =========================================================================
-- OPPORTUNITIES (the catalogue — spec §17)
-- =========================================================================
create table public.opportunities (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text not null,
  description text not null,
  geography text not null default 'national',
  estimated_startup_level text not null check (
    estimated_startup_level in ('low', 'low_medium', 'medium', 'medium_high', 'high')
  ),
  customer_segment text not null,
  demand_summary text not null,
  demand_score numeric not null check (demand_score >= 0 and demand_score <= 1),
  market_signal text not null,
  why_now text not null,
  prototype_only boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.opportunity_skills (
  id uuid primary key default gen_random_uuid(),
  opportunity_id uuid not null references public.opportunities (id) on delete cascade,
  skill_id uuid not null references public.skills (id) on delete cascade,
  requirement_type text not null check (requirement_type in ('required', 'preferred')),
  unique (opportunity_id, skill_id)
);

create table public.opportunity_resources (
  id uuid primary key default gen_random_uuid(),
  opportunity_id uuid not null references public.opportunities (id) on delete cascade,
  resource_id uuid not null references public.resources (id) on delete cascade,
  requirement_type text not null check (requirement_type in ('required', 'preferred')),
  unique (opportunity_id, resource_id)
);

create index opportunity_skills_opportunity_id_idx on public.opportunity_skills (opportunity_id);
create index opportunity_resources_opportunity_id_idx on public.opportunity_resources (opportunity_id);

-- =========================================================================
-- TEAMS / TEAM_MEMBERS (spec §22)
-- =========================================================================
create table public.teams (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_by uuid not null references public.profiles (id) on delete cascade,
  opportunity_id uuid references public.opportunities (id),
  status text not null default 'proposed' check (status in ('proposed', 'formed')),
  created_at timestamptz not null default now()
);

create table public.team_members (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.teams (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  role text,
  joined_at timestamptz not null default now(),
  unique (team_id, user_id)
);

create index team_members_team_id_idx on public.team_members (team_id);
create index team_members_user_id_idx on public.team_members (user_id);

-- =========================================================================
-- RECOMMENDATIONS — every claim on screen traces back to a row here.
-- See docs/architecture.md §3 for the `components` jsonb shape.
-- =========================================================================
create table public.recommendations (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('opportunity', 'person')),
  subject_user_id uuid not null references public.profiles (id) on delete cascade,
  team_id uuid references public.teams (id) on delete cascade,
  opportunity_id uuid references public.opportunities (id) on delete cascade,
  candidate_user_id uuid references public.profiles (id) on delete cascade,
  total numeric not null check (total >= 0 and total <= 1),
  components jsonb not null,
  created_at timestamptz not null default now(),
  constraint recommendations_kind_shape check (
    (kind = 'opportunity' and opportunity_id is not null and candidate_user_id is null)
    or
    (kind = 'person' and candidate_user_id is not null and opportunity_id is null)
  )
);

create index recommendations_subject_user_id_idx on public.recommendations (subject_user_id);
create index recommendations_team_id_idx on public.recommendations (team_id);

-- =========================================================================
-- VENTURES / VENTURE_STAGES (spec §23, §24, §27, §29)
-- =========================================================================
create table public.ventures (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null unique references public.teams (id) on delete cascade,
  opportunity_id uuid not null references public.opportunities (id),
  name text not null,
  current_stage text not null default 'team_formed' check (
    current_stage in (
      'team_formed', 'opportunity_selected', 'validate_opportunity',
      'develop_business', 'funding_ready', 'launch'
    )
  ),
  business_concept jsonb not null default '{}'::jsonb,
  customer jsonb not null default '{}'::jsonb,
  operations jsonb not null default '{}'::jsonb,
  money jsonb not null default '{}'::jsonb,
  readiness_score numeric not null default 0 check (readiness_score >= 0 and readiness_score <= 1),
  launched_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.venture_stages (
  id uuid primary key default gen_random_uuid(),
  venture_id uuid not null references public.ventures (id) on delete cascade,
  stage text not null check (
    stage in (
      'team_formed', 'opportunity_selected', 'validate_opportunity',
      'develop_business', 'funding_ready', 'launch'
    )
  ),
  order_index int not null,
  status text not null default 'pending' check (status in ('pending', 'active', 'complete')),
  completed_at timestamptz,
  unique (venture_id, stage)
);

create index venture_stages_venture_id_idx on public.venture_stages (venture_id);

-- =========================================================================
-- SUPPORT_PROGRAMMES / LEARNING_PROGRAMMES (spec §26, §28)
-- =========================================================================
create table public.support_programmes (
  id uuid primary key default gen_random_uuid(),
  category text not null check (
    category in (
      'bank', 'government', 'development_agency', 'corporate_enterprise_development',
      'grant', 'incubator', 'business_competition', 'training_provider'
    )
  ),
  provider text not null,
  programme_name text not null,
  support_type text not null,
  typical_eligibility text not null,
  amount_range text not null,
  closing_date date,
  description text not null,
  is_demo_data boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.learning_programmes (
  id uuid primary key default gen_random_uuid(),
  skill_id uuid references public.skills (id) on delete set null,
  title text not null,
  reason text not null,
  provider text not null,
  format text not null check (format in ('online', 'in_person', 'hybrid')),
  duration text not null,
  url text,
  is_demo_data boolean not null default true,
  created_at timestamptz not null default now()
);

create index learning_programmes_skill_id_idx on public.learning_programmes (skill_id);

-- =========================================================================
-- HELP_REQUESTS / NOTIFICATIONS (spec §25, §30)
-- =========================================================================
create table public.help_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  venture_id uuid references public.ventures (id) on delete cascade,
  topic text not null check (
    topic in (
      'business_plan', 'financial_plan', 'funding_application', 'marketing', 'pricing',
      'registration', 'compliance', 'business_banking', 'contracts', 'general_advice'
    )
  ),
  message text,
  status text not null default 'submitted' check (status in ('submitted', 'acknowledged')),
  created_at timestamptz not null default now()
);

create index help_requests_user_id_idx on public.help_requests (user_id);

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  type text not null,
  title text not null,
  body text not null,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index notifications_user_id_idx on public.notifications (user_id);

-- =========================================================================
-- updated_at helper
-- =========================================================================
create function public.set_updated_at() returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger profiles_set_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();

create trigger ventures_set_updated_at before update on public.ventures
  for each row execute function public.set_updated_at();

-- =========================================================================
-- New-user hook — every auth.users row gets a matching profiles row.
-- =========================================================================
create function public.handle_new_user() returns trigger as $$
begin
  insert into public.profiles (id, first_name, last_name, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'first_name', ''),
    coalesce(new.raw_user_meta_data ->> 'last_name', ''),
    new.email
  );
  return new;
end;
$$ language plpgsql security definer set search_path = public;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
