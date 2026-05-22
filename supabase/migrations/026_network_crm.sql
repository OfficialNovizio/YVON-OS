-- Migration 026: Network CRM
-- Tables: network_contacts, contact_interactions

-- Ensure trigger function exists (idempotent)
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create table if not exists network_contacts (
  id                  uuid        primary key default gen_random_uuid(),
  name                text        not null,
  title               text,
  company             text,
  industry_tag        text,
  linkedin_url        text,
  email               text,
  location            text,
  how_met             text,
  relationship_type   text        not null default 'peer',
  relationship_strength text      not null default 'weak',
  venture_slug        text,
  notes               text,
  last_contacted      date,
  next_action         text,
  next_action_date    date,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create table if not exists contact_interactions (
  id               uuid        primary key default gen_random_uuid(),
  contact_id       uuid        not null references network_contacts(id) on delete cascade,
  interaction_date date        not null default current_date,
  type             text        not null default 'other',
  notes            text,
  outcome          text,
  created_at       timestamptz not null default now()
);

create index if not exists idx_network_contacts_industry
  on network_contacts(industry_tag);

create index if not exists idx_network_contacts_next_action
  on network_contacts(next_action_date)
  where next_action_date is not null;

create index if not exists idx_network_contacts_last_contacted
  on network_contacts(last_contacted desc nulls last);

create index if not exists idx_contact_interactions_contact
  on contact_interactions(contact_id);

create index if not exists idx_contact_interactions_date
  on contact_interactions(interaction_date desc);

drop trigger if exists trg_network_contacts_updated_at on network_contacts;
create trigger trg_network_contacts_updated_at
  before update on network_contacts
  for each row execute function update_updated_at();
