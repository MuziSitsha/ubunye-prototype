-- Ubunye prototype seed data.
-- Rebuilds the full Golden Demo dataset from empty (spec §46, §32; docs/decisions.md D6).
-- Run via `npm run db:reset` (wraps `supabase db reset`, which runs every migration then this file).
--
-- Sections:
--   1. Skills catalogue (20+)
--   2. Resources catalogue
--   3. Demo personas (auth.users + profiles + user_skills + user_resources) — 8 users, spec §46
--   4. Opportunity catalogue (8-15) + required/preferred skills + resources — spec §17
--   5. Support programmes (funding/support ecosystem) — spec §26, fictional providers only (D7)
--   6. Learning programmes — spec §28

begin;

-- =========================================================================
-- 1. SKILLS
-- =========================================================================
insert into public.skills (name, category) values
  ('Appliance Repair', 'trade'),
  ('Electrical Maintenance', 'trade'),
  ('Fault Diagnosis', 'trade'),
  ('Driving', 'logistics'),
  ('Logistics', 'logistics'),
  ('Sales', 'business'),
  ('Customer Service', 'business'),
  ('Social Media Marketing', 'digital'),
  ('Administration', 'business'),
  ('Bookkeeping', 'business'),
  ('Baking', 'food'),
  ('Food Preparation', 'food'),
  ('Food Safety', 'food'),
  ('Cleaning', 'services'),
  ('Gardening & Landscaping', 'trade'),
  ('Childcare', 'care'),
  ('Tutoring', 'care'),
  ('Sewing & Tailoring', 'trade'),
  ('Carpentry', 'trade'),
  ('Plumbing', 'trade'),
  ('Construction Painting', 'trade'),
  ('Mobile Phone Repair', 'trade'),
  ('Basic Computer Literacy', 'digital'),
  ('Event Planning', 'business'),
  ('Photography', 'digital'),
  ('Hairdressing & Beauty', 'services'),
  ('Security Services', 'services'),
  ('Agriculture & Farming', 'trade');

-- =========================================================================
-- 2. RESOURCES
-- =========================================================================
insert into public.resources (name, category) values
  ('Vehicle', 'transport'),
  ('Smartphone', 'equipment'),
  ('Laptop', 'equipment'),
  ('Tools', 'equipment'),
  ('Workspace', 'facility'),
  ('Kitchen', 'facility'),
  ('Machinery', 'equipment'),
  ('Internet', 'utility'),
  ('Storage', 'facility'),
  ('Existing Customers', 'network'),
  ('Startup Capital', 'capital'),
  ('Professional Certification', 'credential'),
  ('Other', 'other');

-- =========================================================================
-- 3. DEMO PERSONAS
-- Fixed UUIDs so the demo panel (/demo) and docs/demo-script.md can reference
-- them directly. Password for every demo persona: see docs/demo-script.md.
-- =========================================================================
insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
  confirmation_token, email_change, email_change_token_new, recovery_token,
  is_sso_user, is_anonymous
)
select
  '00000000-0000-0000-0000-000000000000',
  v.id::uuid,
  'authenticated',
  'authenticated',
  v.email,
  crypt('Ubunye-Demo-2026', gen_salt('bf')),
  now(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  jsonb_build_object('first_name', v.first_name, 'last_name', v.last_name),
  now(),
  now(),
  '', '', '', '',
  false, false
from (values
  ('a0000000-0000-4000-8000-000000000001', 'sipho@ubunye.demo',   'Sipho',   'Nkosi'),
  ('a0000000-0000-4000-8000-000000000002', 'thandi@ubunye.demo',  'Thandi',  'Mokoena'),
  ('a0000000-0000-4000-8000-000000000003', 'kabelo@ubunye.demo',  'Kabelo',  'Molefe'),
  ('a0000000-0000-4000-8000-000000000004', 'naledi@ubunye.demo',  'Naledi',  'Dube'),
  ('a0000000-0000-4000-8000-000000000005', 'lindiwe@ubunye.demo', 'Lindiwe', 'Zulu'),
  ('a0000000-0000-4000-8000-000000000006', 'themba@ubunye.demo',  'Themba',  'Khumalo'),
  ('a0000000-0000-4000-8000-000000000007', 'zanele@ubunye.demo',  'Zanele',  'Ngcobo'),
  ('a0000000-0000-4000-8000-000000000008', 'bongani@ubunye.demo', 'Bongani', 'Sithole')
) as v(id, email, first_name, last_name);

insert into auth.identities (
  id, provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at
)
select
  gen_random_uuid(),
  u.id::text,
  u.id,
  jsonb_build_object('sub', u.id::text, 'email', u.email),
  'email',
  now(), now(), now()
from auth.users u
where u.id in (
  'a0000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000002',
  'a0000000-0000-4000-8000-000000000003', 'a0000000-0000-4000-8000-000000000004',
  'a0000000-0000-4000-8000-000000000005', 'a0000000-0000-4000-8000-000000000006',
  'a0000000-0000-4000-8000-000000000007', 'a0000000-0000-4000-8000-000000000008'
);

-- The handle_new_user trigger already created a bare profiles row for each user above.
-- Fill in the structured profile fields (spec §11) the trigger doesn't know about.
update public.profiles set
  province = v.province, city = v.city, availability = v.availability,
  situation = v.situation, is_demo_persona = true,
  onboarding_completed_at = now(), skills_confirmed_at = now()
from (values
  ('a0000000-0000-4000-8000-000000000001', 'Gauteng',        'Johannesburg', 'full_time', 'unemployed'),
  ('a0000000-0000-4000-8000-000000000002', 'Gauteng',        'Johannesburg', 'part_time', 'informally_employed'),
  ('a0000000-0000-4000-8000-000000000003', 'Gauteng',        'Johannesburg', 'full_time', 'under_employed'),
  ('a0000000-0000-4000-8000-000000000004', 'Gauteng',        'Johannesburg', 'part_time', 'unemployed'),
  ('a0000000-0000-4000-8000-000000000005', 'KwaZulu-Natal',  'Durban',       'full_time', 'unemployed'),
  ('a0000000-0000-4000-8000-000000000006', 'Gauteng',        'Pretoria',     'weekends',  'informally_employed'),
  ('a0000000-0000-4000-8000-000000000007', 'Western Cape',   'Cape Town',    'evenings',  'employed_seeking'),
  ('a0000000-0000-4000-8000-000000000008', 'Gauteng',        'Johannesburg', 'evenings',  'unemployed')
) as v(id, province, city, availability, situation)
where profiles.id = v.id::uuid;

-- user_skills
insert into public.user_skills (user_id, skill_id, confidence, experience_level, source)
select v.user_id::uuid, s.id, v.confidence::numeric, v.experience_level, 'manual'
from (values
  -- Sipho — appliance repair specialist
  ('a0000000-0000-4000-8000-000000000001', 'Appliance Repair',        0.95, 'experienced'),
  ('a0000000-0000-4000-8000-000000000001', 'Electrical Maintenance',  0.80, 'some_experience'),
  ('a0000000-0000-4000-8000-000000000001', 'Fault Diagnosis',         0.85, 'experienced'),
  -- Thandi — sales & customer service
  ('a0000000-0000-4000-8000-000000000002', 'Sales',                   0.90, 'experienced'),
  ('a0000000-0000-4000-8000-000000000002', 'Customer Service',        0.88, 'experienced'),
  ('a0000000-0000-4000-8000-000000000002', 'Social Media Marketing',  0.75, 'some_experience'),
  -- Kabelo — driver / logistics
  ('a0000000-0000-4000-8000-000000000003', 'Driving',                 0.92, 'experienced'),
  ('a0000000-0000-4000-8000-000000000003', 'Logistics',               0.80, 'experienced'),
  -- Naledi — administration & bookkeeping
  ('a0000000-0000-4000-8000-000000000004', 'Administration',          0.85, 'experienced'),
  ('a0000000-0000-4000-8000-000000000004', 'Bookkeeping',             0.78, 'some_experience'),
  -- Lindiwe — baker
  ('a0000000-0000-4000-8000-000000000005', 'Baking',                  0.90, 'experienced'),
  ('a0000000-0000-4000-8000-000000000005', 'Food Preparation',        0.85, 'experienced'),
  ('a0000000-0000-4000-8000-000000000005', 'Food Safety',             0.60, 'beginner'),
  -- Themba — builder
  ('a0000000-0000-4000-8000-000000000006', 'Carpentry',               0.88, 'experienced'),
  ('a0000000-0000-4000-8000-000000000006', 'Construction Painting',   0.70, 'some_experience'),
  ('a0000000-0000-4000-8000-000000000006', 'Plumbing',                0.50, 'beginner'),
  -- Zanele — childcare
  ('a0000000-0000-4000-8000-000000000007', 'Childcare',               0.90, 'experienced'),
  ('a0000000-0000-4000-8000-000000000007', 'Tutoring',                0.70, 'some_experience'),
  -- Bongani — administration (no bookkeeping — deliberately distinct from Naledi)
  ('a0000000-0000-4000-8000-000000000008', 'Administration',          0.70, 'some_experience'),
  ('a0000000-0000-4000-8000-000000000008', 'Basic Computer Literacy', 0.75, 'experienced')
) as v(user_id, skill_name, confidence, experience_level)
join public.skills s on s.name = v.skill_name;

-- user_resources
insert into public.user_resources (user_id, resource_id)
select v.user_id::uuid, r.id
from (values
  ('a0000000-0000-4000-8000-000000000001', 'Tools'),
  ('a0000000-0000-4000-8000-000000000002', 'Smartphone'),
  ('a0000000-0000-4000-8000-000000000003', 'Vehicle'),
  ('a0000000-0000-4000-8000-000000000004', 'Laptop'),
  ('a0000000-0000-4000-8000-000000000005', 'Kitchen'),
  ('a0000000-0000-4000-8000-000000000006', 'Tools'),
  ('a0000000-0000-4000-8000-000000000006', 'Vehicle'),
  ('a0000000-0000-4000-8000-000000000007', 'Workspace'),
  ('a0000000-0000-4000-8000-000000000008', 'Laptop'),
  ('a0000000-0000-4000-8000-000000000008', 'Internet')
) as v(user_id, resource_name)
join public.resources r on r.name = v.resource_name;

-- =========================================================================
-- 4. OPPORTUNITY CATALOGUE — 14 entries. Prototype demand data only (spec §21).
-- =========================================================================
insert into public.opportunities (
  name, category, description, geography, estimated_startup_level, customer_segment,
  demand_summary, demand_score, market_signal, why_now, prototype_only
) values
  ('Mobile Appliance Repair Service', 'repairs',
   'A mobile team that repairs fridges, washing machines and other household appliances on-site.',
   'Johannesburg', 'low_medium', 'Households needing fast, affordable appliance repairs',
   'Home repair and maintenance services show strong demand indicators in this demonstration area.',
   0.84, 'Prototype market signal — illustrative only',
   'Appliance replacement costs are rising, increasing demand for repair-first solutions.', true),

  ('Home & Office Cleaning Collective', 'cleaning',
   'A scheduled cleaning service for households and small offices.',
   'National', 'low', 'Households and small offices',
   'Demand for reliable, vetted cleaning teams remains consistently high in the demonstration dataset.',
   0.75, 'Prototype market signal — illustrative only',
   'Dual-income households increasingly outsource routine cleaning.', true),

  ('Mobile Hair & Beauty Services', 'mobile services',
   'At-home hairdressing and beauty appointments booked via WhatsApp/social media.',
   'National', 'low_medium', 'Clients who prefer at-home beauty appointments',
   'Mobile beauty bookings show strong growth in the demonstration signal set.',
   0.78, 'Prototype market signal — illustrative only',
   'Social media discovery is lowering customer-acquisition cost for mobile beauty services.', true),

  ('Neighbourhood Catering & Event Food', 'catering',
   'Catering for family events, community gatherings and small business functions.',
   'National', 'medium', 'Families and small businesses hosting events',
   'Catering for community and family events shows strong, recurring prototype demand.',
   0.85, 'Prototype market signal — illustrative only',
   'Township event catering is under-served by formal caterers, per the demonstration signal set.', true),

  ('School Run & Local Logistics Service', 'logistics',
   'Scheduled school transport and small local deliveries.',
   'National', 'low', 'Working parents and small local businesses needing deliveries',
   'Local transport and delivery requests appear frequently in the demonstration signal set.',
   0.70, 'Prototype market signal — illustrative only',
   'Growth in local e-commerce increases demand for short-haul, trusted delivery.', true),

  ('Small Business Bookkeeping Support', 'digital services',
   'Outsourced bookkeeping and basic financial administration for micro-businesses.',
   'National', 'low', 'Informal and micro businesses without in-house finance support',
   'Micro-businesses in the demonstration dataset frequently cite bookkeeping as their biggest administrative gap.',
   0.72, 'Prototype market signal — illustrative only',
   'Funders increasingly require formal financial records, raising demand for bookkeeping support.', true),

  ('Residential Garden & Landscaping Service', 'maintenance',
   'Garden upkeep, landscaping and small outdoor maintenance jobs.',
   'National', 'low', 'Homeowners and estate managers',
   'Seasonal demand for garden upkeep is consistently represented in the demonstration dataset.',
   0.68, 'Prototype market signal — illustrative only',
   'Rising formal landscaping costs are pushing homeowners toward independent providers.', true),

  ('Home-Based Childcare & After-School Care', 'childcare',
   'Supervised after-school care and homework support for small groups of children.',
   'National', 'low_medium', 'Working parents needing after-school supervision',
   'After-school care requests are one of the most frequent categories in the demonstration signal set.',
   0.80, 'Prototype market signal — illustrative only',
   'Two-income households continue to drive demand for trusted local childcare.', true),

  ('Mobile Phone & Small Electronics Repair', 'repairs',
   'On-demand repair of smartphones and small household electronics.',
   'National', 'low', 'Smartphone owners avoiding costly retail repairs',
   'Device repair requests are frequent and recurring in the demonstration signal set.',
   0.73, 'Prototype market signal — illustrative only',
   'Extended device lifespans are increasing demand for third-party repair.', true),

  ('Small-Scale Construction & Maintenance Crew', 'construction support',
   'A small crew handling home renovations, repairs and maintenance jobs too small for formal contractors.',
   'National', 'medium', 'Homeowners needing small renovation and repair jobs',
   'Small renovation and maintenance jobs appear consistently in the demonstration signal set.',
   0.70, 'Prototype market signal — illustrative only',
   'Formal contractors are often unavailable for small jobs, creating an opening for a responsive crew.', true),

  ('Community Security & Patrol Service', 'township services',
   'Local patrol and monitoring services coordinated with residents'' associations.',
   'Johannesburg', 'low_medium', 'Residents'' associations and small businesses',
   'Community safety concerns generate steady interest in local patrol services in the demonstration dataset.',
   0.65, 'Prototype market signal — illustrative only',
   'Neighbourhood watch groups are increasingly formalising into paid patrol arrangements.', true),

  ('Urban Micro-Farming & Produce Supply', 'agriculture support',
   'Small-scale, high-density vegetable growing supplying local households and grocers.',
   'National', 'medium', 'Local households and small grocers',
   'Demand for affordable, locally grown produce is well represented in the demonstration signal set.',
   0.69, 'Prototype market signal — illustrative only',
   'Rising fresh-produce prices are increasing interest in local micro-farm suppliers.', true),

  ('Social Media & Digital Marketing for Small Business', 'digital services',
   'Content creation and social media management for small local businesses.',
   'National', 'low', 'Small businesses without in-house marketing',
   'Small businesses in the demonstration dataset consistently cite online visibility as a growth blocker.',
   0.76, 'Prototype market signal — illustrative only',
   'Small businesses are shifting marketing spend toward social platforms.', true),

  ('Tailoring & Alterations Service', 'mobile services',
   'Clothing alterations and made-to-order tailoring for households and small retailers.',
   'National', 'low_medium', 'Households and small fashion retailers needing alterations',
   'Alteration and made-to-order requests appear steadily in the demonstration signal set.',
   0.66, 'Prototype market signal — illustrative only',
   'Growth in secondhand and made-to-measure fashion is increasing demand for alteration services.', true);

-- opportunity_skills
insert into public.opportunity_skills (opportunity_id, skill_id, requirement_type)
select o.id, s.id, v.requirement_type
from (values
  ('Mobile Appliance Repair Service', 'Appliance Repair', 'required'),
  ('Mobile Appliance Repair Service', 'Electrical Maintenance', 'required'),
  ('Mobile Appliance Repair Service', 'Fault Diagnosis', 'preferred'),
  ('Mobile Appliance Repair Service', 'Customer Service', 'preferred'),
  ('Mobile Appliance Repair Service', 'Bookkeeping', 'preferred'),

  ('Home & Office Cleaning Collective', 'Cleaning', 'required'),
  ('Home & Office Cleaning Collective', 'Customer Service', 'preferred'),
  ('Home & Office Cleaning Collective', 'Administration', 'preferred'),

  ('Mobile Hair & Beauty Services', 'Hairdressing & Beauty', 'required'),
  ('Mobile Hair & Beauty Services', 'Social Media Marketing', 'preferred'),
  ('Mobile Hair & Beauty Services', 'Customer Service', 'preferred'),

  ('Neighbourhood Catering & Event Food', 'Baking', 'required'),
  ('Neighbourhood Catering & Event Food', 'Food Preparation', 'required'),
  ('Neighbourhood Catering & Event Food', 'Food Safety', 'preferred'),
  ('Neighbourhood Catering & Event Food', 'Event Planning', 'preferred'),

  ('School Run & Local Logistics Service', 'Driving', 'required'),
  ('School Run & Local Logistics Service', 'Logistics', 'required'),
  ('School Run & Local Logistics Service', 'Customer Service', 'preferred'),

  ('Small Business Bookkeeping Support', 'Bookkeeping', 'required'),
  ('Small Business Bookkeeping Support', 'Administration', 'required'),
  ('Small Business Bookkeeping Support', 'Basic Computer Literacy', 'preferred'),

  ('Residential Garden & Landscaping Service', 'Gardening & Landscaping', 'required'),
  ('Residential Garden & Landscaping Service', 'Carpentry', 'preferred'),

  ('Home-Based Childcare & After-School Care', 'Childcare', 'required'),
  ('Home-Based Childcare & After-School Care', 'Tutoring', 'preferred'),
  ('Home-Based Childcare & After-School Care', 'Food Preparation', 'preferred'),

  ('Mobile Phone & Small Electronics Repair', 'Mobile Phone Repair', 'required'),
  ('Mobile Phone & Small Electronics Repair', 'Fault Diagnosis', 'required'),
  ('Mobile Phone & Small Electronics Repair', 'Sales', 'preferred'),
  ('Mobile Phone & Small Electronics Repair', 'Customer Service', 'preferred'),

  ('Small-Scale Construction & Maintenance Crew', 'Carpentry', 'required'),
  ('Small-Scale Construction & Maintenance Crew', 'Construction Painting', 'required'),
  ('Small-Scale Construction & Maintenance Crew', 'Plumbing', 'preferred'),
  ('Small-Scale Construction & Maintenance Crew', 'Electrical Maintenance', 'preferred'),

  ('Community Security & Patrol Service', 'Security Services', 'required'),
  ('Community Security & Patrol Service', 'Administration', 'preferred'),

  ('Urban Micro-Farming & Produce Supply', 'Agriculture & Farming', 'required'),
  ('Urban Micro-Farming & Produce Supply', 'Sales', 'preferred'),
  ('Urban Micro-Farming & Produce Supply', 'Logistics', 'preferred'),

  ('Social Media & Digital Marketing for Small Business', 'Social Media Marketing', 'required'),
  ('Social Media & Digital Marketing for Small Business', 'Photography', 'required'),
  ('Social Media & Digital Marketing for Small Business', 'Sales', 'preferred'),

  ('Tailoring & Alterations Service', 'Sewing & Tailoring', 'required'),
  ('Tailoring & Alterations Service', 'Sales', 'preferred')
) as v(opportunity_name, skill_name, requirement_type)
join public.opportunities o on o.name = v.opportunity_name
join public.skills s on s.name = v.skill_name;

-- opportunity_resources
insert into public.opportunity_resources (opportunity_id, resource_id, requirement_type)
select o.id, r.id, v.requirement_type
from (values
  ('Mobile Appliance Repair Service', 'Tools', 'required'),
  ('Mobile Appliance Repair Service', 'Vehicle', 'required'),
  ('Mobile Appliance Repair Service', 'Smartphone', 'preferred'),

  ('Home & Office Cleaning Collective', 'Vehicle', 'preferred'),
  ('Home & Office Cleaning Collective', 'Smartphone', 'preferred'),

  ('Mobile Hair & Beauty Services', 'Tools', 'required'),
  ('Mobile Hair & Beauty Services', 'Smartphone', 'preferred'),
  ('Mobile Hair & Beauty Services', 'Existing Customers', 'preferred'),

  ('Neighbourhood Catering & Event Food', 'Kitchen', 'required'),
  ('Neighbourhood Catering & Event Food', 'Vehicle', 'preferred'),
  ('Neighbourhood Catering & Event Food', 'Existing Customers', 'preferred'),

  ('School Run & Local Logistics Service', 'Vehicle', 'required'),
  ('School Run & Local Logistics Service', 'Smartphone', 'preferred'),

  ('Small Business Bookkeeping Support', 'Laptop', 'required'),
  ('Small Business Bookkeeping Support', 'Internet', 'preferred'),

  ('Residential Garden & Landscaping Service', 'Tools', 'required'),
  ('Residential Garden & Landscaping Service', 'Vehicle', 'preferred'),

  ('Home-Based Childcare & After-School Care', 'Workspace', 'required'),

  ('Mobile Phone & Small Electronics Repair', 'Tools', 'required'),
  ('Mobile Phone & Small Electronics Repair', 'Smartphone', 'required'),
  ('Mobile Phone & Small Electronics Repair', 'Storage', 'preferred'),

  ('Small-Scale Construction & Maintenance Crew', 'Tools', 'required'),
  ('Small-Scale Construction & Maintenance Crew', 'Vehicle', 'required'),
  ('Small-Scale Construction & Maintenance Crew', 'Machinery', 'preferred'),

  ('Community Security & Patrol Service', 'Smartphone', 'required'),
  ('Community Security & Patrol Service', 'Vehicle', 'preferred'),

  ('Urban Micro-Farming & Produce Supply', 'Workspace', 'required'),
  ('Urban Micro-Farming & Produce Supply', 'Storage', 'required'),
  ('Urban Micro-Farming & Produce Supply', 'Vehicle', 'preferred'),

  ('Social Media & Digital Marketing for Small Business', 'Smartphone', 'required'),
  ('Social Media & Digital Marketing for Small Business', 'Internet', 'required'),
  ('Social Media & Digital Marketing for Small Business', 'Laptop', 'preferred'),

  ('Tailoring & Alterations Service', 'Machinery', 'required'),
  ('Tailoring & Alterations Service', 'Workspace', 'preferred')
) as v(opportunity_name, resource_name, requirement_type)
join public.opportunities o on o.name = v.opportunity_name
join public.resources r on r.name = v.resource_name;

-- =========================================================================
-- 5. SUPPORT PROGRAMMES — spec §26. Fictional providers only (docs/decisions.md D7).
-- =========================================================================
insert into public.support_programmes (
  category, provider, programme_name, support_type, typical_eligibility, amount_range,
  closing_date, description, is_demo_data
) values
  ('bank', 'Example Development Bank', 'Micro-Enterprise Start Fund',
   'Blended loan + mentorship', 'Registered or registering micro-enterprises with 2 or more team members',
   'R10,000 – R100,000', null,
   'Combines a low-interest loan with structured mentorship for early-stage teams moving toward launch.', true),

  ('government', 'Provincial Department of Small Business Development', 'Township Enterprise Grant',
   'Non-repayable grant', 'Township-based youth-led micro-enterprises', 'R5,000 – R50,000',
   '2026-11-30',
   'A provincial grant supporting youth-led businesses operating in township economies.', true),

  ('development_agency', 'Provincial Enterprise Fund', 'Skills-to-Business Bridge',
   'Grant + structured training', 'Teams that have completed Ubunye''s business-development journey',
   'R15,000 – R40,000', null,
   'Bridges the gap between a validated opportunity and a funding-ready business plan.', true),

  ('corporate_enterprise_development', 'Example Retail Group Enterprise Development', 'Supplier Incubation Programme',
   'Procurement pipeline + working-capital advance', 'Service businesses able to supply retail or corporate clients',
   'R20,000 – R150,000', null,
   'Enterprise-development programme offering a route into a corporate supply chain.', true),

  ('grant', 'Example Community Foundation', 'Ubuntu Business Grant',
   'Once-off grant', 'First-time township entrepreneurs', 'R5,000 – R25,000',
   '2026-12-15',
   'A once-off grant aimed at first-time entrepreneurs building their first formal business.', true),

  ('incubator', 'Example Innovation Hub', '12-Week Micro-Business Incubator',
   'Incubation + co-working access', 'Early-stage teams with a validated opportunity',
   'Non-financial — incubation support', null,
   'A structured 12-week programme covering business fundamentals, with co-working access.', true),

  ('business_competition', 'Provincial Youth Enterprise Challenge', 'Annual Pitch Competition',
   'Prize funding + visibility', 'Youth-led teams (ages 18–35)', 'R10,000 – R75,000 in prizes',
   '2027-02-28',
   'An annual pitching competition for youth-led micro-enterprises across the province.', true),

  ('training_provider', 'Example Training Partner', 'Small Business Fundamentals',
   'Training', 'Any early-stage team', 'Free – subsidised', null,
   'A foundational course covering pricing, customers and basic operations for new businesses.', true);

-- =========================================================================
-- 6. LEARNING PROGRAMMES — spec §28
-- =========================================================================
insert into public.learning_programmes (skill_id, title, reason, provider, format, duration, url, is_demo_data)
select s.id, v.title, v.reason, v.provider, v.format, v.duration, null, true
from (values
  ('Bookkeeping', 'Basic Bookkeeping for Small Business',
   'Strengthens financial record-keeping for funding readiness.', 'Example Training Partner', 'online', '6 hours'),
  ('Electrical Maintenance', 'Electrical Safety Fundamentals',
   'Builds the formal safety knowledge repair businesses are often asked for.', 'Example Skills Institute', 'in_person', '2 days'),
  ('Customer Service', 'Customer Service Essentials',
   'Improves customer retention and complaint handling.', 'Example Training Partner', 'online', '4 hours'),
  ('Food Safety', 'Food Safety & Hygiene Certificate',
   'Required by many catering clients and venues.', 'Example Skills Institute', 'in_person', '1 day'),
  ('Social Media Marketing', 'Social Media Marketing for Small Business',
   'Helps teams generate demand without a marketing budget.', 'Example Digital Academy', 'online', '5 hours'),
  ('Basic Computer Literacy', 'Basic Computer Literacy',
   'Foundational digital skills for admin, invoicing and communication.', 'Example Digital Academy', 'online', '8 hours')
) as v(skill_name, title, reason, provider, format, duration)
join public.skills s on s.name = v.skill_name;

insert into public.learning_programmes (skill_id, title, reason, provider, format, duration, url, is_demo_data)
values (
  null, 'Pricing & Costing for Micro-Businesses',
  'Helps teams price services sustainably and understand their true costs.',
  'Example Training Partner', 'online', '3 hours', null, true
);

commit;
