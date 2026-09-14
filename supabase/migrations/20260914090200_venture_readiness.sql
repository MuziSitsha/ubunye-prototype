-- Simulated readiness checklist items that don't come from anywhere else in the schema
-- (spec §27 funding readiness, §29 launch readiness). No real registration/banking/compliance
-- integration exists in this prototype (spec §5) — these are user-toggled flags representing
-- "the team says this step is done", not a verified external state.
alter table public.ventures
  add column readiness_checklist jsonb not null default '{
    "company_registered": false,
    "bank_account_opened": false,
    "safety_certification_complete": false,
    "supporting_documents_ready": false
  }'::jsonb;
